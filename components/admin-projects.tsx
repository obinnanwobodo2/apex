"use client";

import { useState } from "react";
import { ExternalLink, FolderKanban, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

interface Project {
  id: string;
  title: string;
  type: string;
  status: string;
  progress: number;
  description: string | null;
  notes: string | null;
  websiteUrl: string | null;
  createdAt: string;
  profile: {
    fullName: string | null;
    companyName: string | null;
    phone: string | null;
  } | null;
  subscription: {
    package: string;
    paid: boolean;
    status: string;
    amountPaid: number;
    businessName: string | null;
    contactPerson: string | null;
    description: string | null;
    invoiceNumber: string | null;
  } | null;
}

const STATUSES = ["requested", "scoping", "in_progress", "review", "completed"];
const STATUS_COLORS: Record<string, string> = {
  requested: "bg-gray-100 text-gray-600",
  scoping: "bg-brand-navy/10 text-brand-navy",
  in_progress: "bg-amber-100 text-amber-700",
  review: "bg-brand-green/15 text-brand-green",
  completed: "bg-brand-green/15 text-brand-green",
};

export default function AdminProjectsClient({ projects }: { projects: Project[] }) {
  const [items, setItems] = useState(projects);
  const [editing, setEditing] = useState<Record<string, { notes: string; websiteUrl: string }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  function draftFor(project: Project) {
    return editing[project.id] ?? { notes: project.notes ?? "", websiteUrl: project.websiteUrl ?? "" };
  }

  function setDraft(id: string, patch: Partial<{ notes: string; websiteUrl: string }>) {
    setEditing((prev) => ({
      ...prev,
      [id]: { notes: prev[id]?.notes ?? "", websiteUrl: prev[id]?.websiteUrl ?? "", ...patch },
    }));
  }

  async function updateProject(id: string, payload: Partial<Project>) {
    setSavingId(id);
    try {
      const res = await fetch(`/api/admin/projects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update");
      const updated = await res.json();
      setItems((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
    } finally {
      setSavingId(null);
    }
  }

  if (items.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-extrabold text-brand-navy">Projects</h1>
        <Card>
          <CardContent className="py-16 text-center">
            <FolderKanban className="h-12 w-12 text-gray-200 mx-auto mb-3" />
            <h3 className="font-bold text-brand-navy mb-1">No projects yet</h3>
            <p className="text-sm text-gray-400">Paid client requests will appear here automatically.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-brand-navy">Projects</h1>
        <p className="text-sm text-gray-400 mt-0.5">{items.length} total projects</p>
      </div>

      <div className="space-y-4">
        {items.map((p) => {
          const draft = draftFor(p);
          return (
            <Card key={p.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-brand-navy">{p.title}</span>
                      <span className="text-xs text-gray-400 capitalize border border-gray-200 px-2 py-0.5 rounded-full">{p.type}</span>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${STATUS_COLORS[p.status] ?? "bg-gray-100 text-gray-500"}`}>
                        {p.status.replace("_", " ")}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Client: {p.subscription?.businessName ?? p.profile?.companyName ?? p.profile?.fullName ?? "Unknown"} ·{" "}
                      {new Date(p.createdAt).toLocaleDateString("en-ZA")}
                    </div>
                    {p.subscription && (
                      <div className="text-xs text-gray-500 mt-1">
                        Subscription: {p.subscription.package} · {p.subscription.paid ? "Paid" : p.subscription.status} ·{" "}
                        {formatCurrency(p.subscription.amountPaid)}
                        {p.subscription.invoiceNumber ? ` · ${p.subscription.invoiceNumber}` : ""}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={p.status}
                      onChange={(e) => updateProject(p.id, { status: e.target.value })}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-600"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{s.replace("_", " ")}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={p.progress}
                      onChange={(e) => updateProject(p.id, { progress: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })}
                      className="w-20 text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-600"
                    />
                  </div>
                </div>

                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-brand-green rounded-full h-2 transition-all" style={{ width: `${p.progress}%` }} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Client Requirements</p>
                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm text-gray-600 whitespace-pre-wrap min-h-[110px]">
                      {p.description || p.subscription?.description || "No requirement notes provided yet."}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Admin Update (Visible To Client)</p>
                    <textarea
                      rows={5}
                      value={draft.notes}
                      onChange={(e) => setDraft(p.id, { notes: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-700 resize-none"
                      placeholder="Write update note for client..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <label className="text-sm">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Preview / Live URL</span>
                    <input
                      value={draft.websiteUrl}
                      onChange={(e) => setDraft(p.id, { websiteUrl: e.target.value })}
                      className="mt-1 w-full h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700"
                      placeholder="https://preview.yoursite.com"
                    />
                  </label>
                  <div className="flex items-end gap-2">
                    <Button
                      onClick={() => updateProject(p.id, { notes: draft.notes, websiteUrl: draft.websiteUrl || null })}
                      disabled={savingId === p.id}
                    >
                      {savingId === p.id ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                      Save & Notify
                    </Button>
                    {p.websiteUrl && (
                      <Button variant="outline" asChild>
                        <a href={p.websiteUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open Preview
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
