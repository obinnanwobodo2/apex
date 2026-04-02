"use client";

import { useState } from "react";
import { Plus, Clock, CheckCircle2, Eye, AlertCircle, FolderOpen, ChevronRight, Rocket, Settings2, Copy, ShoppingCart, Users, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PlansFlow from "@/components/plans-flow";

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
  requested: { label: "Requested", color: "bg-gray-100 text-gray-600", icon: <Clock className="h-3 w-3" /> },
  scoping: { label: "Scoping", color: "bg-brand-navy/5 text-brand-navy", icon: <Eye className="h-3 w-3" /> },
  in_progress: { label: "In Progress", color: "bg-brand-navy/5 text-brand-navy", icon: <AlertCircle className="h-3 w-3" /> },
  review: { label: "In Review", color: "bg-brand-green/10 text-brand-navy", icon: <Eye className="h-3 w-3" /> },
  completed: { label: "Completed", color: "bg-green-100 text-green-700", icon: <CheckCircle2 className="h-3 w-3" /> },
};

const TABS = [
  { id: "all", label: "All Projects" },
  { id: "in_progress", label: "Active" },
  { id: "review", label: "In Review" },
  { id: "completed", label: "Completed" },
];

export default function ProjectsClient({ initialProjects }: { initialProjects: Project[] }) {
  const [tab, setTab] = useState("all");
  const [flowOpen, setFlowOpen] = useState(false);

  const filtered = tab === "all" ? initialProjects : initialProjects.filter((p) => p.status === tab);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-navy">Projects</h1>
          <p className="text-sm text-gray-400 mt-0.5">{initialProjects.length} total projects</p>
        </div>
        <Button onClick={() => setFlowOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />Request New
        </Button>
      </div>

      {/* Quick start options */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: <Rocket className="h-5 w-5 text-brand-navy" />, label: "From Template", desc: "Start with a pre-built layout" },
          { icon: <Settings2 className="h-5 w-5 text-brand-navy" />, label: "Custom Build", desc: "Fully tailored to your needs" },
          { icon: <Copy className="h-5 w-5 text-brand-navy" />, label: "Clone Previous", desc: "Duplicate a past project" },
        ].map((opt) => (
          <button
            key={opt.label}
            onClick={() => setFlowOpen(true)}
            className="bg-white border border-gray-200 rounded-2xl p-4 text-left hover:border-brand-green/40 hover:shadow-md transition-all group"
          >
            <div className="mb-2">{opt.icon}</div>
            <div className="font-semibold text-brand-navy text-sm group-hover:text-brand-green transition-colors">{opt.label}</div>
            <div className="text-xs text-gray-400">{opt.desc}</div>
          </button>
        ))}
      </div>

      {/* Tab filter */}
      <div className="flex gap-2 overflow-x-auto">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              tab === t.id ? "bg-brand-navy text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Project list */}
      {filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map((p) => {
            const st = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.requested;
            return (
              <Card key={p.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-brand-navy/5 flex items-center justify-center flex-shrink-0 text-brand-navy">
                      {p.type === "ecommerce" ? <ShoppingCart className="h-4 w-4" /> : p.type === "crm" ? <Users className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-bold text-brand-navy">{p.title}</span>
                        <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium ${st.color}`}>
                          {st.icon}{st.label}
                        </span>
                        <Badge variant="outline" className="text-xs capitalize">{p.type}</Badge>
                      </div>
                      {p.description && <p className="text-sm text-gray-400 mt-1 line-clamp-1">{p.description}</p>}
                      {p.notes && <p className="text-xs text-gray-500 mt-1 line-clamp-2">Admin update: {p.notes}</p>}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                          <span>Progress</span>
                          <span className="font-semibold text-brand-navy">{p.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div className="bg-brand-green rounded-full h-2 transition-all" style={{ width: `${p.progress}%` }} />
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 mt-2">
                        Requested {new Date(p.createdAt).toLocaleDateString("en-ZA")}
                      </div>
                      {p.websiteUrl && (
                        <div className="mt-2">
                          <a
                            href={p.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-semibold text-brand-green hover:underline"
                          >
                            Open Preview / Live Site
                          </a>
                        </div>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-300 flex-shrink-0 mt-1" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <FolderOpen className="h-12 w-12 text-gray-200 mx-auto mb-3" />
            <h3 className="font-bold text-brand-navy mb-1">
              {tab === "all" ? "No projects yet" : `No ${tab.replace("_", " ")} projects`}
            </h3>
            <p className="text-sm text-gray-400 mb-5">
              {tab === "all" ? "Request your first project to get started" : "Check back when your project moves to this stage"}
            </p>
            {tab === "all" && <Button onClick={() => setFlowOpen(true)}>Request a Project</Button>}
          </CardContent>
        </Card>
      )}

      {/* Progress tracker card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-brand-navy text-base">Project Progress Tracker</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-0">
            {["Request Submitted", "Scope Approved", "Development", "Testing", "Deployment"].map((stage, i, arr) => (
              <div key={stage} className="flex-1 flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                  i <= 1 ? "bg-brand-green border-brand-green text-white" : "bg-gray-100 border-gray-200 text-gray-400"
                }`}>
                  {i <= 1 ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                </div>
                {i < arr.length - 1 && (
                  <div className={`w-full h-0.5 mt-4 -mr-4 ${i < 1 ? "bg-brand-green" : "bg-gray-200"}`} />
                )}
                <div className="text-xs text-center mt-2 text-gray-500 hidden sm:block leading-tight px-1">{stage}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <PlansFlow open={flowOpen} onClose={() => setFlowOpen(false)} />
    </div>
  );
}
