import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { initializeTransaction, generateReference } from "@/lib/paystack";
import { ALL_PACKAGES, calculateTotal, type AnyPackageId } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const {
      packageId,
      email,
      businessName,
      contactPerson,
      phone,
      description,
      websiteGoals,
      hasBranding,
      brandingNotes,
      pagesFeatures,
      invoiceNumber,
      existingSubscriptionId,
    } = body;

    if (existingSubscriptionId) {
      const user = await currentUser();
      const emailFromUser = user?.primaryEmailAddress?.emailAddress;
      if (!emailFromUser) return NextResponse.json({ error: "Email not available" }, { status: 400 });

      const existing = await prisma.subscription.findFirst({
        where: { id: existingSubscriptionId, userId },
      });
      if (!existing) return NextResponse.json({ error: "Pending invoice not found" }, { status: 404 });

      const pkg = ALL_PACKAGES[existing.package as AnyPackageId];
      const isDomainOrder = existing.projectType === "domain_registration" || existing.package === "domain-registration";
      if (!pkg && !isDomainOrder) return NextResponse.json({ error: "Invalid package" }, { status: 400 });

      const reference = generateReference(isDomainOrder ? "DOM" : "APX");
      const amountWithVat = existing.amountPaid > 0
        ? existing.amountPaid
        : calculateTotal(existing.amount || pkg?.price || 0);
      const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "";

      await prisma.subscription.update({
        where: { id: existing.id },
        data: {
          paystackReference: reference,
          amountPaid: amountWithVat,
          invoiceNumber: existing.invoiceNumber ?? invoiceNumber,
        },
      });

      const result = await initializeTransaction({
        email: emailFromUser,
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

    if (!packageId || !email || !businessName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const pkg = ALL_PACKAGES[packageId as AnyPackageId];
    if (!pkg) return NextResponse.json({ error: "Invalid package" }, { status: 400 });

    const reference = generateReference("APX");
    const amountWithVat = calculateTotal(pkg.price);

    // Ensure profile exists
    await prisma.profile.upsert({
      where: { id: userId },
      create: { id: userId },
      update: {},
    });

    // Build combined description from onboarding answers
    const fullDescription = [
      description && `About: ${description}`,
      websiteGoals && `Goals: ${websiteGoals}`,
      hasBranding && `Branding: ${hasBranding}${brandingNotes ? ` — ${brandingNotes}` : ""}`,
      pagesFeatures && `Pages/Features: ${pagesFeatures}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    await prisma.subscription.create({
      data: {
        id: reference,
        userId,
        package: pkg.id,
        amount: pkg.price,
        amountPaid: amountWithVat,
        status: "pending",
        businessName,
        contactPerson,
        phone,
        description: fullDescription,
        invoiceNumber,
        paystackReference: reference,
      },
    });

    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "";

    const result = await initializeTransaction({
      email,
      amount: Math.round(amountWithVat * 100), // Paystack uses kobo (ZAR cents)
      currency: "ZAR",
      reference,
      callback_url: `${origin}/success?reference=${reference}`,
      metadata: {
        custom_fields: [
          { display_name: "Business Name", variable_name: "business_name", value: businessName },
          { display_name: "Package", variable_name: "package", value: pkg.name },
          { display_name: "Contact Person", variable_name: "contact_person", value: contactPerson || "" },
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
    console.error("Paystack init error:", err);
    return NextResponse.json({ error: "Payment initialization failed" }, { status: 500 });
  }
}
