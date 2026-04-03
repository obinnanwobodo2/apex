import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ExternalLink, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const INDUSTRIES = ["All", "Professional Services", "Retail & E-Commerce", "Food & Hospitality", "Health & Beauty", "Construction & Trade", "Finance & Legal"];

const PROJECTS = [
  {
    title: "Mokoena Legal Consultants",
    industry: "Finance & Legal",
    description: "Complete rebrand + website for a Johannesburg law firm. Conversion-focused design with online consultation booking.",
    tags: ["Website", "SEO", "Booking System"],
    result: "+3 new clients in week 1",
    plan: "Growth",
    image: "/portfolio/professional.svg",
  },
  {
    title: "Naidoo Beauty Studio",
    industry: "Health & Beauty",
    description: "Modern salon website with online booking, WhatsApp integration, and before/after gallery.",
    tags: ["Website", "Booking", "WhatsApp"],
    result: "Bookings up 60%",
    plan: "Starter",
    image: "/portfolio/hospitality.svg",
  },
  {
    title: "Van Zyl Construction",
    industry: "Construction & Trade",
    description: "Professional project showcase with quote request system, before/after galleries, and local SEO for Cape Town.",
    tags: ["Website", "Portfolio", "Local SEO"],
    result: "Page 1 on Google in 6 weeks",
    plan: "Growth",
    image: "/portfolio/professional.svg",
  },
  {
    title: "ZD Accounting",
    industry: "Finance & Legal",
    description: "Clean, trustworthy website with service pages, client portal integration, and CRM for lead management.",
    tags: ["Website", "CRM", "Client Portal"],
    result: "30% more inquiries",
    plan: "Pro",
    image: "/portfolio/professional.svg",
  },
  {
    title: "Ferreira Automotive",
    industry: "Retail & E-Commerce",
    description: "Parts e-commerce store with inventory management, Paystack checkout, and WhatsApp order updates.",
    tags: ["E-Commerce", "Paystack", "WhatsApp"],
    result: "R120K in online sales month 1",
    plan: "Pro",
    image: "/portfolio/ecommerce.svg",
  },
  {
    title: "Patel Fashion Boutique",
    industry: "Retail & E-Commerce",
    description: "Shopfront-style e-commerce with lookbook galleries, size guides, Instagram feed integration.",
    tags: ["E-Commerce", "Fashion", "Instagram"],
    result: "80 products live in 10 days",
    plan: "Pro",
    image: "/portfolio/ecommerce.svg",
  },
  {
    title: "Sunrise Guesthouse",
    industry: "Food & Hospitality",
    description: "Hospitality website with room showcase, pricing tables, and Airbnb-style booking integration.",
    tags: ["Website", "Booking", "Hospitality"],
    result: "Direct bookings up 45%",
    plan: "Growth",
    image: "/portfolio/hospitality.svg",
  },
  {
    title: "Cape Physio Centre",
    industry: "Health & Beauty",
    description: "Healthcare website with appointment scheduling, therapist profiles, and medical SEO optimisation.",
    tags: ["Healthcare", "Appointments", "SEO"],
    result: "2x organic traffic in 3 months",
    plan: "Growth",
    image: "/portfolio/hospitality.svg",
  },
  {
    title: "BrightSpark Electrical",
    industry: "Construction & Trade",
    description: "Tradesperson website with instant quote tool, service area map, and emergency call button.",
    tags: ["Trades", "Quotes", "Local SEO"],
    result: "Top 3 for local searches",
    plan: "Starter",
    image: "/portfolio/professional.svg",
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
              <div className="relative h-44 bg-gray-100">
                <Image src={p.image} alt={`${p.title} project preview`} fill className="object-cover" />
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
          <h2 className="text-3xl font-extrabold text-brand-navy mb-4">Want results like these?</h2>
          <p className="text-gray-500 mb-8">Start with any plan and see measurable growth in your first month.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="xl" asChild><Link href="/#packages">Get Started <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            <Button size="xl" variant="outline" asChild><Link href="/contact">Talk to Us First</Link></Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
