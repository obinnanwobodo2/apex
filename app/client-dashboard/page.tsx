import Link from "next/link";
import { LayoutDashboard, ArrowRight, ShieldCheck } from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

export default function ClientDashboardEntryPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <section className="pt-28 pb-20 px-4 bg-gradient-to-br from-gray-50 via-white to-brand-green/10">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-green/10 text-brand-green text-sm font-medium mb-5">
            <ShieldCheck className="h-4 w-4" />
            Secure client portal
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-brand-navy mb-4">Client Dashboard Access</h1>
          <p className="text-gray-600 mb-8">
            Manage projects, invoices, support, requests, domains, and settings from one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg,#1b2340,#2dc5a2)" }}
            >
              <LayoutDashboard className="h-4 w-4" />
              Open Dashboard
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-gray-300 bg-white text-sm font-semibold text-brand-navy hover:bg-gray-100"
            >
              Create Account
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
