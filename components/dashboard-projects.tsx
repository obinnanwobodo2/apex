"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Plus, Clock, CheckCircle2, Eye, AlertCircle, FolderOpen, ChevronRight, Globe, ShoppingCart, RefreshCw, Zap, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getPusherClient } from "@/lib/pusher-client";
import { getClientChannelName } from "@/lib/realtime";
import { PACKAGES } from "@/lib/utils";

interface Project {
  id: string;
  title: string;
  type: string;
  status: string;
  progress: number;
  description: string | null;
  notes: string | null;
  websiteUrl: string | null;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  requested: { label: "Under Review", color: "bg-amber-50 text-amber-700 border border-amber-200", icon: <Clock className="h-3 w-3" /> },
  scoping: { label: "Scoping", color: "bg-blue-50 text-blue-700 border border-blue-200", icon: <Eye className="h-3 w-3" /> },
  in_progress: { label: "In Progress", color: "bg-purple-50 text-purple-700 border border-purple-200", icon: <AlertCircle className="h-3 w-3" /> },
  review: { label: "In Review", color: "bg-brand-green/10 text-brand-navy border border-brand-green/30", icon: <Eye className="h-3 w-3" /> },
  completed: { label: "Completed", color: "bg-green-50 text-green-700 border border-green-200", icon: <CheckCircle2 className="h-3 w-3" /> },
};

const PIPELINE_STAGES = ["Under Review", "Scoping", "In Progress", "In Review", "Completed"];

export default function ProjectsClient({ initialProjects }: { initialProjects: Project[] }) {
  const { userId } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>(initialProjects);

  useEffect(() => { setProjects(initialProjects); }, [initialProjects]);

  useEffect(() => {
    if (!userId) return;
    const pusher = getPusherClient();
    if (!pusher) return;
    const channel = pusher.subscribe(getClientChannelName(userId));
    const onNotification = async (payload: { type?: string }) => {
      if (payload?.type !== "project_update") return;
      const res = await fetch("/api/projects", { cache: "no-store" });
      const data = await res.json().catch(() => []);
      if (!res.ok) return;
      setProjects(Array.isArray(data) ? data : []);
    };
    channel.bind("new-notification", onNotification);
    return () => {
      channel.unbind("new-notification", onNotification);
      pusher.unsubscribe(getClientChannelName(userId));
    };
  }, [userId]);

  const activeProject = projects.find((p) => p.status !== "completed") ?? projects[0] ?? null;
  const currentStageLabel = activeProject ? (STATUS_CONFIG[activeProject.status]?.label ?? "Under Review") : null;
  const currentStageIdx = currentStageLabel ? PIPELINE_STAGES.indexOf(currentStageLabel) : -1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-navy">My Project</h1>
          <p className="text-sm text-gray-400 mt-0.5">{projects.length} project{projects.length !== 1 ? "s" : ""} on your account</p>
        </div>
        {projects.length === 0 && (
          <Button onClick={() => router.push("/dashboard/onboarding")} className="w-full sm:w-auto"
            style={{ background: "linear-gradient(135deg,#1b2340,#2dc5a2)" }}>
            <Plus className="h-4 w-4 mr-2" />Start a Project
          </Button>
        )}
      </div>

      {projects.length === 0 ? (
        /* ── No projects yet: show plan picker ─────────────────────── */
        <div className="space-y-5">
          <div className="rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center bg-white">
            <FolderOpen className="h-12 w-12 text-gray-200 mx-auto mb-3" />
            <h3 className="font-bold text-brand-navy mb-1">No project yet</h3>
            <p className="text-sm text-gray-400 mb-6 max-w-xs mx-auto">Choose a plan below, answer a few quick questions, and we&apos;ll start building your website.</p>
          </div>

          {/* Retainer plans */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <RefreshCw className="h-4 w-4 text-brand-green" />
              <span className="font-bold text-brand-navy">Monthly Retainer Plans</span>
              <span className="text-xs text-brand-green bg-brand-green/10 px-2 py-0.5 rounded-full font-semibold">Recommended</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {Object.values(PACKAGES).map((pkg) => (
                <button key={pkg.id} onClick={() => router.push(`/dashboard/onboarding`)}
                  className={`text-left rounded-2xl border-2 p-5 bg-white hover:shadow-md transition-all group ${
                    pkg.popular ? "border-brand-green/50" : "border-gray-200 hover:border-brand-green/30"
                  }`}>
                  {pkg.popular && (
                    <span className="text-[10px] font-bold text-brand-green uppercase tracking-wider">Most Popular</span>
                  )}
                  <div className="font-extrabold text-brand-navy text-lg mt-1">
                    R{pkg.price.toLocaleString()}<span className="text-sm font-normal text-gray-400">/mo</span>
                  </div>
                  <div className="font-semibold text-brand-navy mt-0.5">{pkg.name}</div>
                  <div className="text-xs text-gray-400 mt-1 mb-3 leading-relaxed">{pkg.tagline}</div>
                  <ul className="space-y-1.5 mb-4">
                    {pkg.features.slice(0, 3).map((f) => (
                      <li key={f} className="flex items-start gap-1.5 text-xs text-gray-500">
                        <CheckCircle2 className="h-3 w-3 text-brand-green mt-0.5 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center gap-1 text-xs font-bold text-brand-green group-hover:gap-2 transition-all">
                    Get started <ArrowRight className="h-3 w-3" />
                  </div>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2 px-1">Website built free · Hosting included · Cancel with 30 days notice</p>
          </div>

          {/* Once-off option */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-4 w-4 text-gray-500" />
              <span className="font-bold text-brand-navy">Once-Off Build</span>
            </div>
            <button onClick={() => router.push("/dashboard/onboarding")}
              className="w-full text-left rounded-2xl border border-gray-200 p-5 bg-white hover:border-gray-300 hover:shadow-sm transition-all group flex items-center justify-between">
              <div>
                <div className="font-semibold text-brand-navy">Custom Quote</div>
                <div className="text-sm text-gray-400 mt-0.5">Pay once, own your website outright. Add hosting & support optionally.</div>
              </div>
              <div className="flex items-center gap-1 text-sm font-bold text-gray-500 group-hover:text-brand-navy group-hover:gap-2 transition-all flex-shrink-0 ml-4">
                Get a quote <ArrowRight className="h-4 w-4" />
              </div>
            </button>
          </div>
        </div>
      ) : (
        /* ── Has projects ─────────────────────────────────────────── */
        <div className="space-y-5">
          {/* Pipeline progress (for active project) */}
          {activeProject && (
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="flex items-start justify-between gap-3 mb-5">
                <div>
                  <h2 className="font-extrabold text-brand-navy">{activeProject.title}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Requested {new Date(activeProject.createdAt).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}</p>
                </div>
                <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-semibold flex-shrink-0 ${STATUS_CONFIG[activeProject.status]?.color ?? "bg-gray-100 text-gray-600"}`}>
                  {STATUS_CONFIG[activeProject.status]?.icon}
                  {STATUS_CONFIG[activeProject.status]?.label ?? activeProject.status}
                </span>
              </div>

              {/* Pipeline bar */}
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  {PIPELINE_STAGES.map((stage, i) => (
                    <div key={stage} className="flex-1 flex flex-col items-center gap-1.5">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 text-[9px] font-bold transition-all ${
                        i < currentStageIdx
                          ? "bg-brand-green border-brand-green text-white"
                          : i === currentStageIdx
                          ? "bg-brand-navy border-brand-navy text-white"
                          : "bg-white border-gray-200 text-gray-400"
                      }`}>
                        {i < currentStageIdx ? <CheckCircle2 className="h-3 w-3" /> : i + 1}
                      </div>
                      <span className="text-[9px] text-center text-gray-400 leading-tight hidden sm:block px-0.5">{stage}</span>
                    </div>
                  ))}
                </div>
                {/* Connector line */}
                <div className="absolute top-3 left-3 right-3 h-0.5 bg-gray-100 -z-0">
                  <div className="h-full bg-brand-green transition-all duration-500"
                    style={{ width: `${Math.max(0, (currentStageIdx / (PIPELINE_STAGES.length - 1)) * 100)}%` }} />
                </div>
              </div>

              {activeProject.description && (
                <p className="text-sm text-gray-500 mt-4 leading-relaxed">{activeProject.description}</p>
              )}

              {activeProject.websiteUrl && (
                <a href={activeProject.websiteUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold text-brand-green hover:underline">
                  <Globe className="h-3.5 w-3.5" />View Preview / Live Site
                </a>
              )}

              {/* Progress bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                  <span>Overall progress</span>
                  <span className="font-bold text-brand-navy">{activeProject.progress}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="rounded-full h-2 transition-all"
                    style={{ width: `${activeProject.progress}%`, background: "linear-gradient(90deg, #1b2340, #2dc5a2)" }} />
                </div>
              </div>
            </div>
          )}

          {/* All projects list */}
          {projects.length > 1 && (
            <div className="space-y-3">
              <h3 className="font-bold text-brand-navy text-sm">All Projects</h3>
              {projects.map((p) => {
                const st = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.requested;
                return (
                  <Card key={p.id} className="hover:shadow-md transition-shadow border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-brand-navy/5 flex items-center justify-center flex-shrink-0 text-brand-navy">
                          {p.type === "ecommerce" ? <ShoppingCart className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-brand-navy text-sm">{p.title}</span>
                            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${st.color}`}>
                              {st.icon}{st.label}
                            </span>
                            <Badge variant="outline" className="text-xs capitalize">{p.type}</Badge>
                          </div>
                          {p.description && <p className="text-xs text-gray-400 mt-1 line-clamp-1">{p.description}</p>}
                          <div className="text-xs text-gray-400 mt-1.5">
                            {new Date(p.createdAt).toLocaleDateString("en-ZA")}
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-300 flex-shrink-0 mt-1" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
