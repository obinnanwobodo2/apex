import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { ALL_PACKAGES, calculateTotal, generateInvoiceNumber, type AnyPackageId } from "@/lib/utils";
import {
  readJsonObject,
  sanitizeDate,
  sanitizeStringArray,
  sanitizeText,
} from "@/lib/validation";

interface RequestDraftPayload {
  title?: string;
  description?: string;
  services?: string[];
  budget?: string;
  deadline?: string;
  notes?: string;
}

function normalizeRequestDraft(input: unknown): RequestDraftPayload | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as Record<string, unknown>;

  const services = sanitizeStringArray(raw.services, 20, 80);

  const parsedDeadline = sanitizeDate(raw.deadline);
  const validDeadline = parsedDeadline ? parsedDeadline.toISOString() : undefined;

  const normalized: RequestDraftPayload = {
    title: sanitizeText(raw.title, { maxLength: 160 }) ?? undefined,
    description: sanitizeText(raw.description, { maxLength: 4000, allowNewLines: true }) ?? undefined,
    services,
    budget: sanitizeText(raw.budget, { maxLength: 80 }) ?? undefined,
    deadline: validDeadline,
    notes: sanitizeText(raw.notes, { maxLength: 1200, allowNewLines: true }) ?? undefined,
  };

  const hasData = Boolean(
    normalized.title ||
      normalized.description ||
      normalized.services?.length ||
      normalized.budget ||
      normalized.deadline ||
      normalized.notes
  );

  return hasData ? normalized : null;
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await readJsonObject(req);
  if (!body) return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });

  const packageId = sanitizeText(body?.packageId, { maxLength: 40 }) as AnyPackageId | null;
  if (!packageId || !ALL_PACKAGES[packageId]) {
    return NextResponse.json({ error: "Valid packageId is required" }, { status: 400 });
  }

  const pkg = ALL_PACKAGES[packageId];
  const requestDraft = normalizeRequestDraft(body?.requestDraft);
  const description =
    requestDraft?.description ||
    (sanitizeText(body?.description, { maxLength: 4000, allowNewLines: true }) ?? null);

  const profile = await prisma.profile.upsert({
    where: { id: userId },
    create: { id: userId },
    update: {},
  });

  const structuredFeatures = requestDraft
    ? JSON.stringify({
        source: "requests_dashboard",
        request: requestDraft,
        createdAt: new Date().toISOString(),
      })
    : null;

  const pending = await prisma.subscription.create({
    data: {
      userId,
      package: pkg.id,
      amount: pkg.price,
      amountPaid: calculateTotal(pkg.price),
      status: "pending",
      paid: false,
      businessName: requestDraft?.title || profile.companyName || profile.fullName || "Client Project",
      contactPerson: profile.fullName ?? null,
      phone: profile.phone ?? null,
      invoiceNumber: generateInvoiceNumber(),
      description,
      budget: requestDraft?.budget ?? null,
      features: structuredFeatures,
    },
  });

  return NextResponse.json({
    ...pending,
    createdAt: pending.createdAt.toISOString(),
    updatedAt: pending.updatedAt.toISOString(),
  });
}
