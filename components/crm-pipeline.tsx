"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, X, Trash2, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";

interface Deal {
  id: string;
  title: string;
  value: number;
  stage: string;
  probability: number;
  closeDate: string | null;
  notes: string | null;
  contact: { firstName: string; lastName: string | null } | null;
}

const STAGES = [
  { id: "lead", label: "Lead", color: "bg-gray-100 border-gray-200" },
  { id: "qualified", label: "Qualified", color: "bg-brand-navy/5 border-brand-navy/20" },
  { id: "proposal", label: "Proposal", color: "bg-brand-green/5 border-brand-green/20" },
  { id: "negotiation", label: "Negotiation", color: "bg-amber-50 border-amber-200" },
  { id: "won", label: "Won", color: "bg-brand-green/10 border-brand-green/25" },
  { id: "lost", label: "Lost", color: "bg-red-50 border-red-200" },
];

const EMPTY_FORM = { title: "", value: "", stage: "lead", probability: "0", closeDate: "", notes: "" };

export default function PipelineClient() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState<string | null>(null);

  const fetchDeals = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/crm/deals");
    if (res.ok) setDeals(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchDeals(); }, [fetchDeals]);

  async function handleSave() {
    if (!form.title.trim()) return;
    setSaving(true);
    await fetch("/api/crm/deals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        value: parseFloat(form.value) || 0,
        stage: form.stage,
        probability: parseInt(form.probability) || 0,
        closeDate: form.closeDate || null,
        notes: form.notes || null,
      }),
    });
    setShowForm(false);
    setForm(EMPTY_FORM);
    fetchDeals();
    setSaving(false);
  }

  async function handleStageChange(dealId: string, newStage: string) {
    await fetch(`/api/crm/deals/${dealId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: newStage }),
    });
    setDeals((prev) => prev.map((d) => d.id === dealId ? { ...d, stage: newStage } : d));
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this deal?")) return;
    await fetch(`/api/crm/deals/${id}`, { method: "DELETE" });
    fetchDeals();
  }

  function onDragStart(dealId: string) {
    setDragging(dealId);
  }

  function onDrop(stageId: string) {
    if (dragging) handleStageChange(dragging, stageId);
    setDragging(null);
  }

  const totalPipeline = deals.filter((d) => !["won", "lost"].includes(d.stage)).reduce((s, d) => s + d.value, 0);
  const wonValue = deals.filter((d) => d.stage === "won").reduce((s, d) => s + d.value, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-navy">Pipeline</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {formatCurrency(totalPipeline)} open · {formatCurrency(wonValue)} won
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />Add Deal
        </Button>
      </div>

      {/* Kanban board */}
      {loading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((s) => (
            <div key={s.id} className="w-64 flex-shrink-0 h-96 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const stageDeals = deals.filter((d) => d.stage === stage.id);
            const stageValue = stageDeals.reduce((s, d) => s + d.value, 0);
            return (
              <div
                key={stage.id}
                className={`w-64 flex-shrink-0 rounded-xl border-2 ${stage.color} p-3 min-h-[400px]`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDrop(stage.id)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-sm font-bold text-brand-navy">{stage.label}</span>
                    <span className="ml-2 text-xs text-gray-400">({stageDeals.length})</span>
                  </div>
                  {stageValue > 0 && (
                    <span className="text-xs font-semibold text-gray-500">{formatCurrency(stageValue)}</span>
                  )}
                </div>
                <div className="space-y-2">
                  {stageDeals.map((deal) => (
                    <div
                      key={deal.id}
                      draggable
                      onDragStart={() => onDragStart(deal.id)}
                      className="bg-white rounded-lg p-3 shadow-sm border border-white hover:border-gray-200 cursor-grab active:cursor-grabbing group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-brand-navy leading-snug">{deal.title}</div>
                          {deal.contact && (
                            <div className="text-xs text-gray-400 mt-0.5">
                              {deal.contact.firstName} {deal.contact.lastName ?? ""}
                            </div>
                          )}
                          <div className="flex items-center gap-1 mt-2">
                            <DollarSign className="h-3 w-3 text-brand-green" />
                            <span className="text-sm font-bold text-brand-green">{formatCurrency(deal.value)}</span>
                          </div>
                          {deal.closeDate && (
                            <div className="text-xs text-gray-400 mt-1">
                              Close: {new Date(deal.closeDate).toLocaleDateString("en-ZA")}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleDelete(deal.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-300 hover:text-red-500 transition-all flex-shrink-0"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add deal slide-over */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowForm(false)} />
          <div className="relative w-full max-w-md bg-white h-full overflow-y-auto shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-bold text-brand-navy text-lg">New Deal</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <div className="flex-1 p-5 space-y-4">
              <div className="space-y-1.5">
                <Label>Deal Title *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Website Redesign for Acme Ltd" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Value (ZAR)</Label>
                  <Input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder="5000" />
                </div>
                <div className="space-y-1.5">
                  <Label>Probability %</Label>
                  <Input type="number" min="0" max="100" value={form.probability} onChange={(e) => setForm({ ...form, probability: e.target.value })} placeholder="50" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Stage</Label>
                <select
                  value={form.stage}
                  onChange={(e) => setForm({ ...form, stage: e.target.value })}
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Expected Close Date</Label>
                <Input type="date" value={form.closeDate} onChange={(e) => setForm({ ...form, closeDate: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Deal context, requirements..." rows={3} />
              </div>
            </div>
            <div className="p-5 border-t flex gap-3">
              <Button className="flex-1" onClick={handleSave} disabled={saving || !form.title.trim()}>
                {saving ? "Saving..." : "Add Deal"}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
