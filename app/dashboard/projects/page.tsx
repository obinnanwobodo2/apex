import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProjectsClient from "@/components/dashboard-projects";
import { isDashboardGuestPreviewEnabled } from "@/lib/dashboard-guest-preview";

export default async function ProjectsPage() {
  const { userId } = await auth();
  const guestPreview = !userId && isDashboardGuestPreviewEnabled();
  if (!userId && !guestPreview) redirect("/login");

  const projects = userId
    ? await prisma.project.findMany({
      where: {
        userId,
        subscription: {
          is: {
            paid: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })
    : [];

  const serialized = projects.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  return <ProjectsClient initialProjects={serialized} />;
}
