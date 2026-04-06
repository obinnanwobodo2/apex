"use client";

import { useEffect, useState } from "react";
import {
  Search, Globe, CheckCircle2, XCircle, AlertCircle,
  ShoppingCart, RefreshCw, ArrowRight, Loader2, ShieldCheck,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface DomainResult {
  domain: string;
  available: boolean;
  registered: boolean;
  source: "registrar" | "rdap";
  checkedAt: string;
  error?: string;
  warning?: string;
  suggestions: string[];
  supported: boolean;
  price: number | null;
  priceLabel: string;
  accuracy: "registrar_verified" | "rdap_lookup";
  notice: string | null;
}

interface DomainOrder {
  id: string;
  domain: string;
  status: string;
  paid: boolean;
  amount: number;
  amountPaid: number;
  invoiceNumber: string | null;
  nextBillingDate: string | null;
  createdAt: string;
  registrationStatus: string;
  providerReference: string | null;
  registrationError: string | null;
  years: number;
}

const POPULAR_TLDS = [".co.za", ".com", ".net", ".org", ".io", ".dev"];
const PRICES: Record<string, string> = {
  "co.za": "R180/yr",
  com: "R280/yr",
  net: "R290/yr",
  org: "R260/yr",
  io: "R620/yr",
  dev: "R350/yr",
};

function getTld(domain: string): string {
  return domain.split(".").slice(1).join(".");
}

function humanStatus(order: DomainOrder) {
  if (order.registrationStatus === "registered" && order.status === "active" && order.paid) return "Live";
  if (order.paid && order.registrationStatus?.includes("pending")) return "Provisioning";
  if (!order.paid && order.status === "pending") return "Awaiting Payment";
  if (order.status === "failed") return "Failed";
  if (order.status === "cancelled") return "Cancelled";
  return "Processing";
}

export default function DomainsPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DomainResult | null>(null);
  const [error, setError] = useState("");
  const [actionMsg, setActionMsg] = useState("");
  const [registering, setRegistering] = useState(false);
  const [checked, setChecked] = useState<DomainResult[]>([]);
  const [orders, setOrders] = useState<DomainOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const liveDomain = orders.find((order) => humanStatus(order) === "Live")?.domain ?? orders[0]?.domain ?? null;

  async function loadOrders() {
    setOrdersLoading(true);
    try {
      const res = await fetch("/api/domains/register", { cache: "no-store" });
      const data = await res.json().catch(() => []);
      if (!res.ok) throw new Error("Failed to load domains");
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      // Silent; user can still use search/purchase
    } finally {
      setOrdersLoading(false);
    }
  }

  useEffect(() => {
    void loadOrders();
  }, []);

  async function checkDomain(domain?: string) {
    const d = (domain ?? query).trim().toLowerCase();
    if (!d || !d.includes(".")) {
      setError("Please enter a full domain name e.g. mybusiness.co.za");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch(`/api/domains/check?domain=${encodeURIComponent(d)}`);
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Failed to check domain");
      setResult(data as DomainResult);
      setChecked((prev) => [data as DomainResult, ...prev.filter((c) => c.domain !== d)].slice(0, 10));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check domain. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function registerDomain(domain: string) {
    try {
      setRegistering(true);
      setActionMsg("");

      const res = await fetch("/api/domains/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Failed to initialize payment");

      if (data?.authorization_url) {
        window.location.href = data.authorization_url;
        return;
      }

      setActionMsg("Payment initialized. Please continue in checkout.");
    } catch (err) {
      setActionMsg(err instanceof Error ? err.message : "Could not start domain purchase right now.");
    } finally {
      setRegistering(false);
      void loadOrders();
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-brand-navy">Domain Search</h1>
        <p className="text-gray-500 text-sm mt-1">Check accurate availability, pay instantly with Paystack, and activate your domain.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <label className="text-sm font-medium text-gray-600 block mb-3">Search for a domain</label>
        <div className="flex gap-3">
          <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus-within:border-brand-green/50 transition-colors">
            <Globe className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && checkDomain()}
              placeholder="e.g. mybusiness.co.za or mybusiness.com"
              className="flex-1 bg-transparent text-brand-navy text-sm placeholder-[#333] focus:outline-none"
            />
            {query && (
              <button onClick={() => { setQuery(""); setResult(null); setError(""); }}
                className="text-gray-400 hover:text-brand-navy transition-colors">
                <XCircle className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => checkDomain()}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#1b2340,#2dc5a2)" }}
          >
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Check
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          {POPULAR_TLDS.map((tld) => (
            <button
              key={tld}
              onClick={() => {
                const base = query.split(".")[0] || "mybusiness";
                const d = `${base}${tld}`;
                setQuery(d);
                checkDomain(d);
              }}
              className="text-xs px-2.5 py-1 rounded-full border border-gray-200 text-gray-500 hover:text-brand-navy hover:border-gray-300 transition-colors"
            >
              {tld}
            </button>
          ))}
        </div>

        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
      </div>

      {result && (
        <div className={`rounded-2xl border p-5 transition-all ${
          result.error ? "bg-white border-gray-200" :
          result.available ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-500/5 border-red-500/20"
        }`}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              {result.error ? (
                <AlertCircle className="h-6 w-6 text-brand-navy" />
              ) : result.available ? (
                <CheckCircle2 className="h-6 w-6 text-brand-green" />
              ) : (
                <XCircle className="h-6 w-6 text-gray-500" />
              )}
              <div>
                <div className="font-bold text-brand-navy text-base">{result.domain}</div>
                <div className={`text-sm ${
                  result.error ? "text-brand-navy" :
                  result.available ? "text-brand-green" : "text-gray-500"
                }`}>
                  {result.error ? `Could not check: ${result.error}` :
                   result.available ? "Available to register!" : "Already registered"}
                </div>
                <div className="text-[11px] text-gray-500 mt-1">
                  Source: {result.source === "registrar" ? "Registrar API (accurate)" : "RDAP fallback"}
                  {result.warning ? ` · ${result.warning}` : ""}
                </div>
              </div>
            </div>
            {result.available && !result.error && (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="font-bold text-brand-navy">{result.priceLabel || PRICES[getTld(result.domain)] || "Contact us"}</div>
                  <div className="text-[11px] text-[#444]">annual registration</div>
                </div>
                <button
                  onClick={() => registerDomain(result.domain)}
                  disabled={registering || !result.supported}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg,#1b2340,#2dc5a2)" }}
                >
                  {registering ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
                  {registering ? "Opening Checkout..." : "Pay & Register"}
                </button>
              </div>
            )}
          </div>

          {result.notice && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              {result.notice}
            </div>
          )}

          {result.suggestions.length > 0 && (
            <div className="mt-5 border-t border-gray-200 pt-4">
              <p className="text-xs font-semibold text-[#444] uppercase tracking-widest mb-3">Similar domains to try</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {result.suggestions.map((s) => (
                  <button key={s} onClick={() => { setQuery(s); checkDomain(s); }}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-white border border-gray-200 hover:border-gray-300 transition-all group">
                    <span className="text-sm text-gray-500 group-hover:text-brand-navy transition-colors truncate">{s}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-gray-400 group-hover:text-brand-green flex-shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      {actionMsg && <p className="text-sm text-brand-navy">{actionMsg}</p>}

      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <h3 className="font-semibold text-brand-navy text-sm mb-4">Your Domains</h3>
        {ordersLoading ? (
          <p className="text-sm text-gray-400">No domains registered yet.</p>
        ) : orders.length === 0 ? (
          <p className="text-sm text-gray-400">No domains registered yet.</p>
        ) : (
          <div className="space-y-2">
            {orders.map((order) => {
              const status = humanStatus(order);
              return (
                <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0 gap-3">
                  <div>
                    <p className="text-sm font-semibold text-brand-navy">{order.domain}</p>
                    <p className="text-xs text-gray-500">
                      {order.invoiceNumber ? `${order.invoiceNumber} · ` : ""}
                      {new Date(order.createdAt).toLocaleDateString("en-ZA")}
                      {order.nextBillingDate ? ` · Renews ${new Date(order.nextBillingDate).toLocaleDateString("en-ZA")}` : ""}
                    </p>
                    {order.registrationError && (
                      <p className="text-xs text-amber-700 mt-1">{order.registrationError}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-brand-navy">{formatCurrency(order.amountPaid || order.amount)}</p>
                    <p className={`text-xs font-medium ${
                      status === "Live" ? "text-brand-green" :
                      status === "Provisioning" ? "text-amber-700" :
                      status === "Awaiting Payment" ? "text-gray-500" :
                      "text-red-600"
                    }`}>
                      {status}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <h3 className="font-semibold text-brand-navy text-sm mb-4">DNS Settings</h3>
        {liveDomain ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-sm font-semibold text-brand-navy">{liveDomain}</p>
              <p className="text-xs text-gray-500 mt-1">Use the DNS records below if you manage nameservers externally.</p>
            </div>
            <div className="space-y-2">
              {[
                { type: "A", host: "@", value: "76.76.21.21", ttl: "3600" },
                { type: "CNAME", host: "www", value: "cname.vercel-dns.com", ttl: "3600" },
              ].map((record) => (
                <div key={`${record.type}-${record.host}`} className="grid grid-cols-4 gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600">
                  <span className="font-semibold text-brand-navy">{record.type}</span>
                  <span>{record.host}</span>
                  <span className="truncate">{record.value}</span>
                  <span className="text-right">{record.ttl}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400">No registered domain yet. Complete registration to unlock DNS controls.</p>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <h3 className="font-semibold text-brand-navy text-sm mb-4">Domain Pricing</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(PRICES).map(([tld, price]) => (
            <div key={tld} className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
              <div className="text-xs font-bold text-brand-green mb-1">.{tld}</div>
              <div className="text-sm font-bold text-brand-navy">{price}</div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-gray-500 mt-4 flex items-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5 text-brand-green" />
          Availability is verified in real time before checkout and re-confirmed before registration.
        </p>
      </div>

      {checked.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h3 className="font-semibold text-brand-navy text-sm mb-3">Recent Searches</h3>
          <div className="space-y-2">
            {checked.map((c) => (
              <div key={c.domain} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0">
                <button onClick={() => { setQuery(c.domain); checkDomain(c.domain); }}
                  className="text-sm text-gray-500 hover:text-brand-navy transition-colors">
                  {c.domain}
                </button>
                <span className={`text-xs font-medium ${
                  c.error ? "text-brand-navy" : c.available ? "text-brand-green" : "text-gray-500"
                }`}>
                  {c.error ? "Error" : c.available ? "Available" : "Taken"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
