import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BarChart3, Users, TrendingUp, Eye, MousePointerClick, Globe, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AnalyticsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  const [subscriptions, projects] = await Promise.all([
    prisma.subscription.findMany({ where: { userId, status: "active" } }),
    prisma.project.findMany({ where: { userId } }),
  ]);

  const activeSubs = subscriptions.filter((s) => s.paid);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-brand-navy">Analytics</h1>
        <p className="text-sm text-gray-400 mt-0.5">Website and account performance at a glance</p>
      </div>

      {/* Connect notice */}
      <div className="bg-brand-green/5 border border-brand-green/20 rounded-2xl p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-brand-green/10 flex items-center justify-center flex-shrink-0">
          <BarChart3 className="h-5 w-5 text-brand-green" />
        </div>
        <div>
          <div className="font-semibold text-brand-navy">Connect Google Analytics</div>
          <div className="text-sm text-gray-500 mt-0.5">
            Link your Google Analytics account to see live traffic, bounce rate, conversions and more directly here.
          </div>
          <button className="mt-3 text-sm font-semibold text-brand-green hover:underline flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5" />Connect Google Analytics
          </button>
        </div>
      </div>

      {/* Account stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Active Subscriptions",
            value: String(activeSubs.length),
            sub: activeSubs.length > 0 ? "Plans currently active" : "No active subscription yet.",
            icon: <Zap className="h-5 w-5" />,
            color: "text-brand-green bg-brand-green/10",
          },
          {
            label: "Total Projects",
            value: String(projects.length),
            sub: projects.length > 0 ? "Tracked projects" : "No projects yet. Submit your first request.",
            icon: <Globe className="h-5 w-5" />,
            color: "text-brand-navy bg-brand-navy/5",
          },
          {
            label: "Monthly Spend",
            value: `R${activeSubs.reduce((s, sub) => s + sub.amount, 0).toLocaleString()}`,
            sub: activeSubs.length > 0 ? "Current active plans" : "No monthly spend yet.",
            icon: <TrendingUp className="h-5 w-5" />,
            color: "text-brand-navy bg-gray-100",
          },
          {
            label: "Services Active",
            value: String(new Set(activeSubs.map((s) => s.package)).size),
            sub: activeSubs.length > 0 ? "Unique services in use" : "No active services yet.",
            icon: <Users className="h-5 w-5" />,
            color: "text-brand-navy bg-gray-100",
          },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
                {stat.icon}
              </div>
              <div className="text-2xl font-extrabold text-brand-navy">{stat.value}</div>
              <div className="text-sm text-gray-500 mt-0.5">{stat.label}</div>
              <div className="text-xs text-gray-400 mt-1">{stat.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Placeholder analytics widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-brand-navy text-base flex items-center gap-2">
              <Eye className="h-4 w-4 text-brand-green" />Website Traffic
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-40 bg-gray-50 rounded-xl flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Connect Google Analytics to see traffic data</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-brand-navy text-base flex items-center gap-2">
              <MousePointerClick className="h-4 w-4 text-brand-green" />Conversions & Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-40 bg-gray-50 rounded-xl flex items-center justify-center">
              <div className="text-center">
                <TrendingUp className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Form submissions and lead tracking coming soon</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top pages placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-brand-navy text-base">Top Pages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {["/", "/services", "/contact", "/about", "/portfolio"].map((page, i) => (
              <div key={page} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-4">{i + 1}</span>
                  <span className="text-sm font-medium text-brand-navy">{page}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span>— visits</span>
                  <div className="w-20 bg-gray-200 rounded-full h-1.5">
                    <div className="bg-brand-green rounded-full h-1.5" style={{ width: `${(5 - i) * 20}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 text-center mt-4">Live data available after connecting Google Analytics</p>
        </CardContent>
      </Card>
    </div>
  );
}
