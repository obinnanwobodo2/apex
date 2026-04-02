"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  { q: "Do I own my website?", a: "Yes, absolutely. Once your site is live, it belongs to you. We manage it on a monthly basis, but ownership stays with you." },
  { q: "Can I cancel anytime?", a: "Yes. We require 30 days notice to cancel your plan. No lock-in contracts or cancellation penalties." },
  { q: "What happens after I choose a plan?", a: "After payment, you'll get dashboard access. We'll reach out within 24 hours to kick off onboarding and collect your branding, content and goals." },
  { q: "Is VAT included in the price?", a: "Prices shown are exclusive of VAT. VAT at 15% is added at checkout. We'll issue a VAT-compliant invoice for your records." },
  { q: "How long until my website is live?", a: "Starter: 5–7 days. Growth: 7–10 days. Pro: 10–14 days. This depends on how quickly you provide content and feedback." },
  { q: "What does 'unlimited updates' mean?", a: "Text changes, image swaps, new sections, contact info, new pages — anything short of a full rebuild. Most updates are done within 24–48 hours." },
  { q: "Do you offer e-commerce?", a: "Yes. E-commerce is included in the Growth and Pro plans, and can be added to Starter as an add-on. We integrate with Paystack and other SA payment providers." },
];

export default function FaqSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-xs font-bold text-brand-green uppercase tracking-widest">FAQ</span>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mt-3 mb-4">Common questions</h2>
        </motion.div>

        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="border border-gray-200 rounded-xl overflow-hidden bg-white"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm font-medium text-gray-900 pr-4">{faq.q}</span>
                <ChevronDown className={`h-4 w-4 text-gray-500 flex-shrink-0 transition-transform ${open === i ? "rotate-180" : ""}`} />
              </button>
              {open === i && (
                <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-200 pt-3">
                  {faq.a}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
