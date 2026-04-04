import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { initializeTransaction, generateReference } from "@/lib/paystack";
import { ALL_PACKAGES, PACKAGES, calculateTotal, type AnyPackageId } from "@/lib/utils";
import { logApplicationError } from "@/lib/security-monitoring";
import {
  readJsonObject,
  sanitizeDate,
  sanitizeEmail,
  sanitizeFloat,
  sanitizePhone,
  sanitizeStringArray,
  sanitizeText,
} from "@/lib/validation";

function cleanString(value: unknown) {
  return sanitizeText(value, { maxLength: 4000 });
}

function cleanStringArray(value: unknown) {
  return sanitizeStringArray(value, 20, 100);
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await readJsonObject(req);
    if (!body) return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });

    const user = await currentUser();
    const userEmail = sanitizeEmail(user?.primaryEmailAddress?.emailAddress);
    if (!userEmail) return NextResponse.json({ error: "Email not available" }, { status: 400 });

    const providedEmail = sanitizeEmail(body.email);
    if (providedEmail && providedEmail !== userEmail) {
      return NextResponse.json({ error: "Authenticated email mismatch" }, { status: 400 });
    }

    const {
      packageId,
      businessName,
      contactPerson,
      phone,
      description,
      websiteGoals,
      hasBranding,
      brandingNotes,
      pagesFeatures,
      projectType,
      budget,
      timeline,
      hostingPlan,
      hostingAmount,
      requestTitle,
      requestDescription,
      requestServices,
      requestBudget,
      requestDeadline,
      requestNotes,
      invoiceNumber,
      existingSubscriptionId,
    } = body;

    const normalizedExistingSubscriptionId = sanitizeText(existingSubscriptionId, { maxLength: 64 });
    if (normalizedExistingSubscriptionId) {
      const existing = await prisma.subscription.findFirst({
        where: { id: normalizedExistingSubscriptionId, userId },
      });
      if (!existing) return NextResponse.json({ error: "Pending invoice not found" }, { status: 404 });
      if (existing.paid || existing.status !== "pending") {
        return NextResponse.json({ error: "This invoice is not payable." }, { status: 400 });
      }

      const pkg = ALL_PACKAGES[existing.package as AnyPackageId];
      const isDomainOrder = existing.projectType === "domain_registration" || existing.package === "domain-registration";
      if (!pkg && !isDomainOrder) return NextResponse.json({ error: "Invalid package" }, { status: 400 });

      const reference = generateReference(isDomainOrder ? "DOM" : "APX");
      const amountWithVat = existing.amountPaid > 0
        ? existing.amountPaid
        : calculateTotal(existing.amount || pkg?.price || 0);
      const origin = (req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "").trim();
      if (!origin) return NextResponse.json({ error: "Application URL is not configured" }, { status: 500 });

      await prisma.subscription.update({
        where: { id: existing.id },
        data: {
          paystackReference: reference,
          amountPaid: amountWithVat,
          invoiceNumber: existing.invoiceNumber ?? (sanitizeText(invoiceNumber, { maxLength: 80 }) ?? null),
        },
      });

      const result = await initializeTransaction({
        email: userEmail,
        amount: Math.round(amountWithVat * 100),
        currency: "ZAR",
        reference,
        callback_url: `${origin}/success?reference=${reference}`,
        metadata: {
          custom_fields: [
            { display_name: "Business Name", variable_name: "business_name", value: existing.businessName ?? "" },
            { display_name: "Package", variable_name: "package", value: isDomainOrder ? "Domain Registration" : (pkg?.name ?? existing.package) },
            { display_name: "Contact Person", variable_name: "contact_person", value: existing.contactPerson || "" },
            ...(isDomainOrder ? [{ display_name: "Domain", variable_name: "domain", value: existing.businessName ?? "" }] : []),
          ],
          package: isDomainOrder ? "domain-registration" : (pkg?.id ?? existing.package),
          subscription_id: existing.id,
        },
      });

      return NextResponse.json({
        authorization_url: result.authorization_url,
        reference,
      });
    }

    const normalizedPackageId = sanitizeText(packageId, { maxLength: 40 }) as AnyPackageId | null;
    const normalizedBusinessName = sanitizeText(businessName, { maxLength: 160 });
    if (!normalizedPackageId || !normalizedBusinessName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const isWebsitePackage = normalizedPackageId in PACKAGES;
    const purchaseSource = sanitizeText(body.purchaseSource, { maxLength: 32 });
    if (isWebsitePackage && purchaseSource !== "dashboard") {
      return NextResponse.json(
        { error: "Website packages can only be purchased from the client dashboard." },
        { status: 403 }
      );
    }

    const pkg = ALL_PACKAGES[normalizedPackageId];
    if (!pkg) return NextResponse.json({ error: "Invalid package" }, { status: 400 });

    const reference = generateReference("APX");
    const normalizedHostingAmount = sanitizeFloat(hostingAmount, { min: 0, max: 100000, fallback: 0 });
    const subtotal = pkg.price + normalizedHostingAmount;
    const amountWithVat = calculateTotal(subtotal);

    // Ensure profile exists
    await prisma.profile.upsert({
      where: { id: userId },
      create: { id: userId },
      update: {},
    });

    const cleanDescription = cleanString(description);
    const cleanWebsiteGoals = cleanString(websiteGoals);
    const cleanHasBranding = cleanString(hasBranding);
    const cleanBrandingNotes = cleanString(brandingNotes);
    const cleanPagesFeatures = cleanString(pagesFeatures);

    // Build combined description from onboarding answers
    const fullDescription = [
      cleanDescription && `About: ${cleanDescription}`,
      cleanWebsiteGoals && `Goals: ${cleanWebsiteGoals}`,
      cleanHasBranding && `Branding: ${cleanHasBranding}${cleanBrandingNotes ? ` — ${cleanBrandingNotes}` : ""}`,
      cleanPagesFeatures && `Pages/Features: ${cleanPagesFeatures}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    const requestServicesList = cleanStringArray(requestServices);
    const parsedRequestDeadline = sanitizeDate(requestDeadline);
    const requestDeadlineIso = parsedRequestDeadline ? parsedRequestDeadline.toISOString() : null;

    const metadata = {
      source: "checkout",
      onboarding: {
        websiteGoals: cleanWebsiteGoals,
        hasBranding: cleanHasBranding,
        brandingNotes: cleanBrandingNotes,
        pagesFeatures: cleanPagesFeatures,
      },
      request: {
        title: cleanString(requestTitle),
        description: cleanString(requestDescription),
        services: requestServicesList,
        budget: cleanString(requestBudget),
        deadline: requestDeadlineIso,
        notes: cleanString(requestNotes),
      },
    };

    await prisma.subscription.create({
      data: {
        id: reference,
        userId,
        package: pkg.id,
        amount: subtotal,
        amountPaid: amountWithVat,
        status: "pending",
        businessName: normalizedBusinessName,
        contactPerson: cleanString(contactPerson),
        phone: sanitizePhone(phone),
        description: fullDescription,
        invoiceNumber: sanitizeText(invoiceNumber, { maxLength: 80 }) ?? null,
        paystackReference: reference,
        projectType: cleanString(projectType),
        budget: cleanString(budget),
        timeline: cleanString(timeline),
        hostingPlan: cleanString(hostingPlan),
        hostingAmount: normalizedHostingAmount,
        features: JSON.stringify(metadata),
      },
    });

    const origin = (req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "").trim();
    if (!origin) return NextResponse.json({ error: "Application URL is not configured" }, { status: 500 });

    const result = await initializeTransaction({
      email: userEmail,
      amount: Math.round(amountWithVat * 100), // Paystack uses kobo (ZAR cents)
      currency: "ZAR",
      reference,
      callback_url: `${origin}/success?reference=${reference}`,
      metadata: {
        custom_fields: [
          { display_name: "Business Name", variable_name: "business_name", value: normalizedBusinessName },
          { display_name: "Package", variable_name: "package", value: pkg.name },
          { display_name: "Contact Person", variable_name: "contact_person", value: cleanString(contactPerson) || "" },
        ],
        package: pkg.id,
        subscription_id: reference,
      },
    });

    return NextResponse.json({
      authorization_url: result.authorization_url,
      reference,
    });
  } catch (err) {
    await logApplicationError({
      source: "api/paystack/initialize",
      severity: "critical",
      message: "Paystack initialization failed",
      route: "/api/paystack/initialize",
      error: err,
    });
    return NextResponse.json({ error: "Payment initialization failed" }, { status: 500 });
  }
}
