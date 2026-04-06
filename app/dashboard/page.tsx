import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DashboardOverview from "@/components/dashboard-overview";
import { PACKAGES, type PackageId } from "@/lib/utils";
import { isDashboardGuestPreviewEnabled } from "@/lib/dashboard-guest-preview";

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
  const guestPreview = !userId && isDashboardGuestPreviewEnabled();
  if (!userId && !guestPreview) redirect("/login");
  const initialPlanId = getInitialPlanId(searchParams?.plan);

  const [subscriptions, projects] = userId
    ? await Promise.all([
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
    ])
    : [[], []];

  if (userId) {
    // Ensure profile row exists and sync display name from Clerk.
    const clerkUser = await currentUser();
    const fullName = clerkUser?.fullName ??
      ([clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") || null);
    await prisma.profile.upsert({
      where: { id: userId },
      create: { id: userId, fullName },
      update: fullName ? { fullName } : {},
    });
  }

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
