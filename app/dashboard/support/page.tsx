import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SupportClient from "@/components/support-client";

export default async function SupportPage() {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  const tickets = await prisma.supportTicket.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  const serialized = tickets.map((t) => ({
    ...t,
    resolvedAt: t.resolvedAt?.toISOString() ?? null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }));

  return <SupportClient initialTickets={serialized} />;
}
