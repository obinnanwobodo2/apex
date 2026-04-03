import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { getAdminAccess } from "@/lib/admin";
import { readJsonObject, sanitizeText } from "@/lib/validation";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || "not-configured" });

function fallbackSupportReply(input: {
  subject: string;
  message: string;
  priority: string;
  company?: string | null;
}) {
  const sla = input.priority === "urgent" ? "within 2 hours" : "within 1 business day";
  return `Hi${input.company ? ` ${input.company}` : ""},

Thank you for your message regarding **${input.subject}**.

We have logged your request and our team is now reviewing the details you shared:
> ${input.message.slice(0, 220)}${input.message.length > 220 ? "..." : ""}

**Next steps**
1. We will validate the request scope.
2. We will send you a confirmed action plan and timeline.
3. We will update your dashboard progress as work is completed.

Expected first update: **${sla}**.

Regards,  
Apex Visual Support`;
}

export async function POST(req: Request) {
  const access = await getAdminAccess();
  if (!access.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!access.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await readJsonObject(req);
  if (!body) return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });

  const ticketId = sanitizeText(body.ticketId, { maxLength: 64 }) ?? "";
  const instruction = sanitizeText(body.instruction, { maxLength: 1000, allowNewLines: true }) ?? "";

  if (!ticketId) return NextResponse.json({ error: "ticketId required" }, { status: 400 });

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      profile: {
        select: {
          fullName: true,
          companyName: true,
          phone: true,
        },
      },
    },
  });

  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

  const system = `You are a support assistant for Apex Visual.
Write professional, concise, empathetic replies.
Always include next action and expected turnaround.
Do not promise anything that is not in context.
${instruction ? `Admin instruction: ${instruction}` : ""}`;

  const userPrompt = `Client: ${ticket.profile?.fullName ?? "Unknown"} (${ticket.profile?.companyName ?? "No company"})
Priority: ${ticket.priority}
Current status: ${ticket.status}
Subject: ${ticket.subject}
Message: ${ticket.message}
Existing response: ${ticket.response ?? "None"}

Draft a reply the admin can send to the client.`;

  const model = process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-latest";
  try {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error("AI key not configured");
    const response = await anthropic.messages.create({
      model,
      max_tokens: 500,
      system,
      messages: [{ role: "user", content: userPrompt }],
    });
    const reply = response.content[0]?.type === "text" ? response.content[0].text : "";
    if (!reply.trim()) throw new Error("Empty AI response");
    return NextResponse.json({ reply, source: "anthropic" });
  } catch (error) {
    const fallback = fallbackSupportReply({
      subject: ticket.subject,
      message: ticket.message,
      priority: ticket.priority,
      company: ticket.profile?.companyName,
    });
    return NextResponse.json({
      reply: fallback,
      source: "fallback",
      warning: error instanceof Error ? error.message : "AI unavailable",
    });
  }
}
