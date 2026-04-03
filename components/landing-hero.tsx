"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Shield, Zap, TrendingUp, Star, Play } from "lucide-react";

export default function LandingHero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white pt-20 pb-12 sm:pt-16">
      {/* Gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-[260px] h-[260px] sm:w-[500px] sm:h-[500px] rounded-full opacity-10 blur-[80px] sm:blur-[120px] pointer-events-none"
        style={{ background: "radial-gradient(circle, #1b2340 0%, transparent 70%)" }} />
      <div className="absolute bottom-1/4 right-1/4 w-[220px] h-[220px] sm:w-[400px] sm:h-[400px] rounded-full opacity-8 blur-[70px] sm:blur-[100px] pointer-events-none"
        style={{ background: "radial-gradient(circle, #2dc5a2 0%, transparent 70%)" }} />

      {/* Grid pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: "linear-gradient(rgba(17,24,39,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(17,24,39,0.06) 1px, transparent 1px)",
          backgroundSize: "60px 60px"
        }} />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-green/30 bg-brand-green/10 text-brand-green text-xs sm:text-sm font-medium mb-8"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
          Newly Established in 2025
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 leading-[1.05] tracking-tight mb-6"
        >
          Your Website,
          <br />
          <span style={{
            background: "linear-gradient(135deg, #1b2340, #2dc5a2)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text"
          }}>
            Fully Managed.
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-base sm:text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          One monthly fee covers everything — design, development, hosting, SEO,
          updates and ongoing support. No surprise invoices. No abandoned projects.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-14"
        >
          <Link href="/#packages"
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-base font-bold text-white transition-all hover:opacity-90 hover:scale-105 active:scale-100"
            style={{ background: "linear-gradient(135deg,#1b2340,#2dc5a2)", boxShadow: "0 0 28px rgba(45,197,162,0.25)" }}>
            View Packages <ArrowRight className="h-5 w-5" />
          </Link>
          <Link href="/contact"
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-base font-semibold text-gray-900 border border-gray-300 bg-white hover:bg-gray-100 hover:border-gray-400 transition-all">
            <Play className="h-4 w-4" />Book a Free Call
          </Link>
        </motion.div>

        {/* Trust strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="flex flex-wrap justify-center gap-4 sm:gap-8 text-xs sm:text-sm text-gray-600"
        >
          {[
            { icon: Shield, text: "No long-term contracts" },
            { icon: Zap, text: "Live in days, not months" },
            { icon: TrendingUp, text: "10+ businesses supported" },
            { icon: Star, text: "95% client satisfaction" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-brand-green" />
              <span>{text}</span>
            </div>
          ))}
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-px bg-gray-200 rounded-2xl overflow-hidden border border-gray-200"
        >
          {[
            { value: "10+", label: "Clients Served" },
            { value: "Since 2025", label: "Established" },
            { value: "95%", label: "Client Satisfaction" },
            { value: "5 days", label: "Avg Delivery" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white px-6 py-6 text-center">
              <div className="text-2xl font-extrabold text-white mb-1"
                style={{ background: "linear-gradient(135deg,#1b2340,#2dc5a2)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                {stat.value}
              </div>
              <div className="text-xs text-gray-500">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
