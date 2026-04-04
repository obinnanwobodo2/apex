import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import {
  readJsonObject,
  sanitizeBoolean,
  sanitizeEmail,
  sanitizeHttpUrl,
  sanitizePhone,
  sanitizeText,
} from "@/lib/validation";

type FieldKind = "text" | "multiline" | "email" | "phone" | "url" | "number";

interface IntegrationFieldRule {
  kind: FieldKind;
  maxLength?: number;
  min?: number;
  max?: number;
}

const INTEGRATION_RULES: Record<string, Record<string, IntegrationFieldRule>> = {
  whatsapp: {
    phoneNumber: { kind: "phone" },
    defaultMessage: { kind: "multiline", maxLength: 500 },
  },
  gmail: {
    fromName: { kind: "text", maxLength: 120 },
    fromEmail: { kind: "email" },
    signature: { kind: "multiline", maxLength: 600 },
  },
  google_calendar: {
    clientId: { kind: "text", maxLength: 200 },
    clientSecret: { kind: "text", maxLength: 300 },
    refreshToken: { kind: "text", maxLength: 500 },
    calendarId: { kind: "text", maxLength: 200 },
    timezone: { kind: "text", maxLength: 120 },
    defaultDuration: { kind: "number", min: 15, max: 180 },
  },
  notion: {
    internalToken: { kind: "text", maxLength: 300 },
    databaseId: { kind: "text", maxLength: 120 },
    parentPageId: { kind: "text", maxLength: 120 },
    workspaceName: { kind: "text", maxLength: 120 },
  },
  monday: {
    apiToken: { kind: "text", maxLength: 300 },
    boardId: { kind: "text", maxLength: 60 },
    groupId: { kind: "text", maxLength: 60 },
    ownerId: { kind: "text", maxLength: 60 },
  },
  slack: {
    botToken: { kind: "text", maxLength: 300 },
    signingSecret: { kind: "text", maxLength: 300 },
    appId: { kind: "text", maxLength: 80 },
    defaultChannel: { kind: "text", maxLength: 120 },
    workspaceUrl: { kind: "url", maxLength: 255 },
  },
  webhook: {
    url: { kind: "url", maxLength: 255 },
    secret: { kind: "text", maxLength: 300 },
  },
};

function sanitizeNumberField(
  value: unknown,
  options: { min?: number; max?: number } = {}
): string | null {
  const raw = sanitizeText(value, { maxLength: 20 });
  if (!raw) return null;

  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return null;

  const min = options.min ?? Number.NEGATIVE_INFINITY;
  const max = options.max ?? Number.POSITIVE_INFINITY;
  const clamped = Math.max(min, Math.min(max, Math.floor(parsed)));
  if (!Number.isFinite(clamped)) return null;
  return String(clamped);
}

function sanitizeIntegrationField(value: unknown, rule: IntegrationFieldRule): string | null {
  switch (rule.kind) {
    case "multiline":
      return sanitizeText(value, { maxLength: rule.maxLength ?? 1000, allowNewLines: true });
    case "email":
      return sanitizeEmail(value);
    case "phone":
      return sanitizePhone(value);
    case "url":
      return sanitizeHttpUrl(value, rule.maxLength ?? 2048);
    case "number":
      return sanitizeNumberField(value, { min: rule.min, max: rule.max });
    case "text":
    default:
      return sanitizeText(value, { maxLength: rule.maxLength ?? 255 });
  }
}

function sanitizeIntegrationConfig(type: string, configRaw: unknown): Record<string, string> {
  if (!configRaw || typeof configRaw !== "object" || Array.isArray(configRaw)) return {};

  const rules = INTEGRATION_RULES[type] ?? {};
  const source = configRaw as Record<string, unknown>;
  const config: Record<string, string> = {};

  for (const [fieldKey, rule] of Object.entries(rules)) {
    const sanitized = sanitizeIntegrationField(source[fieldKey], rule);
    if (sanitized) config[fieldKey] = sanitized;
  }

  return config;
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const integrations = await prisma.crmIntegration.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(integrations);
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await readJsonObject(req);
  if (!body) return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });

  const type = sanitizeText(body.type, { maxLength: 60 });
  if (!type) return NextResponse.json({ error: "type required" }, { status: 400 });
  if (!(type in INTEGRATION_RULES)) {
    return NextResponse.json({ error: "Unsupported integration type" }, { status: 400 });
  }

  const config = sanitizeIntegrationConfig(type, body.config);
  const serializedConfig = JSON.stringify(config);
  if (serializedConfig.length > 20_000) {
    return NextResponse.json({ error: "Integration config is too large" }, { status: 400 });
  }

  const hasConfigValue = Object.keys(config).length > 0;
  const requestedActive = sanitizeBoolean(body.active, hasConfigValue);
  const active = requestedActive && hasConfigValue;

  await prisma.profile.upsert({ where: { id: userId }, create: { id: userId }, update: {} });

  const integration = await prisma.crmIntegration.upsert({
    where: { id: `${userId}_${type}` },
    create: {
      id: `${userId}_${type}`,
      userId,
      type,
      config: serializedConfig,
      active,
    },
    update: {
      config: serializedConfig,
      active,
    },
  });

  return NextResponse.json(integration);
}
