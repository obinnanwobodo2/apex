"use client";

import { useState } from "react";
import { CreditCard, FileText, CheckCircle2, Clock, XCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, ALL_PACKAGES } from "@/lib/utils";
import Link from "next/link";

interface Subscription {
  id: string;
  package: string;
  amount: number;
  amountPaid: number;
  projectType?: string | null;
  businessName?: string | null;
  status: string;
  paid: boolean;
  cancelledAt: string | null;
  nextBillingDate: string | null;
  invoiceNumber: string | null;
  createdAt: string;
}

function statusVariant(status: string): "default" | "secondary" | "destructive" {
  if (status === "active") return "default";
  if (status === "cancelled" || status === "failed") return "destructive";
  return "secondary";
}

function packageDisplayName(sub: Subscription) {
  const isDomain = sub.projectType === "domain_registration" || sub.package === "domain-registration";
  if (isDomain) {
    const domain = sub.businessName?.trim();
    return domain ? `${domain} Domain` : "Domain Registration";
  }
  return `${ALL_PACKAGES[sub.package as keyof typeof ALL_PACKAGES]?.name ?? sub.package} Package`;
}

export default function BillingClient({ initialSubscriptions }: { initialSubscriptions: Subscription[] }) {
  const [subscriptions, setSubscriptions] = useState(initialSubscriptions);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [invoiceOpenId, setInvoiceOpenId] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);

  const activeSub = subscriptions.find((s) => s.status === "active" && s.paid);
  const pendingSubs = subscriptions.filter((s) => s.status === "pending" && !s.paid);

  async function cancelSubscription(id: string) {
    setCancelling(id);
    try {
      const res = await fetch("/api/subscription/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId: id }),
      });
      if (!res.ok) throw new Error("Failed to cancel");
      const updated = await res.json();
      setSubscriptions((prev) => prev.map((s) => (s.id === id ? { ...s, ...updated } : s)));
    } catch {
      // handled silently — user can retry
    } finally {
      setCancelling(null);
      setConfirmId(null);
    }
  }

  async function payPendingInvoice(subscriptionId: string) {
    setPayingId(subscriptionId);
    try {
      const res = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ existingSubscriptionId: subscriptionId }),
      });
      if (!res.ok) throw new Error("Failed to initialize payment");
      const data = await res.json();
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      }
    } finally {
      setPayingId(null);
    }
  }

  async function removePendingInvoice(subscriptionId: string) {
    setRemovingId(subscriptionId);
    try {
      const res = await fetch("/api/subscription/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId, hardDelete: true }),
      });
      if (!res.ok) throw new Error("Failed to remove invoice");
      setSubscriptions((prev) => prev.filter((item) => item.id !== subscriptionId));
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-brand-navy">Billing</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your subscription and payment history. Payments are processed via Paystack.</p>
      </div>

      {/* Active subscription summary */}
      {activeSub && (
        <Card className="border-brand-green/20 bg-brand-green/5">
          <CardContent className="p-5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-brand-green flex items-center justify-center text-white font-bold text-lg">
                  {(ALL_PACKAGES[activeSub.package as keyof typeof ALL_PACKAGES]?.name ?? activeSub.package)[0].toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-brand-navy">
                    {packageDisplayName(activeSub)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatCurrency(activeSub.amount)}
                    {(activeSub.projectType === "domain_registration" || activeSub.package === "domain-registration") ? "/year" : "/month"} · Renews{" "}
                    {activeSub.nextBillingDate
                      ? new Date(activeSub.nextBillingDate).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })
                      : "—"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="default" className="gap-1"><CheckCircle2 className="h-3 w-3" />Active</Badge>
                {confirmId === activeSub.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Cancel subscription?</span>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={cancelling === activeSub.id}
                      onClick={() => cancelSubscription(activeSub.id)}
                    >
                      {cancelling === activeSub.id ? "Cancelling…" : "Confirm"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setConfirmId(null)}>No</Button>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" className="text-gray-500" onClick={() => setConfirmId(activeSub.id)}>
                    <XCircle className="h-4 w-4 mr-1.5" />Cancel Plan
                  </Button>
                )}
              </div>
            </div>
            {confirmId === activeSub.id && (
              <div className="mt-4 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>Your subscription will be cancelled immediately. Your website remains active until the current billing period ends.</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payment history */}
      {pendingSubs.length > 0 && (
        <Card className="border-brand-navy/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-brand-navy">Cart / Pending Invoices</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingSubs.map((sub) => (
              <div key={sub.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100">
                <div>
                  <p className="text-sm font-semibold text-brand-navy">
                    {packageDisplayName(sub)}
                  </p>
                  <p className="text-xs text-gray-400">
                    {sub.invoiceNumber ? `${sub.invoiceNumber} · ` : ""}{new Date(sub.createdAt).toLocaleDateString("en-ZA")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-brand-navy">{formatCurrency(sub.amountPaid || sub.amount)}</span>
                  <Button size="sm" onClick={() => payPendingInvoice(sub.id)} disabled={payingId === sub.id}>
                    {payingId === sub.id ? "Opening..." : "Pay Now"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => removePendingInvoice(sub.id)} disabled={removingId === sub.id}>
                    {removingId === sub.id ? "Removing..." : "Delete"}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {subscriptions.length > 0 ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-brand-navy flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-brand-green" />Payment History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {subscriptions.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      sub.paid ? "bg-green-50 text-green-600" :
                      sub.status === "cancelled" ? "bg-red-50 text-red-500" :
                      "bg-amber-50 text-amber-600"
                    }`}>
                      {sub.paid ? <CheckCircle2 className="h-4 w-4" /> :
                       sub.status === "cancelled" ? <XCircle className="h-4 w-4" /> :
                       <Clock className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-brand-navy capitalize">
                        {packageDisplayName(sub)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(sub.createdAt).toLocaleDateString("en-ZA")}
                        {sub.invoiceNumber ? ` · ${sub.invoiceNumber}` : ""}
                        {sub.cancelledAt ? ` · Cancelled ${new Date(sub.cancelledAt).toLocaleDateString("en-ZA")}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-brand-navy">
                      {formatCurrency(sub.amountPaid || sub.amount)}
                    </span>
                    <Badge variant={statusVariant(sub.status)} className="text-xs capitalize">{sub.status}</Badge>
                    {sub.paid && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => setInvoiceOpenId(sub.id)}>
                          View Invoice
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <a href={`/api/invoices/${sub.id}/pdf`} target="_blank" rel="noopener noreferrer">
                            Download PDF
                          </a>
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-10 w-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium mb-1">No billing history</p>
            <p className="text-gray-400 text-sm mb-4">Subscribe to a plan to see your invoices here.</p>
            <Button asChild><a href="/#packages" target="_blank" rel="noopener noreferrer">View Plans</a></Button>
          </CardContent>
        </Card>
      )}

      {invoiceOpenId && (
        <div className="fixed inset-0 z-50 bg-gray-900/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white border border-gray-200 rounded-2xl p-6">
            {(() => {
              const invoice = subscriptions.find((s) => s.id === invoiceOpenId);
              if (!invoice) return null;
              return (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-brand-navy">Invoice</h3>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <a href={`/api/invoices/${invoice.id}/pdf`} target="_blank" rel="noopener noreferrer">Download PDF</a>
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setInvoiceOpenId(null)}>Close</Button>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 space-y-2">
                    <p><strong className="text-brand-navy">Invoice No:</strong> {invoice.invoiceNumber ?? invoice.id}</p>
                    <p><strong className="text-brand-navy">Date:</strong> {new Date(invoice.createdAt).toLocaleDateString("en-ZA")}</p>
                    <p><strong className="text-brand-navy">Package:</strong> {packageDisplayName(invoice)}</p>
                    {(invoice.projectType === "domain_registration" || invoice.package === "domain-registration") && invoice.businessName && (
                      <p><strong className="text-brand-navy">Domain:</strong> {invoice.businessName}</p>
                    )}
                    <p><strong className="text-brand-navy">Amount Paid:</strong> {formatCurrency(invoice.amountPaid || invoice.amount)}</p>
                    <p><strong className="text-brand-navy">Payment:</strong> {invoice.paid ? "Paid" : "Pending"}</p>
                    <p><strong className="text-brand-navy">Status:</strong> {invoice.status}</p>
                    {invoice.nextBillingDate && (
                      <p><strong className="text-brand-navy">Next Billing:</strong> {new Date(invoice.nextBillingDate).toLocaleDateString("en-ZA")}</p>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
