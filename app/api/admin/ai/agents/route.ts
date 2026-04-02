import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getAdminAccess } from "@/lib/admin";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || "not-configured" });

function fallbackReply(agent: string, input: string) {
  if (agent === "project_planner") {
    return `Project Plan (Draft)
1. Discovery & requirements confirmation (Day 1)
2. Wireframe and visual direction (Day 2)
3. Build core pages and responsive layout (Days 3-4)
4. Integrations, forms, and QA pass (Day 5)
5. Client review + revisions (Days 6-7)
6. Launch and post-launch monitoring

Notes from brief:
${input.slice(0, 350)}`;
  }
  if (agent === "client_update") {
    return `Client Progress Update
- Current status: in progress
- Work completed: structure and core pages are underway
- Next milestone: preview link and content review
- ETA for next update: within 1 business day

Context:
${input.slice(0, 280)}`;
  }
  return `Support Reply Draft
Thank you for your request. We have received your message and our team is reviewing it now.
We will send your next update within 1 business day.

Context:
${input.slice(0, 280)}`;
}

export async function POST(req: Request) {
  const access = await getAdminAccess();
  if (!access.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!access.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const agent = typeof body.agent === "string" ? body.agent : "";
  const input = typeof body.input === "string" ? body.input : "";
  const instruction = typeof body.instruction === "string" ? body.instruction : "";

  if (!agent || !input.trim()) {
    return NextResponse.json({ error: "agent and input are required" }, { status: 400 });
  }

  const model = process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-latest";
  const system = `You are an operations assistant for Apex Visual admin team.
Agent mode: ${agent}
Write clear, actionable output in markdown.
${instruction ? `Extra instruction: ${instruction}` : ""}`;

  try {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error("AI key not configured");
    const resp = await anthropic.messages.create({
      model,
      max_tokens: 800,
      system,
      messages: [{ role: "user", content: input }],
    });
    const output = resp.content[0]?.type === "text" ? resp.content[0].text : "";
    if (!output.trim()) throw new Error("Empty AI output");
    return NextResponse.json({ output, source: "anthropic" });
  } catch (error) {
    return NextResponse.json({
      output: fallbackReply(agent, input),
      source: "fallback",
      warning: error instanceof Error ? error.message : "AI unavailable",
    });
  }
}

