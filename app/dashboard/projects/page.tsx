import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProjectsClient from "@/components/dashboard-projects";

export default async function ProjectsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  const projects = await prisma.project.findMany({
    where: {
      userId,
      subscription: {
        is: {
          paid: true,
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

  return <ProjectsClient initialProjects={serialized} />;
}
