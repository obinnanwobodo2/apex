import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { isDashboardGuestPreviewEnabled } from "@/lib/dashboard-guest-preview";
import MessagesClient from "@/components/messages-client";
import { Button } from "@/components/ui/button";
import { MessageCircle, FolderKanban } from "lucide-react";

export default async function MessagesPage() {
  const { userId } = await auth();
  const guestPreview = !userId && isDashboardGuestPreviewEnabled();
  if (!userId && !guestPreview) redirect("/login");

  const project = userId
    ? await prisma.project.findFirst({
        where: { userId, subscription: { is: { paid: true } } },
        orderBy: { createdAt: "desc" },
        include: {
          messages: { orderBy: { createdAt: "asc" } },
        },
      })
    : null;

  if (!project) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-navy">Messages</h1>
          <p className="text-sm text-gray-400 mt-0.5">Project communication with the Apex Visual team</p>
        </div>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-green/10 flex items-center justify-center mb-4">
            <MessageCircle className="h-8 w-8 text-brand-green" />
          </div>
          <h3 className="font-bold text-brand-navy mb-2">No active project yet</h3>
          <p className="text-sm text-gray-400 max-w-sm mb-6">
            Once you start a project, your team communication will appear here. All messages and updates happen in one place.
          </p>
          <Button asChild>
            <Link href="/dashboard/projects">
              <FolderKanban className="h-4 w-4 mr-2" />
              Start a project
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const serializedMessages = project.messages.map((m) => ({
    ...m,
    readAt: m.readAt?.toISOString() ?? null,
    createdAt: m.createdAt.toISOString(),
  }));

  return (
    <MessagesClient
      projectId={project.id}
      projectTitle={project.title}
      initialMessages={serializedMessages}
    />
  );
}
