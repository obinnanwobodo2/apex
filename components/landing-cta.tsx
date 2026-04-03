"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Phone } from "lucide-react";

export default function LandingCta() {
  return (
    <section className="py-24 bg-gray-50 relative overflow-hidden">
      {/* Glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[300px] h-[180px] sm:w-[600px] sm:h-[300px] rounded-full blur-[90px] sm:blur-[120px] opacity-15"
          style={{ background: "linear-gradient(135deg,#1b2340,#2dc5a2)" }} />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="text-xs font-bold text-brand-green uppercase tracking-widest">Get Started Today</span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-gray-900 mt-4 mb-5 leading-tight">
            Ready to grow your
            <br className="hidden sm:block" />
            <span className="sm:hidden"> </span>
            <span style={{ background: "linear-gradient(135deg,#1b2340,#2dc5a2)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              online presence?
            </span>
          </h2>
          <p className="text-gray-600 text-base sm:text-lg mb-10 max-w-xl mx-auto">
            Pick a plan, get onboarded in 24 hours, and let us handle your entire digital presence.
            No contracts. Cancel anytime.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/#packages"
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-bold text-white transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg,#1b2340,#2dc5a2)", boxShadow: "0 0 28px rgba(45,197,162,0.25)" }}>
              Choose Your Plan <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/contact"
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-semibold text-gray-900 border border-gray-300 bg-white hover:bg-gray-100 hover:border-gray-400 transition-all">
              <Phone className="h-4 w-4" />Book a Consultation
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
