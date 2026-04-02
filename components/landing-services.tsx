"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Globe, TrendingUp, Search, ShoppingCart, Bot, Zap, Server, Users, ArrowRight } from "lucide-react";

const SERVICES = [
  { icon: Globe, title: "Website Design & Build", desc: "Custom, fast, mobile-first websites built to convert visitors into customers.", color: "#1b2340", bg: "bg-brand-green/10" },
  { icon: TrendingUp, title: "Monthly Care Plans", desc: "Unlimited updates, performance monitoring, and ongoing improvements every month.", color: "#1b2340", bg: "bg-brand-navy/5" },
  { icon: Search, title: "SEO Optimisation", desc: "Get found on Google. We handle on-page SEO, local search, and monthly rankings.", color: "#1b2340", bg: "bg-brand-green/10" },
  { icon: ShoppingCart, title: "E-Commerce Setup", desc: "Start selling online with a full store, Paystack integration, and inventory management.", color: "#1b2340", bg: "bg-brand-navy/5" },
  { icon: Bot, title: "AI-Powered CRM", desc: "Manage contacts, pipeline, and tasks with built-in AI assistant for your sales team.", color: "#1b2340", bg: "bg-brand-green/10" },
  { icon: Zap, title: "Integrations & Automation", desc: "Connect your tools — WhatsApp, email, payments, and custom webhook automations.", color: "#1b2340", bg: "bg-brand-green/10" },
  { icon: Server, title: "Hosting & Domains", desc: "Fast SA-based hosting with SSL, domain management, and 99.9% uptime guarantee.", color: "#1b2340", bg: "bg-brand-navy/5" },
  { icon: Users, title: "Client Dashboard", desc: "Your own branded portal to track projects, invoices, and communicate with our team.", color: "#1b2340", bg: "bg-brand-green/10" },
];

export default function LandingServices() {
  return (
    <section id="services" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="text-xs font-bold text-brand-green uppercase tracking-widest">Services</span>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mt-3 mb-4">
            Everything your business needs
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            From a simple website to a full CRM + AI stack — all under one roof, in simple monthly plans.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SERVICES.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ y: -3 }}
                className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-gray-300 transition-all"
              >
                <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-4`}>
                  <Icon className="h-5 w-5" style={{ color: s.color }} />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm mb-2 leading-snug">{s.title}</h3>
                <p className="text-gray-600 text-xs leading-relaxed">{s.desc}</p>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-10"
        >
          <Link href="/services"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg,#1b2340,#2dc5a2)" }}>
            Explore All Services <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
