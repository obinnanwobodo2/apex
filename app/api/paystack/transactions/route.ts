import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getAdminAccess } from "@/lib/admin";
import { sanitizeText } from "@/lib/validation";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const secret = process.env.PAYSTACK_SECRET_KEY?.trim();
  if (!secret) return NextResponse.json({ error: "Paystack secret key is not configured." }, { status: 503 });

  const access = await getAdminAccess();
  const { searchParams } = new URL(req.url);
  const requestedClientId = sanitizeText(searchParams.get("clientId"), { maxLength: 128 });
  const clientId = access.isAdmin && requestedClientId ? requestedClientId : userId;

  const customer = await prisma.paystackCustomer.findUnique({ where: { clientId } });
  if (!customer?.paystackCustomerCode) return NextResponse.json([]);

  const url = new URL("https://api.paystack.co/transaction");
  url.searchParams.set("customer", customer.paystackCustomerCode);
  url.searchParams.set("perPage", "50");

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${secret}` },
    cache: "no-store",
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok || payload?.status === false) {
    return NextResponse.json({ error: payload?.message || "Failed to load transactions" }, { status: 400 });
  }

  const rows = Array.isArray(payload?.data) ? payload.data : [];
  return NextResponse.json(
    rows.map((item: Record<string, unknown>) => ({
      id: String(item.id ?? ""),
      reference: String(item.reference ?? ""),
      amount: Number(item.amount ?? 0) / 100,
      status: String(item.status ?? ""),
      paidAt: typeof item.paid_at === "string" ? item.paid_at : null,
      channel: typeof item.channel === "string" ? item.channel : null,
      currency: typeof item.currency === "string" ? item.currency : "ZAR",
    }))
  );
}
