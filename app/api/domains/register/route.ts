import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { initializeTransaction, generateReference } from "@/lib/paystack";
import { calculateTotal, generateInvoiceNumber } from "@/lib/utils";
import { logApplicationError } from "@/lib/security-monitoring";
import { isTestPaymentModeEnabled } from "@/lib/payment-mode";
import {
  buildDomainPurchaseMeta,
  checkDomainAvailability,
  formatDomainPrice,
  getDomainPrice,
  getDomainTld,
  normalizeDomain,
  parseDomainMeta,
} from "@/lib/domain-service";
import { readJsonObject, sanitizeInt } from "@/lib/validation";

const DOMAIN_PACKAGE = "domain-registration";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orders = await prisma.subscription.findMany({
    where: {
      userId,
      OR: [{ projectType: "domain_registration" }, { package: DOMAIN_PACKAGE }],
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    orders.map((order) => {
      const meta = parseDomainMeta(order.features);
      return {
        id: order.id,
        domain: order.businessName ?? String(meta.domain ?? ""),
        package: order.package,
        status: order.status,
        paid: order.paid,
        amount: order.amount,
        amountPaid: order.amountPaid,
        invoiceNumber: order.invoiceNumber ?? null,
        nextBillingDate: order.nextBillingDate?.toISOString() ?? null,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        registrationStatus: String(meta.registrationStatus ?? ""),
        providerReference: typeof meta.providerReference === "string" ? meta.providerReference : null,
        registrationError: typeof meta.registrationError === "string" ? meta.registrationError : null,
        years: Number(meta.years) > 0 ? Number(meta.years) : 1,
      };
    })
  );
}

export async function POST(req: Request) {
  const testPaymentMode = isTestPaymentModeEnabled();
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await readJsonObject(req);
  if (!body) return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });

  const normalizedDomain = normalizeDomain(typeof body?.domain === "string" ? body.domain : "");
  const years = sanitizeInt(body?.years, { min: 1, max: 10, fallback: 1 });

  if (!normalizedDomain) {
    return NextResponse.json({ error: "Valid domain is required" }, { status: 400 });
  }

  const unitPrice = getDomainPrice(normalizedDomain);
  if (!unitPrice) {
    return NextResponse.json(
      {
        error: "This domain extension is not supported for direct purchase in-app.",
        domain: normalizedDomain,
      },
      { status: 400 }
    );
  }

  const availability = await checkDomainAvailability(normalizedDomain);
  if (availability.error) {
    return NextResponse.json(
      { error: `Could not confirm availability: ${availability.error}` },
      { status: 502 }
    );
  }

  if (!availability.available) {
    return NextResponse.json(
      { error: "Domain is no longer available. Please try another name." },
      { status: 409 }
    );
  }

  const duplicate = await prisma.subscription.findFirst({
    where: {
      userId,
      businessName: normalizedDomain,
      OR: [{ projectType: "domain_registration" }, { package: DOMAIN_PACKAGE }],
      status: { in: ["pending", "active"] },
    },
  });

  if (duplicate) {
    if (duplicate.paid && duplicate.status === "active") {
      return NextResponse.json({ error: "This domain already exists in your account." }, { status: 400 });
    }
    if (!duplicate.paid) {
      return NextResponse.json(
        { error: "You already have a pending invoice for this domain in Billing." },
        { status: 400 }
      );
    }
  }

  const profile = await prisma.profile.upsert({
    where: { id: userId },
    create: { id: userId },
    update: {},
  });

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress?.trim();
  if (!email) {
    return NextResponse.json({ error: "User email is required to initialize payment." }, { status: 400 });
  }

  const amount = unitPrice * years;
  const total = calculateTotal(amount);
  const reference = generateReference("DOM");
  const invoiceNumber = generateInvoiceNumber();
  const tld = getDomainTld(normalizedDomain);
  const origin = (req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "").trim();
  if (!origin) {
    return NextResponse.json({ error: "Application URL is not configured" }, { status: 500 });
  }

  const order = await prisma.subscription.create({
    data: {
      userId,
      package: DOMAIN_PACKAGE,
      projectType: "domain_registration",
      amount,
      amountPaid: total,
      status: "pending",
      paid: false,
      businessName: normalizedDomain,
      contactPerson: profile.fullName ?? user?.fullName ?? null,
      phone: profile.phone ?? null,
      invoiceNumber,
      description: `Domain registration for ${normalizedDomain} (${years} year${years > 1 ? "s" : ""}).`,
      paystackReference: reference,
      features: buildDomainPurchaseMeta({
        domain: normalizedDomain,
        years,
        source: availability.source,
        price: unitPrice,
        totalPrice: total,
        purchaserEmail: email,
      }),
    },
  });

  if (testPaymentMode) {
    return NextResponse.json({
      success: true,
      authorization_url: `${origin}/success?reference=${encodeURIComponent(reference)}&mode=test`,
      reference,
      invoiceNumber,
      domain: normalizedDomain,
      priceLabel: formatDomainPrice(normalizedDomain),
      testMode: true,
    });
  }

  try {
    const payment = await initializeTransaction({
      email,
      amount: Math.round(total * 100),
      currency: "ZAR",
      reference,
      callback_url: `${origin}/success?reference=${reference}`,
      metadata: {
        custom_fields: [
          { display_name: "Domain", variable_name: "domain", value: normalizedDomain },
          { display_name: "TLD", variable_name: "tld", value: tld },
          { display_name: "Years", variable_name: "years", value: String(years) },
        ],
        package: DOMAIN_PACKAGE,
        subscription_id: order.id,
      },
    });

    return NextResponse.json({
      success: true,
      authorization_url: payment.authorization_url,
      reference,
      invoiceNumber,
      domain: normalizedDomain,
      priceLabel: formatDomainPrice(normalizedDomain),
    });
  } catch (err) {
    await logApplicationError({
      source: "api/domains/register",
      severity: "critical",
      message: "Domain payment initialization failed",
      route: "/api/domains/register",
      error: err,
    });
    await prisma.subscription.update({
      where: { id: order.id },
      data: {
        status: "failed",
        features: JSON.stringify({
          ...parseDomainMeta(order.features),
          registrationStatus: "payment_initialization_failed",
          registrationError: err instanceof Error ? err.message : "Failed to initialize payment",
          updatedAt: new Date().toISOString(),
        }),
      },
    });

    return NextResponse.json(
      { error: "Could not initialize Paystack payment for this domain." },
      { status: 500 }
    );
  }
}
