import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import Link from "next/link";
import { ArrowRight, Globe, TrendingUp, ShoppingCart, Search, Bot, Zap, CreditCard, Server, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const SERVICES = [
  {
    icon: <Globe className="h-7 w-7" />,
    title: "Website Design & Build",
    desc: "Custom, conversion-focused websites designed and built for your business. Mobile-first, fast, and professional.",
    features: ["Custom design to match your brand", "Mobile-optimised & fast loading", "Contact forms & call-to-actions", "Analytics integration"],
    color: "text-brand-green bg-brand-green/10",
  },
  {
    icon: <TrendingUp className="h-7 w-7" />,
    title: "Monthly Website Care",
    desc: "Ongoing updates, improvements, and maintenance so your site always looks fresh and works perfectly.",
    features: ["Unlimited content updates", "Performance monitoring", "Security & backup management", "Monthly review calls"],
    color: "text-brand-navy bg-brand-navy/5",
  },
  {
    icon: <Search className="h-7 w-7" />,
    title: "SEO Optimisation",
    desc: "Get found on Google. We handle technical SEO, content optimisation, and local search strategy.",
    features: ["On-page SEO & metadata", "Local SEO for SA businesses", "Google Business Profile", "Monthly ranking reports"],
    color: "text-brand-navy bg-gray-100",
  },
  {
    icon: <ShoppingCart className="h-7 w-7" />,
    title: "E-Commerce Setup",
    desc: "Start selling online. We build and manage your online store with secure payment integration.",
    features: ["Product catalogue setup", "Paystack integration", "Inventory management", "Order tracking"],
    color: "text-brand-navy bg-gray-100",
  },
  {
    icon: <Bot className="h-7 w-7" />,
    title: "AI-Powered CRM",
    desc: "Manage your contacts, pipeline, and tasks in a CRM with built-in AI assistance for sales teams.",
    features: ["Contact & deal management", "Kanban sales pipeline", "AI lead scoring & insights", "WhatsApp & Gmail integration"],
    color: "text-brand-green bg-brand-green/10",
  },
  {
    icon: <Zap className="h-7 w-7" />,
    title: "Integrations & Automation",
    desc: "Connect your website and CRM to the tools you already use — CRM, email, payments, and more.",
    features: ["WhatsApp Business API", "Email marketing tools", "Payment gateway setup", "Custom webhook automations"],
    color: "text-brand-navy bg-brand-navy/5",
  },
  {
    icon: <Server className="h-7 w-7" />,
    title: "Hosting & Domain",
    desc: "Fast, reliable South African hosting with SSL, domain management, and 99.9% uptime guarantee.",
    features: ["SA-based server hosting", "Free SSL certificate", "Domain registration & DNS", "Daily backups"],
    color: "text-brand-green bg-brand-green/10",
  },
  {
    icon: <Users className="h-7 w-7" />,
    title: "Client Portal & Dashboard",
    desc: "Your own branded client portal to track projects, view invoices, and communicate with our team.",
    features: ["Project progress tracking", "Invoice & billing history", "File & asset management", "Direct team communication"],
    color: "text-brand-navy bg-brand-navy/5",
  },
];

const ADDONS = [
  { name: "Website Maintenance Plan", price: "R600/mo", desc: "Monthly updates, security checks, and backups" },
  { name: "Hosting (Basic)", price: "R150/mo", desc: "5GB SSD, SSL, 99.9% uptime" },
  { name: "Hosting (Business)", price: "R350/mo", desc: "20GB SSD, priority support, CDN" },
  { name: "CRM Starter", price: "R199/mo", desc: "Up to 500 contacts, AI assistant" },
  { name: "CRM Pro", price: "R1,200/mo", desc: "Unlimited contacts, full integrations" },
  { name: "Extra Domain", price: "R180/yr", desc: ".co.za or .com registration" },
  { name: "Priority Support", price: "R400/mo", desc: "4-hour response SLA, dedicated line" },
];

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-16 px-4 bg-gradient-to-br from-gray-50 via-white to-brand-green/10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-green/10 text-brand-green text-sm font-medium mb-5">
            <Zap className="h-4 w-4" />
            Full-service digital agency
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-brand-navy mb-5 leading-tight">
            Everything your business needs
            <br className="hidden sm:block" />
            <span className="sm:hidden"> </span>
            <span className="text-brand-green">to win online</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            From a simple website to a full CRM + AI stack — we offer everything under one roof,
            bundled in simple monthly plans.
          </p>
        </div>
      </section>

      {/* Services grid */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map((s) => (
              <div key={s.title} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.color}`}>
                  {s.icon}
                </div>
                <div>
                  <h3 className="font-bold text-brand-navy mb-1.5">{s.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
                <ul className="space-y-1.5 mt-auto">
                  {s.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-gray-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-green mt-1.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Add-ons */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-brand-navy">One-off project pricing</h2>
            <p className="text-gray-500 mt-2">Add to any plan. Cancel or adjust anytime.</p>
            <p className="text-xs text-gray-400 mt-2">Prices exclude VAT.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ADDONS.map((a) => (
              <div key={a.name} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-start gap-4">
                <CreditCard className="h-5 w-5 text-brand-green mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-brand-navy">{a.name}</div>
                  <div className="text-brand-green font-bold text-sm">{a.price}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{a.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-brand-navy">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Not sure what you need?</h2>
          <p className="text-gray-300 mb-8">Book a free 30-minute consultation and we&apos;ll put together a custom package.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="xl" asChild><Link href="/contact">Book Free Consultation <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            <Button size="xl" variant="outline" className="border-white/30 text-white hover:bg-white/10" asChild><Link href="/#packages">View Pricing</Link></Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
