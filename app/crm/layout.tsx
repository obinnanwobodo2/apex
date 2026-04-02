import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CrmShell from "@/components/crm-shell";
import Link from "next/link";
import { Lock, ArrowRight } from "lucide-react";
import { CRM_PACKAGES, formatCurrency } from "@/lib/utils";

export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  // Check for active CRM subscription
  const crmSub = await prisma.subscription.findFirst({
    where: {
      userId,
      paid: true,
      status: "active",
      package: { in: ["crm-starter", "crm-pro"] },
    },
  });

  if (!crmSub) {
    const crmPlans = Object.values(CRM_PACKAGES);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-3xl w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-brand-green/10 flex items-center justify-center mx-auto mb-5">
              <Lock className="h-8 w-8 text-brand-green" />
            </div>
            <h1 className="text-2xl font-extrabold text-brand-navy mb-3">CRM Access Requires a Plan</h1>
            <p className="text-gray-500 leading-relaxed max-w-2xl mx-auto">
              Choose a CRM plan below. Once selected, you&apos;ll be taken to secure checkout to make payment and unlock CRM immediately.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {crmPlans.map((plan) => (
              <div key={plan.id} className={`bg-white rounded-2xl border p-5 shadow-sm ${plan.popular ? "border-brand-green/40 ring-2 ring-brand-green/15" : "border-gray-100"}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-brand-navy">{plan.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{plan.tagline}</p>
                  </div>
                  {plan.popular && (
                    <span className="text-[10px] font-bold text-brand-green uppercase tracking-widest">Popular</span>
                  )}
                </div>
                <div className="mt-4 text-2xl font-extrabold text-brand-navy">
                  {formatCurrency(plan.price)}<span className="text-sm font-normal text-gray-400">/month</span>
                </div>
                <ul className="mt-4 space-y-1.5">
                  {plan.features.slice(0, 4).map((feature) => (
                    <li key={feature} className="text-xs text-gray-600">• {feature}</li>
                  ))}
                </ul>
                <Link
                  href={`/checkout?package=${plan.id}`}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#1b2340] to-[#2dc5a2] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  Choose & Pay
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>

          <div className="text-center mt-6">
            <Link href="/dashboard" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <CrmShell>{children}</CrmShell>;
}
