"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, LayoutDashboard, Loader2, ArrowRight, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

function SuccessContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference") || searchParams.get("trxref");
  const [verified, setVerified] = useState<boolean | null>(null);
  const [packageName, setPackageName] = useState("your package");
  const [warning, setWarning] = useState("");
  const isCrm = packageName.toLowerCase().includes("crm");
  const isDomain = packageName.toLowerCase().includes("domain");

  useEffect(() => {
    if (!reference) {
      setVerified(false);
      return;
    }
    fetch(`/api/paystack/verify?reference=${reference}`)
      .then((r) => r.json())
      .then((data) => {
        setVerified(data.success);
        if (data.package) setPackageName(data.package);
        if (data.warning) setWarning(String(data.warning));
      })
      .catch(() => setVerified(false));
  }, [reference]);

  if (verified === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-10 w-10 animate-spin text-brand-green mx-auto" />
          <p className="text-gray-500">Verifying your payment…</p>
        </div>
      </div>
    );
  }

  if (verified === false) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-brand-navy">Payment verification failed</h1>
          <p className="text-gray-500">
            We couldn&apos;t verify your payment. If you were charged, please contact us.
          </p>
          <Button asChild>
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-brand-green/10 flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <Link href="/" className="mb-10">
        <Image src="/logo.svg" alt="Apex Visuals" width={150} height={60} className="h-10 w-auto" />
      </Link>

      <div className="max-w-lg w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-10 text-center animate-fade-in">
        {/* Success icon */}
        <div className="flex items-center justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-brand-green/10 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-brand-green" />
          </div>
        </div>

        <h1 className="text-3xl font-extrabold text-brand-navy mb-3">
          You&apos;re in
        </h1>
        <p className="text-gray-500 mb-2 text-lg">
          Payment confirmed for your <span className="font-semibold text-brand-navy capitalize">{packageName}</span> plan.
        </p>
        <p className="text-gray-400 text-sm mb-8">
          {isDomain
            ? "We are provisioning your domain now. You can track status in Dashboard > Domains."
            : isCrm
            ? "We&apos;ll activate your CRM onboarding shortly and share your setup steps."
            : "We&apos;ll reach out within 24 hours to kick off your onboarding. Get ready to go live!"}
        </p>
        {warning && (
          <div className="mb-8 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
            {warning}
          </div>
        )}

        {/* Reference */}
        {reference && (
          <div className="mb-8 p-3 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-400 mb-1">Payment Reference</p>
            <p className="font-mono text-sm font-semibold text-brand-navy">{reference}</p>
          </div>
        )}

        {/* What happens next */}
        <div className="text-left space-y-3 mb-8 p-5 bg-brand-navy/5 rounded-2xl">
          <p className="text-sm font-semibold text-brand-navy mb-2">What happens next:</p>
          {[
            "Check your email for your confirmation receipt",
            isDomain
              ? "Domain registration is being finalized with the registrar"
              : isCrm
              ? "We&apos;ll send your CRM onboarding checklist"
              : "We&apos;ll send you an onboarding questionnaire",
            "Your dedicated account manager will be in touch",
            isDomain
              ? "You can monitor renewal and invoice status in Billing"
              : isCrm
              ? "We configure your CRM workspace and integrations"
              : "We start building — launch is around the corner",
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3 text-sm text-gray-600">
              <span className="w-5 h-5 rounded-full bg-brand-green text-white text-xs flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </span>
              {step.replace(/&apos;/g, "'")}
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button className="flex-1" asChild>
            <Link href="/dashboard">
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Link>
          </Button>
          <Button variant="outline" className="flex-1" asChild>
            <Link href="/">
              Back to Home
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-brand-green" /></div>}>
      <SuccessContent />
    </Suspense>
  );
}
