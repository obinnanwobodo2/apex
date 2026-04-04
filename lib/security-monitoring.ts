export type SecuritySeverity = "info" | "warn" | "critical";

interface SecurityEventPayload {
  event: string;
  severity?: SecuritySeverity;
  details?: Record<string, unknown>;
}

interface AppErrorPayload {
  source: string;
  severity?: SecuritySeverity;
  message: string;
  requestId?: string;
  route?: string;
  userId?: string | null;
  details?: Record<string, unknown>;
  error?: unknown;
}

function redact(value: unknown): unknown {
  if (typeof value === "string") {
    if (value.length > 300) return `${value.slice(0, 300)}...`;
    return value;
  }
  if (Array.isArray(value)) {
    return value.slice(0, 10).map((item) => redact(item));
  }
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const output: Record<string, unknown> = {};
    const keys = Object.keys(obj).slice(0, 20);
    for (const key of keys) {
      if (/password|secret|token|authorization/i.test(key)) {
        output[key] = "[REDACTED]";
      } else {
        output[key] = redact(obj[key]);
      }
    }
    return output;
  }
  return value;
}

export async function logSecurityEvent(payload: SecurityEventPayload): Promise<void> {
  const severity = payload.severity ?? "warn";
  const event = {
    timestamp: new Date().toISOString(),
    event: payload.event,
    severity,
    details: redact(payload.details ?? {}),
  };

  if (severity === "critical") {
    console.error("[security]", JSON.stringify(event));
  } else if (severity === "warn") {
    console.warn("[security]", JSON.stringify(event));
  } else {
    console.info("[security]", JSON.stringify(event));
  }

  const webhookUrl = process.env.SECURITY_ALERT_WEBHOOK_URL?.trim();
  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
      cache: "no-store",
    });
  } catch (error) {
    console.error("[security] failed to send webhook alert", error);
  }
}

function summarizeError(input: unknown) {
  if (input instanceof Error) {
    return {
      name: input.name,
      message: input.message,
      stack: input.stack?.split("\n").slice(0, 12).join("\n"),
    };
  }
  return typeof input === "string" ? { message: input } : redact(input);
}

export async function logApplicationError(payload: AppErrorPayload): Promise<void> {
  const severity = payload.severity ?? "critical";
  const event = {
    timestamp: new Date().toISOString(),
    event: "application_error",
    severity,
    source: payload.source,
    message: payload.message,
    requestId: payload.requestId ?? null,
    route: payload.route ?? null,
    userId: payload.userId ?? null,
    details: redact(payload.details ?? {}),
    error: summarizeError(payload.error),
  };

  console.error("[app]", JSON.stringify(event));

  const webhookUrl =
    process.env.APP_ALERT_WEBHOOK_URL?.trim() ||
    process.env.SECURITY_ALERT_WEBHOOK_URL?.trim();
  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
      cache: "no-store",
    });
  } catch (error) {
    console.error("[app] failed to send webhook alert", error);
  }
}
