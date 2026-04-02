import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.profile.findUnique({ where: { id: userId } });
  return NextResponse.json(profile ?? {});
}

export async function PATCH(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    fullName, phone,
    companyName, companyAddress, companyWebsite, vatNumber,
    notifyEmail, notifyUpdates, notifyBilling,
  } = body;

  const profile = await prisma.profile.upsert({
    where: { id: userId },
    create: {
      id: userId,
      fullName, phone,
      companyName, companyAddress, companyWebsite, vatNumber,
      notifyEmail, notifyUpdates, notifyBilling,
    },
    update: {
      ...(fullName !== undefined && { fullName }),
      ...(phone !== undefined && { phone }),
      ...(companyName !== undefined && { companyName }),
      ...(companyAddress !== undefined && { companyAddress }),
      ...(companyWebsite !== undefined && { companyWebsite }),
      ...(vatNumber !== undefined && { vatNumber }),
      ...(notifyEmail !== undefined && { notifyEmail }),
      ...(notifyUpdates !== undefined && { notifyUpdates }),
      ...(notifyBilling !== undefined && { notifyBilling }),
    },
  });

  return NextResponse.json(profile);
}
