"use client";

import { useState } from "react";
import { Bot, Loader2, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const AGENTS = [
  { id: "support_reply", name: "Support Agent", hint: "Draft client support responses quickly." },
  { id: "project_planner", name: "Project Planner Agent", hint: "Create build plans and milestones from client briefs." },
  { id: "client_update", name: "Client Update Agent", hint: "Generate progress update messages for clients." },
];

export default function AdminAiAgents() {
  const [agent, setAgent] = useState(AGENTS[0].id);
  const [input, setInput] = useState("");
  const [instruction, setInstruction] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [warning, setWarning] = useState("");

  async function runAgent() {
    setLoading(true);
    setWarning("");
    try {
      const res = await fetch("/api/admin/ai/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent, input, instruction }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to run AI agent");
      setOutput(data.output ?? "");
      if (data.warning) setWarning(`Fallback used: ${data.warning}`);
    } catch (err) {
      setWarning(err instanceof Error ? err.message : "Failed to run AI agent");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-brand-navy">AI Agents</h1>
        <p className="text-sm text-gray-400 mt-0.5">Delegate repetitive admin tasks to AI assistants.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base text-brand-navy flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand-green" />Agent Runner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {AGENTS.map((a) => (
              <button
                key={a.id}
                onClick={() => setAgent(a.id)}
                className={`text-left rounded-xl border p-3 transition-colors ${
                  agent === a.id ? "border-brand-green/30 bg-brand-green/5" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <p className="text-sm font-semibold text-brand-navy">{a.name}</p>
                <p className="text-xs text-gray-500 mt-1">{a.hint}</p>
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Input</label>
            <Textarea
              rows={8}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="resize-none"
              placeholder="Paste ticket details, client brief, or project context..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Extra Instruction (Optional)</label>
            <Textarea
              rows={3}
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              className="resize-none"
              placeholder="Example: Keep it concise and formal."
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={runAgent} disabled={loading || !input.trim()}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Bot className="h-4 w-4 mr-2" />}
              Run Agent
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base text-brand-navy">Agent Output</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {warning && <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">{warning}</p>}
          <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl p-4 min-h-[220px]">
            {output || "Run an agent to generate output."}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

