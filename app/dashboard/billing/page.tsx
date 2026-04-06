import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import BillingClient from "@/components/billing-client";

export default async function BillingPage() {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  const subscriptions = await prisma.subscription.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  const serialized = subscriptions.map((s) => ({
    ...s,
    cancelledAt: s.cancelledAt?.toISOString() ?? null,
    nextBillingDate: s.nextBillingDate?.toISOString() ?? null,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }));

  return <BillingClient initialSubscriptions={serialized} />;
}
