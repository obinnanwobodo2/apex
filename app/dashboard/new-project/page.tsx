import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FolderPlus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { isDashboardGuestPreviewEnabled } from "@/lib/dashboard-guest-preview";

export default async function NewProjectPage() {
  const { userId } = await auth();
  const guestPreview = !userId && isDashboardGuestPreviewEnabled();
  if (!userId && !guestPreview) redirect("/login");

  return (
    <Card>
      <CardContent className="py-14 text-center">
        <FolderPlus className="h-10 w-10 text-gray-200 mx-auto mb-3" />
        <h1 className="text-xl font-bold text-brand-navy mb-2">Start a New Project</h1>
        <p className="text-sm text-gray-400 mb-5">
          New project submissions are managed in Requests so your project brief and payment flow stay in one place.
        </p>
        <Button asChild>
          <Link href="/dashboard/requests">Go to Requests</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
