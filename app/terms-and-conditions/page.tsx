import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

export const metadata: Metadata = {
  title: "Terms & Conditions | Apex Visuals",
  description: "Read the Terms and Conditions for Apex Visuals website and services.",
};

const SECTIONS = [
  {
    title: "1. Acceptance of Terms",
    body: "By accessing or using Apex Visuals services, website, or client dashboard, you agree to these Terms and Conditions. If you do not agree, please do not use our services.",
  },
  {
    title: "2. Services",
    body: "Apex Visuals provides web design, development, hosting support, CRM services, and related digital services. Final scope, timelines, and deliverables are defined in your selected package, invoice, or written agreement.",
  },
  {
    title: "3. Client Responsibilities",
    body: "Clients are responsible for providing accurate information, content, approvals, and required assets in time. Delays in client responses may affect project timelines and delivery dates.",
  },
  {
    title: "4. Payments and Billing",
    body: "Payments are processed securely through approved providers including Paystack. Work may only start or continue after required payments are received, unless otherwise agreed in writing.",
  },
  {
    title: "5. Domains and Third-Party Services",
    body: "Domain registration, hosting, and third-party tools may be subject to external provider policies and availability. Apex Visuals is not responsible for third-party downtime, pricing changes, or policy changes.",
  },
  {
    title: "6. Intellectual Property",
    body: "Upon full payment, clients receive rights to approved final project outputs as agreed. Apex Visuals retains ownership of internal frameworks, reusable code components, templates, and proprietary methods unless explicitly transferred in writing.",
  },
  {
    title: "7. Revisions and Change Requests",
    body: "Reasonable revisions are included according to package scope. Additional revisions, features, or scope changes may require a revised quote, timeline adjustment, or additional invoice.",
  },
  {
    title: "8. Limitation of Liability",
    body: "To the maximum extent permitted by law, Apex Visuals is not liable for indirect, incidental, special, or consequential losses. Total liability is limited to the amount paid by the client for the affected service.",
  },
  {
    title: "9. Termination",
    body: "Either party may end services with written notice. Amounts due for completed work, approved milestones, or active billing periods remain payable.",
  },
  {
    title: "10. Changes to Terms",
    body: "We may update these Terms from time to time. Updates become effective once published on this page. Continued use of our services after updates means you accept the revised Terms.",
  },
  {
    title: "11. Contact",
    body: "For questions about these Terms and Conditions, contact us at info@apexvisual.co.za.",
  },
];

export default function TermsAndConditionsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <section className="pt-28 pb-14 px-4 bg-gradient-to-br from-gray-50 via-white to-brand-green/10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-brand-navy mb-4">Terms & Conditions</h1>
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
