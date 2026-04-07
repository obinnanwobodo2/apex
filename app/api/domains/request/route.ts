import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getAdminAccess } from "@/lib/admin";
import { readJsonObject, sanitizeEnum, sanitizeText } from "@/lib/validation";

const EXTENSIONS = [".co.za", ".com", ".net", ".org", ".io", ".dev"] as const;
const PAYMENT_TYPES = ["once-off", "monthly"] as const;

function normalizeDomainName(value: unknown) {
  const raw = sanitizeText(value, { maxLength: 120 })?.toLowerCase() ?? "";
  return raw.replace(/[^a-z0-9-]/g, "").replace(/^-+|-+$/g, "");
}

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const access = await getAdminAccess();
  const { searchParams } = new URL(req.url);
  const requestedClientId = sanitizeText(searchParams.get("clientId"), { maxLength: 128 });
  const clientId = access.isAdmin && requestedClientId ? requestedClientId : userId;

  const requests = await prisma.domainRequest.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    requests.map((request) => ({
      ...request,
      createdAt: request.createdAt.toISOString(),
      updatedAt: request.updatedAt.toISOString(),
    }))
  );
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await readJsonObject(req);
  if (!body) return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });

  const domainName = normalizeDomainName(body.domainName);
  const extension = sanitizeEnum(body.extension, EXTENSIONS, ".co.za");
  const paymentType = sanitizeEnum(body.paymentType, PAYMENT_TYPES, "once-off");
  const notes = sanitizeText(body.notes, { maxLength: 2000, allowNewLines: true });

  if (!domainName || domainName.length < 2) {
    return NextResponse.json({ error: "Please enter a valid domain name." }, { status: 400 });
  }

  const created = await prisma.domainRequest.create({
    data: {
      clientId: userId,
      domainName,
      extension,
      paymentType,
      notes,
      status: "pending",
      paymentStatus: paymentType === "monthly" ? "pending_monthly" : "unpaid",
    },
  });

  return NextResponse.json({
    ...created,
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString(),
  });
}
