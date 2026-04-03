import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import {
  readJsonObject,
  sanitizeBoolean,
  sanitizeHttpUrl,
  sanitizePhone,
  sanitizeText,
} from "@/lib/validation";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.profile.findUnique({ where: { id: userId } });
  return NextResponse.json(profile ?? {});
}

export async function PATCH(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await readJsonObject(req);
  if (!body) return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });

  const updateData: {
    fullName?: string | null;
    phone?: string | null;
    companyName?: string | null;
    companyAddress?: string | null;
    companyWebsite?: string | null;
    vatNumber?: string | null;
    notifyEmail?: boolean;
    notifyUpdates?: boolean;
    notifyBilling?: boolean;
  } = {};

  if ("fullName" in body) {
    updateData.fullName = sanitizeText(body.fullName, { maxLength: 120 }) ?? null;
  }
  if ("phone" in body) {
    updateData.phone = sanitizePhone(body.phone) ?? null;
  }
  if ("companyName" in body) {
    updateData.companyName = sanitizeText(body.companyName, { maxLength: 140 }) ?? null;
  }
  if ("companyAddress" in body) {
    updateData.companyAddress = sanitizeText(body.companyAddress, { maxLength: 220, allowNewLines: true }) ?? null;
  }
  if ("companyWebsite" in body) {
    updateData.companyWebsite = sanitizeHttpUrl(body.companyWebsite, 2048) ?? null;
  }
  if ("vatNumber" in body) {
    updateData.vatNumber = sanitizeText(body.vatNumber, { maxLength: 60 }) ?? null;
  }
  if ("notifyEmail" in body) {
    updateData.notifyEmail = sanitizeBoolean(body.notifyEmail, true);
  }
  if ("notifyUpdates" in body) {
    updateData.notifyUpdates = sanitizeBoolean(body.notifyUpdates, true);
  }
  if ("notifyBilling" in body) {
    updateData.notifyBilling = sanitizeBoolean(body.notifyBilling, true);
  }

  const profile = await prisma.profile.upsert({
    where: { id: userId },
    create: {
      id: userId,
      fullName: updateData.fullName ?? null,
      phone: updateData.phone ?? null,
      companyName: updateData.companyName ?? null,
      companyAddress: updateData.companyAddress ?? null,
      companyWebsite: updateData.companyWebsite ?? null,
      vatNumber: updateData.vatNumber ?? null,
      notifyEmail: updateData.notifyEmail ?? true,
      notifyUpdates: updateData.notifyUpdates ?? true,
      notifyBilling: updateData.notifyBilling ?? true,
    },
    update: updateData,
  });

  return NextResponse.json(profile);
}
