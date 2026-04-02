import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import AdminProjectsClient from "@/components/admin-projects";

export default async function AdminProjectsPage() {
  const { userId } = await auth();
  if (!userId) return null;

  const projects = await prisma.project.findMany({
    include: {
      profile: { select: { fullName: true, companyName: true, phone: true } },
      subscription: {
        select: {
          package: true,
          paid: true,
          status: true,
          amountPaid: true,
          businessName: true,
          contactPerson: true,
          description: true,
          invoiceNumber: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const serialized = projects.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  return <AdminProjectsClient projects={serialized} />;
}
