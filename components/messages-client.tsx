"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Message {
  id: string;
  projectId: string;
  userId: string;
  senderRole: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

export default function MessagesClient({
  projectId,
  projectTitle,
  initialMessages,
  isAdmin = false,
}: {
  projectId: string;
  projectTitle: string;
  initialMessages: Message[];
  isAdmin?: boolean;
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
      setMessages((prev) => [...prev, msg]);
      setInput("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-brand-navy">Messages</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {isAdmin ? `Client project: ${projectTitle}` : `Project: ${projectTitle}`}
        </p>
      </div>

      <Card className="flex flex-col" style={{ height: "calc(100vh - 240px)", minHeight: "440px" }}>
        <CardHeader className="pb-3 flex-shrink-0 border-b border-gray-100">
          <CardTitle className="text-base text-brand-navy flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-brand-green" />
            {isAdmin ? "Client Conversation" : "Your conversation with Apex Visual"}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col flex-1 min-h-0 p-0">
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                <div className="w-12 h-12 rounded-2xl bg-brand-green/10 flex items-center justify-center mb-3">
                  <MessageCircle className="h-6 w-6 text-brand-green" />
                </div>
                <p className="text-sm font-semibold text-brand-navy mb-1">No messages yet</p>
                <p className="text-xs text-gray-400 max-w-xs">
                  {isAdmin
                    ? "Send the client an update or question about their project."
                    : "Send a message to start the conversation with the Apex Visual team."}
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isSelf = isAdmin ? msg.senderRole === "admin" : msg.senderRole === "client";
                return (
                  <div key={msg.id} className={`flex ${isSelf ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                        isSelf
                          ? "bg-brand-navy text-white rounded-br-sm"
                          : "bg-gray-100 text-gray-800 rounded-bl-sm"
                      }`}
                    >
                      <div
                        className={`text-[10px] font-semibold mb-1 ${
                          isSelf ? "text-white/60" : "text-gray-400"
                        }`}
                      >
                        {isSelf ? "You" : isAdmin ? "Client" : "Apex Visual Team"}
                      </div>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                      <div
                        className={`text-[10px] mt-1.5 ${
                          isSelf ? "text-white/50 text-right" : "text-gray-400"
                        }`}
                      >
                        {new Date(msg.createdAt).toLocaleString("en-ZA", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          <div className="flex-shrink-0 border-t border-gray-200 p-4">
            {error && (
              <p className="text-xs text-red-600 mb-2">{error}</p>
            )}
            <div className="flex gap-3">
              <Textarea
                rows={2}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Type your message… (Enter to send, Shift+Enter for new line)"
                className="flex-1 resize-none text-sm"
              />
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || sending}
                className="h-auto px-4 self-end"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
