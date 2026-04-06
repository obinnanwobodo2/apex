import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { verifyTransaction } from "@/lib/paystack";
import { processSuccessfulPayment } from "@/lib/payment-processing";
import { logApplicationError } from "@/lib/security-monitoring";
import { extractDomainFromSubscription } from "@/lib/domain-service";
import { ALL_PACKAGES, type AnyPackageId } from "@/lib/utils";
import { isTestPaymentModeEnabled } from "@/lib/payment-mode";
import { sanitizeText } from "@/lib/validation";

function isDomainOrder(order: { package: string; projectType: string | null }) {
  return order.projectType === "domain_registration" || order.package === "domain-registration";
}

function getOrderPackageName(order: {
  package: string;
  projectType: string | null;
  businessName: string | null;
  description: string | null;
  features: string | null;
}) {
  if (isDomainOrder(order)) {
    const domain = extractDomainFromSubscription(order);
    return domain ? `${domain} Domain` : "Domain Registration";
  }
  return ALL_PACKAGES[order.package as AnyPackageId]?.name ?? order.package;
}

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const testPaymentMode = isTestPaymentModeEnabled();

  const { searchParams } = new URL(req.url);
  const reference = sanitizeText(searchParams.get("reference"), { maxLength: 80 });

  if (!reference) {
    return NextResponse.json({ success: false, error: "Missing reference" }, { status: 400 });
  }

  try {
    const order = await prisma.subscription.findFirst({
      where: { paystackReference: reference, userId },
      select: {
        id: true,
        package: true,
        projectType: true,
        businessName: true,
        description: true,
        features: true,
        paid: true,
      },
    });
    if (!order) {
      return NextResponse.json({ success: false, error: "Payment record not found" }, { status: 404 });
    }

    if (order.paid) {
      return NextResponse.json({
        success: true,
        package: getOrderPackageName(order),
        reference,
        domain: isDomainOrder(order) ? (extractDomainFromSubscription(order) ?? null) : null,
        warning: null,
      });
    }

    if (testPaymentMode) {
      const processed = await processSuccessfulPayment(reference);
      if (!processed.success) {
        return NextResponse.json({ success: false, error: "No matching order found for this payment." }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        package: processed.packageName,
        reference,
        domain: processed.domain ?? null,
        warning: processed.warning ?? null,
        mode: "test",
      });
    }

    const paystackData = await verifyTransaction(reference);
    if (paystackData.status !== "success") {
      return NextResponse.json({ success: false, error: "Payment not successful" });
    }

    const processed = await processSuccessfulPayment(reference);
    if (!processed.success) {
      return NextResponse.json({ success: false, error: "No matching order found for this payment." }, { status: 404 });
    }

    const refreshed = await prisma.subscription.findFirst({
      where: { paystackReference: reference, userId },
      select: { paid: true },
    });
    if (!refreshed?.paid) {
      return NextResponse.json({ success: false, error: "Payment is still being processed." }, { status: 409 });
    }

    return NextResponse.json({
      success: true,
      package: processed.packageName,
      reference,
      domain: processed.domain ?? null,
      warning: processed.warning ?? null,
    });
  } catch (err) {
    await logApplicationError({
      source: "api/paystack/verify",
      severity: "critical",
      message: "Paystack verification failed",
      route: "/api/paystack/verify",
      error: err,
    });
    return NextResponse.json({ success: false, error: "Verification failed" }, { status: 500 });
  }
}
