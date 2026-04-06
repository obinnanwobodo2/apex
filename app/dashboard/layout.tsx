import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/dashboard-shell";
import { isDashboardGuestPreviewEnabled } from "@/lib/dashboard-guest-preview";

export const metadata = { title: "Dashboard — Apex Visual" };

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId && !isDashboardGuestPreviewEnabled()) redirect("/login");

  return <DashboardShell>{children}</DashboardShell>;
}
