"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Check, ArrowRight, ArrowLeft, Loader2, Globe, ShoppingBag, Camera, Calendar, FileText, Zap, Layout, BookOpen, MessageSquare, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const STEP_LABELS = ["Business", "Goals", "Style", "Review"];

const BUSINESS_TYPES = [
  "Retail / Shop", "Professional Services", "Health & Beauty", "Food & Hospitality",
  "Construction & Trade", "Finance & Legal", "Healthcare", "Education",
  "Creative / Agency", "Technology", "Non-profit", "Other",
];

const WEBSITE_TYPES = [
  { id: "informational", label: "Informational", icon: Globe, desc: "About us, services, contact" },
  { id: "ecommerce", label: "Online Store", icon: ShoppingBag, desc: "Sell products online" },
  { id: "portfolio", label: "Portfolio", icon: Camera, desc: "Showcase your work" },
  { id: "booking", label: "Booking / Appointments", icon: Calendar, desc: "Let clients book online" },
  { id: "blog", label: "Blog / Content", icon: BookOpen, desc: "Articles and updates" },
  { id: "custom", label: "Custom / Not Sure", icon: Zap, desc: "Tell us what you need" },
];

const GOALS = [
  "Get more enquiries / leads",
  "Sell products or services online",
  "Look professional and credible",
  "Showcase my portfolio or work",
  "Let clients book appointments",
  "Rank higher on Google",
  "Replace my current website",
];

const FEATURES = [
  { id: "contact_form", label: "Contact form", icon: MessageSquare },
  { id: "whatsapp", label: "WhatsApp chat button", icon: MessageSquare },
  { id: "booking", label: "Online booking", icon: Calendar },
  { id: "gallery", label: "Photo / work gallery", icon: Camera },
  { id: "blog", label: "Blog / news section", icon: FileText },
  { id: "payment", label: "Online payment", icon: CreditCard },
  { id: "product_catalogue", label: "Product catalogue", icon: ShoppingBag },
  { id: "custom_pages", label: "Custom pages", icon: Layout },
];

const STYLE_OPTIONS = [
  { id: "clean", label: "Clean & Minimal", desc: "White space, simple, modern" },
  { id: "bold", label: "Bold & Modern", desc: "Strong colours, impactful" },
  { id: "professional", label: "Professional & Corporate", desc: "Formal, trust-focused" },
  { id: "warm", label: "Warm & Friendly", desc: "Inviting, approachable" },
];

const DOMAIN_STATUS = [
  { id: "have_domain", label: "I already have a domain" },
  { id: "need_domain", label: "I need to register one" },
  { id: "not_sure", label: "Not sure yet" },
];

const CONTENT_STATUS = [
  { id: "ready", label: "Ready — I have text & images" },
  { id: "partial", label: "Partially ready" },
  { id: "need_help", label: "I need help with content" },
];

const PAGE_COUNTS = [
  { id: "1-3", label: "1–3 pages" },
  { id: "4-7", label: "4–7 pages" },
  { id: "8+", label: "8+ pages" },
  { id: "not_sure", label: "Not sure" },
];

interface FormData {
  businessName: string;
  businessType: string;
  websiteType: string;
  goals: string[];
  features: string[];
  pageCount: string;
  stylePreference: string;
  domainStatus: string;
  contentStatus: string;
  additionalNotes: string;
}

function ToggleChip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
        selected
          ? "bg-brand-green/10 border-brand-green text-brand-green"
          : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
      }`}
    >
      {selected && <Check className="h-3.5 w-3.5 flex-shrink-0" />}
      {children}
    </button>
  );
}

function RadioCard({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-full text-left p-4 rounded-xl border transition-all ${
        selected
          ? "bg-brand-green/5 border-brand-green"
          : "bg-white border-gray-200 hover:border-gray-300"
      }`}
    >
      {selected && (
        <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-brand-green flex items-center justify-center">
          <Check className="h-3 w-3 text-white" />
        </span>
      )}
      {children}
    </button>
  );
}

export default function OnboardingForm({
  subscriptionId,
  defaultBusinessName,
  packageName,
}: {
  subscriptionId: string | null;
  defaultBusinessName: string;
  packageName: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<FormData>({
    businessName: defaultBusinessName,
    businessType: "",
    websiteType: "",
    goals: [],
    features: [],
    pageCount: "",
    stylePreference: "",
    domainStatus: "",
    contentStatus: "",
    additionalNotes: "",
  });

  function toggleArray(key: "goals" | "features", value: string) {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((v) => v !== value)
        : [...prev[key], value],
    }));
  }

  function canAdvance() {
    if (step === 0) return form.businessName.trim().length > 0 && form.businessType && form.websiteType;
    if (step === 1) return form.goals.length > 0;
    if (step === 2) return form.stylePreference && form.domainStatus && form.contentStatus;
    return true;
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError("");
    try {
      const notes = JSON.stringify({
        businessType: form.businessType,
        websiteType: form.websiteType,
        goals: form.goals,
        features: form.features,
        pageCount: form.pageCount,
        stylePreference: form.stylePreference,
        domainStatus: form.domainStatus,
        contentStatus: form.contentStatus,
        additionalNotes: form.additionalNotes,
        package: packageName,
      });

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${form.businessName} — Website Project`,
          type: form.websiteType === "ecommerce" ? "ecommerce" : "website",
          description: `${form.businessName} (${form.businessType}) — ${form.websiteType} website. Goals: ${form.goals.join(", ")}.`,
          notes,
          subscriptionId,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to submit project");
      }

      router.push("/dashboard?onboarded=1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-brand-green/5 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
        <Link href="/">
          <Image src="/logo.svg" alt="Apex Visual" width={120} height={48} className="h-8 w-auto" />
        </Link>
        <span className="text-sm text-gray-400">Project setup — Step {step + 1} of {STEP_LABELS.length}</span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-100">
        <div
          className="h-full bg-brand-green transition-all duration-300"
          style={{ width: `${((step + 1) / STEP_LABELS.length) * 100}%` }}
        />
      </div>

      <div className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-2xl">

          {/* Step pills */}
          <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-1">
            {STEP_LABELS.map((label, i) => (
              <div key={label} className="flex items-center gap-2 flex-shrink-0">
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  i < step ? "bg-brand-green text-white" :
                  i === step ? "bg-brand-navy text-white" :
                  "bg-gray-100 text-gray-400"
                }`}>
                  {i < step ? <Check className="h-3 w-3" /> : <span>{i + 1}</span>}
                  {label}
                </div>
                {i < STEP_LABELS.length - 1 && <div className={`w-6 h-px ${i < step ? "bg-brand-green" : "bg-gray-200"}`} />}
              </div>
            ))}
          </div>

          {/* Step 0: Business details */}
          {step === 0 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-extrabold text-brand-navy">Tell us about your business</h1>
                <p className="text-gray-500 mt-1">This helps us build the right website for you.</p>
              </div>

              <div className="space-y-2">
                <Label>Business name *</Label>
                <Input
                  value={form.businessName}
                  onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                  placeholder="e.g. Naidoo Beauty Studio"
                />
              </div>

              <div className="space-y-2">
                <Label>What industry are you in? *</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {BUSINESS_TYPES.map((type) => (
                    <ToggleChip
                      key={type}
                      selected={form.businessType === type}
                      onClick={() => setForm({ ...form, businessType: type })}
                    >
                      {type}
                    </ToggleChip>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>What type of website do you need? *</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {WEBSITE_TYPES.map((type) => {
                    const Icon = type.icon;
                    return (
                      <RadioCard
                        key={type.id}
                        selected={form.websiteType === type.id}
                        onClick={() => setForm({ ...form, websiteType: type.id })}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            form.websiteType === type.id ? "bg-brand-green/15" : "bg-gray-100"
                          }`}>
                            <Icon className={`h-4 w-4 ${form.websiteType === type.id ? "text-brand-green" : "text-gray-500"}`} />
                          </div>
                          <div>
                            <div className="font-semibold text-brand-navy text-sm">{type.label}</div>
                            <div className="text-xs text-gray-400 mt-0.5">{type.desc}</div>
                          </div>
                        </div>
                      </RadioCard>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Goals & features */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-extrabold text-brand-navy">What are your goals?</h1>
                <p className="text-gray-500 mt-1">Select everything that applies — we&apos;ll optimise for these.</p>
              </div>

              <div className="space-y-2">
                <Label>Main goals for this website *</Label>
                <div className="flex flex-wrap gap-2">
                  {GOALS.map((goal) => (
                    <ToggleChip
                      key={goal}
                      selected={form.goals.includes(goal)}
                      onClick={() => toggleArray("goals", goal)}
                    >
                      {goal}
                    </ToggleChip>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Features you need <span className="text-gray-400 font-normal">(optional)</span></Label>
                <div className="grid grid-cols-2 gap-2">
                  {FEATURES.map((feature) => (
                    <ToggleChip
                      key={feature.id}
                      selected={form.features.includes(feature.id)}
                      onClick={() => toggleArray("features", feature.id)}
                    >
                      {feature.label}
                    </ToggleChip>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>How many pages do you need? <span className="text-gray-400 font-normal">(optional)</span></Label>
                <div className="flex flex-wrap gap-2">
                  {PAGE_COUNTS.map((pc) => (
                    <ToggleChip
                      key={pc.id}
                      selected={form.pageCount === pc.id}
                      onClick={() => setForm({ ...form, pageCount: pc.id })}
                    >
                      {pc.label}
                    </ToggleChip>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Style & readiness */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-extrabold text-brand-navy">Style & readiness</h1>
                <p className="text-gray-500 mt-1">Help us understand your aesthetic and what you have ready.</p>
              </div>

              <div className="space-y-3">
                <Label>What style fits your brand? *</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {STYLE_OPTIONS.map((style) => (
                    <RadioCard
                      key={style.id}
                      selected={form.stylePreference === style.id}
                      onClick={() => setForm({ ...form, stylePreference: style.id })}
                    >
                      <div className="font-semibold text-brand-navy text-sm pr-6">{style.label}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{style.desc}</div>
                    </RadioCard>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Domain status *</Label>
                <div className="space-y-2">
                  {DOMAIN_STATUS.map((d) => (
                    <RadioCard
                      key={d.id}
                      selected={form.domainStatus === d.id}
                      onClick={() => setForm({ ...form, domainStatus: d.id })}
                    >
                      <span className="text-sm font-medium text-brand-navy pr-6">{d.label}</span>
                    </RadioCard>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Content readiness *</Label>
                <div className="space-y-2">
                  {CONTENT_STATUS.map((c) => (
                    <RadioCard
                      key={c.id}
                      selected={form.contentStatus === c.id}
                      onClick={() => setForm({ ...form, contentStatus: c.id })}
                    >
                      <span className="text-sm font-medium text-brand-navy pr-6">{c.label}</span>
                    </RadioCard>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Anything else you&apos;d like us to know? <span className="text-gray-400 font-normal">(optional)</span></Label>
                <Textarea
                  rows={3}
                  value={form.additionalNotes}
                  onChange={(e) => setForm({ ...form, additionalNotes: e.target.value })}
                  placeholder="Links to websites you like, colour preferences, specific requirements..."
                  className="resize-none"
                />
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-extrabold text-brand-navy">Ready to submit?</h1>
                <p className="text-gray-500 mt-1">Here&apos;s a summary of your project brief. We&apos;ll start right away.</p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white divide-y divide-gray-100">
                {[
                  { label: "Business", value: `${form.businessName} — ${form.businessType}` },
                  { label: "Website type", value: WEBSITE_TYPES.find((t) => t.id === form.websiteType)?.label ?? form.websiteType },
                  { label: "Goals", value: form.goals.join(", ") || "—" },
                  { label: "Features", value: FEATURES.filter((f) => form.features.includes(f.id)).map((f) => f.label).join(", ") || "None specified" },
                  { label: "Pages", value: PAGE_COUNTS.find((p) => p.id === form.pageCount)?.label ?? "Not specified" },
                  { label: "Style", value: STYLE_OPTIONS.find((s) => s.id === form.stylePreference)?.label ?? "—" },
                  { label: "Domain", value: DOMAIN_STATUS.find((d) => d.id === form.domainStatus)?.label ?? "—" },
                  { label: "Content", value: CONTENT_STATUS.find((c) => c.id === form.contentStatus)?.label ?? "—" },
                  ...(form.additionalNotes ? [{ label: "Notes", value: form.additionalNotes }] : []),
                ].map(({ label, value }) => (
                  <div key={label} className="flex gap-4 px-5 py-3">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide w-28 flex-shrink-0 mt-0.5">{label}</span>
                    <span className="text-sm text-brand-navy">{value}</span>
                  </div>
                ))}
              </div>

              <div className="rounded-xl bg-brand-green/5 border border-brand-green/20 p-4 text-sm text-gray-600">
                After submitting, you can upload your logo and brand files in <strong>Dashboard → Files</strong>. Our team will review your brief and start work within 1 business day.
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            {step > 0 ? (
              <Button variant="outline" onClick={() => setStep((s) => s - 1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />Back
              </Button>
            ) : (
              <div />
            )}

            {step < STEP_LABELS.length - 1 ? (
              <Button onClick={() => setStep((s) => s + 1)} disabled={!canAdvance()}>
                Continue <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting...</>
                ) : (
                  <>Start my project <ArrowRight className="h-4 w-4 ml-2" /></>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
