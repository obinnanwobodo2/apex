import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import LandingHero from "@/components/landing-hero";
import LandingPortfolio from "@/components/landing-portfolio";
import LandingServices from "@/components/landing-services";
import HowItWorks from "@/components/how-it-works";
import PricingSection from "@/components/pricing-section";
import LandingUpsells from "@/components/landing-upsells";
import TestimonialsSection from "@/components/testimonials-section";
import FaqSection from "@/components/faq-section";
import LandingCta from "@/components/landing-cta";

{/* TODO: Replace certification placeholders with real badges once obtained */}
const CREDENTIALS = [
  { label: "Google Partner", status: "Certification in progress" },
  { label: "Meta Business Partner", status: "Certification in progress" },
  { label: "Semrush Certified", status: "Certification in progress" },
  { label: "WooCommerce Expert", status: "Certification in progress" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <LandingHero />
      <LandingPortfolio />
      <LandingServices />
      <HowItWorks />
      <PricingSection />
      <LandingUpsells />
      <TestimonialsSection />

      {/* Credentials */}
      <section className="py-16 px-4 bg-white border-t border-gray-100">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-2xl font-extrabold text-brand-navy mb-10">Our credentials</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {CREDENTIALS.map((c) => (
              <div key={c.label} className="rounded-2xl border border-dashed border-gray-200 p-6 flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 text-xs text-center leading-tight px-1">
                  [{c.label}]
                </div>
                <div className="font-semibold text-brand-navy text-sm">{c.label}</div>
                <div className="text-xs text-gray-400">{c.status}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FaqSection />
      <LandingCta />
      <Footer />
    </div>
  );
}
