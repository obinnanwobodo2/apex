import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import CrmOverview from "@/components/crm-overview";

export default async function CrmPage() {
  const { userId } = await auth();
  if (!userId) return null;

  await prisma.profile.upsert({ where: { id: userId }, create: { id: userId }, update: {} });

  const [contacts, deals, tasks, activities] = await Promise.all([
    prisma.contact.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    prisma.deal.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { contact: { select: { firstName: true, lastName: true } } },
    }),
    prisma.task.findMany({
      where: { userId, status: { not: "done" } },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      take: 5,
    }),
    prisma.activity.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { contact: { select: { firstName: true, lastName: true } } },
    }),
  ]);

  const serialized = {
    contacts: contacts.map((c) => ({ ...c, createdAt: c.createdAt.toISOString(), updatedAt: c.updatedAt.toISOString() })),
    deals: deals.map((d) => ({
      ...d,
      closeDate: d.closeDate?.toISOString() ?? null,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    })),
    tasks: tasks.map((t) => ({
      ...t,
      dueDate: t.dueDate?.toISOString() ?? null,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    })),
    activities: activities.map((a) => ({ ...a, createdAt: a.createdAt.toISOString() })),
  };

  return <CrmOverview data={serialized} />;
}
