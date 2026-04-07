import Link from "next/link";
import { ArrowRight, Bot, CheckCircle2 } from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { formatCurrency, CRM_PACKAGES } from "@/lib/utils";
import PaystackSubscribeButton from "@/components/paystack-subscribe-button";

const proPrice = CRM_PACKAGES["crm-pro"].price;

export default function CrmDemoPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <section className="pt-28 pb-16 px-4 bg-gradient-to-br from-gray-50 via-white to-brand-green/10">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-green/10 text-brand-green text-sm font-medium mb-5">
            <Bot className="h-4 w-4" />
            CRM Demo
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-brand-navy mb-4">Try the CRM flow before checkout</h1>
          <p className="text-gray-500 text-lg max-w-2xl">
            Explore the CRM experience first, then continue to secure checkout when you&apos;re ready.
          </p>
        </div>
      </section>

      <section className="py-14 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="text-xl font-bold text-brand-navy mb-3">What you can test in demo</h2>
            <ul className="space-y-2 text-sm text-gray-600">
              {[
                "Contacts and deal pipeline flow",
                "Task tracking and reminders",
                "Integrations panel preview",
                "Support + settings workflow",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-brand-green" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="text-xl font-bold text-brand-navy mb-3">Checkout terms</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              CRM Pro is {formatCurrency(proPrice)}/month (excl. VAT). Billing is monthly and auto-renews until cancelled.
              Cancellation requires 30 days written notice.
            </p>
            <div className="mt-5 flex flex-col sm:flex-row gap-3">
              <PaystackSubscribeButton
                packageId="crm-pro"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white"
                style={{ background: "linear-gradient(135deg,#1b2340,#2dc5a2)" }}
              >
                Continue to {formatCurrency(proPrice)}/mo Checkout
                <ArrowRight className="h-4 w-4" />
              </PaystackSubscribeButton>
              <Link
                href="/crm"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-gray-300 text-sm font-semibold text-brand-navy hover:bg-gray-100"
              >
                Back to CRM plans
              </Link>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
