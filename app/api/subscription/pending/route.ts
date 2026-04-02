import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { ALL_PACKAGES, calculateTotal, generateInvoiceNumber, type AnyPackageId } from "@/lib/utils";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const packageId = body?.packageId as AnyPackageId | undefined;
  if (!packageId || !ALL_PACKAGES[packageId]) {
    return NextResponse.json({ error: "Valid packageId is required" }, { status: 400 });
  }

  const pkg = ALL_PACKAGES[packageId];
  const profile = await prisma.profile.upsert({
    where: { id: userId },
    create: { id: userId },
    update: {},
  });

  const pending = await prisma.subscription.create({
    data: {
      userId,
      package: pkg.id,
      amount: pkg.price,
      amountPaid: calculateTotal(pkg.price),
      status: "pending",
      paid: false,
      businessName: profile.companyName ?? profile.fullName ?? "Client Project",
      contactPerson: profile.fullName ?? null,
      phone: profile.phone ?? null,
      invoiceNumber: generateInvoiceNumber(),
      description: body?.description ? String(body.description) : null,
    },
  });

  return NextResponse.json({
    ...pending,
    createdAt: pending.createdAt.toISOString(),
    updatedAt: pending.updatedAt.toISOString(),
  });
}
