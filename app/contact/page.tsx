"use client";

import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { useState } from "react";
import { Mail, Phone, MapPin, MessageCircle, Calendar, Clock, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const CONTACT_METHODS = [
  { icon: <MessageCircle className="h-5 w-5" />, label: "WhatsApp", value: "+27 75 459 8388", action: "https://wa.me/27754598388", color: "text-green-600 bg-green-50" },
  { icon: <Mail className="h-5 w-5" />, label: "Email", value: "info@apexvisual.co.za", action: "mailto:info@apexvisual.co.za", color: "text-brand-navy bg-brand-navy/5" },
  { icon: <Phone className="h-5 w-5" />, label: "Phone", value: "+27 75 459 8388", action: "tel:+27754598388", color: "text-brand-green bg-brand-green/10" },
  { icon: <MapPin className="h-5 w-5" />, label: "Location", value: "South Africa (Remote)", action: "#", color: "text-brand-navy bg-gray-100" },
];

const HOURS = [
  { day: "Monday – Friday", time: "08:00 – 17:00" },
  { day: "Saturday", time: "09:00 – 13:00" },
  { day: "Sunday", time: "Closed" },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    await new Promise((r) => setTimeout(r, 1200)); // simulate send
    setSent(true);
    setSending(false);
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-16 px-4 bg-gradient-to-br from-gray-50 via-white to-brand-green/10">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-brand-navy mb-4">
            Let&apos;s talk about your <span className="text-brand-green">project</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            Book a free 30-minute consultation, send us a message, or just WhatsApp us. We respond within 2 hours.
          </p>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-12">
          {/* Contact info */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-brand-navy mb-4">Get in touch</h2>
              <div className="space-y-3">
                {CONTACT_METHODS.map((c) => (
                  <a key={c.label} href={c.action} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-brand-green/30 hover:bg-gray-50 transition-all group">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.color}`}>
                      {c.icon}
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 font-medium">{c.label}</div>
                      <div className="text-sm font-semibold text-brand-navy">{c.value}</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-4 w-4 text-brand-green" />
                <span className="font-semibold text-brand-navy text-sm">Business Hours</span>
              </div>
              <div className="space-y-2">
                {HOURS.map((h) => (
                  <div key={h.day} className="flex justify-between text-sm">
                    <span className="text-gray-500">{h.day}</span>
                    <span className="font-medium text-brand-navy">{h.time}</span>
                  </div>
                ))}
              </div>
            </div>

            <a
              href="https://calendly.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-xl bg-brand-navy text-white hover:bg-brand-navy/90 transition-colors"
            >
              <Calendar className="h-5 w-5 text-brand-green flex-shrink-0" />
              <div>
                <div className="font-semibold text-sm">Book a Free Consultation</div>
                <div className="text-xs text-gray-300">30 minutes · No obligation</div>
              </div>
            </a>
          </div>

          {/* Contact form */}
          <div className="lg:col-span-3">
            {sent ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-20">
                <div className="w-16 h-16 rounded-full bg-brand-green/10 flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-8 w-8 text-brand-green" />
                </div>
                <h3 className="text-xl font-bold text-brand-navy mb-2">Message received!</h3>
                <p className="text-gray-500">We&apos;ll get back to you within 2 hours during business hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <h2 className="text-xl font-bold text-brand-navy">Send us a message</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Your Name *</Label>
                    <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Smith" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email Address *</Label>
                    <Input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="john@business.co.za" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Phone Number</Label>
                    <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+27 75 459 8388" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Subject *</Label>
                    <Input required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Website quote / CRM / General" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Message *</Label>
                  <Textarea required rows={6} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Tell us about your business and what you need..." className="resize-none" />
                </div>
                <Button type="submit" size="lg" className="w-full" disabled={sending}>
                  {sending ? "Sending..." : <><Send className="h-4 w-4 mr-2" />Send Message</>}
                </Button>
                <p className="text-xs text-gray-400 text-center">We typically respond within 2 hours during business hours.</p>
              </form>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
