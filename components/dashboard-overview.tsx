"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Globe, TrendingUp, Calendar, CreditCard, ArrowUpRight,
  Clock, CheckCircle2, AlertCircle, Plus, FolderKanban, BookOpenCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { formatCurrency, ALL_PACKAGES, type PackageId } from "@/lib/utils";
import PlansFlow from "@/components/plans-flow";

export interface SerializedSubscription {
  id: string;
  package: string;
  amount: number;
  amountPaid: number;
  status: string;
  paid: boolean;
  cancelledAt: string | null;
  nextBillingDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SerializedProject {
  id: string;
  title: string;
  type: string;
  status: string;
  progress: number;
  websiteUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

function statusVariant(status: string): "default" | "secondary" | "navy" {
  switch (status?.toLowerCase()) {
    case "active": case "completed": return "default";
    case "in_progress": case "review": return "navy";
    default: return "secondary";
  }
}

function statusIcon(status: string) {
  switch (status?.toLowerCase()) {
    case "active": case "completed": return <CheckCircle2 className="h-3.5 w-3.5" />;
    case "in_progress": case "review": return <Clock className="h-3.5 w-3.5" />;
    default: return <AlertCircle className="h-3.5 w-3.5" />;
  }
}

const PROJECT_STATUS_LABELS: Record<string, string> = {
  requested: "Requested",
  scoping: "Scoping",
  in_progress: "In Progress",
  review: "In Review",
  completed: "Completed",
};

export default function DashboardOverview({
  subscriptions,
  projects,
  initialPlanId = null,
}: {
  subscriptions: SerializedSubscription[];
  projects: SerializedProject[];
  initialPlanId?: PackageId | null;
}) {
  const [flowOpen, setFlowOpen] = useState(false);
  const didAutoOpen = useRef(false);

  useEffect(() => {
    if (!initialPlanId || didAutoOpen.current) return;
    didAutoOpen.current = true;
    setFlowOpen(true);
  }, [initialPlanId]);

  const activeSub = subscriptions.find((s) => s.status === "active" && s.paid);
  const pkg = activeSub ? ALL_PACKAGES[activeSub.package as keyof typeof ALL_PACKAGES] : null;

  const stats = [
    {
      label: "Active Plan",
      value: pkg?.name ?? "None",
      sub: activeSub ? `${formatCurrency(activeSub.amount)}/mo` : "No active plan",
      icon: <Globe className="h-5 w-5" />,
      color: "text-brand-green",
      bg: "bg-brand-green/10",
    },
    {
      label: "Next Billing",
      value: activeSub?.nextBillingDate
        ? new Date(activeSub.nextBillingDate).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })
        : "—",
      sub: "Auto-renews monthly",
      icon: <Calendar className="h-5 w-5" />,
      color: "text-brand-navy",
      bg: "bg-brand-navy/5",
    },
    {
      label: "Total Projects",
      value: String(projects.length),
      sub: "All time",
      icon: <TrendingUp className="h-5 w-5" />,
      color: "text-brand-navy",
      bg: "bg-gray-100",
    },
    {
      label: "Monthly Value",
      value: activeSub ? formatCurrency(activeSub.amount) : "R0",
      sub: "excl. VAT",
      icon: <CreditCard className="h-5 w-5" />,
      color: "text-brand-navy",
      bg: "bg-gray-100",
    },
  ];

  const billingProgress = (() => {
    if (!activeSub) return 0;
    const start = new Date(activeSub.createdAt).getTime();
    const end = activeSub.nextBillingDate
      ? new Date(activeSub.nextBillingDate).getTime()
      : start + 30 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    return Math.min(100, Math.round(((now - start) / (end - start)) * 100));
  })();

  return (
    <div className="space-y-8">
      {(projects.length === 0 || !activeSub) && (
        <Card className="border-brand-green/20 bg-brand-green/5">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-green/15 flex items-center justify-center text-brand-navy">
                <BookOpenCheck className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-brand-navy mb-3">New Client Quick Start</p>
                <ol className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
                  <li>1. Choose a package and complete payment.</li>
                  <li>2. Open `Requests` and submit your website brief.</li>
                  <li>3. Upload logo/content in `Files`.</li>
                  <li>4. Track progress in `Projects`.</li>
                  <li>5. View invoices in `Billing`.</li>
                  <li>6. Use `Support` for updates and help.</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-gray-200 hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                  {stat.icon}
                </div>
                <ArrowUpRight className="h-4 w-4 text-gray-300" />
              </div>
              <div className="text-2xl font-extrabold text-brand-navy">{stat.value}</div>
              <div className="text-sm font-medium text-gray-500 mt-0.5">{stat.label}</div>
              <div className="text-xs text-gray-400 mt-1">{stat.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subscription card */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-brand-navy text-base">Your Subscription</CardTitle>
              {activeSub && (
                <Badge variant={statusVariant(activeSub.status)} className="gap-1">
                  {statusIcon(activeSub.status)}{activeSub.status}
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              {activeSub && pkg ? (
                <div className="space-y-5">
                  <div className="flex items-center gap-4 p-4 bg-brand-navy/5 rounded-xl border border-brand-green/20">
                    <div className="w-12 h-12 rounded-xl bg-brand-navy flex items-center justify-center text-white font-bold text-lg">
                      {pkg.name[0]}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-brand-navy">{pkg.name} Package</div>
                      <div className="text-sm text-gray-500">{formatCurrency(pkg.price)}/month · Monthly retainer</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-brand-green">Active</div>
                      <div className="text-xs text-gray-400 mt-0.5">Auto-renews</div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-500">Billing cycle progress</span>
                      <span className="text-brand-navy font-medium">{billingProgress}%</span>
                    </div>
                    <Progress value={billingProgress} />
                    <div className="flex justify-between text-xs text-gray-400 mt-1.5">
                      <span>Started {new Date(activeSub.createdAt).toLocaleDateString("en-ZA")}</span>
                      <span>
                        Renews{" "}
                        {activeSub.nextBillingDate
                          ? new Date(activeSub.nextBillingDate).toLocaleDateString("en-ZA")
                          : "—"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" size="sm" onClick={() => setFlowOpen(true)}>
                      Upgrade Plan
                    </Button>
                    <Button variant="ghost" size="sm" className="text-gray-500" asChild>
                      <Link href="/dashboard/billing">View Invoices</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-brand-green/10 flex items-center justify-center mb-4">
                    <Globe className="h-8 w-8 text-brand-green" />
                  </div>
                  <h3 className="font-bold text-brand-navy mb-1">No active subscription</h3>
                  <p className="text-gray-400 text-sm mb-5 max-w-xs">
                    Choose a monthly care plan to get your website built, managed and growing.
                  </p>
                  <Button size="lg" onClick={() => setFlowOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    View Plans &amp; Get Started
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick actions */}
        <div>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-brand-navy text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                {
                  label: activeSub ? "Upgrade my plan" : "Choose a plan",
                  icon: <TrendingUp className="h-4 w-4" />,
                  action: () => setFlowOpen(true),
                },
                { label: "My projects", icon: <FolderKanban className="h-4 w-4" />, href: "/dashboard/projects" },
                { label: "View my website", icon: <Globe className="h-4 w-4" />, href: "/dashboard/website" },
                { label: "View invoices", icon: <CreditCard className="h-4 w-4" />, href: "/dashboard/billing" },
              ].map((action) =>
                "action" in action && action.action ? (
                  <button
                    key={action.label}
                    onClick={action.action}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium text-gray-600 hover:text-brand-navy group text-left"
                  >
                    <span className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-brand-green/10 group-hover:text-brand-green flex items-center justify-center transition-colors">
                      {action.icon}
                    </span>
                    {action.label}
                    <ArrowUpRight className="h-3.5 w-3.5 ml-auto text-gray-300 group-hover:text-brand-green" />
                  </button>
                ) : (
                  <Link
                    key={action.label}
                    href={"href" in action ? action.href! : "#"}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium text-gray-600 hover:text-brand-navy group"
                  >
                    <span className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-brand-green/10 group-hover:text-brand-green flex items-center justify-center transition-colors">
                      {action.icon}
                    </span>
                    {action.label}
                    <ArrowUpRight className="h-3.5 w-3.5 ml-auto text-gray-300 group-hover:text-brand-green" />
                  </Link>
                )
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent projects */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-brand-navy text-base">Recent Projects</CardTitle>
          <Link href="/dashboard/projects" className="text-xs text-brand-green hover:underline flex items-center gap-1">
            View all <ArrowUpRight className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent>
          {projects.length > 0 ? (
            <div className="space-y-3">
              {projects.map((project) => (
                <div key={project.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-brand-navy/5 flex items-center justify-center text-brand-navy font-bold text-sm">
                      {project.title[0]?.toUpperCase() ?? "P"}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-brand-navy">{project.title}</div>
                      <div className="text-xs text-gray-400 capitalize">
                        {project.type} · {new Date(project.createdAt).toLocaleDateString("en-ZA")}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
                      <div className="w-16 bg-gray-100 rounded-full h-1.5">
                        <div className="bg-brand-green rounded-full h-1.5 transition-all" style={{ width: `${project.progress}%` }} />
                      </div>
                      <span>{project.progress}%</span>
                    </div>
                    <Badge variant={statusVariant(project.status)} className="gap-1 text-xs">
                      {statusIcon(project.status)}
                      {PROJECT_STATUS_LABELS[project.status] ?? project.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <Clock className="h-10 w-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No projects yet.</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => setFlowOpen(true)}>
                Subscribe to get started
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <PlansFlow
        open={flowOpen}
        onClose={() => setFlowOpen(false)}
        initialPackageId={initialPlanId}
      />
    </div>
  );
}
