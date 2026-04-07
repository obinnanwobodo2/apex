// Paystack integration — South Africa (ZAR)
// Docs: https://paystack.com/docs

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;

export const PAYSTACK_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!;

export interface PaystackInitPayload {
  email: string;
  amount?: number; // in kobo/cents — ZAR * 100
  currency: "ZAR";
  reference: string;
  callback_url: string;
  metadata: {
    custom_fields: Array<{
      display_name: string;
      variable_name: string;
      value: string;
    }>;
    package: string;
    subscription_id: string;
    [key: string]: unknown;
  };
  plan?: string; // Paystack plan code for subscriptions
  channels?: string[];
}

export function generateReference(prefix = "APX"): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${ts}-${rand}`;
}

export async function initializeTransaction(
  payload: PaystackInitPayload
): Promise<{ authorization_url: string; access_code: string; reference: string }> {
  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Paystack initialization failed");
  }

  const data = await res.json();
  return data.data;
}

export async function verifyTransaction(
  reference: string
): Promise<{ status: string; amount: number; customer: { email: string }; metadata: Record<string, unknown> }> {
  const res = await fetch(
    `https://api.paystack.co/transaction/verify/${reference}`,
    {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
    }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Paystack verification failed");
  }

  const data = await res.json();
  return data.data;
}
