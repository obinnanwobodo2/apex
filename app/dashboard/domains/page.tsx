"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
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

interface DomainEntry {
  id: string;
  domainName: string;
  registeredAt: string;
  expiresAt: string;
  status: string;
}

interface DomainRequestItem {
  id: string;
  domainName: string;
  extension: string;
  paymentType: "once-off" | "monthly";
  status: string;
  paymentStatus: string;
  notes: string | null;
  checkedNote: string | null;
  createdAt: string;
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
  const { isLoaded, userId } = useAuth();
  const isSignedIn = Boolean(userId);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DomainResult | null>(null);
  const [error, setError] = useState("");
  const [actionMsg, setActionMsg] = useState("");
  const [registering, setRegistering] = useState(false);
  const [checked, setChecked] = useState<DomainResult[]>([]);
  const [orders, setOrders] = useState<DomainOrder[]>([]);
  const [domains, setDomains] = useState<DomainEntry[]>([]);
  const [requests, setRequests] = useState<DomainRequestItem[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestForm, setRequestForm] = useState({
    domainName: "",
    extension: ".co.za",
    paymentType: "once-off" as "once-off" | "monthly",
    notes: "",
  });

  const liveDomain = domains[0]?.domainName
    ?? orders.find((order) => humanStatus(order) === "Live")?.domain
    ?? orders[0]?.domain
    ?? null;

  const loadOrders = useCallback(async () => {
    if (!isSignedIn) {
      setOrders([]);
      setDomains([]);
      setRequests([]);
      setOrdersLoading(false);
      return;
    }

    setOrdersLoading(true);
    try {
      const [orderRes, domainRes, requestRes] = await Promise.all([
        fetch("/api/domains/register", { cache: "no-store" }),
        fetch("/api/domains", { cache: "no-store" }),
        fetch("/api/domains/request", { cache: "no-store" }),
      ]);

      const orderData = await orderRes.json().catch(() => []);
      const domainData = await domainRes.json().catch(() => []);
      const requestData = await requestRes.json().catch(() => []);

      if (orderRes.ok) setOrders(Array.isArray(orderData) ? orderData : []);
      if (domainRes.ok) setDomains(Array.isArray(domainData) ? domainData : []);
      if (requestRes.ok) setRequests(Array.isArray(requestData) ? requestData : []);
    } catch {
      // Silent; user can still use search/purchase
    } finally {
      setOrdersLoading(false);
    }
  }, [isSignedIn]);

  useEffect(() => {
    if (!isLoaded) return;
    void loadOrders();
  }, [isLoaded, loadOrders]);

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

  async function submitDomainRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!isSignedIn) {
      setActionMsg("Sign in to request a domain.");
      return;
    }

    const cleanDomainName = requestForm.domainName.trim().toLowerCase().replace(/\.[a-z.]+$/i, "");
    if (!cleanDomainName) {
      setActionMsg("Please enter a domain name.");
      return;
    }

    setRequestLoading(true);
    setActionMsg("");
    try {
      const reqRes = await fetch("/api/domains/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domainName: cleanDomainName,
          extension: requestForm.extension,
          paymentType: requestForm.paymentType,
          notes: requestForm.notes,
        }),
      });
      const reqData = await reqRes.json().catch(() => null);
      if (!reqRes.ok) throw new Error(reqData?.error || "Failed to submit domain request.");

      const created = reqData as DomainRequestItem;
      setRequests((prev) => [created, ...prev]);

      if (created.paymentType === "once-off") {
        const payRes = await fetch("/api/paystack/domain-charge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ requestId: created.id }),
        });
        const payData = await payRes.json().catch(() => null);
        if (!payRes.ok) throw new Error(payData?.error || "Unable to open payment checkout.");
        if (payData?.authorization_url) {
          window.location.href = payData.authorization_url;
          return;
        }
      }

      setActionMsg(
        created.paymentType === "monthly"
          ? "Domain request submitted. We will add it to your next monthly invoice."
          : "Domain request submitted successfully."
      );
      setRequestForm((prev) => ({ ...prev, domainName: "", notes: "" }));
      void loadOrders();
    } catch (err) {
      setActionMsg(err instanceof Error ? err.message : "Failed to submit domain request.");
    } finally {
      setRequestLoading(false);
    }
  }

  const STATUS_BADGES: Record<string, string> = {
    pending: "text-gray-500 bg-gray-100",
    checked: "text-brand-navy bg-brand-navy/5",
    issued: "text-brand-green bg-brand-green/10",
    unavailable: "text-red-600 bg-red-50",
    paid: "text-brand-green bg-brand-green/10",
  };

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

      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <h3 className="font-semibold text-brand-navy text-sm mb-4">Request a domain</h3>
        {!isLoaded ? (
          <p className="text-sm text-gray-400">Loading account status...</p>
        ) : !isSignedIn ? (
          <p className="text-sm text-gray-400">Sign in to view your domains and submit a domain request.</p>
        ) : (
          <form onSubmit={submitDomainRequest} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="text-sm">
                <span className="text-xs font-medium text-gray-500 block mb-1.5">Domain name</span>
                <input
                  value={requestForm.domainName}
                  onChange={(e) => setRequestForm((prev) => ({ ...prev, domainName: e.target.value }))}
                  placeholder="e.g. apexvisual"
                  className="w-full h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-brand-navy"
                />
              </label>
              <label className="text-sm">
                <span className="text-xs font-medium text-gray-500 block mb-1.5">Extension</span>
                <select
                  value={requestForm.extension}
                  onChange={(e) => setRequestForm((prev) => ({ ...prev, extension: e.target.value }))}
                  className="w-full h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-brand-navy"
                >
                  {POPULAR_TLDS.map((ext) => (
                    <option key={ext} value={ext}>{ext}</option>
                  ))}
                </select>
              </label>
            </div>

            <div>
              <span className="text-xs font-medium text-gray-500 block mb-1.5">Payment type</span>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "once-off", label: "Once-off payment" },
                  { id: "monthly", label: "Add to monthly plan" },
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setRequestForm((prev) => ({ ...prev, paymentType: type.id as "once-off" | "monthly" }))}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      requestForm.paymentType === type.id
                        ? "border-brand-green text-brand-green bg-brand-green/5"
                        : "border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="text-sm block">
              <span className="text-xs font-medium text-gray-500 block mb-1.5">Notes (optional)</span>
              <textarea
                rows={3}
                value={requestForm.notes}
                onChange={(e) => setRequestForm((prev) => ({ ...prev, notes: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-brand-navy resize-none"
                placeholder="Any registrar preference or extra details..."
              />
            </label>

            <button
              type="submit"
              disabled={requestLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#1b2340,#2dc5a2)" }}
            >
              {requestLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
              {requestLoading ? "Submitting..." : "Submit Domain Request"}
            </button>
          </form>
        )}
      </div>

      {isSignedIn && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h3 className="font-semibold text-brand-navy text-sm mb-3">Submitted Requests</h3>
          {requests.length === 0 ? (
            <p className="text-sm text-gray-400">No domain requests submitted yet.</p>
          ) : (
            <div className="space-y-2">
              {requests.map((request) => (
                <div key={request.id} className="flex items-start justify-between py-2 border-b border-gray-200 last:border-0 gap-2">
                  <div>
                    <p className="text-sm font-semibold text-brand-navy">
                      {request.domainName}{request.extension}
                    </p>
                    <p className="text-xs text-gray-500">
                      {request.paymentType === "monthly" ? "Monthly add-on" : "Once-off payment"} · {new Date(request.createdAt).toLocaleDateString("en-ZA")}
                    </p>
                    {request.checkedNote && <p className="text-xs text-gray-500 mt-1">{request.checkedNote}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${STATUS_BADGES[request.status] ?? "text-gray-500 bg-gray-100"}`}>
                      {request.status}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${STATUS_BADGES[request.paymentStatus] ?? "text-gray-500 bg-gray-100"}`}>
                      {request.paymentStatus.replace("_", " ")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
        {!isLoaded ? (
          <p className="text-sm text-gray-400">Loading account status...</p>
        ) : !isSignedIn ? (
          <p className="text-sm text-gray-400">Sign in to view your domains.</p>
        ) : ordersLoading ? (
          <p className="text-sm text-gray-400">Loading your domains...</p>
        ) : domains.length > 0 ? (
          <div className="space-y-2">
            {domains.map((domain) => (
              <div key={domain.id} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0 gap-3">
                <div>
                  <p className="text-sm font-semibold text-brand-navy">{domain.domainName}</p>
                  <p className="text-xs text-gray-500">
                    Registered {new Date(domain.registeredAt).toLocaleDateString("en-ZA")}
                    {" · "}
                    Expires {new Date(domain.expiresAt).toLocaleDateString("en-ZA")}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                  domain.status === "active" ? "text-brand-green bg-brand-green/10" : "text-gray-500 bg-gray-100"
                }`}>
                  {domain.status}
                </span>
              </div>
            ))}
          </div>
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
