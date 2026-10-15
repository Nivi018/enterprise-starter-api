import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";

@Injectable()
export class MetricsService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard() {
    const [totalUsers, activeUsers, projects, roles] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.project.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true, status: true, progress: true },
      }),
      this.prisma.role.findMany({
        orderBy: { name: "asc" },
        include: { _count: { select: { users: true } } },
      }),
    ]);

    const activeProjects = projects.filter(
      (project) => project.status === "ACTIVE" || project.status === "AT_RISK",
    ).length;
    const averageProgress = projects.length
      ? Math.round(
          projects.reduce((sum, project) => sum + project.progress, 0) /
            projects.length,
        )
      : 0;

    return {
      kpis: {
        totalUsers,
        activeUsers,
        activeProjects,
        averageProgress,
      },
      projectProgress: projects.map((project) => ({
        name: project.name,
        progress: project.progress,
        status: project.status,
      })),
      usersByRole: roles.map((role) => ({
        role: role.name,
        count: role._count.users,
      })),
    };
  }
}
