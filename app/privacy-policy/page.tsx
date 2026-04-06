import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import TermlyPolicyEmbed from "@/components/termly-policy-embed";

export const metadata: Metadata = {
  title: "Privacy Policy | Apex Visual",
  description: "Read how Apex Visual collects, uses, and protects personal information.",
};

const SECTIONS = [
  {
    title: "1. Information We Collect",
    body: "We may collect information you provide directly, including your name, email, phone number, company details, project requirements, uploaded assets, and support communications.",
  },
  {
    title: "2. How We Use Information",
    body: "We use collected information to provide services, manage client accounts, process payments, communicate project updates, improve the platform, and provide support.",
  },
  {
    title: "3. Payments and Transaction Data",
    body: "Payments are handled by trusted third-party providers such as Paystack. We do not store full card details on our platform.",
  },
  {
    title: "4. Data Sharing",
    body: "We do not sell your personal information. We may share relevant data with service providers and integrations only when necessary to deliver requested services.",
  },
  {
    title: "5. Security",
    body: "We take reasonable administrative, technical, and organizational measures to safeguard your information. No internet-based system can guarantee absolute security.",
  },
  {
    title: "6. Data Retention",
    body: "We retain information for as long as needed to provide services, meet legal obligations, resolve disputes, and maintain accurate records.",
  },
  {
    title: "7. Your Rights",
    body: "You may request access, correction, or deletion of your personal information, subject to legal and operational requirements.",
  },
  {
    title: "8. Policy Changes",
    body: "We may revise this Privacy Policy periodically. Updated versions will be posted on this page with a revised date.",
  },
  {
    title: "9. Contact",
    body: "For privacy-related requests, contact privacy@apexvisual.co.za.",
  },
];

const TERMLY_PRIVACY_POLICY_ID =
  process.env.NEXT_PUBLIC_TERMLY_PRIVACY_POLICY_ID?.trim() || null;

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <section className="pt-28 pb-14 px-4 bg-gradient-to-br from-gray-50 via-white to-brand-green/10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-brand-navy mb-4">Privacy Policy</h1>
          <p className="text-sm text-gray-500">Last updated: April 2, 2026</p>
        </div>
      </section>

      <section className="py-14 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          {TERMLY_PRIVACY_POLICY_ID ? (
            <TermlyPolicyEmbed
              policyId={TERMLY_PRIVACY_POLICY_ID}
              title="Privacy Policy"
            />
          ) : (
            SECTIONS.map((section) => (
              <article key={section.title} className="rounded-2xl border border-gray-200 bg-white p-6">
                <h2 className="text-xl font-bold text-brand-navy mb-3">{section.title}</h2>
                <p className="text-gray-600 leading-relaxed">{section.body}</p>
              </article>
            ))
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
