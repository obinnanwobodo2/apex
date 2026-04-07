"use client";

import { useMemo, useState } from "react";
import { Bot, CheckCircle2, Clock3, LifeBuoy, Loader2, Send, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

interface Ticket {
  id: string;
  userId: string;
  subject: string;
  message: string;
  priority: string;
  status: string;
  response: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  replies?: Array<{
    id: string;
    senderRole: string;
    senderName: string;
    message: string;
    createdAt: string;
  }>;
  profile: {
    fullName: string | null;
    companyName: string | null;
    phone: string | null;
  } | null;
}

const STATUS_OPTIONS = ["open", "in_progress", "resolved", "closed"] as const;

export default function AdminSupportClient({ initialTickets }: { initialTickets: Ticket[] }) {
  const [tickets, setTickets] = useState(initialTickets);
  const [activeId, setActiveId] = useState<string>(initialTickets[0]?.id ?? "");
  const [reply, setReply] = useState<string>(initialTickets[0]?.response ?? "");
  const [status, setStatus] = useState<string>(initialTickets[0]?.status ?? "open");
  const [saving, setSaving] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const active = useMemo(() => tickets.find((t) => t.id === activeId) ?? null, [tickets, activeId]);

  function selectTicket(id: string) {
    const ticket = tickets.find((t) => t.id === id);
    if (!ticket) return;
    setActiveId(id);
    setReply(ticket.response ?? ticket.replies?.[ticket.replies.length - 1]?.message ?? "");
    setStatus(ticket.status);
  }

  async function saveTicket() {
    if (!active) return;
    setSaving(true);
    try {
      const previousReply = active.replies?.[active.replies.length - 1]?.message ?? active.response ?? "";
      if (reply.trim() && reply.trim() !== previousReply.trim()) {
        await fetch("/api/support/replies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticketId: active.id, message: reply.trim() }),
        });
      }

      const res = await fetch(`/api/admin/support/${active.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, response: reply }),
      });
      if (!res.ok) throw new Error("Failed to update");
      const updated = await res.json();
      setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } finally {
      setSaving(false);
    }
  }

  async function generateAiReply() {
    if (!active) return;
    setAiLoading(true);
    setAiError("");
    try {
      const res = await fetch("/api/admin/ai/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: active.id,
          instruction: aiPrompt,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Failed to generate");
      }
      const data = await res.json();
      if (data.reply) setReply(data.reply);
      if (data.warning) setAiError(`AI fallback used: ${data.warning}`);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Failed to generate");
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-brand-navy">Support Inbox</h1>
        <p className="text-sm text-gray-400 mt-0.5">Handle all user support queries, update status, and reply in one place.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-brand-navy flex items-center gap-2">
              <LifeBuoy className="h-4 w-4 text-brand-green" />Open Tickets
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[70vh] overflow-y-auto">
            {tickets.length === 0 && (
              <p className="text-sm text-gray-400 py-8 text-center">No support tickets yet.</p>
            )}
            {tickets.map((ticket) => (
              <button
                key={ticket.id}
                onClick={() => selectTicket(ticket.id)}
                className={`w-full text-left p-3 rounded-xl border transition-colors ${
                  activeId === ticket.id ? "border-brand-green/30 bg-brand-green/5" : "border-gray-100 hover:border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-brand-navy truncate">{ticket.subject}</p>
                  <Badge variant={ticket.status === "resolved" || ticket.status === "closed" ? "default" : "secondary"} className="text-[10px]">
                    {ticket.status.replace("_", " ")}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 mt-1 truncate">{ticket.profile?.fullName ?? ticket.userId.slice(0, 8)}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(ticket.createdAt).toLocaleDateString("en-ZA")}</p>
              </button>
            ))}
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          {active ? (
            <>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-brand-navy">Ticket Detail</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{active.priority}</Badge>
                    <span className="text-xs text-gray-400">
                      Created {new Date(active.createdAt).toLocaleDateString("en-ZA")}
                    </span>
                    <span className="text-xs text-gray-400">Client: {active.profile?.fullName ?? "Unknown"}</span>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-sm font-semibold text-brand-navy mb-2">{active.subject}</p>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{active.message}</p>
                  </div>
                  {active.replies && active.replies.length > 0 && (
                    <div className="space-y-2">
                      {active.replies.map((entry) => (
                        <div key={entry.id} className="rounded-lg border border-gray-100 bg-white p-3">
                          <p className="text-[11px] font-semibold text-gray-500 mb-1">
                            {entry.senderName} · {new Date(entry.createdAt).toLocaleString("en-ZA")}
                          </p>
                          <p className="text-sm text-gray-700">{entry.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="text-sm">
                      <span className="text-gray-500">Status</span>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="mt-1 w-full h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{s.replace("_", " ")}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <label className="text-sm block">
                    <span className="text-gray-500">Admin response</span>
                    <Textarea
                      rows={6}
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      className="mt-1 resize-none"
                      placeholder="Write your reply to the client..."
                    />
                  </label>
                  <div className="flex justify-end">
                    <Button onClick={saveTicket} disabled={saving}>
                      {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                      Save Reply
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-brand-navy flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-brand-green" />AI Reply Assistant
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {aiError && (
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      {aiError}
                    </p>
                  )}
                  <Textarea
                    rows={3}
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="resize-none"
                    placeholder="Optional instruction (e.g., make it shorter and more formal)."
                  />
                  <Button variant="outline" onClick={generateAiReply} disabled={aiLoading}>
                    {aiLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Bot className="h-4 w-4 mr-2" />}
                    Generate Suggested Reply
                  </Button>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-16 text-center text-gray-400">
                <Clock3 className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                Select a ticket to review and respond.
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Card className="border-brand-green/20 bg-brand-green/5">
        <CardContent className="p-4 text-sm text-brand-navy flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-brand-green" />
          Client responses are visible instantly on the client dashboard Support tab.
        </CardContent>
      </Card>
    </div>
  );
}
