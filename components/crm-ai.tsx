"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const QUICK_PROMPTS = [
  "Summarise my pipeline and highlight top opportunities",
  "Which contacts haven't been followed up in the last 7 days?",
  "Draft a follow-up email for a new lead",
  "What tasks are most urgent this week?",
  "Give me a cold outreach message for a potential client",
  "Score my current leads and explain your reasoning",
];

export default function AiAssistantClient() {
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    setMessages([{
      role: "assistant",
      content: "Hi! I'm your AI sales assistant. I have access to your CRM data — contacts, deals, and tasks — so I can help you with lead scoring, drafting emails, pipeline analysis, follow-up suggestions, and more.\n\nWhat would you like to know?",
      timestamp: new Date(),
    }]);
  }, []);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text?: string) {
    const messageText = (text ?? input).trim();
    if (!messageText || loading) return;

    setInput("");
    const userMsg: Message = { role: "user", content: messageText, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/crm/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageText }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, {
          role: "assistant",
          content: data.reply,
          timestamp: new Date(),
        }]);
      } else {
        setMessages((prev) => [...prev, {
          role: "assistant",
          content: "Sorry, I encountered an error. Please check that your ANTHROPIC_API_KEY is set in your .env.local file.",
          timestamp: new Date(),
        }]);
      }
    } catch {
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: "Network error. Please try again.",
        timestamp: new Date(),
      }]);
    }
    setLoading(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-h-[800px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-navy flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-brand-green" />
            AI Assistant
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">Powered by Claude — has context of your CRM data</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMessages([{
            role: "assistant",
            content: "Conversation cleared. How can I help you?",
            timestamp: new Date(), // safe: only runs on client via click
          }])}
        >
          <RefreshCw className="h-4 w-4 mr-1.5" />Clear
        </Button>
      </div>

      {/* Messages */}
      <Card className="flex-1 overflow-hidden flex flex-col">
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === "assistant" ? "bg-brand-green/10" : "bg-brand-navy/10"
              }`}>
                {msg.role === "assistant"
                  ? <Bot className="h-4 w-4 text-brand-green" />
                  : <User className="h-4 w-4 text-brand-navy" />
                }
              </div>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-brand-navy text-white rounded-tr-sm"
                  : "bg-gray-100 text-brand-navy rounded-tl-sm"
              }`}>
                <div className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                <div className={`text-xs mt-1 ${msg.role === "user" ? "text-white/50" : "text-gray-400"}`}>
                  {msg.timestamp.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-green/10 flex items-center justify-center flex-shrink-0">
                <Bot className="h-4 w-4 text-brand-green" />
              </div>
              <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </CardContent>

        {/* Quick prompts */}
        {messages.length <= 1 && (
          <div className="px-4 pb-3 border-t">
            <p className="text-xs font-medium text-gray-400 mt-3 mb-2">Quick prompts</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => sendMessage(p)}
                  className="text-xs px-3 py-1.5 rounded-full bg-brand-green/10 text-brand-green hover:bg-brand-green/20 transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t flex gap-3 items-end">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your pipeline, draft an email, score leads..."
            rows={1}
            className="flex-1 resize-none min-h-[44px] max-h-32"
          />
          <Button onClick={() => sendMessage()} disabled={loading || !input.trim()} className="h-11 w-11 p-0 flex-shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
