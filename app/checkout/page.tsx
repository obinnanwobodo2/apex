"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Check, ArrowLeft, FileText, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  PACKAGES,
  ALL_PACKAGES,
  formatCurrency,
  calculateVAT,
  calculateTotal,
  generateInvoiceNumber,
  type AnyPackageId,
} from "@/lib/utils";
import { useUser } from "@clerk/nextjs";

interface FormData {
  businessName: string;
  contactPerson: string;
  email: string;
  phone: string;
  description: string;
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoaded, isSignedIn } = useUser();

  const packageId = searchParams.get("package") as AnyPackageId | null;
  const pkg = packageId && ALL_PACKAGES[packageId] ? ALL_PACKAGES[packageId] : null;
  const isCrmPlan = Boolean(pkg?.id?.startsWith("crm-"));
  const isWebsitePackage = Boolean(packageId && packageId in PACKAGES);
  const checkoutRedirectTarget = packageId ? `/checkout?package=${packageId}` : "/checkout";

  const [form, setForm] = useState<FormData>({
    businessName: "",
    contactPerson: "",
    email: "",
    phone: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const invoiceNumber = useMemo(() => generateInvoiceNumber(), []);
  const invoiceDate = useMemo(
    () =>
      new Date().toLocaleDateString("en-ZA", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    []
  );

  // Prefill email if user is logged in
  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        email: user.primaryEmailAddress?.emailAddress ?? f.email,
        contactPerson: user.fullName ?? f.contactPerson,
      }));
    }
  }, [user]);

  useEffect(() => {
    if (!packageId || !isWebsitePackage || !isLoaded) return;
    const dashboardUrl = `/dashboard?plan=${encodeURIComponent(packageId)}`;
    if (isSignedIn) {
      router.replace(dashboardUrl);
      return;
    }
    router.replace(`/register?redirect_url=${encodeURIComponent(dashboardUrl)}`);
  }, [isLoaded, isSignedIn, isWebsitePackage, packageId, router]);

  useEffect(() => {
    if (!isLoaded || isSignedIn || !packageId) return;
    if (isWebsitePackage) return;
    router.replace(`/register?redirect_url=${encodeURIComponent(checkoutRedirectTarget)}`);
  }, [isLoaded, isSignedIn, isWebsitePackage, packageId, checkoutRedirectTarget, router]);

  if (!pkg) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500">No package selected.</p>
        <Button asChild><Link href="/#packages">View Packages</Link></Button>
      </div>
    );
  }

  if (isWebsitePackage) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-sm text-gray-500">Website packages are now purchasable only from your client dashboard.</p>
        <Button asChild>
          <Link href={isSignedIn ? `/dashboard?plan=${encodeURIComponent(packageId ?? "")}` : "/register?redirect_url=%2Fdashboard"}>
            Go to Client Dashboard
          </Link>
        </Button>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-brand-green" />
        <p className="text-sm text-gray-500">Loading secure checkout...</p>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-brand-green" />
        <p className="text-sm text-gray-500">Redirecting to sign up...</p>
      </div>
    );
  }

  const validate = (): boolean => {
    const newErrors: Partial<FormData> = {};
    if (!form.businessName.trim()) newErrors.businessName = "Required";
    if (!form.contactPerson.trim()) newErrors.contactPerson = "Required";
    if (!form.email.trim() || !/^\S+@\S+\.\S+$/.test(form.email)) newErrors.email = "Valid email required";
    if (!form.phone.trim()) newErrors.phone = "Required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePayment = async () => {
    if (!validate()) return;
    setLoading(true);

    try {
      // Guard checkout so only authenticated users can pay.
      if (!isSignedIn) {
        router.push(`/register?redirect_url=${encodeURIComponent(checkoutRedirectTarget)}`);
        return;
      }

      // Initialize Paystack transaction via our API
      const res = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: pkg.id,
          email: form.email,
          businessName: form.businessName,
          contactPerson: form.contactPerson,
          phone: form.phone,
          description: form.description,
          invoiceNumber,
          userId: user.id,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Payment initialization failed");
      }

      const { authorization_url } = await res.json();
      window.location.href = authorization_url;
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const vat = calculateVAT(pkg.price);
  const total = calculateTotal(pkg.price);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <Image src="/logo.svg" alt="Apex Visual" width={130} height={52} className="h-9 w-auto" />
          </Link>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Lock className="h-3.5 w-3.5 text-brand-green" />
            Secure Checkout
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-10">
        <Link href={isCrmPlan ? "/crm" : "/#packages"} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-brand-navy mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          {isCrmPlan ? "Back to CRM plans" : "Back to packages"}
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left — Form */}
          <div className="lg:col-span-3 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-brand-navy">
                  <FileText className="h-5 w-5 text-brand-green" />
                  Your Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="businessName">Business Name *</Label>
                    <Input
                      id="businessName"
                      placeholder="Acme Pty Ltd"
                      className="mt-1"
                      value={form.businessName}
                      onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                    />
                    {errors.businessName && <p className="text-xs text-red-500 mt-1">{errors.businessName}</p>}
                  </div>
                  <div>
                    <Label htmlFor="contactPerson">Contact Person *</Label>
                    <Input
                      id="contactPerson"
                      placeholder="John Smith"
                      className="mt-1"
                      value={form.contactPerson}
                      onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                    />
                    {errors.contactPerson && <p className="text-xs text-red-500 mt-1">{errors.contactPerson}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@acme.co.za"
                      className="mt-1"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      placeholder="+27 81 000 0000"
                      className="mt-1"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                    {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Brief Description of Your Needs</Label>
                  <Textarea
                    id="description"
                    placeholder="Tell us about your business, target audience, and what you need from your website..."
                    className="mt-1 resize-none"
                    rows={4}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Invoice Preview */}
            <Card className="border-brand-green/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-brand-navy text-base">Invoice Preview</CardTitle>
                  <span className="text-xs text-gray-400">{invoiceNumber}</span>
                </div>
                <p className="text-xs text-gray-400">{invoiceDate}</p>
              </CardHeader>
              <CardContent>
                <div className="flex items-start justify-between py-3 border-t border-gray-100">
                  <div>
                    <p className="font-medium text-sm text-brand-navy">Apex Visual {pkg.name} Package</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {isCrmPlan ? "Monthly CRM subscription" : "Monthly retainer"} — {pkg.turnaround}
                    </p>
                  </div>
                  <span className="font-semibold text-sm">{formatCurrency(pkg.price)}</span>
                </div>
                <Separator className="my-2" />
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between text-gray-500">
                    <span>Subtotal</span>
                    <span>{formatCurrency(pkg.price)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>VAT (15%)</span>
                    <span>{formatCurrency(vat)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-brand-navy text-base pt-2 border-t border-gray-100">
                    <span>Total Due</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right — Order Summary */}
          <div className="lg:col-span-2 space-y-6">
            <Card className={pkg.popular ? "border-brand-green ring-2 ring-brand-green/20" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-brand-navy">{pkg.name} Plan</CardTitle>
                  {pkg.popular && (
                    <span className="text-xs font-bold text-brand-green uppercase tracking-wider">
                      Most Popular
                    </span>
                  )}
                </div>
                <div className="text-3xl font-extrabold text-brand-navy">
                  {formatCurrency(pkg.price)}<span className="text-sm font-normal text-gray-400">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {pkg.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <Check className="h-4 w-4 text-brand-green mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="mt-5 p-3 bg-brand-green/5 rounded-xl text-xs text-brand-green font-medium">
                  {isCrmPlan ? `CRM setup in ${pkg.turnaround}` : `Launch in ${pkg.turnaround}`}
                </div>

                <Button
                  className="w-full mt-5"
                  size="lg"
                  onClick={handlePayment}
                  disabled={loading || !isLoaded}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing…
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Pay {formatCurrency(total)} with Paystack
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-gray-400 mt-3">
                  Secured by Paystack · Cancel anytime
                </p>
              </CardContent>
            </Card>

            {/* Trust signals */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
              {[
                "30-day cancellation notice",
                "Dedicated account manager",
                "Ongoing monthly updates",
                "South Africa-based team",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-gray-600">
                  <Check className="h-4 w-4 text-brand-green" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-brand-green" /></div>}>
      <CheckoutContent />
    </Suspense>
  );
}
