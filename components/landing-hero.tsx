"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Shield, Zap, Clock } from "lucide-react";

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
          Most businesses are held back by a website that underperforms — slow, outdated, and impossible to maintain. Apex Visual changes that. One fixed monthly fee gives you a professionally built, fully managed digital presence: custom design, ongoing updates, SEO, and dedicated support. No hidden costs. No chasing freelancers. Just results.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-14"
        >
          <Link href="/register"
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-base font-bold text-white transition-all hover:opacity-90 hover:scale-105 active:scale-100"
            style={{ background: "linear-gradient(135deg,#1b2340,#2dc5a2)", boxShadow: "0 0 28px rgba(45,197,162,0.25)" }}>
            Get Started <ArrowRight className="h-5 w-5" />
          </Link>
          <Link href="/contact"
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-base font-semibold text-gray-900 border border-gray-300 bg-white hover:bg-gray-100 hover:border-gray-400 transition-all">
            Book a Free Call
          </Link>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-xs text-gray-400 mb-6 -mt-8"
        >
          We review all enquiries within 2 hours on weekdays. Limited onboarding spots available each month.
        </motion.p>

        {/* Trust strip — 3 columns */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="flex flex-wrap justify-center gap-4 sm:gap-8 text-xs sm:text-sm text-gray-600"
        >
          {[
            { icon: Shield, text: "No Long-Term Contracts" },
            { icon: Zap, text: "Dedicated Support" },
            { icon: Clock, text: "Cancel Anytime" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-brand-green" />
              <span>{text}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
