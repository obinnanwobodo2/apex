"use client";

import { useState } from "react";
import { User, Building2, Bell, Shield, Save, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface ProfileData {
  fullName: string;
  phone: string;
  companyName: string;
  companyAddress: string;
  companyWebsite: string;
  vatNumber: string;
  notifyEmail: boolean;
  notifyUpdates: boolean;
  notifyBilling: boolean;
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
        checked ? "bg-brand-green" : "bg-gray-200"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export default function SettingsClient({
  profile,
  onboardingRequired = false,
}: {
  profile: ProfileData;
  onboardingRequired?: boolean;
}) {
  const [form, setForm] = useState<ProfileData>(profile);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function set(key: keyof ProfileData, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (onboardingRequired && (!form.fullName.trim() || !form.phone.trim() || !form.companyName.trim())) {
      setError("Please complete Full Name, Phone Number, and Company Name to continue.");
      return;
    }
    setSaving(true);
    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
      {onboardingRequired && (
        <div className="rounded-xl border border-brand-green/30 bg-brand-green/5 p-4 text-sm text-brand-navy">
          Security onboarding: confirm your account identity by completing your profile details before using the full dashboard.
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-navy">Settings</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your account and company details.</p>
        </div>
        <Button type="submit" disabled={saving} className="gap-2">
          {saved ? (
            <><CheckCircle2 className="h-4 w-4" />Saved</>
          ) : (
            <><Save className="h-4 w-4" />{saving ? "Saving…" : "Save Changes"}</>
          )}
        </Button>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-brand-navy flex items-center gap-2">
            <User className="h-4 w-4 text-brand-green" />Personal Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={form.fullName}
                onChange={(e) => set("fullName", e.target.value)}
                placeholder="Jane Smith"
                required={onboardingRequired}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+27 82 000 0000"
                required={onboardingRequired}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-brand-navy flex items-center gap-2">
            <Building2 className="h-4 w-4 text-brand-green" />Company Info
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={form.companyName}
                onChange={(e) => set("companyName", e.target.value)}
                placeholder="Acme (Pty) Ltd"
                required={onboardingRequired}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vatNumber">VAT Number</Label>
              <Input
                id="vatNumber"
                value={form.vatNumber}
                onChange={(e) => set("vatNumber", e.target.value)}
                placeholder="4123456789"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="companyAddress">Business Address</Label>
            <Input
              id="companyAddress"
              value={form.companyAddress}
              onChange={(e) => set("companyAddress", e.target.value)}
              placeholder="1 Main Road, Cape Town, 8001"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="companyWebsite">Website URL</Label>
            <Input
              id="companyWebsite"
              value={form.companyWebsite}
              onChange={(e) => set("companyWebsite", e.target.value)}
              placeholder="https://example.co.za"
            />
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-brand-navy flex items-center gap-2">
            <Bell className="h-4 w-4 text-brand-green" />Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: "notifyEmail" as const, label: "Email notifications", desc: "Receive project updates and messages via email" },
            { key: "notifyUpdates" as const, label: "Product updates", desc: "New features, improvements, and platform news" },
            { key: "notifyBilling" as const, label: "Billing alerts", desc: "Invoice reminders, payment confirmations, and receipts" },
          ].map(({ key, label, desc }) => (
            <div key={key}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-brand-navy">{label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{desc}</div>
                </div>
                <Toggle checked={form[key] as boolean} onChange={(v) => set(key, v)} />
              </div>
              <Separator className="mt-4" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-brand-navy flex items-center gap-2">
            <Shield className="h-4 w-4 text-brand-green" />Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-500">
          <p>Your account signs out automatically after <strong className="text-brand-navy">15 minutes</strong> of inactivity.</p>
          <Separator />
          <p className="text-gray-400 text-sm">
            To change your password, email, or connected accounts, visit your{" "}
            <a href="https://accounts.clerk.com" target="_blank" rel="noopener noreferrer" className="text-brand-green hover:underline">
              account security settings
            </a>.
          </p>
        </CardContent>
      </Card>
    </form>
  );
}
