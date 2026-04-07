"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import MessagesClient from "@/components/messages-client";

interface Message {
  id: string;
  projectId: string;
  userId: string;
  senderRole: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

interface ProjectThread {
  id: string;
  clientId: string;
  title: string;
  status: string;
  clientName: string;
  messages: Message[];
  updatedAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  requested: "bg-gray-100 text-gray-600",
  scoping: "bg-brand-navy/10 text-brand-navy",
  in_progress: "bg-amber-100 text-amber-700",
  review: "bg-brand-green/15 text-brand-green",
  completed: "bg-green-100 text-green-700",
};

export default function AdminMessagesClient({ projects }: { projects: ProjectThread[] }) {
  const [selectedId, setSelectedId] = useState<string>(projects[0]?.id ?? "");

  const selected = projects.find((p) => p.id === selectedId) ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-brand-navy">Messages</h1>
        <p className="text-sm text-gray-400 mt-0.5">Client conversations by project</p>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <MessageCircle className="h-12 w-12 text-gray-200 mx-auto mb-3" />
            <h3 className="font-bold text-brand-navy mb-1">No projects yet</h3>
            <p className="text-sm text-gray-400">Client message threads will appear here once projects are created.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" style={{ height: "calc(100vh - 200px)", minHeight: "500px" }}>
          {/* Project thread list */}
          <div className="lg:col-span-1 flex flex-col">
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col h-full">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Projects</p>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                {projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedId(p.id)}
                    className={`w-full text-left px-4 py-3 transition-colors ${
                      selectedId === p.id
                        ? "bg-brand-green/5 border-l-2 border-brand-green"
                        : "hover:bg-gray-50 border-l-2 border-transparent"
                    }`}
                  >
                    <div className="font-semibold text-brand-navy text-sm truncate">{p.title}</div>
                    <div className="text-xs text-gray-400 truncate mt-0.5">{p.clientName}</div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${
                          STATUS_COLORS[p.status] ?? "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {p.status.replace("_", " ")}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {p.messages.length} msg{p.messages.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Conversation */}
          <div className="lg:col-span-3 flex flex-col h-full">
            {selected ? (
              <MessagesClient
                projectId={selected.id}
                projectTitle={`${selected.title} — ${selected.clientName}`}
                initialMessages={selected.messages}
                isAdmin={true}
                clientId={selected.clientId}
              />
            ) : (
              <Card className="h-full">
                <CardContent className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-400">
                    <MessageCircle className="h-10 w-10 mx-auto mb-3 text-gray-200" />
                    <p className="text-sm">Select a project to view the conversation</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
