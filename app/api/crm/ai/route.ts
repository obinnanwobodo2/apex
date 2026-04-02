import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || "not-configured" });

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { message, context } = body as { message: string; context?: string };

  if (!message) return NextResponse.json({ error: "message required" }, { status: 400 });

  // Fetch recent CRM data for context
  const [contacts, deals, tasks] = await Promise.all([
    prisma.contact.findMany({ where: { userId }, take: 20, orderBy: { createdAt: "desc" } }),
    prisma.deal.findMany({
      where: { userId },
      take: 20,
      orderBy: { createdAt: "desc" },
      include: { contact: { select: { firstName: true, lastName: true } } },
    }),
    prisma.task.findMany({
      where: { userId, status: { not: "done" } },
      take: 10,
      orderBy: { dueDate: "asc" },
    }),
  ]);

  const crmContext = `
You are an AI sales assistant for a South African small business CRM.

Current CRM data:
- Contacts (${contacts.length}): ${contacts.slice(0, 5).map((c) => `${c.firstName} ${c.lastName ?? ""} (${c.status}, ${c.company ?? "no company"})`).join(", ")}
- Open Deals (${deals.filter((d) => !["won", "lost"].includes(d.stage)).length}): ${deals.filter((d) => !["won", "lost"].includes(d.stage)).slice(0, 5).map((d) => `${d.title} R${d.value} (${d.stage})`).join(", ")}
- Pending Tasks (${tasks.length}): ${tasks.slice(0, 5).map((t) => `${t.title} (${t.priority} priority)`).join(", ")}
${context ? `\nAdditional context: ${context}` : ""}

Respond helpfully in a concise, professional tone. Format responses with markdown when helpful.
You can help with: lead scoring, email drafting, deal insights, follow-up reminders, pipeline analysis, contact summaries.
`;

  const model = process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-latest";
  let reply = "";
  try {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error("AI key not configured");
    const response = await anthropic.messages.create({
      model,
      max_tokens: 1024,
      system: crmContext,
      messages: [{ role: "user", content: message }],
    });
    reply = response.content[0].type === "text" ? response.content[0].text : "";
    if (!reply.trim()) throw new Error("Empty AI response");
  } catch {
    reply = `Quick CRM guidance:
- Prioritize open deals with highest value and highest close probability.
- Send follow-up messages to stalled deals older than 7 days.
- Focus first on tasks due in the next 48 hours.
- Keep notes updated after each client interaction.

Based on your prompt: "${message.slice(0, 180)}${message.length > 180 ? "..." : ""}"`;
  }

  // Log as activity
  await prisma.activity.create({
    data: { userId, type: "note", title: "AI Assistant query", body: `Q: ${message}\n\nA: ${reply}` },
  });

  return NextResponse.json({ reply });
}
