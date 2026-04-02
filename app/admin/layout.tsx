import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import AdminShell from "@/components/admin-shell";
import { getAdminAccess } from "@/lib/admin";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  const access = await getAdminAccess();
  if (!access.isAdmin) {
    redirect("/dashboard");
  }

  return <AdminShell>{children}</AdminShell>;
}
