"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Check, ArrowRight, ArrowLeft, Loader2, Globe, ShoppingBag, Camera,
  Calendar, FileText, Zap, Layout, BookOpen, MessageSquare, CreditCard,
  RefreshCw, Wrench, Server,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PACKAGES } from "@/lib/utils";

// ── Constants ────────────────────────────────────────────────────────────────

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

const HOSTING_OPTIONS = [
  { id: "none", label: "No hosting needed", desc: "I'll host it myself", icon: Server, price: null },
  { id: "basic", label: "Basic Hosting", desc: "R200/mo — ideal for informational sites", icon: Server, price: 200 },
  { id: "business", label: "Business Hosting", desc: "R400/mo — fast, priority support, e-commerce ready", icon: Server, price: 400 },
];

// ── Types ─────────────────────────────────────────────────────────────────────

interface FormData {
  // Plan step (only shown when no subscription)
  billingType: "retainer" | "once_off" | "";
  selectedPlan: string; // retainer plan id
  hostingPlan: string;  // once-off hosting choice
  // Business step
  businessName: string;
  businessType: string;
  websiteType: string;
  // Goals step
  goals: string[];
  features: string[];
  pageCount: string;
  // Style step
  stylePreference: string;
  domainStatus: string;
  contentStatus: string;
  additionalNotes: string;
}

// ── Small reusable pieces ─────────────────────────────────────────────────────

function ToggleChip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
        selected ? "bg-brand-green/10 border-brand-green text-brand-green" : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
      }`}>
      {selected && <Check className="h-3.5 w-3.5 flex-shrink-0" />}
      {children}
    </button>
  );
}

function RadioCard({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={`relative w-full text-left p-4 rounded-xl border transition-all ${
        selected ? "bg-brand-green/5 border-brand-green" : "bg-white border-gray-200 hover:border-gray-300"
      }`}>
      {selected && (
        <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-brand-green flex items-center justify-center">
          <Check className="h-3 w-3 text-white" />
        </span>
      )}
      {children}
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

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
  const needsPlanStep = !subscriptionId;

  // Steps: if no plan yet → [Plan, Business, Goals, Style, Review], else [Business, Goals, Style, Review]
  const STEP_LABELS = needsPlanStep
    ? ["Plan", "Business", "Goals", "Style", "Review"]
    : ["Business", "Goals", "Style", "Review"];

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<FormData>({
    billingType: "",
    selectedPlan: "",
    hostingPlan: "",
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

  // Map step index to logical step name
  function stepName(i: number) {
    return STEP_LABELS[i];
  }

  function canAdvance() {
    const name = stepName(step);
    if (name === "Plan") {
      if (form.billingType === "retainer") return Boolean(form.selectedPlan);
      if (form.billingType === "once_off") return Boolean(form.hostingPlan);
      return false;
    }
    if (name === "Business") return form.businessName.trim().length > 0 && Boolean(form.businessType) && Boolean(form.websiteType);
    if (name === "Goals") return form.goals.length > 0;
    if (name === "Style") return Boolean(form.stylePreference) && Boolean(form.domainStatus) && Boolean(form.contentStatus);
    return true;
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError("");
    try {
      const planInfo = needsPlanStep
        ? form.billingType === "retainer"
          ? { billingType: "retainer", plan: form.selectedPlan }
          : { billingType: "once_off", hosting: form.hostingPlan }
        : { billingType: "subscription", plan: packageName };

      const notes = JSON.stringify({
        ...planInfo,
        businessType: form.businessType,
        websiteType: form.websiteType,
        goals: form.goals,
        features: form.features,
        pageCount: form.pageCount,
        stylePreference: form.stylePreference,
        domainStatus: form.domainStatus,
        contentStatus: form.contentStatus,
        additionalNotes: form.additionalNotes,
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

  const currentLabel = STEP_LABELS[step];

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
        <div className="h-full bg-brand-green transition-all duration-300"
          style={{ width: `${((step + 1) / STEP_LABELS.length) * 100}%` }} />
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

          {/* ── STEP: Plan ─────────────────────────────────────────────────── */}
          {currentLabel === "Plan" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-extrabold text-brand-navy">How would you like to pay?</h1>
                <p className="text-gray-500 mt-1">Choose the model that suits your budget best.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <RadioCard selected={form.billingType === "retainer"} onClick={() => setForm({ ...form, billingType: "retainer", selectedPlan: "", hostingPlan: "" })}>
                  <div className="flex items-start gap-3 pr-6">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${form.billingType === "retainer" ? "bg-brand-green/15" : "bg-gray-100"}`}>
                      <RefreshCw className={`h-4 w-4 ${form.billingType === "retainer" ? "text-brand-green" : "text-gray-400"}`} />
                    </div>
                    <div>
                      <div className="font-bold text-brand-navy text-sm">Monthly Retainer</div>
                      <div className="text-xs text-gray-500 mt-1 leading-relaxed">Website built for free. One monthly fee covers everything — hosting, updates, SEO, support.</div>
                    </div>
                  </div>
                </RadioCard>

                <RadioCard selected={form.billingType === "once_off"} onClick={() => setForm({ ...form, billingType: "once_off", selectedPlan: "", hostingPlan: "" })}>
                  <div className="flex items-start gap-3 pr-6">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${form.billingType === "once_off" ? "bg-brand-green/15" : "bg-gray-100"}`}>
                      <Wrench className={`h-4 w-4 ${form.billingType === "once_off" ? "text-brand-green" : "text-gray-400"}`} />
                    </div>
                    <div>
                      <div className="font-bold text-brand-navy text-sm">Once-Off Build</div>
                      <div className="text-xs text-gray-500 mt-1 leading-relaxed">Pay once for your website. Add optional hosting separately. You own it outright.</div>
                    </div>
                  </div>
                </RadioCard>
              </div>

              {/* Retainer plans */}
              {form.billingType === "retainer" && (
                <div className="space-y-3">
                  <Label>Choose your retainer plan *</Label>
                  {Object.values(PACKAGES).map((pkg) => (
                    <RadioCard key={pkg.id} selected={form.selectedPlan === pkg.id} onClick={() => setForm({ ...form, selectedPlan: pkg.id })}>
                      <div className="flex items-center justify-between pr-6">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-brand-navy text-sm">{pkg.name}</span>
                            {pkg.popular && <span className="text-[10px] bg-brand-green/15 text-brand-green px-2 py-0.5 rounded-full font-bold">Most Popular</span>}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">{pkg.tagline}</div>
                          <ul className="mt-2 space-y-1">
                            {pkg.features.slice(0, 3).map((f) => (
                              <li key={f} className="flex items-center gap-1.5 text-xs text-gray-500">
                                <Check className="h-3 w-3 text-brand-green flex-shrink-0" />{f}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="text-right flex-shrink-0 ml-4">
                          <div className="text-lg font-extrabold text-brand-navy">R{pkg.price.toLocaleString()}</div>
                          <div className="text-xs text-gray-400">/month</div>
                        </div>
                      </div>
                    </RadioCard>
                  ))}
                  <p className="text-xs text-gray-400">Prices excl. VAT · Cancel with 30 days notice</p>
                </div>
              )}

              {/* Once-off hosting options */}
              {form.billingType === "once_off" && (
                <div className="space-y-3">
                  <Label>Add hosting? *</Label>
                  <p className="text-xs text-gray-400 -mt-1">Your website build cost will be quoted after we review your brief. Choose hosting below.</p>
                  {HOSTING_OPTIONS.map((opt) => (
                    <RadioCard key={opt.id} selected={form.hostingPlan === opt.id} onClick={() => setForm({ ...form, hostingPlan: opt.id })}>
                      <div className="flex items-center justify-between pr-6">
                        <div>
                          <div className="font-bold text-brand-navy text-sm">{opt.label}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{opt.desc}</div>
                        </div>
                        {opt.price !== null && (
                          <div className="text-right flex-shrink-0 ml-4">
                            <div className="text-base font-extrabold text-brand-navy">R{opt.price}</div>
                            <div className="text-xs text-gray-400">/month</div>
                          </div>
                        )}
                      </div>
                    </RadioCard>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── STEP: Business ─────────────────────────────────────────────── */}
          {currentLabel === "Business" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-extrabold text-brand-navy">Tell us about your business</h1>
                <p className="text-gray-500 mt-1">This helps us build the right website for you.</p>
              </div>

              <div className="space-y-2">
                <Label>Business name *</Label>
                <Input value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} placeholder="e.g. Naidoo Beauty Studio" />
              </div>

              <div className="space-y-2">
                <Label>What industry are you in? *</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {BUSINESS_TYPES.map((type) => (
                    <ToggleChip key={type} selected={form.businessType === type} onClick={() => setForm({ ...form, businessType: type })}>
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
                      <RadioCard key={type.id} selected={form.websiteType === type.id} onClick={() => setForm({ ...form, websiteType: type.id })}>
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${form.websiteType === type.id ? "bg-brand-green/15" : "bg-gray-100"}`}>
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

          {/* ── STEP: Goals ────────────────────────────────────────────────── */}
          {currentLabel === "Goals" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-extrabold text-brand-navy">What are your goals?</h1>
                <p className="text-gray-500 mt-1">Select everything that applies — we&apos;ll optimise for these.</p>
              </div>

              <div className="space-y-2">
                <Label>Main goals for this website *</Label>
                <div className="flex flex-wrap gap-2">
                  {GOALS.map((goal) => (
                    <ToggleChip key={goal} selected={form.goals.includes(goal)} onClick={() => toggleArray("goals", goal)}>{goal}</ToggleChip>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Features you need <span className="text-gray-400 font-normal">(optional)</span></Label>
                <div className="grid grid-cols-2 gap-2">
                  {FEATURES.map((feature) => (
                    <ToggleChip key={feature.id} selected={form.features.includes(feature.id)} onClick={() => toggleArray("features", feature.id)}>{feature.label}</ToggleChip>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>How many pages do you need? <span className="text-gray-400 font-normal">(optional)</span></Label>
                <div className="flex flex-wrap gap-2">
                  {PAGE_COUNTS.map((pc) => (
                    <ToggleChip key={pc.id} selected={form.pageCount === pc.id} onClick={() => setForm({ ...form, pageCount: pc.id })}>{pc.label}</ToggleChip>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP: Style ────────────────────────────────────────────────── */}
          {currentLabel === "Style" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-extrabold text-brand-navy">Style & readiness</h1>
                <p className="text-gray-500 mt-1">Help us understand your aesthetic and what you have ready.</p>
              </div>

              <div className="space-y-3">
                <Label>What style fits your brand? *</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {STYLE_OPTIONS.map((style) => (
                    <RadioCard key={style.id} selected={form.stylePreference === style.id} onClick={() => setForm({ ...form, stylePreference: style.id })}>
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
                    <RadioCard key={d.id} selected={form.domainStatus === d.id} onClick={() => setForm({ ...form, domainStatus: d.id })}>
                      <span className="text-sm font-medium text-brand-navy pr-6">{d.label}</span>
                    </RadioCard>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Content readiness *</Label>
                <div className="space-y-2">
                  {CONTENT_STATUS.map((c) => (
                    <RadioCard key={c.id} selected={form.contentStatus === c.id} onClick={() => setForm({ ...form, contentStatus: c.id })}>
                      <span className="text-sm font-medium text-brand-navy pr-6">{c.label}</span>
                    </RadioCard>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Anything else you&apos;d like us to know? <span className="text-gray-400 font-normal">(optional)</span></Label>
                <Textarea rows={3} value={form.additionalNotes} onChange={(e) => setForm({ ...form, additionalNotes: e.target.value })}
                  placeholder="Links to websites you like, colour preferences, specific requirements..." className="resize-none" />
              </div>
            </div>
          )}

          {/* ── STEP: Review ───────────────────────────────────────────────── */}
          {currentLabel === "Review" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-extrabold text-brand-navy">Ready to submit?</h1>
                <p className="text-gray-500 mt-1">Here&apos;s a summary of your project brief. We&apos;ll start right away.</p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white divide-y divide-gray-100">
                {[
                  needsPlanStep && form.billingType === "retainer" && {
                    label: "Plan",
                    value: `Monthly Retainer — ${Object.values(PACKAGES).find((p) => p.id === form.selectedPlan)?.name ?? form.selectedPlan} (R${Object.values(PACKAGES).find((p) => p.id === form.selectedPlan)?.price ?? "—"}/mo)`,
                  },
                  needsPlanStep && form.billingType === "once_off" && {
                    label: "Plan",
                    value: `Once-Off Build — ${HOSTING_OPTIONS.find((h) => h.id === form.hostingPlan)?.label ?? ""}`,
                  },
                  !needsPlanStep && packageName && { label: "Plan", value: packageName },
                  { label: "Business", value: `${form.businessName} — ${form.businessType}` },
                  { label: "Website type", value: WEBSITE_TYPES.find((t) => t.id === form.websiteType)?.label ?? form.websiteType },
                  { label: "Goals", value: form.goals.join(", ") || "—" },
                  { label: "Features", value: FEATURES.filter((f) => form.features.includes(f.id)).map((f) => f.label).join(", ") || "None specified" },
                  { label: "Pages", value: PAGE_COUNTS.find((p) => p.id === form.pageCount)?.label ?? "Not specified" },
                  { label: "Style", value: STYLE_OPTIONS.find((s) => s.id === form.stylePreference)?.label ?? "—" },
                  { label: "Domain", value: DOMAIN_STATUS.find((d) => d.id === form.domainStatus)?.label ?? "—" },
                  { label: "Content", value: CONTENT_STATUS.find((c) => c.id === form.contentStatus)?.label ?? "—" },
                  form.additionalNotes && { label: "Notes", value: form.additionalNotes },
                ].filter(Boolean).map((row) => {
                  const r = row as { label: string; value: string };
                  return (
                    <div key={r.label} className="flex gap-4 px-5 py-3">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide w-28 flex-shrink-0 mt-0.5">{r.label}</span>
                      <span className="text-sm text-brand-navy">{r.value}</span>
                    </div>
                  );
                })}
              </div>

              <div className="rounded-xl bg-brand-green/5 border border-brand-green/20 p-4 text-sm text-gray-600">
                After submitting, upload your logo and brand files in <strong>Dashboard → Files</strong>.
                {needsPlanStep && form.billingType === "retainer" && " Our team will send your payment link within 1 business day."}
                {needsPlanStep && form.billingType === "once_off" && " We&apos;ll quote your build cost and set up hosting within 1 business day."}
                {!needsPlanStep && " Our team will review your brief and start within 1 business day."}
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
