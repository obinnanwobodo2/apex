"use client";

import Link from "next/link";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import {
  Users,
  TrendingUp,
  CheckSquare,
  Activity,
  ArrowUpRight,
  Clock,
  PhoneCall,
  Mail,
  CalendarDays,
  FileText,
  MessageSquare,
  Pin,
  Plus,
  AlertTriangle,
  Target,
  Flame,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

interface CrmData {
  contacts: Array<{ id: string; firstName: string; lastName: string | null; company: string | null; status: string; email: string | null; phone: string | null; createdAt: string }>;
  deals: Array<{ id: string; title: string; value: number; stage: string; contact: { firstName: string; lastName: string | null } | null; createdAt: string; closeDate: string | null }>;
  tasks: Array<{ id: string; title: string; priority: string; status: string; dueDate: string | null; createdAt: string }>;
  activities: Array<{ id: string; type: string; title: string; body: string | null; contact: { firstName: string; lastName: string | null } | null; createdAt: string }>;
}


const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-gray-100 text-gray-500",
  medium: "bg-brand-navy/5 text-brand-navy",
  high: "bg-brand-green/10 text-brand-navy",
};

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  call: <PhoneCall className="h-4 w-4 text-brand-navy" />,
  email: <Mail className="h-4 w-4 text-brand-navy" />,
  meeting: <CalendarDays className="h-4 w-4 text-brand-navy" />,
  note: <FileText className="h-4 w-4 text-brand-navy" />,
  whatsapp: <MessageSquare className="h-4 w-4 text-brand-navy" />,
};

const PIPELINE_ORDER = ["lead", "qualified", "proposal", "negotiation", "won"];

function pctDelta(current: number, previous: number) {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function daysBetween(startIso: string, endIso: string) {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null;
  return Math.max(0, Math.round((end - start) / (1000 * 60 * 60 * 24)));
}

function buildSparklinePoints(days = 7, values: Record<string, number>) {
  const out: number[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i -= 1) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const key = day.toISOString().slice(0, 10);
    out.push(values[key] ?? 0);
  }
  return out;
}

function MiniSpark({ points }: { points: number[] }) {
  const max = Math.max(...points, 1);
  return (
    <div className="flex items-end gap-1 h-6">
      {points.map((p, idx) => (
        <span
          key={`${idx}-${p}`}
          className="w-2 rounded-sm bg-brand-green/70"
          style={{ height: `${Math.max(2, Math.round((p / max) * 24))}px` }}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

export default function CrmOverview({ data }: { data: CrmData }) {
  const { user } = useUser();
  const { contacts, deals, tasks, activities } = data;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  const openDeals = deals.filter((d) => !["won", "lost"].includes(d.stage));
  const wonDeals = deals.filter((d) => d.stage === "won");
  const pipelineValue = openDeals.reduce((sum, d) => sum + d.value, 0);

  const wonThisMonth = wonDeals.filter((d) => {
    const when = new Date(d.closeDate ?? d.createdAt);
    return when >= monthStart;
  });
  const wonPrevMonth = wonDeals.filter((d) => {
    const when = new Date(d.closeDate ?? d.createdAt);
    return when >= prevMonthStart && when <= prevMonthEnd;
  });

  const revenueThisMonth = wonThisMonth.reduce((sum, d) => sum + d.value, 0);
  const revenuePrevMonth = wonPrevMonth.reduce((sum, d) => sum + d.value, 0);
  const revenueTrend = pctDelta(revenueThisMonth, revenuePrevMonth);

  const conversionRate = deals.length > 0 ? Math.round((wonDeals.length / deals.length) * 100) : 0;
  const hotLeads = contacts.filter((c) => c.status === "lead" || c.status === "prospect").length;
  const overdueTasks = tasks.filter((t) => t.dueDate && new Date(t.dueDate) < now).length;
  const leadsNeedingFollowUp = contacts.filter((c) => {
    if (c.status === "customer") return false;
    const latest = activities.find((a) => a.contact && `${a.contact.firstName} ${a.contact.lastName ?? ""}`.trim().toLowerCase() === `${c.firstName} ${c.lastName ?? ""}`.trim().toLowerCase());
    if (!latest) return true;
    const ageDays = daysBetween(latest.createdAt, now.toISOString());
    return ageDays !== null && ageDays >= 7;
  }).length;

  const closingSoon = openDeals.filter((d) => {
    if (!d.closeDate) return false;
    const close = new Date(d.closeDate);
    const diffDays = Math.ceil((close.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  }).length;

  const avgDealTime = (() => {
    const durations = wonDeals
      .map((d) => (d.closeDate ? daysBetween(d.createdAt, d.closeDate) : null))
      .filter((v): v is number => typeof v === "number");
    if (durations.length === 0) return 0;
    return Math.round(durations.reduce((sum, v) => sum + v, 0) / durations.length);
  })();

  const dealsByStage = PIPELINE_ORDER.map((stage) => {
    const stageDeals = deals.filter((d) => d.stage === stage);
    return {
      stage,
      count: stageDeals.length,
      value: stageDeals.reduce((sum, d) => sum + d.value, 0),
    };
  });

  const revenueByDay: Record<string, number> = {};
  wonDeals.forEach((deal) => {
    const key = new Date(deal.closeDate ?? deal.createdAt).toISOString().slice(0, 10);
    revenueByDay[key] = (revenueByDay[key] ?? 0) + deal.value;
  });
  const revenueSpark = buildSparklinePoints(7, revenueByDay);

  const focusItems = [
    {
      tone: "text-red-600 bg-red-50 border-red-100",
      icon: <AlertTriangle className="h-4 w-4" />,
      label: `${overdueTasks} overdue task${overdueTasks === 1 ? "" : "s"}`,
      href: "/crm/tasks",
      action: overdueTasks > 0 ? "Review overdue" : "Add first task",
    },
    {
      tone: "text-amber-700 bg-amber-50 border-amber-100",
      icon: <Flame className="h-4 w-4" />,
      label: `${leadsNeedingFollowUp} lead${leadsNeedingFollowUp === 1 ? "" : "s"} need follow-up`,
      href: "/crm/contacts",
      action: leadsNeedingFollowUp > 0 ? "Follow up now" : "Add first lead",
    },
    {
      tone: "text-brand-green bg-brand-green/10 border-brand-green/20",
      icon: <Target className="h-4 w-4" />,
      label: `${closingSoon} deal${closingSoon === 1 ? "" : "s"} close soon`,
      href: "/crm/pipeline",
      action: closingSoon > 0 ? "Check closing deals" : "Create deal",
    },
  ];

  const insightItems = [
    overdueTasks > 0
      ? `You have ${overdueTasks} overdue task${overdueTasks === 1 ? "" : "s"}. Clearing these first improves response time.`
      : "No overdue tasks right now. Keep momentum by scheduling your next follow-ups.",
    leadsNeedingFollowUp > 0
      ? `${leadsNeedingFollowUp} lead${leadsNeedingFollowUp === 1 ? "" : "s"} have been quiet for 7+ days. A quick check-in can recover pipeline value.`
      : "Your lead follow-up health looks good this week.",
    conversionRate > 0
      ? `Current conversion rate is ${conversionRate}%. Focus on moving qualified leads into proposal this week.`
      : "No conversion data yet. Add your first deal and start tracking win rate.",
  ];

  const displayName = user?.firstName || user?.fullName || "there";

  const kpis = [
    {
      label: "Revenue This Month",
      value: formatCurrency(revenueThisMonth),
      sub: `${revenueTrend >= 0 ? "+" : ""}${revenueTrend}% vs last month`,
      helper: revenueThisMonth > 0 ? "Deals won this month" : "Close your first deal to start trend tracking",
      href: "/crm/pipeline",
      icon: <TrendingUp className="h-5 w-5" />,
      bg: "bg-brand-green/10",
      color: "text-brand-green",
      spark: revenueSpark,
    },
    {
      label: "Conversion Rate",
      value: `${conversionRate}%`,
      sub: `${wonDeals.length} won of ${deals.length} deals`,
      helper: deals.length > 0 ? "Deal quality indicator" : "Add your first deal to measure conversion",
      href: "/crm/pipeline",
      icon: <BarChart3 className="h-5 w-5" />,
      bg: "bg-brand-navy/5",
      color: "text-brand-navy",
      spark: buildSparklinePoints(7, {}),
    },
    {
      label: "Hot Leads",
      value: String(hotLeads),
      sub: `${leadsNeedingFollowUp} need follow-up`,
      helper: hotLeads > 0 ? "Prioritize warm prospects" : "Add your first contact to start your pipeline",
      href: "/crm/contacts",
      icon: <Flame className="h-5 w-5" />,
      bg: "bg-brand-navy/5",
      color: "text-brand-navy",
      spark: buildSparklinePoints(7, {}),
    },
    {
      label: "Average Deal Time",
      value: avgDealTime > 0 ? `${avgDealTime} days` : "—",
      sub: `${overdueTasks} follow-ups overdue`,
      helper: avgDealTime > 0 ? "From creation to close" : "Close your first deal to benchmark cycle time",
      href: "/crm/tasks",
      icon: <Clock className="h-5 w-5" />,
      bg: "bg-gray-100",
      color: "text-brand-navy",
      spark: buildSparklinePoints(7, {}),
    },
    {
      label: "Pipeline Value",
      value: formatCurrency(pipelineValue),
      sub: `${openDeals.length} open deals`,
      helper: openDeals.length > 0 ? "Active opportunities in flight" : "Create your first opportunity",
      href: "/crm/pipeline",
      icon: <Activity className="h-5 w-5" />,
      bg: "bg-gray-100",
      color: "text-brand-navy",
      spark: buildSparklinePoints(7, {}),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-navy">Welcome back, {displayName}</h1>
          <p className="text-sm text-gray-400 mt-1">Here is what needs your attention today.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" className="gap-1.5">
            <Link href="/crm/contacts"><Plus className="h-3.5 w-3.5" />Add Contact</Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="gap-1.5">
            <Link href="/crm/pipeline"><Plus className="h-3.5 w-3.5" />New Deal</Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="gap-1.5">
            <Link href="/crm/tasks"><Plus className="h-3.5 w-3.5" />Add Task</Link>
          </Button>
        </div>
      </div>

      <Card className="border-brand-green/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-brand-navy text-base">Your Focus Today</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {focusItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`rounded-xl border p-3 transition-colors hover:border-gray-300 ${item.tone}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  {item.icon}
                  {item.label}
                </div>
                <ArrowUpRight className="h-4 w-4" />
              </div>
              <p className="mt-2 text-xs">{item.action}</p>
            </Link>
          ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {kpis.map((kpi) => (
          <Link key={kpi.label} href={kpi.href}>
            <Card className="border-gray-200 hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${kpi.bg} ${kpi.color}`}>
                    {kpi.icon}
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-gray-300" />
                </div>
                <div className="text-lg font-extrabold text-brand-navy leading-tight">{kpi.value}</div>
                <div className="text-xs font-medium text-gray-500 mt-0.5">{kpi.label}</div>
                <div className="text-xs text-gray-400 mt-1">{kpi.sub}</div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-gray-400">{kpi.helper}</span>
                  <MiniSpark points={kpi.spark} />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-brand-navy text-base">Smart Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {insightItems.map((insight, index) => (
            <div key={insight} className="flex items-start gap-2 text-sm text-gray-600">
              <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-navy/5 text-[11px] font-semibold text-brand-navy">
                {index + 1}
              </span>
              <p>{insight}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-brand-navy text-base">Pipeline Snapshot</CardTitle>
              <Link href="/crm/pipeline" className="text-xs text-brand-green hover:underline">View full pipeline</Link>
            </CardHeader>
            <CardContent>
              {/* Visual stage funnel */}
              <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
                {dealsByStage.map((stage, idx) => {
                  const maxCount = Math.max(...dealsByStage.map((s) => s.count), 1);
                  const fillPct = stage.count > 0 ? Math.max(20, Math.round((stage.count / maxCount) * 100)) : 8;
                  const stageColors: Record<string, string> = {
                    lead: "bg-gray-200",
                    qualified: "bg-brand-green/30",
                    proposal: "bg-brand-green/50",
                    negotiation: "bg-brand-green/70",
                    won: "bg-brand-green",
                  };
                  return (
                    <div key={stage.stage} className="flex-1 min-w-[56px]">
                      <div className="flex flex-col items-center gap-1.5">
                        {/* Bar */}
                        <div className="w-full h-16 rounded-lg bg-gray-50 border border-gray-100 flex flex-col justify-end overflow-hidden">
                          <div
                            className={`w-full rounded-b-lg transition-all ${stageColors[stage.stage] ?? "bg-gray-200"}`}
                            style={{ height: `${fillPct}%` }}
                          />
                        </div>
                        {/* Label */}
                        <div className="text-center">
                          <div className="text-[11px] font-semibold text-brand-navy capitalize">{stage.stage}</div>
                          <div className="text-[10px] text-gray-400">{stage.count} · {formatCurrency(stage.value)}</div>
                        </div>
                      </div>
                      {idx < dealsByStage.length - 1 && (
                        <div className="hidden" />
                      )}
                    </div>
                  );
                })}
              </div>
              {!dealsByStage.some((s) => s.count > 0) && (
                <div className="text-center py-4 border-t border-gray-100">
                  <p className="text-sm text-gray-400">No pipeline data yet.</p>
                  <Link href="/crm/pipeline" className="text-xs text-brand-green hover:underline mt-1 inline-block">Create your first deal →</Link>
                </div>
              )}
              {/* Stage totals row */}
              {dealsByStage.some((s) => s.count > 0) && (
                <div className="mt-2 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <span>{openDeals.length} open deal{openDeals.length !== 1 ? "s" : ""}</span>
                  <span className="font-semibold text-brand-navy">{formatCurrency(pipelineValue)} total pipeline</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-brand-navy text-base">Pending Tasks</CardTitle>
            <Link href="/crm/tasks" className="text-xs text-brand-green hover:underline">View all</Link>
          </CardHeader>
          <CardContent>
            {tasks.length > 0 ? (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100">
                    <CheckSquare className="h-4 w-4 text-gray-300 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-brand-navy truncate">{task.title}</div>
                      {task.dueDate && (
                        <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3" />
                          {new Date(task.dueDate).toLocaleDateString("en-ZA")}
                        </div>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${PRIORITY_COLORS[task.priority] ?? "bg-gray-100 text-gray-500"}`}>
                      {task.priority}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckSquare className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No tasks yet</p>
                <Link href="/crm/tasks" className="text-xs text-brand-green hover:underline mt-1 inline-block">Add your first task</Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-brand-navy text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activities.length > 0 ? (
              <div className="space-y-3">
                {activities.slice(0, 8).map((act) => (
                  <div key={act.id} className="flex items-start gap-3 rounded-xl border border-gray-100 p-3">
                    <span className="leading-none mt-0.5">{ACTIVITY_ICONS[act.type] ?? <Pin className="h-4 w-4 text-brand-navy" />}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-brand-navy">{act.title}</div>
                      {act.body && <div className="text-xs text-gray-500 mt-1 line-clamp-2">{act.body}</div>}
                      <div className="text-xs text-gray-300 mt-1.5">
                        {new Date(act.createdAt).toLocaleString("en-ZA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Image
                  src="/assets/images/empty-activity.svg"
                  alt="No recent activity illustration"
                  width={320}
                  height={180}
                  className="mx-auto mb-3 h-auto w-full max-w-[320px]"
                />
                <p className="text-sm text-gray-400">No activity yet</p>
                <p className="text-xs text-gray-400 mt-1">Create a contact, then add a deal to start tracking progress.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-brand-navy text-base">Recent Contacts</CardTitle>
            <Link href="/crm/contacts" className="text-xs text-brand-green hover:underline">View all</Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {contacts.slice(0, 6).length > 0 ? contacts.slice(0, 6).map((c) => (
              <div key={c.id} className="flex items-center gap-3 rounded-xl border border-gray-100 p-3">
                <div className="w-9 h-9 rounded-full bg-brand-navy/5 flex items-center justify-center text-brand-navy font-bold text-sm flex-shrink-0">
                  {c.firstName[0]}{c.lastName?.[0] ?? ""}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-brand-navy truncate">
                    {c.firstName} {c.lastName ?? ""}
                  </div>
                  <div className="text-xs text-gray-400 truncate">{c.company ?? c.email ?? "—"}</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${c.status === "customer" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {c.status}
                </span>
              </div>
            )) : (
              <div className="text-center py-8">
                <Users className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No contacts yet</p>
                <Link href="/crm/contacts" className="text-xs text-brand-green hover:underline mt-1 inline-block">Add your first contact</Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
