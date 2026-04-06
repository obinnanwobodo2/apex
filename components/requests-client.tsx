"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FolderPlus, Globe, ShoppingCart, Palette, Bot, Wrench, BarChart3,
  Mail, Rocket, Clock, CheckCircle2, AlertCircle, X, Plus,
} from "lucide-react";

const SERVICES = [
  { id: "website", label: "Website Design & Build", icon: Globe },
  { id: "ecommerce", label: "E-Commerce Setup", icon: ShoppingCart },
  { id: "branding", label: "Brand Identity", icon: Palette },
  { id: "crm", label: "CRM Setup", icon: Bot },
  { id: "maintenance", label: "Maintenance Plan", icon: Wrench },
  { id: "analytics", label: "Analytics Setup", icon: BarChart3 },
  { id: "email", label: "Email Setup", icon: Mail },
  { id: "priority", label: "Priority Delivery", icon: Rocket },
];

const BUDGETS = ["Under R5,000", "R5,000 – R15,000", "R15,000 – R50,000", "R50,000+", "Monthly retainer"];

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Clock; color: string }> = {
  requested: { label: "Submitted", icon: Clock, color: "text-brand-green" },
  scoping: { label: "Scoping", icon: AlertCircle, color: "text-amber-500" },
  in_progress: { label: "In Progress", icon: Rocket, color: "text-brand-navy" },
  review: { label: "In Review", icon: AlertCircle, color: "text-brand-navy" },
  completed: { label: "Completed", icon: CheckCircle2, color: "text-brand-green" },
};

interface ProjectRequest {
  id: string;
  title: string;
  description: string | null;
  services: string | null;
  budget: string | null;
  deadline: string | null;
  notes: string | null;
  status: string;
  createdAt: string;
}

export default function RequestsClient({ initialRequests, isGuest = false }: { initialRequests: ProjectRequest[]; isGuest?: boolean }) {
  const router = useRouter();
  const [requests] = useState(initialRequests);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    services: [] as string[],
    budget: "",
    deadline: "",
    notes: "",
    packageId: "starter",
    paymentMode: "now" as "now" | "later",
  });

  function toggleService(id: string) {
    setForm((prev) => ({
      ...prev,
      services: prev.services.includes(id)
        ? prev.services.filter((s) => s !== id)
        : [...prev.services, id],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const pendingRes = await fetch("/api/subscription/pending", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: form.packageId,
          requestDraft: {
            title: form.title,
            description: form.description,
            services: form.services,
            budget: form.budget,
            deadline: form.deadline,
            notes: form.notes,
          },
        }),
      });
      if (!pendingRes.ok) throw new Error("Failed to create invoice");
      const pending = await pendingRes.json();

      if (form.paymentMode === "later") {
        setSuccess("Request saved to Billing cart. Complete payment to submit it to our team.");
        setShowForm(false);
        setForm({ title: "", description: "", services: [], budget: "", deadline: "", notes: "", packageId: "starter", paymentMode: "now" });
      } else {
        const payRes = await fetch("/api/paystack/initialize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ existingSubscriptionId: pending.id }),
        });
        if (!payRes.ok) throw new Error("Failed to start payment");
        const payData = await payRes.json();
        if (!payData.authorization_url) throw new Error("Missing payment URL");
        window.location.href = payData.authorization_url;
      }
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save your request.";
      setError(message || "Failed to save your request.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-navy">Project Requests</h1>
          <p className="text-gray-500 text-sm mt-1">Payment comes first. Once paid, your request appears in the admin work queue.</p>
        </div>
        {isGuest ? (
          <a
            href="/login"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-brand-navy/60 cursor-not-allowed opacity-60"
            onClick={(e) => e.preventDefault()}
            title="Sign in to create a request"
          >
            <Plus className="h-4 w-4" />New Request
          </a>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-brand-navy transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg,#1b2340,#2dc5a2)" }}
          >
            <Plus className="h-4 w-4" />New Request
          </button>
        )}
      </div>
      {success && <p className="text-sm text-brand-green bg-brand-green/10 border border-brand-green/20 rounded-lg px-4 py-3">{success}</p>}

      {/* Submission form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-gray-900/20 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white border border-gray-200 rounded-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-brand-navy">New Project Request</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-gray-500 hover:text-brand-navy hover:bg-gray-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">{error}</p>}

              {/* Project name */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-600">Project Name *</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. New website for my restaurant"
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-brand-navy text-sm placeholder-gray-400 focus:outline-none focus:border-brand-green/50 transition-colors"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-600">Project Description</label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe what you need, who your audience is, and what results you're looking for..."
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-brand-navy text-sm placeholder-gray-400 focus:outline-none focus:border-brand-green/50 resize-none transition-colors"
                />
              </div>

              {/* Services */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">Services Needed</label>
                <div className="grid grid-cols-2 gap-2">
                  {SERVICES.map(({ id, label, icon: Icon }) => {
                    const selected = form.services.includes(id);
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => toggleService(id)}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all text-left ${
                          selected
                            ? "border-brand-green/40 bg-brand-green/10 text-brand-green"
                            : "border-gray-200 text-gray-500 hover:border-gray-300 hover:text-brand-navy"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="text-xs">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Budget */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">Website Package</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "starter", label: "Starter" },
                    { id: "growth", label: "Growth" },
                    { id: "pro", label: "Pro" },
                  ].map((pkg) => (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => setForm({ ...form, packageId: pkg.id })}
                      className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                        form.packageId === pkg.id
                          ? "border-brand-green/40 bg-brand-green/10 text-brand-green"
                          : "border-gray-200 text-gray-500 hover:border-gray-300 hover:text-brand-navy"
                      }`}
                    >
                      {pkg.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">Payment Option</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, paymentMode: "now" })}
                    className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                      form.paymentMode === "now"
                        ? "border-brand-green/40 bg-brand-green/10 text-brand-green"
                        : "border-gray-200 text-gray-500 hover:border-gray-300 hover:text-brand-navy"
                    }`}
                  >
                    Pay Now
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, paymentMode: "later" })}
                    className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                      form.paymentMode === "later"
                        ? "border-brand-green/40 bg-brand-green/10 text-brand-green"
                        : "border-gray-200 text-gray-500 hover:border-gray-300 hover:text-brand-navy"
                    }`}
                  >
                    Add to Cart
                  </button>
                </div>
              </div>

              {/* Budget */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">Budget Range</label>
                <div className="flex flex-wrap gap-2">
                  {BUDGETS.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setForm({ ...form, budget: form.budget === b ? "" : b })}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                        form.budget === b
                          ? "border-brand-green/40 bg-brand-green/10 text-brand-green"
                          : "border-gray-200 text-gray-500 hover:border-gray-300 hover:text-brand-navy"
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* Deadline */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-600">Desired Deadline (optional)</label>
                <input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-brand-navy text-sm focus:outline-none focus:border-brand-green/50 transition-colors"
                  style={{ colorScheme: "light" }}
                />
              </div>

              {/* Additional notes */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-600">Additional Notes</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Any references, special requirements, or questions..."
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-brand-navy text-sm placeholder-gray-400 focus:outline-none focus:border-brand-green/50 resize-none transition-colors"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-brand-navy transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg,#1b2340,#2dc5a2)" }}
                >
                  {submitting
                    ? "Saving…"
                    : form.paymentMode === "later"
                      ? "Save to Cart (Pay Later)"
                      : "Continue to Secure Payment"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 rounded-xl text-sm font-semibold text-[#666] border border-gray-200 hover:text-brand-navy hover:border-gray-300 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Existing requests */}
      {requests.length > 0 ? (
        <div className="space-y-3">
          {requests.map((req) => {
            const cfg = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.requested;
            const StatusIcon = cfg.icon;
            const services: string[] = req.services ? JSON.parse(req.services) : [];
            return (
              <div key={req.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-1">
                      <h3 className="font-semibold text-brand-navy text-sm">{req.title}</h3>
                    </div>
                    {req.description && (
                      <p className="text-gray-500 text-xs leading-relaxed mb-3 line-clamp-2">{req.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                      {req.budget && (
                        <span className="px-2 py-0.5 rounded bg-gray-100 border border-gray-200">{req.budget}</span>
                      )}
                      {req.deadline && (
                        <span className="px-2 py-0.5 rounded bg-gray-100 border border-gray-200">
                          Due: {new Date(req.deadline).toLocaleDateString("en-ZA")}
                        </span>
                      )}
                      {services.map((s) => (
                        <span key={s} className="px-2 py-0.5 rounded bg-brand-green/10 border border-brand-green/20 text-brand-green capitalize">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <div className={`flex items-center gap-1.5 text-xs font-medium ${cfg.color}`}>
                      <StatusIcon className="h-3.5 w-3.5" />
                      {cfg.label}
                    </div>
                    <span className="text-[11px] text-gray-400">
                      {new Date(req.createdAt).toLocaleDateString("en-ZA")}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl py-16 text-center">
          <FolderPlus className="h-10 w-10 text-[#222] mx-auto mb-3" />
          <h3 className="font-semibold text-brand-navy mb-1">No requests yet</h3>
          {isGuest ? (
            <>
              <p className="text-gray-500 text-sm mb-2">Sign in to submit a project request.</p>
              <p className="text-gray-400 text-xs mb-5">
                Not sure which plan you need?{" "}
                <a href="/#packages" target="_blank" rel="noopener noreferrer" className="text-brand-green hover:underline">View our plans</a>.
              </p>
              <a
                href="/login"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-brand-navy hover:opacity-90 transition-opacity"
              >
                Sign In to Get Started
              </a>
            </>
          ) : (
            <>
              <p className="text-gray-500 text-sm mb-2">After payment succeeds, your submitted requests will appear here.</p>
              <p className="text-gray-400 text-xs mb-5">
                Not sure which plan you need?{" "}
                <a href="/#packages" target="_blank" rel="noopener noreferrer" className="text-brand-green hover:underline">View our plans</a>.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-brand-navy"
                style={{ background: "linear-gradient(135deg,#1b2340,#2dc5a2)" }}
              >
                <Plus className="h-4 w-4" />Create a Request
              </button>
            </>
          )}
        </div>
      )}

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { icon: Globe, title: "Website Project", desc: "Request a new website build, redesign, or major feature addition." },
          { icon: Wrench, title: "Service Request", desc: "Add hosting, SEO, branding, or any other service to your account." },
          { icon: FolderPlus, title: "Custom Work", desc: "Have something specific in mind? Describe it and we'll scope it for you." },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <Icon className="h-5 w-5 text-brand-green mb-2" />
            <div className="font-semibold text-brand-navy text-sm mb-1">{title}</div>
            <div className="text-gray-500 text-xs leading-relaxed">{desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
