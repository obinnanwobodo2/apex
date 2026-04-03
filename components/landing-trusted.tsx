"use client";

import { motion } from "framer-motion";

const BRANDS = [
  "Acme Corp", "TechSA", "BuildRight", "MediaCo", "FreshBrand",
  "ProServices", "GrowthHQ", "StartupZA", "DigitalEdge", "NovaCo",
];

export default function LandingTrusted() {
  return (
    <section className="py-10 sm:py-14 border-y border-gray-200 bg-gray-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-[11px] sm:text-xs font-semibold text-gray-500 uppercase tracking-widest mb-6 sm:mb-8"
        >
          Trusted by growing South African businesses
        </motion.p>
        <div className="flex items-center gap-4 sm:gap-8 overflow-hidden">
          <motion.div
            className="flex items-center gap-8 sm:gap-12 whitespace-nowrap"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          >
            {[...BRANDS, ...BRANDS].map((brand, i) => (
              <span key={i} className="text-xs sm:text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors select-none flex-shrink-0">
                {brand}
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
