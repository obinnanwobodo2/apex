"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Globe, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface DomainRequestRow {
  id: string;
  clientId: string;
  clientName: string;
  domainName: string;
  extension: string;
  paymentType: string;
  paymentStatus: string;
  status: string;
  checkedNote: string | null;
  createdAt: string;
}

const BADGE_STYLES: Record<string, string> = {
  pending: "text-gray-500 bg-gray-100",
  checked: "text-brand-navy bg-brand-navy/5",
  issued: "text-brand-green bg-brand-green/10",
  unavailable: "text-red-600 bg-red-50",
  paid: "text-brand-green bg-brand-green/10",
  unpaid: "text-amber-700 bg-amber-50",
  processing: "text-brand-navy bg-brand-navy/5",
  pending_monthly: "text-brand-navy bg-brand-navy/5",
};

export default function AdminDomainsClient() {
  const [items, setItems] = useState<DomainRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeId, setActiveId] = useState<string>("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const active = useMemo(
    () => items.find((item) => item.id === activeId) ?? null,
    [items, activeId]
  );

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/domains/requests", { cache: "no-store" });
      const data = await res.json().catch(() => []);
      if (!res.ok) throw new Error(data?.error || "Failed to load requests.");
      const rows = Array.isArray(data) ? (data as DomainRequestRow[]) : [];
      setItems(rows);
      if (rows.length > 0) {
        setActiveId((prev) => prev || rows[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load requests.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    if (!active) return;
    setNote(active.checkedNote ?? "");
  }, [active]);

  async function runAction(action: "register_and_issue" | "suggest_alternatives" | "mark_unavailable" | "checked") {
    if (!active) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/domains/requests/${active.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, checkedNote: note }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Failed to process request.");
      await loadRequests();
      setActiveId(active.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process request.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-brand-navy">Domains</h1>
        <p className="text-sm text-gray-400 mt-0.5">Review all client domain requests and issue approved domains.</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-brand-navy">All Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-16 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Loading requests...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="py-16 text-center">
                <Globe className="h-10 w-10 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No domain requests yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveId(item.id)}
                    className={`w-full text-left rounded-xl border p-3 transition-colors ${
                      activeId === item.id ? "border-brand-green/30 bg-brand-green/5" : "border-gray-100 hover:border-gray-200"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-brand-navy">
                          {item.domainName}{item.extension}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.clientName} · {new Date(item.createdAt).toLocaleDateString("en-ZA")}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${BADGE_STYLES[item.status] ?? "text-gray-500 bg-gray-100"}`}>
                          {item.status}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${BADGE_STYLES[item.paymentStatus] ?? "text-gray-500 bg-gray-100"}`}>
                          {item.paymentStatus.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-brand-navy">Process Request</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!active ? (
              <p className="text-sm text-gray-400">Select a request to process.</p>
            ) : (
              <>
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                  <p className="text-sm font-semibold text-brand-navy">{active.domainName}{active.extension}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Client: {active.clientName}
                    {" · "}
                    Payment: {active.paymentType}
                  </p>
                </div>

                <label className="text-sm block">
                  <span className="text-xs font-medium text-gray-500 block mb-1.5">Availability note</span>
                  <Textarea
                    rows={4}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="resize-none"
                    placeholder="Record registry result or alternatives..."
                  />
                </label>

                <div className="space-y-2">
                  <Button className="w-full" onClick={() => runAction("register_and_issue")} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                    Register & issue
                  </Button>
                  <Button className="w-full" variant="outline" onClick={() => runAction("suggest_alternatives")} disabled={saving}>
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Suggest alternatives
                  </Button>
                  <Button className="w-full" variant="outline" onClick={() => runAction("mark_unavailable")} disabled={saving}>
                    <XCircle className="h-4 w-4 mr-2" />
                    Mark unavailable
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
