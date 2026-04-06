"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const TESTIMONIALS = [
  {
    name: "[Name]",
    business: "[Company]",
    location: "South Africa",
    text: "[Quote]",
    stars: 5,
    avatar: "NA",
  },
];

export default function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="text-xs font-bold text-brand-green uppercase tracking-widest">Reviews</span>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mt-3 mb-4">
            What clients are saying
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-gray-300 transition-all"
            >
              <Quote className="h-6 w-6 text-brand-green/40 mb-4" />
              <p className="text-gray-600 text-sm leading-relaxed mb-6">{t.text}</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-brand-green/10 border border-brand-green/20 flex items-center justify-center text-brand-green text-xs font-bold flex-shrink-0">
                  {t.avatar}
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{t.name}</div>
                  <div className="text-[11px] text-gray-500">{t.business} · {t.location}</div>
                </div>
                <div className="ml-auto flex gap-0.5">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} className="h-3 w-3 text-brand-green fill-brand-green" />
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
