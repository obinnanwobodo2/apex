import { NextResponse } from "next/server";
import { sanitizeEmail, readJsonObject } from "@/lib/validation";
import { logSecurityEvent } from "@/lib/security-monitoring";

export async function POST(req: Request) {
  const body = await readJsonObject(req);
  if (!body) return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });

  const email = sanitizeEmail(body.email);
  if (!email) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }

  await logSecurityEvent({
    event: "newsletter_subscribe",
    severity: "info",
    details: {
      email,
    },
  });

  return NextResponse.json({ success: true });
}
