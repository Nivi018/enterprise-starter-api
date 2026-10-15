import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { AppRole } from "../../common/roles.js";
import type { AuthUser } from "../../common/types/auth-user.js";
import { PrismaService } from "../../prisma/prisma.service.js";
import { toAuthUser } from "../auth/auth.mapper.js";
import type {
  ListUsersQueryDto,
  UpdateUserDto,
  UpdateUserRolesDto,
} from "./dto/users.dto.js";

const userInclude = { roles: { include: { role: true } } } as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListUsersQueryDto) {
    const search = query.search?.trim();
    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: "insensitive" as const } },
            { firstName: { contains: search, mode: "insensitive" as const } },
            { lastName: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [total, users] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        include: userInclude,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);

    return {
      data: users.map(toAuthUser),
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        pageCount: Math.max(1, Math.ceil(total / query.pageSize)),
      },
    };
  }

  async getById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: userInclude,
    });
    if (!user) throw new NotFoundException("Usuario no encontrado");
    return toAuthUser(user);
  }

  async update(actor: AuthUser, id: string, dto: UpdateUserDto) {
    const target = await this.getEntity(id);
    if (actor.userId === id && dto.isActive === false) {
      throw new BadRequestException("No puedes desactivar tu propia cuenta");
    }

    const nextActive = dto.isActive ?? target.isActive;
    if (this.isActiveAdmin(target) && !nextActive) {
      await this.assertAnotherActiveAdmin(id);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        firstName: dto.firstName?.trim(),
        lastName: dto.lastName?.trim(),
        isActive: dto.isActive,
      },
      include: userInclude,
    });
    return toAuthUser(user);
  }

  async replaceRoles(actor: AuthUser, id: string, dto: UpdateUserRolesDto) {
    const target = await this.getEntity(id);
    const uniqueRoles = [...new Set(dto.roles)];

    if (actor.userId === id && !uniqueRoles.includes(AppRole.ADMIN)) {
      throw new BadRequestException("No puedes quitarte el rol de administrador");
    }

    if (this.isActiveAdmin(target) && !uniqueRoles.includes(AppRole.ADMIN)) {
      await this.assertAnotherActiveAdmin(id);
    }

    const roles = await this.prisma.role.findMany({
      where: { name: { in: uniqueRoles } },
    });
    if (roles.length !== uniqueRoles.length) {
      throw new BadRequestException("Uno o más roles no existen");
    }

    await this.prisma.$transaction([
      this.prisma.userRole.deleteMany({ where: { userId: id } }),
      this.prisma.userRole.createMany({
        data: roles.map((role) => ({ userId: id, roleId: role.id })),
      }),
    ]);

    return this.getById(id);
  }

  async listRoles() {
    const roles = await this.prisma.role.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { users: true } } },
    });
    return roles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      userCount: role._count.users,
    }));
  }

  private async getEntity(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: userInclude,
    });
    if (!user) throw new NotFoundException("Usuario no encontrado");
    return user;
  }

  private isActiveAdmin(user: {
    isActive: boolean;
    roles: Array<{ role: { name: string } }>;
  }) {
    return user.isActive && user.roles.some((item) => item.role.name === AppRole.ADMIN);
  }

  private async assertAnotherActiveAdmin(excludedUserId: string) {
    const remaining = await this.prisma.user.count({
      where: {
        id: { not: excludedUserId },
        isActive: true,
        roles: { some: { role: { name: AppRole.ADMIN } } },
      },
    });
    if (remaining === 0) {
      throw new BadRequestException("Debe existir al menos un administrador activo");
    }
  }
}
