import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logApplicationError } from "@/lib/security-monitoring";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json(
      {
        status: "ok",
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    await logApplicationError({
      source: "healthcheck",
      severity: "critical",
      message: "Health endpoint database check failed",
      route: "/api/health",
      error,
    });
    return NextResponse.json(
      {
        status: "degraded",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
