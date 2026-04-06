import Link from "next/link";
import { ArrowRight, LayoutDashboard, TrendingUp, CreditCard, Users, CheckSquare, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";

const PREVIEW_TABS = [
  { icon: <LayoutDashboard className="h-3.5 w-3.5" />, label: "Overview" },
  { icon: <TrendingUp className="h-3.5 w-3.5" />, label: "Projects" },
  { icon: <CreditCard className="h-3.5 w-3.5" />, label: "Billing" },
  { icon: <Users className="h-3.5 w-3.5" />, label: "CRM" },
];

export default function DashboardPreview() {
  const nextBillDate = new Date();
  nextBillDate.setMonth(nextBillDate.getMonth() + 1);
  const stats = [
    { label: "Active Projects", value: "2", sub: "1 in review", color: "text-brand-green" },
    {
      label: "Subscription",
      value: "Growth",
      sub: `Next bill ${nextBillDate.toLocaleDateString("en-ZA", { month: "short", day: "numeric", year: "numeric" })}`,
      color: "text-brand-navy",
    },
    { label: "Pipeline Value", value: "R48,500", sub: "6 open deals", color: "text-brand-navy" },
    { label: "Tasks Due", value: "4", sub: "1 overdue", color: "text-brand-navy" },
  ];

  return (
    <section className="py-24 px-4 bg-brand-navy overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left text */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-green/20 text-brand-green text-sm font-medium mb-5">
              <Bot className="h-4 w-4" />
              AI-powered client portal
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-5 leading-tight">
              Everything in one dashboard.
              <br />
              <span className="text-brand-green">Nothing slips through.</span>
            </h2>
            <p className="text-gray-300 mb-8 leading-relaxed">
              Track your website projects, manage invoices, run your CRM, and chat with an AI assistant —
              all from a single clean portal built for South African businesses.
            </p>

            <div className="space-y-3 mb-8">
              {[
                "Real-time project progress & milestones",
                "Subscription management & invoice history",
                "Built-in CRM with pipeline & AI insights",
                "WhatsApp, Gmail & Calendar integrations",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-gray-200 text-sm">
                  <div className="w-5 h-5 rounded-full bg-brand-green/20 flex items-center justify-center flex-shrink-0">
                    <CheckSquare className="h-3 w-3 text-brand-green" />
                  </div>
                  {item}
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button size="lg" asChild>
                <Link href="/register">
                  Get Access <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
          </div>

          {/* Right: Dashboard mockup */}
          <div className="relative">
            {/* Glow */}
            <div className="absolute inset-0 bg-brand-green/5 rounded-3xl blur-3xl" />

            <div className="relative bg-white/5 backdrop-blur border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              {/* Browser bar */}
              <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border-b border-white/10">
                <div className="w-3 h-3 rounded-full bg-white/30" />
                <div className="w-3 h-3 rounded-full bg-white/30" />
                <div className="w-3 h-3 rounded-full bg-brand-green/70" />
                <div className="flex-1 mx-4 bg-white/10 rounded-full px-3 py-1 text-xs text-white/40">
                  app.apexvisual.co.za/dashboard
                </div>
              </div>

              <div className="flex h-[340px]">
                {/* Sidebar */}
                <div className="w-40 bg-white/5 border-r border-white/10 p-3 flex flex-col gap-1">
                  <div className="px-2 py-1 mb-1">
                    <div className="text-[10px] text-white/30 uppercase tracking-wider font-semibold">Menu</div>
                  </div>
                  {PREVIEW_TABS.map((tab, i) => (
                    <div key={tab.label} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs ${
                      i === 0 ? "bg-brand-green text-white" : "text-white/50"
                    }`}>
                      {tab.icon}
                      {tab.label}
                    </div>
                  ))}
                </div>

                {/* Main content */}
                <div className="flex-1 p-4 overflow-hidden">
                  <div className="text-white/60 text-xs font-medium mb-3">Welcome back</div>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {stats.map((s) => (
                      <div key={s.label} className="bg-white/5 rounded-xl p-2.5 border border-white/5">
                        <div className={`text-lg font-extrabold ${s.color}`}>{s.value}</div>
                        <div className="text-[10px] text-white/50 font-medium">{s.label}</div>
                        <div className="text-[10px] text-white/30">{s.sub}</div>
                      </div>
                    ))}
                  </div>

                  {/* Mini project list */}
                  <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                    <div className="text-[10px] text-white/40 font-semibold uppercase mb-2">Active Projects</div>
                    <div className="space-y-2">
                      {[
                        { name: "Website Redesign", progress: 75, status: "In Progress" },
                        { name: "SEO Optimisation", progress: 40, status: "In Review" },
                      ].map((p) => (
                        <div key={p.name} className="flex items-center gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px] text-white/60 font-medium truncate">{p.name}</div>
                            <div className="w-full bg-white/10 rounded-full h-1 mt-1">
                              <div className="bg-brand-green rounded-full h-1" style={{ width: `${p.progress}%` }} />
                            </div>
                          </div>
                          <div className="text-[9px] text-brand-green/70 flex-shrink-0">{p.status}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
