import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SettingsClient from "@/components/settings-client";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams?: { onboarding?: string };
}) {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  const profile = await prisma.profile.upsert({
    where: { id: userId },
    create: { id: userId },
    update: {},
  });

  return (
    <SettingsClient
      onboardingRequired={searchParams?.onboarding === "1"}
      profile={{
        fullName: profile.fullName ?? "",
        phone: profile.phone ?? "",
        companyName: profile.companyName ?? "",
        companyAddress: profile.companyAddress ?? "",
        companyWebsite: profile.companyWebsite ?? "",
        vatNumber: profile.vatNumber ?? "",
        notifyEmail: profile.notifyEmail,
        notifyUpdates: profile.notifyUpdates,
        notifyBilling: profile.notifyBilling,
      }}
    />
  );
}
