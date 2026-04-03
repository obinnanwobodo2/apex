import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import {
  readJsonObject,
  sanitizeDate,
  sanitizeStringArray,
  sanitizeText,
} from "@/lib/validation";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const requests = await prisma.project.findMany({
    where: {
      userId,
      type: "request",
      subscription: {
        is: {
          paid: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    requests.map((r) => ({
      ...r,
      deadline: r.deadline?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }))
  );
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await readJsonObject(req);
  if (!body) return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });

  const title = sanitizeText(body.title, { maxLength: 160 });
  const description = sanitizeText(body.description, { maxLength: 4000, allowNewLines: true });
  const services = sanitizeStringArray(body.services, 20, 80);
  const budget = sanitizeText(body.budget, { maxLength: 80 });
  const deadline = sanitizeDate(body.deadline);
  const notes = sanitizeText(body.notes, { maxLength: 1200, allowNewLines: true });
  const packageId = sanitizeText(body.packageId, { maxLength: 80 });
  const honeypotWebsite = sanitizeText(body.website, { maxLength: 120 });

  if (honeypotWebsite) {
    return NextResponse.json({ error: "Request blocked." }, { status: 400 });
  }

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const activePaidSubscription = await prisma.subscription.findFirst({
    where: {
      userId,
      paid: true,
      status: "active",
    },
    orderBy: { createdAt: "desc" },
  });

  if (!activePaidSubscription) {
    return NextResponse.json(
      { error: "Payment is required before submitting a project request." },
      { status: 402 }
    );
  }

  const request = await prisma.project.create({
    data: {
      userId,
      subscriptionId: activePaidSubscription.id,
      title,
      type: "request",
      status: "requested",
      description: description ?? null,
      services: services.length > 0 ? JSON.stringify(services) : null,
      budget: budget ?? null,
      deadline: deadline ?? null,
      notes: [notes, packageId ? `Requested package: ${packageId}` : ""].filter(Boolean).join(" | ") || null,
    },
  });

  return NextResponse.json({
    ...request,
    deadline: request.deadline?.toISOString() ?? null,
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
  });
}
