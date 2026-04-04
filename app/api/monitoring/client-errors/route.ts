import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { logApplicationError, logSecurityEvent } from "@/lib/security-monitoring";
import { readJsonObject, sanitizeText } from "@/lib/validation";

const ALLOWED_SOURCES = new Set([
  "window_error",
  "unhandled_rejection",
  "route_error_boundary",
  "global_error_boundary",
]);

export async function POST(req: Request) {
  const body = await readJsonObject(req, { maxBytes: 30_000, requireContentType: false });
  if (!body) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const source = sanitizeText(body.source, { maxLength: 60 }) ?? "";
  if (!ALLOWED_SOURCES.has(source)) {
    return NextResponse.json({ error: "Invalid source" }, { status: 400 });
  }

  const message = sanitizeText(body.message, { maxLength: 800 });
  if (!message) return NextResponse.json({ error: "message required" }, { status: 400 });

  const stack = sanitizeText(body.stack, { maxLength: 2500, allowNewLines: true }) ?? "";
  const pathname = sanitizeText(body.pathname, { maxLength: 240 }) ?? "unknown";
  const userAgent = sanitizeText(body.userAgent, { maxLength: 300 }) ?? "unknown";

  const { userId } = await auth();

  await logApplicationError({
    source: `frontend:${source}`,
    severity: pathname.startsWith("/admin") ? "critical" : "warn",
    message: "Client runtime error captured",
    userId,
    route: pathname,
    details: {
      message,
      stack,
      userAgent,
    },
  });

  if (pathname.startsWith("/admin")) {
    await logSecurityEvent({
      event: "admin_frontend_error",
      severity: "warn",
      details: { pathname, userId },
    });
  }

  return NextResponse.json({ received: true });
}
