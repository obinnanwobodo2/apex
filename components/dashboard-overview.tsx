"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Globe, TrendingUp, Calendar, ArrowUpRight,
  CheckCircle2, XCircle, FolderKanban, MessageCircle,
  Upload, CreditCard, Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const PIPELINE_STAGES = ["Under Review", "Scoping", "In Development", "Review & Feedback", "Revisions", "Deployed"];

const STAGE_MAP: Record<string, string> = {
  requested: "Under Review",
  scoping: "Scoping",
  in_progress: "In Development",
  review: "Review & Feedback",
  completed: "Deployed",
};

const STAGE_COLORS: Record<string, string> = {
  "Under Review": "bg-amber-100 text-amber-700",
  "Scoping": "bg-blue-100 text-blue-700",
  "In Development": "bg-brand-navy/10 text-brand-navy",
  "Review & Feedback": "bg-purple-100 text-purple-700",
  "Revisions": "bg-orange-100 text-orange-700",
  "Deployed": "bg-brand-green/15 text-brand-green",
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
  const activeProject = projects[0] ?? null;
  const projectStage = activeProject ? (STAGE_MAP[activeProject.status] ?? "Under Review") : null;

  // Onboarding checklist
  const checklist = [
    { label: "Choose a plan", done: !!activeSub, href: "#" as const },
    { label: "Submit your project brief", done: projects.length > 0, href: "/dashboard/projects" as const },
    { label: "Upload your logo and brand files", done: false, href: "/dashboard/files" as const },
    { label: "Review your website preview", done: activeProject?.status === "review" || activeProject?.status === "completed", href: "/dashboard/projects" as const },
    { label: "Approve & go live", done: activeProject?.status === "completed", href: "/dashboard/projects" as const },
  ];
  const allDone = checklist.every((c) => c.done);

  const stats = [
    {
      label: "Active Plan",
      value: pkg?.name ?? "No active plan",
      sub: activeSub ? `${formatCurrency(activeSub.amount)}/mo` : "Choose a plan to get started",
      icon: <Zap className="h-5 w-5" />,
      color: "text-brand-green",
      bg: "bg-brand-green/10",
    },
    {
      label: "Next Billing",
      value: activeSub?.nextBillingDate
        ? new Date(activeSub.nextBillingDate).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })
        : "—",
      sub: activeSub ? "Auto-renews monthly" : "No billing date yet",
      icon: <Calendar className="h-5 w-5" />,
      color: "text-brand-navy",
      bg: "bg-brand-navy/5",
    },
    {
      label: "Project Stage",
      value: projectStage ?? "No active project",
      sub: activeProject ? `Updated ${new Date(activeProject.updatedAt).toLocaleDateString("en-ZA")}` : "Start a project to track progress",
      icon: <TrendingUp className="h-5 w-5" />,
      color: "text-brand-navy",
      bg: "bg-gray-100",
    },
    {
      label: "Messages",
      value: "0 unread",
      sub: "No new messages",
      icon: <MessageCircle className="h-5 w-5" />,
      color: "text-brand-navy",
      bg: "bg-gray-100",
    },
  ];

  return (
    <div className="space-y-8">
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
              <div className="text-lg font-extrabold text-brand-navy leading-tight">{stat.value}</div>
              <div className="text-sm font-medium text-gray-500 mt-0.5">{stat.label}</div>
              <div className="text-xs text-gray-400 mt-1">{stat.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Onboarding checklist */}
      {!allDone && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-brand-navy">Get started</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {checklist.map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  {item.done ? (
                    <CheckCircle2 className="h-5 w-5 text-brand-green flex-shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-gray-300 flex-shrink-0" />
                  )}
                  {item.done ? (
                    <span className="text-sm text-gray-400 line-through">{item.label}</span>
                  ) : (
                    <Link href={item.href === "#" ? "#" : item.href}
                      onClick={item.href === "#" ? (e) => { e.preventDefault(); setFlowOpen(true); } : undefined}
                      className="text-sm text-brand-navy hover:text-brand-green transition-colors hover:underline">
                      {item.label}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active project card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-brand-navy">Your project</CardTitle>
            </CardHeader>
            <CardContent>
              {activeProject ? (
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-brand-navy">{activeProject.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Last updated {new Date(activeProject.updatedAt).toLocaleDateString("en-ZA")}
                      </p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${STAGE_COLORS[projectStage ?? "Under Review"]}`}>
                      {projectStage}
                    </span>
                  </div>
                  {/* Pipeline mini-bar */}
                  <div className="flex gap-1">
                    {PIPELINE_STAGES.map((stage) => {
                      const stageIdx = PIPELINE_STAGES.indexOf(stage);
                      const currentIdx = PIPELINE_STAGES.indexOf(projectStage ?? "Under Review");
                      return (
                        <div key={stage} className={`flex-1 h-1.5 rounded-full ${stageIdx <= currentIdx ? "bg-brand-green" : "bg-gray-100"}`} />
                      );
                    })}
                  </div>
                  <div className="flex gap-3 pt-1">
                    <Button size="sm" asChild>
                      <Link href="/dashboard/projects">View project</Link>
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <Link href="/dashboard/messages">
                        <MessageCircle className="h-3.5 w-3.5 mr-1.5" />Message us
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-brand-green/10 flex items-center justify-center mb-4">
                    <Globe className="h-7 w-7 text-brand-green" />
                  </div>
                  <h3 className="font-bold text-brand-navy mb-1">No active project yet</h3>
                  <p className="text-gray-400 text-sm mb-5 max-w-xs">
                    Ready to start?{" "}
                    <button onClick={() => setFlowOpen(true)} className="text-brand-green hover:underline font-medium">
                      Choose a plan →
                    </button>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick actions */}
        <div>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-brand-navy text-base">Quick actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {([
                { label: "Message us", icon: <MessageCircle className="h-4 w-4" />, href: "/dashboard/messages" },
                { label: "Upload files", icon: <Upload className="h-4 w-4" />, href: "/dashboard/files" },
                { label: "View invoices", icon: <CreditCard className="h-4 w-4" />, href: "/dashboard/billing" },
                { label: activeSub ? "Upgrade plan" : "Choose a plan", icon: <Zap className="h-4 w-4" />, action: true },
                { label: "My project", icon: <FolderKanban className="h-4 w-4" />, href: "/dashboard/projects" },
              ] as Array<{ label: string; icon: React.ReactNode; href?: string; action?: boolean }>).map((item) =>
                item.action ? (
                  <button key={item.label} onClick={() => setFlowOpen(true)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium text-gray-600 hover:text-brand-navy group text-left">
                    <span className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-brand-green/10 group-hover:text-brand-green flex items-center justify-center transition-colors">
                      {item.icon}
                    </span>
                    {item.label}
                    <ArrowUpRight className="h-3.5 w-3.5 ml-auto text-gray-300 group-hover:text-brand-green" />
                  </button>
                ) : (
                  <Link key={item.label} href={item.href!}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium text-gray-600 hover:text-brand-navy group">
                    <span className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-brand-green/10 group-hover:text-brand-green flex items-center justify-center transition-colors">
                      {item.icon}
                    </span>
                    {item.label}
                    <ArrowUpRight className="h-3.5 w-3.5 ml-auto text-gray-300 group-hover:text-brand-green" />
                  </Link>
                )
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <PlansFlow
        open={flowOpen}
        onClose={() => setFlowOpen(false)}
        initialPackageId={initialPlanId}
      />
    </div>
  );
}
