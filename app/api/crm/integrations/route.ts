import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const integrations = await prisma.crmIntegration.findMany({ where: { userId } });
  return NextResponse.json(integrations);
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { type, config, active } = body;

  if (!type) return NextResponse.json({ error: "type required" }, { status: 400 });

  await prisma.profile.upsert({ where: { id: userId }, create: { id: userId }, update: {} });

  const integration = await prisma.crmIntegration.upsert({
    where: { id: `${userId}_${type}` },
    create: {
      id: `${userId}_${type}`,
      userId,
      type,
      config: JSON.stringify(config ?? {}),
      active: active ?? false,
    },
    update: {
      config: JSON.stringify(config ?? {}),
      active: active ?? false,
    },
  });

  return NextResponse.json(integration);
}
