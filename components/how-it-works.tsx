"use client";

import { motion } from "framer-motion";
import { UserCheck, Palette, Rocket, RefreshCw } from "lucide-react";

const steps = [
  { icon: UserCheck, number: "01", title: "Choose Your Plan", desc: "Pick the package that fits your business. Starter, Growth, or Pro — each covers everything you need." },
  { icon: Palette, number: "02", title: "We Onboard You", desc: "Share your branding, content and goals. We handle the rest — smooth intake, no tech headaches." },
  { icon: Rocket, number: "03", title: "Go Live", desc: "Your site is designed, reviewed and launched. Fast turnarounds so you're online and generating leads." },
  { icon: RefreshCw, number: "04", title: "Monthly Care", desc: "We keep your site updated, optimised and performing every month — like having your own web team." },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="text-xs font-bold text-brand-green uppercase tracking-widest">Process</span>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mt-3 mb-4">How it works</h2>
          <p className="text-gray-600 text-lg max-w-xl mx-auto">
            From zero to a fully-managed, growing website in four simple steps.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative bg-white border border-gray-200 rounded-2xl p-6 hover:border-gray-300 transition-all"
              >
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 -right-2 w-4 h-[1px] bg-gray-300 z-10" />
                )}
                <div className="text-[10px] font-bold text-gray-500 mb-4">{step.number}</div>
                <div className="w-10 h-10 rounded-xl bg-brand-green/10 border border-brand-green/20 flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5 text-brand-green" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm mb-2">{step.title}</h3>
                <p className="text-gray-600 text-xs leading-relaxed">{step.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
