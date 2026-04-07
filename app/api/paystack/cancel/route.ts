import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { readJsonObject, sanitizeText } from "@/lib/validation";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const secret = process.env.PAYSTACK_SECRET_KEY?.trim();
  if (!secret) return NextResponse.json({ error: "Paystack secret key is not configured." }, { status: 503 });

  const body = await readJsonObject(req);
  const providedCode = sanitizeText(body?.subscriptionCode, { maxLength: 120 });
  const token = sanitizeText(body?.token, { maxLength: 120 });

  const customer = await prisma.paystackCustomer.findUnique({ where: { clientId: userId } });
  const subscriptionCode = providedCode ?? customer?.subscriptionCode ?? null;
  if (!subscriptionCode) {
    return NextResponse.json({ error: "No active subscription found." }, { status: 404 });
  }

  if (!token) {
    await prisma.paystackCustomer.updateMany({
      where: { clientId: userId },
      data: { status: "inactive" },
    });
    return NextResponse.json({
      success: true,
      warning: "Cancellation token not provided; marked inactive locally. Disable in Paystack dashboard as needed.",
    });
  }

  const response = await fetch("https://api.paystack.co/subscription/disable", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      code: subscriptionCode,
      token,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.status === false) {
    return NextResponse.json({ error: payload?.message || "Failed to cancel subscription." }, { status: 400 });
  }

  await prisma.paystackCustomer.updateMany({
    where: { clientId: userId },
    data: { status: "inactive" },
  });

  return NextResponse.json({ success: true });
}
