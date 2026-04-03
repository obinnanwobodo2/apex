import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { readJsonObject, sanitizeBoolean, sanitizeText } from "@/lib/validation";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const integrations = await prisma.crmIntegration.findMany({ where: { userId } });
  return NextResponse.json(integrations);
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await readJsonObject(req);
  if (!body) return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });

  const type = sanitizeText(body.type, { maxLength: 60 });
  if (!type) return NextResponse.json({ error: "type required" }, { status: 400 });

  const configRaw = body.config ?? {};
  const serializedConfig = JSON.stringify(configRaw);
  if (serializedConfig.length > 20_000) {
    return NextResponse.json({ error: "Integration config is too large" }, { status: 400 });
  }

  await prisma.profile.upsert({ where: { id: userId }, create: { id: userId }, update: {} });

  const integration = await prisma.crmIntegration.upsert({
    where: { id: `${userId}_${type}` },
    create: {
      id: `${userId}_${type}`,
      userId,
      type,
      config: serializedConfig,
      active: sanitizeBoolean(body.active, false),
    },
    update: {
      config: serializedConfig,
      active: sanitizeBoolean(body.active, false),
    },
  });

  return NextResponse.json(integration);
}
