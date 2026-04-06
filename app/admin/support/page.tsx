import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminSupportClient from "@/components/admin-support";

export default async function AdminSupportPage() {
  const { userId } = await auth();
  if (!userId) redirect("/login?redirect_url=/admin/support");

  const tickets = await prisma.supportTicket.findMany({
    include: {
      profile: {
        select: {
          fullName: true,
          companyName: true,
          phone: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const serialized = tickets.map((t) => ({
    ...t,
    resolvedAt: t.resolvedAt?.toISOString() ?? null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }));

  return <AdminSupportClient initialTickets={serialized} />;
}
