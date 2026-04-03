import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { processSuccessfulPayment } from "@/lib/payment-processing";
import { logSecurityEvent } from "@/lib/security-monitoring";
import { sanitizeText } from "@/lib/validation";

export async function POST(req: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY?.trim();
  if (!secret) {
    await logSecurityEvent({
      event: "paystack_webhook_secret_missing",
      severity: "critical",
      details: { path: "/api/paystack/webhook" },
    });
    return NextResponse.json({ error: "Webhook is not configured" }, { status: 503 });
  }

  const signature = req.headers.get("x-paystack-signature");
  if (!signature) {
    await logSecurityEvent({
      event: "paystack_webhook_signature_missing",
      severity: "warn",
      details: { path: "/api/paystack/webhook" },
    });
    return NextResponse.json({ error: "Missing signature" }, { status: 401 });
  }

  const body = await req.text();

  const hash = crypto.createHmac("sha512", secret).update(body).digest("hex");
  const validSignature = (() => {
    try {
      const digest = Buffer.from(hash, "utf8");
      const provided = Buffer.from(signature, "utf8");
      if (digest.length !== provided.length) return false;
      return crypto.timingSafeEqual(digest, provided);
    } catch {
      return false;
    }
  })();

  if (!validSignature) {
    await logSecurityEvent({
      event: "paystack_webhook_signature_invalid",
      severity: "warn",
      details: { path: "/api/paystack/webhook" },
    });
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: { event: string; data: Record<string, unknown> };
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (event.event === "charge.success") {
    const reference = sanitizeText(event.data.reference, { maxLength: 80 });
    if (reference) {
      await processSuccessfulPayment(reference);
    }
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
