"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Rocket, Search, Server, Globe, Wrench, Palette, Layout, BarChart3, Mail, Share2, ArrowRight } from "lucide-react";

const UPSELLS = [
  { icon: Rocket, title: "Priority Delivery", desc: "Jump the queue — get your project delivered in 48 hours.", price: "R800", period: "once" },
  { icon: Search, title: "SEO Package", desc: "Full on-page + local SEO setup with monthly ranking reports.", price: "R1,200", period: "/mo" },
  { icon: Server, title: "Website Hosting", desc: "SA-based hosting, SSL, daily backups, 99.9% uptime.", price: "from R150", period: "/mo" },
  { icon: Globe, title: "Domain Purchase", desc: "Register .co.za or .com domains with DNS management.", price: "from R180", period: "/yr" },
  { icon: Wrench, title: "Maintenance Plan", desc: "Monthly security scans, speed optimisation, and backups.", price: "R600", period: "/mo" },
  { icon: Palette, title: "Brand Kit", desc: "Logo design, colour palette, typography, and brand guidelines.", price: "R3,500", period: "once" },
  { icon: Layout, title: "Landing Page Optimisation", desc: "CRO audit and redesign of your highest-traffic landing page.", price: "R2,500", period: "once" },
  { icon: BarChart3, title: "Analytics Setup", desc: "Google Analytics 4 + Search Console + monthly reports.", price: "R800", period: "once" },
  { icon: Mail, title: "Email Setup", desc: "Professional business email, hosting and template design.", price: "R450", period: "/mo" },
  { icon: Share2, title: "Social Media Kit", desc: "Profile setup, templates, and 30 days of scheduled posts.", price: "R2,000", period: "once" },
];

export default function LandingUpsells() {
  return (
    <section id="upsells" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="text-xs font-bold text-brand-green uppercase tracking-widest">Add-ons</span>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mt-3 mb-4">
            Supercharge your presence
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Add any service to your plan. Cancel or adjust anytime.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {UPSELLS.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-all group"
              >
                <div className="w-8 h-8 rounded-lg mb-3 flex items-center justify-center bg-brand-green/10">
                  <Icon className="h-4 w-4 text-brand-navy" />
                </div>
                <h3 className="font-semibold text-gray-900 text-xs mb-1 leading-snug">{item.title}</h3>
                <p className="text-gray-500 text-[11px] leading-relaxed mb-3">{item.desc}</p>
                <div>
                  <span className="text-sm font-bold text-gray-900">{item.price}</span>
                  <span className="text-[11px] text-gray-500 ml-1">{item.period}</span>
                </div>
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
          <Link href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-300 bg-white text-sm font-semibold text-gray-900 hover:bg-gray-100 transition-all">
            Discuss a custom package <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
