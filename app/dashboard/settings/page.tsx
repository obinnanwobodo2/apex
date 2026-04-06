import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SettingsClient from "@/components/settings-client";
import { isDashboardGuestPreviewEnabled } from "@/lib/dashboard-guest-preview";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams?: { onboarding?: string };
}) {
  const { userId } = await auth();
  const guestPreview = !userId && isDashboardGuestPreviewEnabled();
  if (!userId && !guestPreview) redirect("/login");

  const profile = userId
    ? await prisma.profile.upsert({
      where: { id: userId },
      create: { id: userId },
      update: {},
    })
    : {
      fullName: "",
      phone: "",
      companyName: "",
      companyAddress: "",
      companyWebsite: "",
      vatNumber: "",
      notifyEmail: true,
      notifyUpdates: true,
      notifyBilling: true,
    };

  return (
    <SettingsClient
      isGuest={!!guestPreview}
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
