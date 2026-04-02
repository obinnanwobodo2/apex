"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Check, Clock, Zap, Star, Crown, ArrowRight } from "lucide-react";
import { PACKAGES, formatCurrency } from "@/lib/utils";

const packageIcons = {
  starter: Zap,
  growth: Star,
  pro: Crown,
};

const packageColors = {
  starter: { bg: "bg-brand-green/10", border: "border-brand-green/20", text: "text-brand-green", icon: "#1b2340" },
  growth: { bg: "bg-brand-navy/5", border: "border-brand-navy/20", text: "text-brand-navy", icon: "#1b2340" },
  pro: { bg: "bg-brand-green/10", border: "border-brand-green/20", text: "text-brand-green", icon: "#1b2340" },
};

export default function PricingSection() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleChoosePlan = (packageId: string) => {
    setLoading(packageId);
    router.push(`/checkout?package=${packageId}`);
  };

  return (
    <section id="packages" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="text-xs font-bold text-brand-green uppercase tracking-widest">Pricing</span>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mt-3 mb-4">
            Monthly Retainer Packages
          </h2>
          <p className="text-gray-600 text-lg max-w-xl mx-auto">
            All plans include a built website + ongoing monthly care. Cancel anytime.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
          {Object.values(PACKAGES).map((pkg, i) => {
            const Icon = packageIcons[pkg.id as keyof typeof packageIcons] ?? Zap;
            const colors = packageColors[pkg.id as keyof typeof packageColors] ?? packageColors.starter;

            return (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative flex flex-col rounded-2xl border transition-all hover:-translate-y-1 ${
                  pkg.popular
                    ? "border-brand-green/40 bg-white"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
                style={pkg.popular ? { boxShadow: "0 0 40px rgba(45,197,162,0.12)" } : undefined}
              >
                {pkg.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-white"
                      style={{ background: "linear-gradient(135deg,#1b2340,#2dc5a2)" }}>
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="p-7 flex flex-col flex-1">
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors.bg} border ${colors.border}`}>
                      <Icon className="h-5 w-5" style={{ color: colors.icon }} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{pkg.name}</h3>
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${colors.text}`}>{pkg.badge}</span>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-end gap-1">
                      <span className="text-4xl font-extrabold text-gray-900">{formatCurrency(pkg.price)}</span>
                      <span className="text-gray-500 text-sm mb-1.5">/month</span>
                    </div>
                    <p className="text-gray-500 text-sm mt-1">{pkg.tagline}</p>
                  </div>

                  <div className="border-t border-gray-200 mb-6" />

                  <ul className="space-y-3 flex-1">
                    {pkg.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm text-gray-600">
                        <Check className="h-4 w-4 text-brand-green mt-0.5 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-5 flex items-center gap-2 text-xs text-gray-500 bg-gray-100 rounded-lg px-3 py-2">
                    <Clock className="h-3.5 w-3.5" />
                    Turnaround: {pkg.turnaround}
                  </div>

                  <button
                    className="mt-5 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                    style={
                      pkg.popular
                        ? { background: "linear-gradient(135deg,#1b2340,#2dc5a2)" }
                        : { background: "#0f172a", border: "1px solid #0f172a" }
                    }
                    onClick={() => handleChoosePlan(pkg.id)}
                    disabled={loading === pkg.id}
                  >
                    {loading === pkg.id ? "Loading…" : "Choose Plan"}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        <p className="text-center text-xs text-gray-500 mt-8">
          Prices exclude VAT. Billed monthly. Cancel anytime with 30 days notice.
        </p>
      </div>
    </section>
  );
}
