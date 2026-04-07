import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { processSuccessfulPayment } from "@/lib/payment-processing";
import { logSecurityEvent } from "@/lib/security-monitoring";
import { sanitizeText } from "@/lib/validation";
import { triggerClientEvent } from "@/lib/realtime";

type PaystackEventPayload = {
  event: string;
  data: Record<string, unknown>;
};

type PaystackCustomerLike = {
  customer_code?: string;
  email?: string;
};

function safeString(value: unknown, maxLength = 200) {
  return sanitizeText(value, { maxLength }) ?? null;
}

function getMetadata(data: Record<string, unknown>) {
  const raw = data.metadata;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return raw as Record<string, unknown>;
}

function normalizeCustomer(data: Record<string, unknown>): PaystackCustomerLike {
  const raw = data.customer;
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as PaystackCustomerLike;
  }
  return {};
}

async function createClientNotification(clientId: string, type: string, message: string) {
  const notification = await prisma.notification.create({
    data: {
      clientId,
      type,
      message,
      read: false,
    },
  });

  await triggerClientEvent(clientId, "new-notification", {
    id: notification.id,
    type: notification.type,
    message: notification.message,
    read: notification.read,
    createdAt: notification.createdAt.toISOString(),
  });
}

async function handleChargeSuccess(data: Record<string, unknown>) {
  const reference = safeString(data.reference, 120);
  if (reference) {
    await processSuccessfulPayment(reference);
  }

  const metadata = getMetadata(data);
  const type = safeString(metadata.type, 50);
  if (type !== "domain") return;

  const clientId = safeString(metadata.clientId, 128);
  const domainRequestId = safeString(metadata.domainRequestId, 128);
  if (!clientId || !domainRequestId) return;

  const request = await prisma.domainRequest.findFirst({
    where: { id: domainRequestId, clientId },
  });
  if (!request) return;

  const updated = await prisma.domainRequest.update({
    where: { id: request.id },
    data: {
      paymentStatus: "paid",
      status: request.status === "pending" ? "checked" : request.status,
    },
  });

  await createClientNotification(
    clientId,
    "domain_payment",
    `Payment received for ${updated.domainName}${updated.extension}. We will process your registration shortly.`
  );

  await logSecurityEvent({
    event: "domain_payment_received",
    severity: "info",
    details: {
      clientId,
      requestId: domainRequestId,
      domain: `${updated.domainName}${updated.extension}`,
      reference,
    },
  });
}

async function findCustomerByCodes(customerCode: string | null, subscriptionCode: string | null) {
  if (subscriptionCode) {
    const bySubscription = await prisma.paystackCustomer.findFirst({
      where: { subscriptionCode },
    });
    if (bySubscription) return bySubscription;
  }
  if (customerCode) {
    const byCustomer = await prisma.paystackCustomer.findFirst({
      where: { paystackCustomerCode: customerCode },
    });
    if (byCustomer) return byCustomer;
  }
  return null;
}

async function handleSubscriptionCreate(data: Record<string, unknown>) {
  const customer = normalizeCustomer(data);
  const metadata = getMetadata(data);

  const clientId = safeString(metadata.clientId, 128);
  const customerCode = safeString(customer.customer_code, 120);
  const subscriptionCode = safeString(data.subscription_code, 120);
  const planCode = safeString(
    (data.plan as Record<string, unknown> | undefined)?.plan_code ?? metadata.planCode,
    120
  );

  if (clientId && customerCode) {
    await prisma.paystackCustomer.upsert({
      where: { clientId },
      create: {
        clientId,
        paystackCustomerCode: customerCode,
        subscriptionCode,
        planCode,
        status: "active",
      },
      update: {
        paystackCustomerCode: customerCode,
        subscriptionCode: subscriptionCode ?? undefined,
        planCode: planCode ?? undefined,
        status: "active",
      },
    });
    return;
  }

  const existing = await findCustomerByCodes(customerCode, subscriptionCode);
  if (!existing) return;

  await prisma.paystackCustomer.update({
    where: { id: existing.id },
    data: {
      status: "active",
      ...(subscriptionCode ? { subscriptionCode } : {}),
      ...(planCode ? { planCode } : {}),
    },
  });
}

async function handleSubscriptionDisable(data: Record<string, unknown>) {
  const customer = normalizeCustomer(data);
  const subscriptionCode = safeString(data.subscription_code, 120);
  const customerCode = safeString(customer.customer_code, 120);
  if (subscriptionCode) {
    await prisma.subscription.updateMany({
      where: { paystackReference: subscriptionCode },
      data: { status: "cancelled" },
    });
  }
  const existing = await findCustomerByCodes(customerCode, subscriptionCode);
  if (!existing) return;

  await prisma.paystackCustomer.update({
    where: { id: existing.id },
    data: { status: "inactive" },
  });

  await createClientNotification(
    existing.clientId,
    "billing",
    "Your subscription was disabled. Contact support if this was unexpected."
  );
}

async function handleInvoicePaymentFailed(data: Record<string, unknown>) {
  const customer = normalizeCustomer(data);
  const customerCode = safeString(customer.customer_code, 120);
  const existing = await findCustomerByCodes(customerCode, null);
  if (!existing) return;

  await createClientNotification(
    existing.clientId,
    "billing",
    "Your payment failed. Please update your billing details."
  );
}

async function handleInvoiceUpdate(data: Record<string, unknown>) {
  const customer = normalizeCustomer(data);
  const customerCode = safeString(customer.customer_code, 120);
  const subscriptionCode = safeString(data.subscription_code, 120);
  const nextDate = safeString(
    data.next_payment_date ?? data.due_date ?? data.paid_at,
    120
  );

  const existing = await findCustomerByCodes(customerCode, subscriptionCode);
  if (!existing) return;

  await prisma.paystackCustomer.update({
    where: { id: existing.id },
    data: {
      ...(nextDate ? { nextBillingDate: nextDate } : {}),
      ...(subscriptionCode ? { subscriptionCode } : {}),
    },
  });
}

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

  let validSignature = false;
  try {
    validSignature = crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
  } catch {
    validSignature = false;
  }

  if (!validSignature) {
    await logSecurityEvent({
      event: "paystack_webhook_signature_invalid",
      severity: "warn",
      details: { path: "/api/paystack/webhook" },
    });
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: PaystackEventPayload;
  try {
    event = JSON.parse(body) as PaystackEventPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventName = safeString(event.event, 120);
  if (!eventName) return NextResponse.json({ received: true });

  if (eventName === "charge.success") {
    await handleChargeSuccess(event.data);
  } else if (eventName === "subscription.create") {
    await handleSubscriptionCreate(event.data);
  } else if (eventName === "subscription.disable" || eventName === "subscription.not_renew") {
    await handleSubscriptionDisable(event.data);
  } else if (eventName === "invoice.payment_failed") {
    await handleInvoicePaymentFailed(event.data);
  } else if (eventName === "invoice.update") {
    await handleInvoiceUpdate(event.data);
  }

  return NextResponse.json({ received: true });
}
