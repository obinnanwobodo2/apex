import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import Link from "next/link";
import { ArrowRight, ExternalLink, Star, Scale, Scissors, HardHat, Calculator, Car, ShoppingBag, Hotel, Activity, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const INDUSTRIES = ["All", "Professional Services", "Retail & E-Commerce", "Food & Hospitality", "Health & Beauty", "Construction & Trade", "Finance & Legal"];

const PROJECTS = [
  {
    title: "Mokoena Legal Consultants",
    industry: "Finance & Legal",
    description: "Full brand identity overhaul and website rebuild for a Johannesburg law firm. We designed a clean, authoritative site with a dedicated practice areas page, attorney profiles, and an online consultation booking form integrated with their diary. SEO-optimised from day one with structured data for local search.",
    tags: ["Website", "SEO", "Booking System"],
    result: "+3 new clients in week 1",
    plan: "Growth",
    bg: "from-[#1b2340] to-[#2d3a6b]",
    Icon: Scale,
  },
  {
    title: "Naidoo Beauty Studio",
    industry: "Health & Beauty",
    description: "Modern salon website built on the Starter plan in 5 days. Features a multi-service online booking system, WhatsApp chat widget, before-and-after gallery with lightbox, and a client loyalty section. Mobile-first design optimised for Google Maps and 'near me' searches.",
    tags: ["Website", "Booking", "WhatsApp"],
    result: "Bookings up 60%",
    plan: "Starter",
    bg: "from-rose-500 to-pink-700",
    Icon: Scissors,
  },
  {
    title: "Van Zyl Construction",
    industry: "Construction & Trade",
    description: "Project portfolio website with a quote request form, before/after photo galleries per project, and a services breakdown. We ran local SEO targeting Cape Town suburbs, built Google Business Profile citations, and added a click-to-call button optimised for mobile users on site.",
    tags: ["Website", "Portfolio", "Local SEO"],
    result: "Page 1 on Google in 6 weeks",
    plan: "Growth",
    bg: "from-amber-600 to-orange-700",
    Icon: HardHat,
  },
  {
    title: "ZD Accounting",
    industry: "Finance & Legal",
    description: "Trust-focused website for a Johannesburg accounting firm — service pages for tax, payroll, and compliance, a secure client document portal, and CRM integration for lead capture. Monthly retainer includes quarterly content updates and ongoing technical SEO reporting.",
    tags: ["Website", "CRM", "Client Portal"],
    result: "30% more inquiries",
    plan: "Pro",
    bg: "from-[#1b2340] to-[#2dc5a2]",
    Icon: Calculator,
  },
  {
    title: "Ferreira Automotive",
    industry: "Retail & E-Commerce",
    description: "Full e-commerce store for a Pretoria auto parts supplier. We built a searchable product catalogue with 300+ SKUs, inventory sync, Paystack checkout, and automated WhatsApp order notifications. The site went from zero to first sale in under 14 days after launch.",
    tags: ["E-Commerce", "Paystack", "WhatsApp"],
    result: "R120K in online sales month 1",
    plan: "Pro",
    bg: "from-slate-700 to-slate-900",
    Icon: Car,
  },
  {
    title: "Patel Fashion Boutique",
    industry: "Retail & E-Commerce",
    description: "High-end fashion e-commerce with a curated lookbook layout, size-guide modals, persistent wishlist, and Instagram feed embedded on the homepage. Built on the Pro plan in 10 days with 80 products loaded, photographed, and described by our team.",
    tags: ["E-Commerce", "Fashion", "Instagram"],
    result: "80 products live in 10 days",
    plan: "Pro",
    bg: "from-purple-600 to-fuchsia-700",
    Icon: ShoppingBag,
  },
  {
    title: "Sunrise Guesthouse",
    industry: "Food & Hospitality",
    description: "Boutique guesthouse website with a room-by-room showcase, seasonal pricing tables, photo gallery, and a direct booking widget that bypasses Airbnb commissions. We added TripAdvisor schema markup to boost review visibility in search results.",
    tags: ["Website", "Booking", "Hospitality"],
    result: "Direct bookings up 45%",
    plan: "Growth",
    bg: "from-yellow-500 to-orange-500",
    Icon: Hotel,
  },
  {
    title: "Cape Physio Centre",
    industry: "Health & Beauty",
    description: "Healthcare website for a Cape Town physiotherapy practice — individual therapist profiles, condition-specific service pages, and an appointment scheduler with real-time availability. Medical SEO targeting 'physio near me' keywords drove organic growth over three months.",
    tags: ["Healthcare", "Appointments", "SEO"],
    result: "2x organic traffic in 3 months",
    plan: "Growth",
    bg: "from-teal-500 to-cyan-700",
    Icon: Activity,
  },
  {
    title: "BrightSpark Electrical",
    industry: "Construction & Trade",
    description: "Lean, fast-loading tradesperson site built in 5 days. Highlights: an instant quote tool that sends enquiries to WhatsApp, a Google Maps service area widget, an emergency call button pinned to mobile screens, and a review feed pulling from Google Business Profile.",
    tags: ["Trades", "Quotes", "Local SEO"],
    result: "Top 3 for local searches",
    plan: "Starter",
    bg: "from-yellow-400 to-amber-500",
    Icon: Zap,
  },
];

const STATS = [
  { value: "12+", label: "Projects delivered" },
  { value: "6", label: "Industries served" },
  { value: "24%", label: "Avg lead growth" },
  { value: "95%", label: "Client satisfaction" },
];

export default function PortfolioPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-16 px-4 bg-gradient-to-br from-gray-50 via-white to-brand-green/10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-green/10 text-brand-green text-sm font-medium mb-5">
            <Star className="h-4 w-4 fill-brand-green" />
            Real work, real results
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-brand-navy mb-5 leading-tight">
            Work we&apos;re proud of
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            Websites and digital solutions built for South African businesses across every industry.
          </p>
        </div>
      </section>

      {/* Stats bar */}
      <section className="py-10 px-4 bg-brand-navy">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="text-2xl font-extrabold text-brand-green">{s.value}</div>
              <div className="text-sm text-gray-300 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Industry filter - display only, no client-side filtering for SSR */}
      <section className="py-6 px-4 border-b bg-white sticky top-16 z-10">
        <div className="max-w-6xl mx-auto flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {INDUSTRIES.map((ind) => (
            <button key={ind} className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              ind === "All" ? "bg-brand-navy text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}>
              {ind}
            </button>
          ))}
        </div>
      </section>

      {/* Projects grid */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PROJECTS.map((p) => (
            <div key={p.title} className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all overflow-hidden flex flex-col">
              {/* Cover */}
              <div className={`relative h-44 bg-gradient-to-br ${p.bg} flex items-center justify-center`}>
                <p.Icon className="h-14 w-14 text-white/20" />
                <div className="absolute top-3 right-3">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-white/90 text-brand-navy font-medium border border-gray-200">{p.plan} Plan</span>
                </div>
              </div>
              {/* Content */}
              <div className="p-5 flex flex-col flex-1">
                <div className="text-xs text-brand-green font-semibold uppercase tracking-wide mb-1">{p.industry}</div>
                <h3 className="font-bold text-brand-navy mb-2">{p.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed flex-1">{p.description}</p>
                <div className="flex flex-wrap gap-1.5 mt-3 mb-4">
                  {p.tags.map((t) => (
                    <span key={t} className="text-xs px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600">{t}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between border-t pt-3">
                  <div className="text-sm font-semibold text-brand-green">{p.result}</div>
                  <button className="p-1.5 rounded-lg text-gray-300 group-hover:text-brand-green transition-colors">
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-extrabold text-brand-navy mb-4">Want results like these for your business?</h2>
          <p className="text-gray-500 mb-8">Tell us about your project and we&apos;ll send a tailored quote within 2 hours.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="xl" asChild><Link href="/contact">Start your project <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            <Button size="xl" variant="outline" asChild><Link href="/register">Get Started</Link></Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
