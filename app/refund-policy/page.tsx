import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

export const metadata: Metadata = {
  title: "Refund Policy | Apex Visual",
  description: "Read the Apex Visual Refund Policy for services and subscriptions.",
};

const SECTIONS = [
  {
    title: "1. Overview",
    body: "This Refund Policy explains how refunds are handled for Apex Visual services, subscriptions, and digital deliverables.",
  },
  {
    title: "2. Project Deposits and Setup Fees",
    body: "Initial setup fees, onboarding fees, and project deposits are generally non-refundable once project work has started or service resources have been allocated.",
  },
  {
    title: "3. Monthly Retainer and Subscription Billing",
    body: "Recurring monthly fees are billed in advance for the current period. You may cancel future renewals, but payments already processed for the active billing period are not automatically refundable.",
  },
  {
    title: "4. Domain Registrations and Third-Party Purchases",
    body: "Domain registrations, renewals, and third-party service purchases are typically non-refundable after successful registration or activation due to registrar and provider rules.",
  },
  {
    title: "5. Refund Requests",
    body: "If you believe a charge was made in error, contact us within 7 calendar days with your invoice number and transaction reference. We review all cases fairly and in good faith.",
  },
  {
    title: "6. Approved Refunds",
    body: "Where a refund is approved, it is returned to the original payment method where possible. Processing times depend on your payment provider and bank.",
  },
  {
    title: "7. Non-Performance",
    body: "If Apex Visual cannot deliver a paid service due to reasons within our control, we will provide either a proportional service credit, re-delivery plan, or partial/full refund as appropriate.",
  },
  {
    title: "8. Contact",
    body: "For refund and billing support, contact info@apexvisual.co.za and include your invoice number for faster assistance.",
  },
];

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <section className="pt-28 pb-14 px-4 bg-gradient-to-br from-gray-50 via-white to-brand-green/10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-brand-navy mb-4">Refund Policy</h1>
          <p className="text-sm text-gray-500">Last updated: April 2, 2026</p>
        </div>
      </section>

      <section className="py-14 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          {SECTIONS.map((section) => (
            <article key={section.title} className="rounded-2xl border border-gray-200 bg-white p-6">
              <h2 className="text-xl font-bold text-brand-navy mb-3">{section.title}</h2>
              <p className="text-gray-600 leading-relaxed">{section.body}</p>
            </article>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
