import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { verifyTransaction } from "@/lib/paystack";
import { processSuccessfulPayment } from "@/lib/payment-processing";
import { sanitizeText } from "@/lib/validation";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const reference = sanitizeText(searchParams.get("reference"), { maxLength: 80 });

  if (!reference) {
    return NextResponse.json({ success: false, error: "Missing reference" }, { status: 400 });
  }

  try {
    const order = await prisma.subscription.findFirst({
      where: { paystackReference: reference, userId },
      select: { id: true },
    });
    if (!order) {
      return NextResponse.json({ success: false, error: "Payment record not found" }, { status: 404 });
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
    console.error("Verify error:", err);
    return NextResponse.json({ success: false, error: "Verification failed" }, { status: 500 });
  }
}
