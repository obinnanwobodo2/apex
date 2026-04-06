import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Globe, ArrowUpRight, RefreshCw, BarChart2, FolderKanban, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const STATUS_LABELS: Record<string, string> = {
  requested: "Requested",
  scoping: "Scoping",
  in_progress: "In Progress",
  review: "In Review",
  completed: "Live",
};

export default async function WebsitePage() {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  const projects = await prisma.project.findMany({
    where: { userId, type: "website" },
    orderBy: { createdAt: "desc" },
  });

  const activeProject = projects.find((p) => p.status === "completed" && p.websiteUrl) ?? projects[0] ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-brand-navy">My Website</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your website and request updates.</p>
      </div>

      {activeProject ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Status card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base text-brand-navy">Website Status</CardTitle>
                <Badge variant={activeProject.status === "completed" ? "default" : "secondary"}>
                  {STATUS_LABELS[activeProject.status] ?? activeProject.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Globe className="h-5 w-5 text-brand-green" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-brand-navy truncate">
                    {activeProject.websiteUrl ?? activeProject.title}
                  </p>
                  <p className="text-xs text-gray-400">
                    {activeProject.websiteUrl ? "Connected · SSL Active" : "In development"}
                  </p>
                </div>
                {activeProject.websiteUrl && (
                  <a href={activeProject.websiteUrl} target="_blank" rel="noopener noreferrer">
                    <ArrowUpRight className="h-4 w-4 text-gray-300 hover:text-brand-green transition-colors" />
                  </a>
                )}
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                  <span>Build progress</span>
                  <span className="font-medium">{activeProject.progress}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-brand-green rounded-full h-2 transition-all"
                    style={{ width: `${activeProject.progress}%` }}
                  />
                </div>
              </div>

              {activeProject.websiteUrl && (
                <Button className="w-full" variant="outline" size="sm" asChild>
                  <a href={activeProject.websiteUrl} target="_blank" rel="noopener noreferrer">
                    <ArrowUpRight className="h-4 w-4 mr-2" />Visit Website
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Update request */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-brand-navy">Request Update</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-500">
                Need changes to your website? Send us a support ticket and we&apos;ll handle it as part of your monthly plan.
              </p>
              <Button className="w-full" size="sm" asChild>
                <Link href="/dashboard/support">
                  <RefreshCw className="h-4 w-4 mr-2" />Submit Update Request
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Other projects */}
          {projects.length > 1 && (
            <Card className="md:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-brand-navy flex items-center gap-2">
                  <FolderKanban className="h-4 w-4 text-brand-green" />All Website Projects
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {projects.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                      <div>
                        <div className="text-sm font-semibold text-brand-navy">{p.title}</div>
                        <div className="text-xs text-gray-400">
                          {new Date(p.createdAt).toLocaleDateString("en-ZA")}
                          {p.websiteUrl && ` · ${p.websiteUrl}`}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500">{p.progress}%</span>
                        <Badge variant={p.status === "completed" ? "default" : "secondary"} className="text-xs">
                          {STATUS_LABELS[p.status] ?? p.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Performance placeholder */}
          <Card className="md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-brand-navy flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-brand-green" />Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-400 text-sm">
                Connect Google Analytics in the{" "}
                <Link href="/dashboard/analytics" className="text-brand-green hover:underline">Analytics tab</Link>{" "}
                to see traffic and performance data.
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <AlertCircle className="h-12 w-12 text-gray-200 mx-auto mb-3" />
            <h3 className="font-bold text-brand-navy mb-1">No website project yet</h3>
            <p className="text-sm text-gray-400 mb-5">
              Subscribe to a plan and we&apos;ll create your project immediately after payment.
            </p>
            <Button asChild>
              <Link href="/#packages">View Plans</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
