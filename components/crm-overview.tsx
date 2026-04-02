"use client";

import Link from "next/link";
import { Users, TrendingUp, CheckSquare, Activity, ArrowUpRight, Clock, PhoneCall, Mail, CalendarDays, FileText, MessageSquare, Pin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface CrmData {
  contacts: Array<{ id: string; firstName: string; lastName: string | null; company: string | null; status: string; email: string | null; phone: string | null; createdAt: string }>;
  deals: Array<{ id: string; title: string; value: number; stage: string; contact: { firstName: string; lastName: string | null } | null; createdAt: string; closeDate: string | null }>;
  tasks: Array<{ id: string; title: string; priority: string; status: string; dueDate: string | null; createdAt: string }>;
  activities: Array<{ id: string; type: string; title: string; body: string | null; contact: { firstName: string; lastName: string | null } | null; createdAt: string }>;
}

const STAGE_COLORS: Record<string, string> = {
  lead: "bg-gray-100 text-gray-600",
  qualified: "bg-brand-green/10 text-brand-navy",
  proposal: "bg-brand-navy/5 text-brand-navy",
  negotiation: "bg-brand-navy/5 text-brand-navy",
  won: "bg-brand-green/10 text-brand-navy",
  lost: "bg-gray-200 text-gray-700",
};

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

export default function CrmOverview({ data }: { data: CrmData }) {
  const { contacts, deals, tasks, activities } = data;

  const openDeals = deals.filter((d) => !["won", "lost"].includes(d.stage));
  const pipelineValue = openDeals.reduce((sum, d) => sum + d.value, 0);
  const wonDeals = deals.filter((d) => d.stage === "won");
  const wonValue = wonDeals.reduce((sum, d) => sum + d.value, 0);

  const stats = [
    {
      label: "Total Contacts",
      value: String(contacts.length),
      sub: `${contacts.filter((c) => c.status === "customer").length} customers`,
      icon: <Users className="h-5 w-5" />,
      color: "text-brand-green",
      bg: "bg-brand-green/10",
      href: "/crm/contacts",
    },
    {
      label: "Open Deals",
      value: String(openDeals.length),
      sub: `${formatCurrency(pipelineValue)} pipeline`,
      icon: <TrendingUp className="h-5 w-5" />,
      color: "text-brand-navy",
      bg: "bg-brand-navy/5",
      href: "/crm/pipeline",
    },
    {
      label: "Tasks Due",
      value: String(tasks.filter((t) => t.dueDate && new Date(t.dueDate) <= new Date()).length),
      sub: `${tasks.length} total open`,
      icon: <CheckSquare className="h-5 w-5" />,
      color: "text-brand-navy",
      bg: "bg-gray-100",
      href: "/crm/tasks",
    },
    {
      label: "Won This Month",
      value: formatCurrency(wonValue),
      sub: `${wonDeals.length} deals closed`,
      icon: <Activity className="h-5 w-5" />,
      color: "text-brand-navy",
      bg: "bg-gray-100",
      href: "/crm/pipeline",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
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
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent contacts */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-brand-navy text-base">Recent Contacts</CardTitle>
              <Link href="/crm/contacts" className="text-xs text-brand-green hover:underline">View all</Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {contacts.slice(0, 5).length > 0 ? contacts.slice(0, 5).map((c) => (
                <div key={c.id} className="flex items-center gap-3">
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
                <p className="text-sm text-gray-400 text-center py-6">No contacts yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Open deals */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-brand-navy text-base">Open Deals</CardTitle>
              <Link href="/crm/pipeline" className="text-xs text-brand-green hover:underline">View pipeline</Link>
            </CardHeader>
            <CardContent>
              {openDeals.slice(0, 5).length > 0 ? (
                <div className="space-y-3">
                  {openDeals.slice(0, 5).map((deal) => (
                    <div key={deal.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-brand-navy truncate">{deal.title}</div>
                        {deal.contact && (
                          <div className="text-xs text-gray-400">{deal.contact.firstName} {deal.contact.lastName ?? ""}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <span className="text-sm font-bold text-brand-navy">{formatCurrency(deal.value)}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STAGE_COLORS[deal.stage] ?? "bg-gray-100 text-gray-500"}`}>
                          {deal.stage}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No open deals</p>
                  <Link href="/crm/pipeline" className="text-xs text-brand-green hover:underline mt-1 inline-block">Add a deal</Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks */}
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
                <p className="text-sm text-gray-400">All clear! No pending tasks</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity feed */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-brand-navy text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activities.length > 0 ? (
              <div className="space-y-3">
                {activities.slice(0, 6).map((act) => (
                  <div key={act.id} className="flex items-start gap-3">
                    <span className="leading-none mt-0.5">{ACTIVITY_ICONS[act.type] ?? <Pin className="h-4 w-4 text-brand-navy" />}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-brand-navy truncate">{act.title}</div>
                      {act.contact && (
                        <div className="text-xs text-gray-400">{act.contact.firstName} {act.contact.lastName ?? ""}</div>
                      )}
                      <div className="text-xs text-gray-300 mt-0.5">
                        {new Date(act.createdAt).toLocaleDateString("en-ZA")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No activity yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
