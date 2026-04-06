import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Users, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export default async function AdminClientsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/login?redirect_url=/admin/clients");

  const clients = await prisma.profile.findMany({
    include: {
      subscriptions: { where: { paid: true } },
      projects: true,
      supportTickets: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-navy">Clients</h1>
          <p className="text-sm text-gray-400 mt-0.5">{clients.length} registered users</p>
        </div>
      </div>

      {clients.length > 0 ? (
        <div className="space-y-3">
          {clients.map((c) => {
            const activeSub = c.subscriptions.find((s) => s.status === "active");
            const totalSpend = c.subscriptions.reduce((sum, s) => sum + s.amountPaid, 0);
            return (
              <Card key={c.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="w-10 h-10 rounded-full bg-brand-navy flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {(c.fullName ?? c.id)[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-brand-navy">{c.fullName ?? "—"}</div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {c.phone && (
                          <span className="text-xs text-gray-400 flex items-center gap-1"><Phone className="h-3 w-3" />{c.phone}</span>
                        )}
                        <span className="text-xs text-gray-400">ID: {c.id.slice(0, 8)}...</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-center">
                      <div>
                        <div className="text-sm font-bold text-brand-navy">{c.subscriptions.length}</div>
                        <div className="text-xs text-gray-400">Subscriptions</div>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-brand-navy">{c.projects.length}</div>
                        <div className="text-xs text-gray-400">Projects</div>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-brand-navy">{c.supportTickets.length}</div>
                        <div className="text-xs text-gray-400">Tickets</div>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-brand-green">{formatCurrency(totalSpend)}</div>
                        <div className="text-xs text-gray-400">Total Spend</div>
                      </div>
                      {activeSub && (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-green-100 text-green-700 font-medium capitalize">
                          {activeSub.package}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <Users className="h-12 w-12 text-gray-200 mx-auto mb-3" />
            <h3 className="font-bold text-brand-navy mb-1">No clients yet</h3>
            <p className="text-sm text-gray-400">Clients will appear here once they register</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
