import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import ProjectsClient from "@/components/dashboard-projects";

export default async function ProjectsPage() {
  const { userId } = await auth();
  if (!userId) return null;

  const projects = await prisma.project.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  const serialized = projects.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  return <ProjectsClient initialProjects={serialized} />;
}
