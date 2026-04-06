import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import RequestsClient from "@/components/requests-client";

export default async function RequestsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/login");

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

  const serialized = requests.map((r) => ({
    ...r,
    deadline: r.deadline?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  return <RequestsClient initialRequests={serialized} />;
}
