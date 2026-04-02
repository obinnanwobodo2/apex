import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { processSuccessfulPayment } from "@/lib/payment-processing";

export async function POST(req: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY!;
  const signature = req.headers.get("x-paystack-signature");
  const body = await req.text();

  const hash = crypto.createHmac("sha512", secret).update(body).digest("hex");
  if (hash !== signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: { event: string; data: Record<string, unknown> };
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (event.event === "charge.success") {
    const reference = event.data.reference as string;
    await processSuccessfulPayment(reference);
  }

  if (event.event === "subscription.disable" || event.event === "subscription.not_renew") {
    const code = (event.data as { subscription_code?: string }).subscription_code;
    if (code) {
      await prisma.subscription.updateMany({
        where: { paystackReference: code },
        data: { status: "cancelled" },
      });
    }
  }

  return NextResponse.json({ received: true });
}
