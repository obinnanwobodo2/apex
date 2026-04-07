import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import Link from "next/link";
import { ArrowRight, Globe, TrendingUp, ShoppingCart, Search, Zap, Server, Users, Check, RefreshCw, Shield, HeadphonesIcon, Clock, Star } from "lucide-react";
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
    icon: <Zap className="h-7 w-7" />,
    title: "Integrations & Automation",
    desc: "Connect your website to the tools you already use — email, payments, WhatsApp, and more.",
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

const RETAINER_BENEFITS = [
  {
    icon: <Globe className="h-6 w-6" />,
    title: "Website Built Free",
    desc: "We build your full website at no extra cost when you join on a retainer plan. No upfront build fees.",
    color: "text-brand-green bg-brand-green/10",
  },
  {
    icon: <RefreshCw className="h-6 w-6" />,
    title: "Unlimited Monthly Updates",
    desc: "Text changes, new photos, price updates, new pages — just send us a message and it's done within 48 hours.",
    color: "text-blue-600 bg-blue-50",
  },
  {
    icon: <Server className="h-6 w-6" />,
    title: "Hosting Included",
    desc: "Fast, South African hosting with SSL certificate is included in every retainer plan. No separate hosting bills.",
    color: "text-purple-600 bg-purple-50",
  },
  {
    icon: <Search className="h-6 w-6" />,
    title: "Ongoing SEO",
    desc: "We continuously optimise your site to rank higher on Google. Not a one-time fix — ongoing every month.",
    color: "text-orange-600 bg-orange-50",
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: "Security & Backups",
    desc: "Daily backups, security monitoring, and malware protection. If anything breaks, we fix it the same day.",
    color: "text-red-600 bg-red-50",
  },
  {
    icon: <HeadphonesIcon className="h-6 w-6" />,
    title: "Dedicated Support",
    desc: "Message our team directly from your client dashboard. Real people, fast responses — not a support ticket queue.",
    color: "text-brand-navy bg-brand-navy/5",
  },
  {
    icon: <Clock className="h-6 w-6" />,
    title: "No Long Contracts",
    desc: "Cancel with 30 days notice. We earn your business every month — not by locking you in.",
    color: "text-brand-green bg-brand-green/10",
  },
  {
    icon: <Star className="h-6 w-6" />,
    title: "Always Up to Date",
    desc: "Technology moves fast. Your website stays modern — we handle platform updates, performance fixes, and redesigns as needed.",
    color: "text-amber-600 bg-amber-50",
  },
];

const ADDONS = [
  { name: "Once-Off Website Build", price: "Quote on request", desc: "Pay once, own it outright. Hosting billed separately." },
  { name: "Basic Hosting", price: "R200/mo", desc: "SA-hosted, SSL, 99.9% uptime, daily backups" },
  { name: "Business Hosting", price: "R400/mo", desc: "Priority support, faster servers, CDN, e-commerce ready" },
  { name: "Domain Registration", price: "R180/yr", desc: ".co.za or .com registration & DNS management" },
  { name: "Priority Support", price: "R400/mo", desc: "4-hour response SLA, dedicated support line" },
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
            <span className="text-brand-green"> to win online</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            One agency. Every digital service your business needs. No juggling freelancers — we handle it all under one simple monthly retainer.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <Link href="/pricing"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg,#1b2340,#2dc5a2)" }}>
              See Plans & Pricing <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/contact"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-brand-navy border border-gray-300 bg-white hover:bg-gray-50 transition-colors">
              Book a Free Consultation
            </Link>
          </div>
        </div>
      </section>

      {/* Services grid */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-brand-navy">What we do</h2>
            <p className="text-gray-500 mt-2 max-w-xl mx-auto">Everything included in your monthly retainer plan or available as a once-off service.</p>
          </div>
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

      {/* Retainer benefits */}
      <section className="py-20 px-4" style={{ background: "linear-gradient(135deg, #0d1526 0%, #1b2340 55%, #0f2a1e 100%)" }}>
        <div className="absolute inset-0 pointer-events-none opacity-[0.04]" style={{ backgroundImage: "linear-gradient(#2dc5a2 1px, transparent 1px), linear-gradient(to right, #2dc5a2 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block text-xs font-bold text-brand-green uppercase tracking-widest mb-3">Why choose retainer</span>
            <h2 className="text-3xl font-extrabold text-white mb-3">What you get every single month</h2>
            <p className="text-white/60 max-w-xl mx-auto">A monthly retainer isn&apos;t just a subscription — it&apos;s a full in-house web team working on your business every day.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {RETAINER_BENEFITS.map((b) => (
              <div key={b.title} className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 flex flex-col gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${b.color}`}>
                  {b.icon}
                </div>
                <div>
                  <div className="font-bold text-white text-sm mb-1">{b.title}</div>
                  <div className="text-xs text-white/55 leading-relaxed">{b.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/pricing"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold text-brand-navy bg-brand-green hover:bg-brand-green/90 transition-colors">
              View Retainer Plans <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Once-off options */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-brand-navy">Once-off & add-on pricing</h2>
            <p className="text-gray-500 mt-2">Prefer to pay once? Add to any plan or request a standalone build.</p>
            <p className="text-xs text-gray-400 mt-2">Prices exclude VAT.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ADDONS.map((a) => (
              <div key={a.name} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-brand-green flex-shrink-0" />
                  <div className="font-semibold text-brand-navy text-sm">{a.name}</div>
                </div>
                <div className="text-brand-green font-bold">{a.price}</div>
                <div className="text-xs text-gray-400 leading-relaxed">{a.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Retainer vs Once-off comparison */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-brand-navy">Retainer vs Once-Off</h2>
            <p className="text-gray-500 mt-2">Which model is right for you?</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border-2 border-brand-green/30 bg-brand-green/5 p-7">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-brand-green/15 flex items-center justify-center">
                  <RefreshCw className="h-5 w-5 text-brand-green" />
                </div>
                <div>
                  <div className="font-extrabold text-brand-navy">Monthly Retainer</div>
                  <div className="text-xs text-brand-green font-semibold">Recommended for most businesses</div>
                </div>
              </div>
              <ul className="space-y-3">
                {[
                  "Website built for free (no upfront cost)",
                  "All updates handled — unlimited changes",
                  "Hosting, SSL, backups all included",
                  "Ongoing SEO every month",
                  "Dedicated support via your dashboard",
                  "No long-term contract — cancel anytime",
                  "Billed on the 1st of every month",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-gray-700">
                    <Check className="h-4 w-4 text-brand-green mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/pricing" className="mt-6 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-brand-green hover:bg-brand-green/90 transition-colors">
                See Retainer Plans <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-7">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <div className="font-extrabold text-brand-navy">Once-Off Build</div>
                  <div className="text-xs text-gray-500 font-semibold">Own your site outright</div>
                </div>
              </div>
              <ul className="space-y-3">
                {[
                  "Pay once — quoted based on requirements",
                  "You own the website outright",
                  "Add hosting & support as optional extras",
                  "Billed once only (no monthly fees)",
                  "Updates billed separately after build",
                  "Ideal for simple brochure sites",
                  "Great if you want full control",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-gray-700">
                    <Check className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/contact" className="mt-6 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-brand-navy border border-gray-300 bg-white hover:bg-gray-50 transition-colors">
                Get a Quote <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0d1526 0%, #1b2340 50%, #0f2a1e 100%)" }}>
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(#2dc5a2 1px, transparent 1px), linear-gradient(to right, #2dc5a2 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Not sure what you need?</h2>
          <p className="text-white/60 mb-8">Book a free 30-minute consultation and we&apos;ll put together a custom package for your business.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="xl" asChild><Link href="/contact">Book Free Consultation <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            <Button size="xl" variant="outline" className="border-white/30 text-white hover:bg-white/10" asChild><Link href="/pricing">View Pricing</Link></Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
