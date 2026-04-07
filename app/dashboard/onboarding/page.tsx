import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import OnboardingForm from "./onboarding-form";

export default async function OnboardingPage() {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  // If user already has a project, skip onboarding
  const existingProject = await prisma.project.findFirst({
    where: { userId },
    select: { id: true },
  });
  if (existingProject) redirect("/dashboard");

  // Get the most recent paid subscription for pre-filling
  const subscription = await prisma.subscription.findFirst({
    where: { userId, paid: true },
    orderBy: { createdAt: "desc" },
    select: { id: true, businessName: true, package: true },
  });

  return (
    <OnboardingForm
      subscriptionId={subscription?.id ?? null}
      defaultBusinessName={subscription?.businessName ?? ""}
      packageName={subscription?.package ?? ""}
    />
  );
}
