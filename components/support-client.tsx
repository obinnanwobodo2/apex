"use client";

import { useState } from "react";
import {
  MessageCircle, Mail, Phone, Calendar, HelpCircle, ExternalLink,
  Send, ChevronDown, ChevronUp, Ticket, Clock, CheckCircle2, AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  priority: string;
  status: string;
  response: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

const FAQS = [
  { q: "How do I request a website update?", a: "Send us a WhatsApp or email describing the change. Updates are usually completed within 24–48 hours on business days." },
  { q: "When will my website go live?", a: "Timelines depend on your plan — Starter is 5–7 days, Growth is 7–10 days, Pro is 10–14 days from when we receive your onboarding information." },
  { q: "Can I cancel my subscription?", a: "Yes, you can cancel with 30 days notice. Your website will remain active until the end of the notice period." },
  { q: "How do I upload files or brand assets?", a: "Use the Files & Assets tab in your dashboard to upload logos, documents, or any files you want to share with our team." },
  { q: "What is included in 'unlimited updates'?", a: "Text changes, image swaps, adding new sections, contact info updates, adding new pages — anything that doesn't require building a completely new website from scratch." },
];

const PRIORITY_COLORS: Record<string, string> = {
  low: "text-gray-500 bg-gray-100",
  normal: "text-brand-navy bg-brand-navy/5",
  high: "text-brand-navy bg-brand-green/10",
  urgent: "text-brand-navy bg-brand-green/10",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  open: <AlertCircle className="h-3.5 w-3.5" />,
  in_progress: <Clock className="h-3.5 w-3.5" />,
  resolved: <CheckCircle2 className="h-3.5 w-3.5" />,
  closed: <CheckCircle2 className="h-3.5 w-3.5" />,
};

export default function SupportClient({ initialTickets }: { initialTickets: SupportTicket[] }) {
  const [tickets, setTickets] = useState<SupportTicket[]>(initialTickets);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [form, setForm] = useState({ subject: "", message: "", priority: "normal" });
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ subject?: string; message?: string }>({});

  async function submitTicket(e: React.FormEvent) {
    e.preventDefault();
    const errs: { subject?: string; message?: string } = {};
    if (!form.subject.trim()) errs.subject = "Subject is required.";
    if (!form.message.trim()) errs.message = "Message is required.";
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to submit");
      const ticket = await res.json();
      setTickets((prev) => [ticket, ...prev]);
      setSent(true);
      setFieldErrors({});
    } catch {
      setError("Failed to submit ticket. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-brand-navy">Support</h1>
        <p className="text-sm text-gray-400 mt-0.5">Get help, raise a ticket, or browse answers</p>
      </div>

      {/* Quick contact */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: <MessageCircle className="h-5 w-5" />, label: "WhatsApp", sub: "+27 75 459 8388", href: "https://wa.me/27754598388", color: "text-brand-navy bg-brand-green/10" },
          { icon: <Mail className="h-5 w-5" />, label: "Email Us", sub: "info@apexvisual.co.za", href: "mailto:info@apexvisual.co.za", color: "text-brand-navy bg-brand-navy/5" },
          { icon: <Calendar className="h-5 w-5" />, label: "Book a Call", sub: "30 min · Free", href: "https://calendly.com/apexvisual", color: "text-brand-navy bg-gray-100" },
          { icon: <Phone className="h-5 w-5" />, label: "Call Us", sub: "+27 75 459 8388", href: "tel:+27754598388", color: "text-brand-green bg-brand-green/10" },
        ].map((c) => (
          <a key={c.label} href={c.href} target="_blank" rel="noopener noreferrer"
            className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-3 hover:border-brand-green/30 hover:shadow-md transition-all">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.color}`}>{c.icon}</div>
            <div>
              <div className="font-semibold text-brand-navy text-sm">{c.label}</div>
              <div className="text-xs text-gray-400">{c.sub}</div>
            </div>
            <ExternalLink className="h-3.5 w-3.5 text-gray-300 ml-auto" />
          </a>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Ticket form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-brand-navy text-base">Submit a Ticket</CardTitle>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-brand-green/10 flex items-center justify-center mx-auto mb-3">
                  <Send className="h-6 w-6 text-brand-green" />
                </div>
                <h3 className="font-bold text-brand-navy mb-1">Ticket submitted!</h3>
                <p className="text-sm text-gray-400">Your ticket has been submitted — we&apos;ll respond within 24 hours on business days.</p>
                <button
                  onClick={() => { setSent(false); setForm({ subject: "", message: "", priority: "normal" }); }}
                  className="mt-4 text-sm text-brand-green hover:underline"
                >
                  Submit another
                </button>
              </div>
            ) : (
              <form onSubmit={submitTicket} className="space-y-4">
                {error && <p className="text-sm text-red-500">{error}</p>}
                <div className="space-y-1.5">
                  <Label>Subject *</Label>
                  <Input
                    value={form.subject}
                    onChange={(e) => { setForm({ ...form, subject: e.target.value }); setFieldErrors((p) => ({ ...p, subject: undefined })); }}
                    placeholder="e.g. Update homepage banner image"
                    className={fieldErrors.subject ? "border-red-400 focus-visible:ring-red-400" : ""}
                  />
                  {fieldErrors.subject && <p className="text-xs text-red-500">{fieldErrors.subject}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Priority</Label>
                  <div className="flex gap-2">
                    {["low", "normal", "high", "urgent"].map((p) => (
                      <button key={p} type="button" onClick={() => setForm({ ...form, priority: p })}
                        className={`flex-1 py-1.5 rounded-lg border text-xs font-medium capitalize transition-all ${
                          form.priority === p ? "border-brand-green bg-brand-green/5 text-brand-green" : "border-gray-200 text-gray-500 hover:border-gray-300"
                        }`}>{p}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Message *</Label>
                  <Textarea
                    rows={4}
                    className={`resize-none ${fieldErrors.message ? "border-red-400 focus-visible:ring-red-400" : ""}`}
                    value={form.message}
                    onChange={(e) => { setForm({ ...form, message: e.target.value }); setFieldErrors((p) => ({ ...p, message: undefined })); }}
                    placeholder="Describe your request in detail..."
                  />
                  {fieldErrors.message && <p className="text-xs text-red-500">{fieldErrors.message}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  <Send className="h-4 w-4 mr-2" />{submitting ? "Submitting…" : "Submit Ticket"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle className="text-brand-navy text-base flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-brand-green" />Frequently Asked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {FAQS.map((faq, i) => (
                <div key={i} className="border border-gray-100 rounded-xl overflow-hidden">
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors">
                    <span className="text-sm font-medium text-brand-navy pr-4">{faq.q}</span>
                    {openFaq === i ? <ChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />}
                  </button>
                  {openFaq === i && (
                    <div className="px-4 pb-4 text-sm text-gray-500 leading-relaxed">{faq.a}</div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* My tickets */}
      {tickets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-brand-navy text-base flex items-center gap-2">
              <Ticket className="h-4 w-4 text-brand-green" />My Tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tickets.map((t) => (
                <div key={t.id} className="p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-brand-navy text-sm">{t.subject}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {new Date(t.createdAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${PRIORITY_COLORS[t.priority] ?? "text-gray-500 bg-gray-100"}`}>
                        {t.priority}
                      </span>
                      <Badge variant={t.status === "resolved" || t.status === "closed" ? "default" : "secondary"} className="gap-1 text-xs">
                        {STATUS_ICONS[t.status]}
                        {t.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                  {t.response && (
                    <div className="mt-3 p-3 bg-brand-green/5 border border-brand-green/10 rounded-lg text-sm text-gray-700">
                      <span className="text-xs font-semibold text-brand-green uppercase tracking-wide block mb-1">Team Response</span>
                      {t.response}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-brand-green animate-pulse" />
              <div>
                <div className="font-semibold text-brand-navy">All Systems Operational</div>
                <div className="text-xs text-gray-400 mt-0.5">Website · Dashboard · Payments · CRM · AI</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
