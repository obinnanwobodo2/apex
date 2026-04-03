import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

export const metadata: Metadata = {
  title: "Cookie Policy | Apex Visuals",
  description: "Read how Apex Visuals uses cookies and similar technologies.",
};

const SECTIONS = [
  {
    title: "1. What Are Cookies?",
    body: "Cookies are small text files stored on your device when you visit a website. They help websites work correctly, improve performance, and remember preferences.",
  },
  {
    title: "2. How We Use Cookies",
    body: "We use cookies and similar technologies to maintain sessions, secure login flows, remember user preferences, and improve the performance and usability of our website and client dashboard.",
  },
  {
    title: "3. Types of Cookies We Use",
    body: "We may use essential cookies (required for core functionality), analytics cookies (to understand usage trends), and functional cookies (to improve personalization and user experience).",
  },
  {
    title: "4. Third-Party Cookies",
    body: "Some cookies may be set by trusted third-party tools used for authentication, payments, analytics, and integrations. These providers have their own privacy and cookie policies.",
  },
  {
    title: "5. Managing Cookies",
    body: "You can manage or disable cookies through your browser settings. Disabling certain cookies may affect important features such as secure sign-in, dashboard access, and checkout processes.",
  },
  {
    title: "6. Policy Updates",
    body: "We may update this Cookie Policy as our platform evolves. Any updates will be published on this page with a revised date.",
  },
  {
    title: "7. Contact",
    body: "If you have questions about cookie usage, contact us at info@apexvisual.co.za.",
  },
];

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <section className="pt-28 pb-14 px-4 bg-gradient-to-br from-gray-50 via-white to-brand-green/10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-brand-navy mb-4">Cookie Policy</h1>
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
