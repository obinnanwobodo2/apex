import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, CreditCard } from "lucide-react";

export default async function AdminBillingPage() {
  const { userId } = await auth();
  if (!userId) redirect("/login?redirect_url=/admin/billing");

  const subscriptions = await prisma.subscription.findMany({
    orderBy: { createdAt: "desc" },
    include: { profile: { select: { fullName: true } } },
  });

  const totalRevenue = subscriptions.reduce((s, sub) => s + sub.amountPaid, 0);
  const mrr = subscriptions.filter((s) => s.status === "active" && s.paid).reduce((s, sub) => s + sub.amount, 0);
  const pending = subscriptions.filter((s) => s.status === "pending").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-brand-navy">Revenue</h1>
        <p className="text-sm text-gray-400 mt-0.5">{subscriptions.length} total subscriptions</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card>
          <CardContent className="p-5">
            <div className="w-10 h-10 rounded-xl bg-brand-green/10 flex items-center justify-center mb-3">
              <TrendingUp className="h-5 w-5 text-brand-green" />
            </div>
            <div className="text-2xl font-extrabold text-brand-navy">{formatCurrency(mrr)}</div>
            <div className="text-sm text-gray-500">Monthly Recurring Revenue</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="w-10 h-10 rounded-xl bg-brand-navy/5 flex items-center justify-center mb-3">
              <CreditCard className="h-5 w-5 text-brand-navy" />
            </div>
            <div className="text-2xl font-extrabold text-brand-navy">{formatCurrency(totalRevenue)}</div>
            <div className="text-sm text-gray-500">Total Revenue (All Time)</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="w-10 h-10 rounded-xl bg-brand-green/10 flex items-center justify-center mb-3">
              <CreditCard className="h-5 w-5 text-brand-navy" />
            </div>
            <div className="text-2xl font-extrabold text-brand-navy">{pending}</div>
            <div className="text-sm text-gray-500">Pending Subscriptions</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-brand-navy text-base">All Subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {subscriptions.map((s) => (
              <div key={s.id} className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-brand-navy text-sm">{s.businessName ?? s.profile?.fullName ?? "Unknown"}</div>
                  <div className="text-xs text-gray-400 capitalize mt-0.5">{s.package} · {s.createdAt.toLocaleDateString("en-ZA")}</div>
                  {s.invoiceNumber && <div className="text-xs text-gray-300 mt-0.5">{s.invoiceNumber}</div>}
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right">
                    <div className="font-bold text-brand-navy text-sm">{formatCurrency(s.amount)}/mo</div>
                    <div className="text-xs text-gray-400">Paid: {formatCurrency(s.amountPaid)}</div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${
                    s.status === "active" ? "bg-brand-green/10 text-brand-navy" :
                    s.status === "pending" ? "bg-brand-navy/5 text-brand-navy" :
                    "bg-gray-100 text-gray-500"
                  }`}>{s.status}</span>
                </div>
              </div>
            ))}
            {subscriptions.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">No subscriptions yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
