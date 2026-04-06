import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import Link from "next/link";
import { ArrowRight, Target, Heart, Zap, Globe, Award, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const VALUES = [
  { icon: <Target className="h-6 w-6" />, title: "Results-Driven", desc: "Every design decision is made with one goal: growing your business. We measure success by your success." },
  { icon: <Heart className="h-6 w-6" />, title: "Client-First", desc: "We build long-term partnerships. Monthly retainers mean we're always invested in your continued growth." },
  { icon: <Zap className="h-6 w-6" />, title: "Fast & Reliable", desc: "Turnaround in days, not months. Updates handled within 48 hours. No waiting, no excuses." },
  { icon: <Globe className="h-6 w-6" />, title: "South Africa Focused", desc: "We understand the local market, local audiences, and what it takes to succeed online in SA." },
];

const STATS = [
  { value: "12+", label: "Projects delivered" },
  { value: "Founded in 2024", label: "In business" },
  { value: "95%", label: "Client satisfaction" },
  { value: "5 days", label: "Average delivery" },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-16 px-4 bg-gradient-to-br from-gray-50 via-white to-brand-green/10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-green/10 text-brand-green text-sm font-medium mb-5">
            <Users className="h-4 w-4" />
            About Apex Visual
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-brand-navy mb-5 leading-tight">
            We build websites that <span className="text-brand-green">actually grow your business</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Apex Visual is a South African web design and digital services agency specialising
            in monthly retainer packages for growing businesses. We handle everything — design,
            development, hosting, SEO, and ongoing updates.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-4 bg-brand-navy">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-extrabold text-brand-green">{s.value}</div>
              <div className="text-sm text-gray-300 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Our story */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-extrabold text-brand-navy mb-5">Our Story</h2>
              <p className="text-gray-500 leading-relaxed mb-4">
                Apex Visual was built to solve the single most expensive mistake in South African business: paying R40,000+ for a website that gets abandoned, never updated, and generates nothing. We replaced the broken agency model with a retainer system — one monthly fee, one dedicated team, measurable results every 30 days.
              </p>
              <p className="text-gray-500 leading-relaxed mb-4">
                We saw a gap. Agencies were charging R50,000+ for a website build that clients
                then couldn&apos;t maintain. We created the retainer model — a fixed monthly fee that
                covers everything, forever. No surprise invoices. No abandoned projects.
              </p>
              <p className="text-gray-500 leading-relaxed">
                Founded in 2024, we are a growing studio serving businesses across South Africa —
                from solo consultants to growing companies — all on simple, transparent monthly plans.
              </p>
            </div>
            <div className="bg-gradient-to-br from-brand-green/10 to-brand-navy/5 rounded-3xl p-8 text-center">
              <div className="w-20 h-20 rounded-2xl bg-brand-navy flex items-center justify-center mx-auto mb-4">
                <Award className="h-10 w-10 text-brand-green" />
              </div>
              <div className="font-bold text-brand-navy text-xl mb-2">Our Mission</div>
              <p className="text-gray-500 text-sm leading-relaxed">
                To give every South African business the same digital firepower that large corporates take for granted — at a fixed monthly cost, with a team that stays invested in your growth.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-extrabold text-brand-navy text-center mb-12">What we stand for</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {VALUES.map((v) => (
              <div key={v.title} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-brand-green/10 flex items-center justify-center text-brand-green mb-4">
                  {v.icon}
                </div>
                <h3 className="font-bold text-brand-navy mb-2">{v.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-extrabold text-brand-navy mb-4">Ready to work with us?</h2>
          <p className="text-gray-500 mb-8">Start with a plan that fits your budget. No contracts. Cancel anytime.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="xl" asChild><Link href="/#packages">See Our Packages <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            <Button size="xl" variant="outline" asChild><Link href="/contact">Book a Call</Link></Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
