"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import {
  Check, X, ChevronRight, ChevronLeft, Loader2, Lock,
  Zap, Star, Crown, Clock, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  PACKAGES,
  formatCurrency,
  calculateVAT,
  calculateTotal,
  generateInvoiceNumber,
  type PackageId,
  type Package,
} from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface OnboardingForm {
  businessName: string;
  contactPerson: string;
  phone: string;
  businessAbout: string;
  websiteGoals: string;
  hasBranding: "yes" | "no" | "";
  brandingNotes: string;
  pagesFeatures: string;
  // New fields
  projectType: string;
  budget: string;
  timeline: string;
  hostingPlan: "none" | "basic" | "business";
}

const HOSTING_OPTIONS = [
  { id: "none" as const, label: "No Hosting", sub: "I have my own", price: 0 },
  { id: "basic" as const, label: "Basic Hosting", sub: "5GB SSD · SSL", price: 150 },
  { id: "business" as const, label: "Business Hosting", sub: "20GB · CDN · Priority", price: 350 },
];

const PROJECT_TYPES = ["Business Website", "E-Commerce Store", "Portfolio / Showcase", "Landing Page", "Blog / News", "Booking System", "Custom Web App"];
const BUDGETS = ["Under R1,000/mo", "R1,000 – R2,000/mo", "R2,000 – R4,000/mo", "R4,000+/mo", "Once-off project"];
const TIMELINES = ["ASAP (rush)", "1–2 weeks", "2–4 weeks", "1–2 months", "Flexible"];

const EMPTY_FORM: OnboardingForm = {
  businessName: "",
  contactPerson: "",
  phone: "",
  businessAbout: "",
  websiteGoals: "",
  hasBranding: "",
  brandingNotes: "",
  pagesFeatures: "",
  projectType: "",
  budget: "",
  timeline: "",
  hostingPlan: "none",
};

const PACKAGE_ICONS: Record<PackageId, React.ReactNode> = {
  starter: <Zap className="h-5 w-5" />,
  growth: <Star className="h-5 w-5" />,
  pro: <Crown className="h-5 w-5" />,
};

// ── Step indicator ─────────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: 1 | 2 | 3 }) {
  const steps = [
    { n: 1, label: "Choose Plan" },
    { n: 2, label: "Onboarding" },
    { n: 3, label: "Pay" },
  ];
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center gap-2">
          <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all ${
            step > s.n ? "bg-gradient-to-r from-brand-navy to-brand-green text-white" :
            step === s.n ? "bg-brand-navy text-white" :
            "bg-gray-100 text-gray-500"
          }`}>
            {step > s.n ? <Check className="h-3.5 w-3.5" /> : s.n}
          </div>
          <span className={`text-xs font-medium hidden sm:block ${step === s.n ? "text-brand-navy" : "text-gray-500"}`}>
            {s.label}
          </span>
          {i < steps.length - 1 && (
            <div className={`w-8 h-px ${step > s.n ? "bg-brand-navy" : "bg-[#1a1a1a]"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Step 1: Package picker ─────────────────────────────────────────────────────

function StepPlans({
  onSelect,
}: {
  onSelect: (pkg: Package) => void;
}) {
  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-extrabold text-brand-navy">Choose Your Plan</h2>
        <p className="text-gray-500 text-sm mt-1">All plans include a professionally built website + monthly care.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(Object.values(PACKAGES) as Package[]).map((pkg) => (
          <div
            key={pkg.id}
            className={`relative flex flex-col rounded-2xl border bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer ${
              pkg.popular
                ? "border-brand-green/40 shadow-md ring-2 ring-brand-green/20"
                : "border-gray-200"
            }`}
            onClick={() => onSelect(pkg)}
          >
            {pkg.popular && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <Badge className="px-3 py-0.5 text-xs font-bold uppercase shadow-sm">Most Popular</Badge>
              </div>
            )}

            <div className="p-5 flex flex-col flex-1">
              <div className="flex items-center gap-2.5 mb-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  pkg.popular ? "bg-gradient-to-r from-brand-navy to-brand-green text-white" : "bg-white/8 text-brand-navy"
                }`} style={{ background: pkg.popular ? undefined : "rgba(27,35,64,0.08)" }}>
                  {PACKAGE_ICONS[pkg.id as PackageId]}
                </div>
                <div>
                  <div className="font-bold text-brand-navy">{pkg.name}</div>
                  <div className="text-xs text-brand-green font-semibold uppercase tracking-wide">{pkg.badge}</div>
                </div>
              </div>

              <div className="mb-4">
                <span className="text-3xl font-extrabold text-brand-navy">{formatCurrency(pkg.price)}</span>
                <span className="text-gray-500 text-xs">/month</span>
              </div>

              <ul className="space-y-2 flex-1 mb-4">
                {pkg.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-gray-600">
                    <Check className="h-3.5 w-3.5 text-brand-green mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 rounded-lg px-2.5 py-1.5 mb-4">
                <Clock className="h-3 w-3" />
                {pkg.turnaround}
              </div>

              <Button
                className="w-full"
                variant={pkg.popular ? "default" : "secondary"}
                size="sm"
                onClick={(e) => { e.stopPropagation(); onSelect(pkg); }}
              >
                Choose Plan <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-gray-500 mt-4">
        Prices exclude VAT (15%). Billed monthly. Cancel with 30 days notice.
      </p>
    </div>
  );
}

// ── Step 2: Onboarding form ───────────────────────────────────────────────────

function StepOnboarding({
  pkg,
  form,
  onChange,
  onBack,
  onNext,
}: {
  pkg: Package;
  form: OnboardingForm;
  onChange: (f: Partial<OnboardingForm>) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const [errors, setErrors] = useState<Partial<Record<keyof OnboardingForm, string>>>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!form.businessName.trim()) e.businessName = "Required";
    if (!form.contactPerson.trim()) e.contactPerson = "Required";
    if (!form.phone.trim()) e.phone = "Required";
    if (!form.businessAbout.trim()) e.businessAbout = "Required";
    if (!form.websiteGoals.trim()) e.websiteGoals = "Required";
    if (!form.hasBranding) e.hasBranding = "Please select one";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (validate()) onNext();
  };

  const field = (
    id: keyof OnboardingForm,
    label: string,
    element: React.ReactNode
  ) => (
    <div>
      <Label htmlFor={id} className="text-sm font-medium text-brand-navy">{label}</Label>
      <div className="mt-1">{element}</div>
      {errors[id] && <p className="text-xs text-red-500 mt-1">{errors[id]}</p>}
    </div>
  );

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <ChevronLeft className="h-4 w-4 text-gray-500" />
        </button>
        <div>
          <h2 className="text-xl font-extrabold text-brand-navy">Tell us about your business</h2>
          <p className="text-gray-500 text-xs mt-0.5">
            <span className="font-semibold text-brand-green">{pkg.name} Plan</span> · {formatCurrency(pkg.price)}/month
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {field("businessName", "Business Name *",
          <Input id="businessName" placeholder="Acme Pty Ltd" value={form.businessName}
            onChange={(e) => onChange({ businessName: e.target.value })} />
        )}
        {field("contactPerson", "Contact Person *",
          <Input id="contactPerson" placeholder="John Smith" value={form.contactPerson}
            onChange={(e) => onChange({ contactPerson: e.target.value })} />
        )}
        {field("phone", "Phone Number *",
          <Input id="phone" placeholder="+27 81 000 0000" value={form.phone}
            onChange={(e) => onChange({ phone: e.target.value })} />
        )}

        <div className="sm:col-span-2">
          {field("businessAbout", "What is your business about? *",
            <Textarea id="businessAbout" placeholder="Tell us what you do, who you serve, and what makes you different..."
              rows={3} className="resize-none" value={form.businessAbout}
              onChange={(e) => onChange({ businessAbout: e.target.value })} />
          )}
        </div>

        <div className="sm:col-span-2">
          {field("websiteGoals", "What are your main goals for the website? *",
            <Textarea id="websiteGoals" placeholder="e.g. Generate leads, showcase portfolio, sell products online, build credibility..."
              rows={3} className="resize-none" value={form.websiteGoals}
              onChange={(e) => onChange({ websiteGoals: e.target.value })} />
          )}
        </div>

        <div className="sm:col-span-2">
          <Label className="text-sm font-medium text-brand-navy">Do you have branding assets? (logo, colours, fonts) *</Label>
          <div className="flex gap-3 mt-2">
            {(["yes", "no"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => onChange({ hasBranding: v })}
                className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  form.hasBranding === v
                    ? "border-brand-green/40 bg-brand-green/10 text-brand-green"
                    : "border-gray-200 text-gray-500 hover:border-gray-300 hover:text-brand-navy"
                }`}
              >
                {v === "yes" ? "Yes, I have branding" : "No, I need branding help"}
              </button>
            ))}
          </div>
          {errors.hasBranding && <p className="text-xs text-red-500 mt-1">{errors.hasBranding}</p>}
        </div>

        {form.hasBranding === "yes" && (
          <div className="sm:col-span-2">
            {field("brandingNotes", "Briefly describe your branding (colours, style, existing logo URL, etc.)",
              <Textarea id="brandingNotes" placeholder="e.g. Blue and white logo, modern clean style, sans-serif fonts..."
                rows={2} className="resize-none" value={form.brandingNotes}
                onChange={(e) => onChange({ brandingNotes: e.target.value })} />
            )}
          </div>
        )}

        <div className="sm:col-span-2">
          {field("pagesFeatures", "Any specific pages or features you want?",
            <Textarea id="pagesFeatures" placeholder="e.g. Home, About, Services, Contact, Blog, Online Store, WhatsApp chat widget..."
              rows={2} className="resize-none" value={form.pagesFeatures}
              onChange={(e) => onChange({ pagesFeatures: e.target.value })} />
          )}
        </div>

        {/* Project Type */}
        <div className="sm:col-span-2">
          <Label className="text-sm font-medium text-brand-navy">Project Type</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {PROJECT_TYPES.map((t) => (
              <button key={t} type="button" onClick={() => onChange({ projectType: t })}
                className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                  form.projectType === t ? "border-brand-green/40 bg-brand-green/10 text-brand-green" : "border-gray-200 text-gray-500 hover:border-gray-300 hover:text-brand-navy"
                }`}>{t}</button>
            ))}
          </div>
        </div>

        {/* Budget + Timeline */}
        <div className="sm:col-span-1">
          <Label className="text-sm font-medium text-brand-navy">Budget Range</Label>
          <div className="flex flex-col gap-1.5 mt-2">
            {BUDGETS.map((b) => (
              <button key={b} type="button" onClick={() => onChange({ budget: b })}
                className={`w-full text-left px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                  form.budget === b ? "border-brand-green/40 bg-brand-green/10 text-brand-green" : "border-gray-200 text-gray-500 hover:border-gray-300 hover:text-brand-navy"
                }`}>{b}</button>
            ))}
          </div>
        </div>

        <div className="sm:col-span-1">
          <Label className="text-sm font-medium text-brand-navy">Desired Timeline</Label>
          <div className="flex flex-col gap-1.5 mt-2">
            {TIMELINES.map((t) => (
              <button key={t} type="button" onClick={() => onChange({ timeline: t })}
                className={`w-full text-left px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                  form.timeline === t ? "border-brand-green/40 bg-brand-green/10 text-brand-green" : "border-gray-200 text-gray-500 hover:border-gray-300 hover:text-brand-navy"
                }`}>{t}</button>
            ))}
          </div>
        </div>

        {/* Hosting Add-on */}
        <div className="sm:col-span-2">
          <Label className="text-sm font-medium text-brand-navy">Add Hosting? (Optional)</Label>
          <p className="text-xs text-gray-500 mt-0.5 mb-2">South African servers · SSL included · Daily backups</p>
          <div className="grid grid-cols-3 gap-2">
            {HOSTING_OPTIONS.map((h) => (
              <button key={h.id} type="button" onClick={() => onChange({ hostingPlan: h.id })}
                className={`p-3 rounded-xl border text-left transition-all ${
                  form.hostingPlan === h.id ? "border-brand-green/40 bg-brand-green/10" : "border-gray-200 hover:border-gray-300"
                }`}>
                <div className={`text-xs font-bold ${form.hostingPlan === h.id ? "text-brand-green" : "text-brand-navy"}`}>{h.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{h.sub}</div>
                <div className={`text-xs font-semibold mt-1 ${form.hostingPlan === h.id ? "text-brand-green" : "text-gray-600"}`}>
                  {h.price === 0 ? "Free" : `+R${h.price}/mo`}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <Button variant="outline" className="flex-1" onClick={onBack}>Back</Button>
        <Button className="flex-1" onClick={handleNext}>
          Review Invoice <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

// ── Step 3: Invoice + Pay ─────────────────────────────────────────────────────

function StepInvoice({
  pkg,
  form,
  onBack,
}: {
  pkg: Package;
  form: OnboardingForm;
  onBack: () => void;
}) {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const invoiceNumber = useMemo(() => generateInvoiceNumber(), []);
  const invoiceDate = useMemo(
    () => new Date().toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" }),
    []
  );

  const hostingOption = HOSTING_OPTIONS.find((h) => h.id === form.hostingPlan) ?? HOSTING_OPTIONS[0];
  const subtotal = pkg.price + hostingOption.price;
  const vat = calculateVAT(subtotal);
  const total = calculateTotal(subtotal);

  const handlePay = async () => {
    setError("");
    if (!user?.primaryEmailAddress?.emailAddress) {
      setError("Please sign in before payment.");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: pkg.id,
          purchaseSource: "dashboard",
          email: user?.primaryEmailAddress?.emailAddress,
          businessName: form.businessName,
          contactPerson: form.contactPerson,
          phone: form.phone,
          description: form.businessAbout,
          websiteGoals: form.websiteGoals,
          hasBranding: form.hasBranding,
          brandingNotes: form.brandingNotes,
          pagesFeatures: form.pagesFeatures,
          projectType: form.projectType,
          budget: form.budget,
          timeline: form.timeline,
          hostingPlan: form.hostingPlan,
          hostingAmount: hostingOption.price,
          invoiceNumber,
          totalAmount: subtotal,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Payment initialization failed");
      }

      const { authorization_url } = await res.json();
      window.location.href = authorization_url;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <ChevronLeft className="h-4 w-4 text-gray-500" />
        </button>
        <div>
          <h2 className="text-xl font-extrabold text-brand-navy">Review & Pay</h2>
          <p className="text-gray-500 text-xs mt-0.5">Your invoice is ready</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
        {/* Invoice */}
        <div className="md:col-span-3 border border-gray-200 rounded-2xl overflow-hidden">
          {/* Invoice header */}
          <div className="bg-brand-navy px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-brand-green text-xs font-bold uppercase tracking-widest">Tax Invoice</p>
              <p className="text-white font-bold mt-0.5">{invoiceNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-500 text-xs">Date</p>
              <p className="text-white text-sm font-medium">{invoiceDate}</p>
            </div>
          </div>

          {/* Parties */}
          <div className="px-5 py-4 grid grid-cols-2 gap-4 border-b border-gray-200">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">From</p>
              <p className="text-sm font-bold text-brand-navy">Apex Visual</p>
              <p className="text-xs text-gray-500">info@apexvisual.co.za</p>
              <p className="text-xs text-gray-500">Johannesburg, ZA</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">To</p>
              <p className="text-sm font-bold text-brand-navy">{form.businessName}</p>
              <p className="text-xs text-gray-500">{form.contactPerson}</p>
              <p className="text-xs text-gray-500">{user?.primaryEmailAddress?.emailAddress}</p>
            </div>
          </div>

          {/* Line items */}
          <div className="px-5 py-4 border-b border-gray-200 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold text-brand-navy">Apex Visual {pkg.name} Package</p>
                <p className="text-xs text-gray-500 mt-0.5">Monthly retainer · Recurring subscription</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-xs bg-brand-green/10 text-brand-green font-medium px-2 py-0.5 rounded-full">
                    Recurring monthly
                  </span>
                  <span className="text-xs text-gray-500">· {pkg.turnaround} launch</span>
                </div>
              </div>
              <p className="text-sm font-bold text-brand-navy">{formatCurrency(pkg.price)}</p>
            </div>
            {hostingOption.price > 0 && (
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-semibold text-brand-navy">{hostingOption.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{hostingOption.sub} · Monthly add-on</p>
                </div>
                <p className="text-sm font-bold text-brand-navy">{formatCurrency(hostingOption.price)}</p>
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="px-5 py-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>VAT (15%)</span><span>{formatCurrency(vat)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-extrabold text-brand-navy text-lg">
              <span>Total Due</span><span>{formatCurrency(total)}</span>
            </div>
            <p className="text-xs text-gray-500">Billed every month. First payment due today.</p>
          </div>
        </div>

        {/* Pay panel */}
        <div className="md:col-span-2 flex flex-col gap-4">
          {/* Order summary */}
          <div className="bg-brand-navy/5 rounded-2xl p-4">
            <p className="text-xs font-semibold text-brand-navy uppercase tracking-wider mb-3">Order Summary</p>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-brand-green flex items-center justify-center text-white font-bold">
                {pkg.name[0]}
              </div>
              <div>
                <p className="text-sm font-bold text-brand-navy">{pkg.name} Plan</p>
                <p className="text-xs text-gray-500">{formatCurrency(pkg.price)}/mo + VAT</p>
              </div>
            </div>
            <ul className="space-y-1.5">
              {pkg.features.slice(0, 3).map((f) => (
                <li key={f} className="flex items-start gap-2 text-xs text-gray-600">
                  <Check className="h-3 w-3 text-brand-green mt-0.5 shrink-0" />{f}
                </li>
              ))}
              <li className="text-xs text-gray-500 pl-5">+ {pkg.features.length - 3} more benefits</li>
            </ul>
          </div>

          {/* Pay button */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">{error}</div>
          )}

          <Button size="lg" className="w-full text-base font-bold" onClick={handlePay} disabled={loading}>
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" />Processing…</>
            ) : (
              <><Lock className="h-4 w-4 mr-2" />Pay {formatCurrency(total)} with Paystack</>
            )}
          </Button>

          <div className="text-center space-y-1.5">
            <p className="text-xs text-gray-500 flex items-center justify-center gap-1.5">
              <Lock className="h-3 w-3" />Secured by Paystack · 256-bit encryption
            </p>
            <p className="text-xs text-gray-500">Cancel anytime with 30 days notice</p>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-2 gap-2">
            {["Dedicated account manager", "Monthly updates included", "South Africa-based team", "30-day cancel notice"].map((t) => (
              <div key={t} className="flex items-start gap-1.5 text-xs text-gray-500">
                <CheckCircle2 className="h-3 w-3 text-brand-green mt-0.5 shrink-0" />{t}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main orchestrator ──────────────────────────────────────────────────────────

interface PlansFlowProps {
  open: boolean;
  onClose: () => void;
  initialPackageId?: PackageId | null;
}

export default function PlansFlow({ open, onClose, initialPackageId = null }: PlansFlowProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedPkg, setSelectedPkg] = useState<Package | null>(null);
  const [form, setForm] = useState<OnboardingForm>(EMPTY_FORM);

  const updateForm = useCallback((f: Partial<OnboardingForm>) => {
    setForm((prev) => ({ ...prev, ...f }));
  }, []);

  const handleClose = () => {
    onClose();
    setTimeout(() => { setStep(1); setSelectedPkg(null); setForm(EMPTY_FORM); }, 300);
  };

  useEffect(() => {
    if (!open) return;
    if (!initialPackageId) return;
    const pkg = PACKAGES[initialPackageId];
    if (!pkg) return;
    setSelectedPkg(pkg);
    setStep(2);
  }, [open, initialPackageId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className={`relative bg-white rounded-3xl shadow-2xl w-full overflow-hidden flex flex-col transition-all duration-300 ${
        step === 1 ? "max-w-4xl" : step === 2 ? "max-w-2xl" : "max-w-4xl"
      }`} style={{ maxHeight: "92vh" }}>
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2 shrink-0">
          <StepIndicator step={step} />
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 p-2 rounded-xl text-gray-500 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto px-6 pb-6">
          {step === 1 && (
            <StepPlans
              onSelect={(pkg) => { setSelectedPkg(pkg); setStep(2); }}
            />
          )}

          {step === 2 && selectedPkg && (
            <StepOnboarding
              pkg={selectedPkg}
              form={form}
              onChange={updateForm}
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
            />
          )}

          {step === 3 && selectedPkg && (
            <StepInvoice
              pkg={selectedPkg}
              form={form}
              onBack={() => setStep(2)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
