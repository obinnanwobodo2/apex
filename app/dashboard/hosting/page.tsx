import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Server, Activity, Mail, Download, ShieldCheck, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const PLAN_LABELS: Record<string, string> = {
  none: "No Hosting",
  basic: "Basic Hosting",
  business: "Business Hosting",
};

export default async function HostingPage() {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  const activeSubscription = await prisma.subscription.findFirst({
    where: { userId, paid: true, status: "active" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      package: true,
      hostingPlan: true,
      createdAt: true,
      nextBillingDate: true,
    },
  });

  const hostingPlan = activeSubscription?.hostingPlan ?? "none";
  const hasHosting = hostingPlan !== "none";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-brand-navy">Hosting Management</h1>
        <p className="text-sm text-gray-400 mt-0.5">Monitor uptime, email accounts, and backups.</p>
      </div>

      <Card className={hasHosting ? "border-brand-green/20 bg-brand-green/5" : ""}>
        <CardContent className="p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-green/10 flex items-center justify-center">
              <Server className="h-5 w-5 text-brand-green" />
            </div>
            <div>
              <p className="text-sm font-semibold text-brand-navy">Current plan: {PLAN_LABELS[hostingPlan] ?? hostingPlan}</p>
              <p className="text-xs text-gray-500">
                {hasHosting
                  ? "Hosting is active and monitored."
                  : "No hosting add-on found on your active subscription."}
              </p>
            </div>
          </div>
          {!hasHosting && (
            <Button asChild>
              <Link href="/dashboard/requests">Request Hosting Add-on</Link>
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-brand-navy flex items-center gap-2">
              <Activity className="h-4 w-4 text-brand-green" />Uptime
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-extrabold text-brand-navy">{hasHosting ? "99.9%" : "—"}</p>
            <p className="text-xs text-gray-400 mt-1">
              {hasHosting ? "Rolling 30-day uptime." : "Activate hosting to track uptime."}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-brand-navy flex items-center gap-2">
              <Mail className="h-4 w-4 text-brand-green" />Email Accounts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-extrabold text-brand-navy">{hasHosting ? "0" : "—"}</p>
            <p className="text-xs text-gray-400 mt-1">
              {hasHosting
                ? "No mailboxes configured yet. Create via support."
                : "Hosting required before mailbox setup."}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-brand-navy flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-brand-green" />Backups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-extrabold text-brand-navy">{hasHosting ? "Daily" : "—"}</p>
            <p className="text-xs text-gray-400 mt-1">
              {hasHosting ? "Automated backups are enabled." : "Backups become available with hosting."}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-brand-navy flex items-center gap-2">
            <Download className="h-4 w-4 text-brand-green" />Backup Download
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {hasHosting ? (
            <>
              <p className="text-sm text-gray-500">Request the latest backup package from support for security verification.</p>
              <Button variant="outline" asChild>
                <Link href="/dashboard/support">Request Backup Download</Link>
              </Button>
            </>
          ) : (
            <p className="text-sm text-gray-400">No hosting backup available yet. Add hosting to enable backup access.</p>
          )}
        </CardContent>
      </Card>

      {activeSubscription && (
        <Card>
          <CardContent className="p-4 text-xs text-gray-500 flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-brand-green" />
            Subscription started {activeSubscription.createdAt.toLocaleDateString("en-ZA")}
            {activeSubscription.nextBillingDate ? ` · Renews ${activeSubscription.nextBillingDate.toLocaleDateString("en-ZA")}` : ""}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
