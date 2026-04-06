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
      <FaqSection />
      <LandingCta />
      <Footer />
    </div>
  );
}
