"use client";

import Link from "next/link";
import { MessageCircle, FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MessagesPage() {
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
          Once you start a project, your team communication will appear here. All messages, updates, and file sharing happen in one place.
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
