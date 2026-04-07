import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SupportClient from "@/components/support-client";
import { isDashboardGuestPreviewEnabled } from "@/lib/dashboard-guest-preview";

export default async function SupportPage() {
  const { userId } = await auth();
  const guestPreview = !userId && isDashboardGuestPreviewEnabled();
  if (!userId && !guestPreview) redirect("/login");

  const tickets = userId
    ? await prisma.supportTicket.findMany({
      where: { userId },
      include: {
        replies: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    })
    : [];

  const serialized = tickets.map((t) => ({
    ...t,
    resolvedAt: t.resolvedAt?.toISOString() ?? null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    replies: t.replies.map((reply) => ({
      ...reply,
      createdAt: reply.createdAt.toISOString(),
    })),
  }));

  return <SupportClient initialTickets={serialized} isAuthenticated={Boolean(userId)} />;
}
