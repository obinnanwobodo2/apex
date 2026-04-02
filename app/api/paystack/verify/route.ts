import { NextResponse } from "next/server";
import { verifyTransaction } from "@/lib/paystack";
import { processSuccessfulPayment } from "@/lib/payment-processing";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const reference = searchParams.get("reference");

  if (!reference) {
    return NextResponse.json({ success: false, error: "Missing reference" }, { status: 400 });
  }

  try {
    const paystackData = await verifyTransaction(reference);
    if (paystackData.status !== "success") {
      return NextResponse.json({ success: false, error: "Payment not successful" });
    }

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
    });
  } catch (err) {
    console.error("Verify error:", err);
    return NextResponse.json({ success: false, error: "Verification failed" }, { status: 500 });
  }
}
