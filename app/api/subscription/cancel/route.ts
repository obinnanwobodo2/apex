import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { readJsonObject, sanitizeBoolean, sanitizeText } from "@/lib/validation";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await readJsonObject(req);
  if (!body) return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });

  const subscriptionId = sanitizeText(body.subscriptionId, { maxLength: 64 });
  const hardDelete = sanitizeBoolean(body.hardDelete, false);
  if (!subscriptionId) {
    return NextResponse.json({ error: "subscriptionId required" }, { status: 400 });
  }

  // Ensure the subscription belongs to this user
  const sub = await prisma.subscription.findFirst({
    where: { id: subscriptionId, userId },
  });

  if (!sub) {
    return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
  }

  if (hardDelete && sub.status === "pending" && !sub.paid) {
    await prisma.subscription.delete({
      where: { id: sub.id },
    });
    return NextResponse.json({ deleted: true, id: sub.id });
  }

  if (sub.status === "cancelled") {
    return NextResponse.json({ error: "Already cancelled" }, { status: 400 });
  }

  const updated = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      status: "cancelled",
      cancelledAt: new Date(),
    },
  });

  return NextResponse.json({
    ...updated,
    cancelledAt: updated.cancelledAt?.toISOString() ?? null,
    nextBillingDate: updated.nextBillingDate?.toISOString() ?? null,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  });
}
