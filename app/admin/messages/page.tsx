import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminMessagesClient from "@/components/admin-messages";

export default async function AdminMessagesPage() {
  const { userId } = await auth();
  if (!userId) redirect("/login?redirect_url=/admin/messages");

  // Fetch all projects with their messages and client profile
  const projects = await prisma.project.findMany({
    include: {
      profile: { select: { fullName: true, companyName: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const serialized = projects.map((p) => ({
    id: p.id,
    clientId: p.userId,
    title: p.title,
    status: p.status,
    clientName:
      p.profile?.fullName ?? p.profile?.companyName ?? "Unknown Client",
    messages: p.messages.map((m) => ({
      ...m,
      readAt: m.readAt?.toISOString() ?? null,
      createdAt: m.createdAt.toISOString(),
    })),
    updatedAt: p.updatedAt.toISOString(),
  }));

  return <AdminMessagesClient projects={serialized} />;
}
