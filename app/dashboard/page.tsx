import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import DashboardOverview from "@/components/dashboard-overview";
import { PACKAGES, type PackageId } from "@/lib/utils";

interface DashboardPageProps {
  searchParams?: {
    plan?: string;
  };
}

function getInitialPlanId(value: string | undefined): PackageId | null {
  if (!value) return null;
  const plan = value.trim() as PackageId;
  return plan in PACKAGES ? plan : null;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const { userId } = await auth();
  if (!userId) return null;
  const initialPlanId = getInitialPlanId(searchParams?.plan);

  // Ensure profile row exists for this Clerk user
  await prisma.profile.upsert({
    where: { id: userId },
    create: { id: userId },
    update: {},
  });

  const [subscriptions, projects] = await Promise.all([
    prisma.subscription.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.project.findMany({
      where: {
        userId,
        subscription: {
          is: {
            paid: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const serializedSubs = subscriptions.map((s) => ({
    ...s,
    cancelledAt: s.cancelledAt?.toISOString() ?? null,
    nextBillingDate: s.nextBillingDate?.toISOString() ?? null,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }));

  const serializedProjects = projects.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  return (
    <DashboardOverview
      subscriptions={serializedSubs}
      projects={serializedProjects}
      initialPlanId={initialPlanId}
    />
  );
}
