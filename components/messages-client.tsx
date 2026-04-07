"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { Send, Loader2, MessageCircle, CheckCheck, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getPusherClient } from "@/lib/pusher-client";
import { getClientChannelName } from "@/lib/realtime";

interface Message {
  id: string;
  projectId: string;
  userId: string;
  senderRole: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

function formatMessageTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);

  if (diffDays === 0) {
    return d.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" });
  }
  if (diffDays === 1) {
    return `Yesterday ${d.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}`;
  }
  return d.toLocaleString("en-ZA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function groupMessagesByDate(messages: Message[]) {
  const groups: { dateLabel: string; messages: Message[] }[] = [];
  let currentLabel = "";

  for (const msg of messages) {
    const d = new Date(msg.createdAt);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    let label = "";
    if (diffDays === 0) label = "Today";
    else if (diffDays === 1) label = "Yesterday";
    else label = d.toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long" });

    if (label !== currentLabel) {
      groups.push({ dateLabel: label, messages: [] });
      currentLabel = label;
    }
    groups[groups.length - 1].messages.push(msg);
  }

  return groups;
}

function InitialAvatar({ name, isAdmin }: { name: string; isAdmin: boolean }) {
  const initial = name.charAt(0).toUpperCase();
  return (
    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
      isAdmin ? "bg-brand-navy text-white" : "bg-brand-green/20 text-brand-green"
    }`}>
      {initial}
    </div>
  );
}

export default function MessagesClient({
  projectId,
  projectTitle,
  initialMessages,
  isAdmin = false,
  clientId,
}: {
  projectId: string;
  projectTitle: string;
  initialMessages: Message[];
  isAdmin?: boolean;
  clientId?: string;
}) {
  const { userId } = useAuth();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const selfLabel = isAdmin ? "Apex Visual (Admin)" : "You";
  const otherLabel = isAdmin ? "Client" : "Apex Visual Team";
  const selfInitial = isAdmin ? "A" : "C";
  const otherInitial = isAdmin ? "C" : "A";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const targetClientId = clientId || userId;
    if (!targetClientId) return;
    const pusher = getPusherClient();
    if (!pusher) return;

    const channel = pusher.subscribe(getClientChannelName(targetClientId));
    const onMessage = (payload: { projectId?: string; message?: Message }) => {
      const incomingMessage = payload?.message;
      if (!payload?.projectId || payload.projectId !== projectId || !incomingMessage) return;
      setMessages((prev) => {
        if (prev.some((item) => item.id === incomingMessage.id)) return prev;
        return [...prev, incomingMessage];
      });
    };
    channel.bind("new-message", onMessage);
    return () => {
      channel.unbind("new-message", onMessage);
      pusher.unsubscribe(getClientChannelName(targetClientId));
    };
  }, [clientId, projectId, userId]);

  const refreshMessages = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/messages/${projectId}`, { cache: "no-store" });
      const data = await res.json().catch(() => []);
      if (res.ok && Array.isArray(data)) setMessages(data);
    } finally {
      setRefreshing(false);
    }
  }, [projectId]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch(`/api/messages/${projectId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Failed to send message");
      }
      const msg = await res.json();
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      setInput("");
      textareaRef.current?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSending(false);
    }
  }

  const groups = groupMessagesByDate(messages);

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 120px)", minHeight: "500px" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 bg-white rounded-t-2xl flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #1b2340, #2dc5a2)" }}>
            <MessageCircle className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="font-bold text-brand-navy text-sm">{isAdmin ? `Client: ${projectTitle}` : "Apex Visual Team"}</div>
            <div className="text-xs text-gray-400">{projectTitle}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isAdmin ? "bg-brand-navy/10 text-brand-navy" : "bg-brand-green/10 text-brand-green"}`}>
            {isAdmin ? "ADMIN VIEW" : "CLIENT VIEW"}
          </span>
          <button onClick={refreshMessages} disabled={refreshing}
            className="p-1.5 rounded-lg text-gray-400 hover:text-brand-navy hover:bg-gray-100 transition-colors disabled:opacity-50" title="Refresh messages">
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1 bg-gray-50/60">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-brand-green/10 flex items-center justify-center mb-4">
              <MessageCircle className="h-7 w-7 text-brand-green" />
            </div>
            <p className="text-sm font-semibold text-brand-navy mb-1">No messages yet</p>
            <p className="text-xs text-gray-400 max-w-xs">
              {isAdmin
                ? "Send the client an update about their project."
                : "Send us a message to start the conversation about your project."}
            </p>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.dateLabel}>
              {/* Date separator */}
              <div className="flex items-center gap-3 py-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-[11px] text-gray-400 font-medium px-2 whitespace-nowrap">{group.dateLabel}</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <div className="space-y-2">
                {group.messages.map((msg, idx) => {
                  const isSelf = isAdmin ? msg.senderRole === "admin" : msg.senderRole === "client";
                  const isConsecutive = idx > 0 && (isAdmin
                    ? group.messages[idx - 1].senderRole === "admin" === (msg.senderRole === "admin")
                    : group.messages[idx - 1].senderRole === "client" === (msg.senderRole === "client"));

                  return (
                    <div key={msg.id} className={`flex items-end gap-2 ${isSelf ? "flex-row-reverse" : "flex-row"}`}>
                      {/* Avatar — only show for first in a run */}
                      {!isConsecutive ? (
                        <InitialAvatar name={isSelf ? selfInitial : otherInitial} isAdmin={isSelf ? isAdmin : !isAdmin} />
                      ) : (
                        <div className="w-7 flex-shrink-0" />
                      )}

                      <div className={`flex flex-col ${isSelf ? "items-end" : "items-start"} max-w-[72%]`}>
                        {/* Sender label — only show first in run */}
                        {!isConsecutive && (
                          <span className={`text-[11px] font-semibold mb-1 px-1 ${
                            isSelf
                              ? "text-brand-navy/60"
                              : isAdmin ? "text-brand-green" : "text-brand-green"
                          }`}>
                            {isSelf ? selfLabel : otherLabel}
                          </span>
                        )}

                        {/* Bubble */}
                        <div className={`relative px-4 py-2.5 ${
                          isSelf
                            ? "rounded-2xl rounded-br-sm text-white"
                            : "rounded-2xl rounded-bl-sm text-gray-800 bg-white border border-gray-200"
                          }`}
                          style={isSelf ? { background: "linear-gradient(135deg, #1b2340 0%, #243060 100%)" } : undefined}
                        >
                          {/* Admin badge inside bubble */}
                          {isAdmin && isSelf && (
                            <span className="block text-[9px] text-brand-green/70 font-bold uppercase tracking-wider mb-1">Admin</span>
                          )}
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                          <div className={`flex items-center gap-1 mt-1.5 ${isSelf ? "justify-end" : "justify-start"}`}>
                            <span className={`text-[10px] ${isSelf ? "text-white/40" : "text-gray-400"}`}>
                              {formatMessageTime(msg.createdAt)}
                            </span>
                            {isSelf && (
                              <CheckCheck className={`h-3 w-3 ${msg.readAt ? "text-brand-green" : "text-white/40"}`} />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 border-t border-gray-200 p-4 bg-white rounded-b-2xl">
        {error && <p className="text-xs text-red-600 mb-2 px-1">{error}</p>}
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void sendMessage();
                }
              }}
              placeholder={isAdmin ? "Reply to client… (Enter to send)" : "Message Apex Visual Team… (Enter to send)"}
              className="resize-none text-sm pr-2 border-gray-200 focus:border-brand-green focus:ring-brand-green/20 rounded-xl"
            />
          </div>
          <Button
            onClick={() => void sendMessage()}
            disabled={!input.trim() || sending}
            className="h-[68px] w-12 p-0 rounded-xl flex-shrink-0"
            style={{ background: input.trim() && !sending ? "linear-gradient(135deg,#1b2340,#2dc5a2)" : undefined }}
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-[10px] text-gray-400 mt-2 px-1">
          {isAdmin ? "Replying as Apex Visual admin · " : ""}Shift+Enter for new line · Enter to send
        </p>
      </div>
    </div>
  );
}
