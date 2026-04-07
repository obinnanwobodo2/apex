import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import PricingSection from "@/components/pricing-section";
import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";

export const metadata = {
  title: "Pricing — Apex Visual",
  description: "Simple, transparent pricing for South African businesses. Get your website built and managed from a fixed monthly plan.",
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-8 px-4 bg-gradient-to-br from-gray-50 via-white to-brand-green/10">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-block text-xs font-bold text-brand-green uppercase tracking-widest mb-4">Pricing</span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-brand-navy mb-4 leading-tight">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            One monthly fee covers your website build, hosting, updates, SEO, and support.
            No hidden costs. No setup fees. Cancel with 30 days notice.
          </p>
        </div>
      </section>

      <PricingSection />

      {/* FAQ strip */}
      <section className="py-16 px-4 bg-white border-t border-gray-100">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-extrabold text-brand-navy mb-8 text-center">Common questions</h2>
          <div className="space-y-6">
            {[
              {
                q: "Is there a once-off option instead of monthly?",
                a: "Yes. We offer a once-off build option — you pay for the website upfront and add hosting/support as optional extras. Contact us to get a quote.",
              },
              {
                q: "What exactly is included in the monthly plan?",
                a: "Your website build at no extra cost, ongoing hosting, monthly content or design updates, SEO maintenance, and technical support.",
              },
              {
                q: "Can I cancel anytime?",
                a: "Yes. All plans require 30 days notice to cancel. No lock-in contracts.",
              },
              {
                q: "How long does it take to build my website?",
                a: "Most sites are ready within 5–10 business days after you submit your project brief and files.",
              },
              {
                q: "Do you build e-commerce stores?",
                a: "Yes. E-commerce is included in the Growth and Pro plans. We set up your product catalogue, checkout, and payment gateway.",
              },
            ].map(({ q, a }) => (
              <div key={q} className="border-b border-gray-100 pb-6">
                <h3 className="font-semibold text-brand-navy mb-2">{q}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-extrabold text-brand-navy mb-3">Not sure which plan fits?</h2>
          <p className="text-gray-500 mb-8">Book a free 20-minute call and we&apos;ll help you choose the right option.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/contact"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg,#1b2340,#2dc5a2)" }}>
              <MessageCircle className="h-4 w-4" />Book a free call
            </Link>
            <Link href="/register"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-brand-navy border border-gray-300 bg-white hover:bg-gray-50 transition-colors">
              Get started now <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
