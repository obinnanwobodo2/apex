import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Users, CreditCard, TrendingUp, Activity, ArrowUpRight, Users2, FolderKanban, Banknote, LayoutDashboard, LifeBuoy, Bot, FileImage } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

export default async function AdminOverviewPage() {
  const { userId } = await auth();
  if (!userId) redirect("/login?redirect_url=/admin");

  const [totalProfiles, totalSubs, activeSubs, totalProjects] = await Promise.all([
    prisma.profile.count(),
    prisma.subscription.count(),
    prisma.subscription.count({ where: { status: "active", paid: true } }),
    prisma.project.count(),
  ]);

  const revenue = await prisma.subscription.aggregate({
    _sum: { amountPaid: true },
    where: { paid: true },
  });

  const mrr = await prisma.subscription.aggregate({
    _sum: { amount: true },
    where: { status: "active", paid: true },
  });

  const recentSubs = await prisma.subscription.findMany({
    take: 8,
    orderBy: { createdAt: "desc" },
    include: { profile: { select: { fullName: true } } },
  });

  const stats = [
    { label: "Total Clients", value: String(totalProfiles), sub: "Registered users", icon: <Users className="h-5 w-5" />, color: "text-brand-green bg-brand-green/10", href: "/admin/clients" },
    { label: "Active Subscriptions", value: String(activeSubs), sub: `${totalSubs} total`, icon: <CreditCard className="h-5 w-5" />, color: "text-brand-navy bg-brand-navy/5", href: "/admin/billing" },
    { label: "MRR", value: formatCurrency(mrr._sum.amount ?? 0), sub: "Monthly recurring", icon: <TrendingUp className="h-5 w-5" />, color: "text-brand-navy bg-gray-100", href: "/admin/billing" },
    { label: "Total Revenue", value: formatCurrency(revenue._sum.amountPaid ?? 0), sub: "All time", icon: <Activity className="h-5 w-5" />, color: "text-brand-navy bg-gray-100", href: "/admin/billing" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-brand-navy">Admin Overview</h1>
        <p className="text-sm text-gray-400 mt-0.5">Business metrics and client activity</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>{s.icon}</div>
                  <ArrowUpRight className="h-4 w-4 text-gray-300" />
                </div>
                <div className="text-2xl font-extrabold text-brand-navy">{s.value}</div>
                <div className="text-sm font-medium text-gray-500 mt-0.5">{s.label}</div>
                <div className="text-xs text-gray-400 mt-1">{s.sub}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent subscriptions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-brand-navy text-base">Recent Subscriptions</CardTitle>
            <Link href="/admin/billing" className="text-xs text-brand-green hover:underline">View all</Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentSubs.length > 0 ? recentSubs.map((s) => (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100">
                  <div className="w-9 h-9 rounded-full bg-brand-navy/5 flex items-center justify-center text-brand-navy font-bold text-sm flex-shrink-0">
                    {(s.businessName ?? s.profile?.fullName ?? "?")[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-brand-navy truncate">{s.businessName ?? s.profile?.fullName ?? "Unknown"}</div>
                    <div className="text-xs text-gray-400 capitalize">{s.package} · {s.createdAt.toLocaleDateString("en-ZA")}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-bold text-brand-navy">{formatCurrency(s.amount)}</div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      s.status === "active" ? "bg-brand-green/10 text-brand-navy" : s.status === "pending" ? "bg-brand-navy/5 text-brand-navy" : "bg-gray-100 text-gray-500"
                    }`}>{s.status}</span>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-gray-400 text-center py-6">No subscriptions yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-brand-navy text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {[
                { href: "/admin/clients", label: "View All Clients", icon: <Users2 className="h-5 w-5 text-brand-navy" /> },
                { href: "/admin/projects", label: "Manage Projects", icon: <FolderKanban className="h-5 w-5 text-brand-navy" /> },
                { href: "/admin/files", label: "Client Files", icon: <FileImage className="h-5 w-5 text-brand-navy" /> },
                { href: "/admin/billing", label: "Revenue Report", icon: <Banknote className="h-5 w-5 text-brand-navy" /> },
                { href: "/admin/support", label: "Support Inbox", icon: <LifeBuoy className="h-5 w-5 text-brand-navy" /> },
                { href: "/admin/ai", label: "AI Agents", icon: <Bot className="h-5 w-5 text-brand-navy" /> },
                { href: "/dashboard", label: "Client Portal", icon: <LayoutDashboard className="h-5 w-5 text-brand-navy" /> },
              ].map((a) => (
                <Link key={a.label} href={a.href}
                  className="bg-gray-50 hover:bg-gray-100 rounded-xl p-4 transition-colors">
                  <div className="mb-2">{a.icon}</div>
                  <div className="text-sm font-semibold text-brand-navy">{a.label}</div>
                </Link>
              ))}
            </div>

            <div className="mt-4 bg-brand-navy rounded-xl p-4 text-white">
              <div className="text-xs text-gray-400 mb-1">Total Projects</div>
              <div className="text-2xl font-extrabold text-brand-green">{totalProjects}</div>
              <Link href="/admin/projects" className="text-xs text-gray-300 hover:text-white mt-1 inline-block">
                Manage all projects →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
