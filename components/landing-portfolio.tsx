"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowUpRight, Globe, Palette, Monitor, Megaphone, LayoutDashboard, ShoppingBag } from "lucide-react";

const PROJECTS = [
  {
    title: "E-Commerce Fashion Store",
    category: "E-Commerce",
    icon: ShoppingBag,
    color: "from-brand-navy/5 to-brand-green/10",
    accent: "#1b2340",
    tags: ["Next.js", "Paystack", "Tailwind"],
  },
  {
    title: "Corporate Brand Identity",
    category: "Branding",
    icon: Palette,
    color: "from-brand-green/10 to-brand-navy/5",
    accent: "#1b2340",
    tags: ["Logo Design", "Brand Kit", "Print"],
  },
  {
    title: "SaaS Marketing Website",
    category: "Web Design",
    icon: Monitor,
    color: "from-brand-navy/5 to-brand-green/10",
    accent: "#1b2340",
    tags: ["UI/UX", "Conversion", "SEO"],
  },
  {
    title: "Local Business SEO",
    category: "Marketing",
    icon: Megaphone,
    color: "from-brand-green/10 to-brand-navy/5",
    accent: "#1b2340",
    tags: ["Google Ads", "Local SEO", "Analytics"],
  },
  {
    title: "Client Management Dashboard",
    category: "SaaS App",
    icon: LayoutDashboard,
    color: "from-brand-navy/5 to-brand-green/10",
    accent: "#1b2340",
    tags: ["React", "Dashboard", "Auth"],
  },
  {
    title: "Restaurant Website & Menu",
    category: "Web Design",
    icon: Globe,
    color: "from-brand-green/10 to-brand-navy/5",
    accent: "#1b2340",
    tags: ["Booking", "Mobile-first", "Maps"],
  },
];

export default function LandingPortfolio() {
  return (
    <section id="portfolio" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="text-xs font-bold text-brand-green uppercase tracking-widest">Portfolio</span>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mt-3 mb-4">
            Work that <span style={{ background: "linear-gradient(135deg,#1b2340,#2dc5a2)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>delivers results</span>
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            From brand identity to full-stack SaaS applications — see what we build for businesses across South Africa.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PROJECTS.map((project, i) => {
            const Icon = project.icon;
            return (
              <motion.div
                key={project.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -4 }}
                className="group relative bg-white border border-gray-200 rounded-2xl p-6 overflow-hidden cursor-pointer hover:border-gray-300 transition-all"
              >
                {/* Background gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${project.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                <div className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: `${project.accent}20`, border: `1px solid ${project.accent}30` }}>
                      <Icon className="h-5 w-5" style={{ color: project.accent }} />
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-gray-900 transition-colors" />
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: project.accent }}>
                    {project.category}
                  </div>
                  <h3 className="font-bold text-gray-900 text-base mb-3 leading-tight">{project.title}</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {project.tags.map((tag) => (
                      <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                        {tag}
                      </span>
                    ))}
                  </div>
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
          <Link href="/portfolio"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-300 bg-white text-sm font-semibold text-gray-900 hover:bg-gray-100 hover:border-gray-400 transition-all">
            View Full Portfolio <ArrowUpRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
