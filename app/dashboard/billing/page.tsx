import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import BillingClient from "@/components/billing-client";
import { isDashboardGuestPreviewEnabled } from "@/lib/dashboard-guest-preview";

export default async function BillingPage() {
  const { userId } = await auth();
  const guestPreview = !userId && isDashboardGuestPreviewEnabled();
  if (!userId && !guestPreview) redirect("/login");

  const [subscriptions, paystackCustomer] = userId
    ? await Promise.all([
      prisma.subscription.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.paystackCustomer.findUnique({
        where: { clientId: userId },
      }),
    ])
    : [[], null];

  const serialized = subscriptions.map((s) => ({
    ...s,
    cancelledAt: s.cancelledAt?.toISOString() ?? null,
    nextBillingDate: s.nextBillingDate?.toISOString() ?? null,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }));

  return (
    <BillingClient
      initialSubscriptions={serialized}
      initialPaystackCustomer={paystackCustomer ? {
        ...paystackCustomer,
        createdAt: paystackCustomer.createdAt.toISOString(),
        updatedAt: paystackCustomer.updatedAt.toISOString(),
      } : null}
    />
  );
}
