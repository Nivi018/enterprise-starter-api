import { createHmac, randomBytes, randomUUID } from "node:crypto";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ENV } from "../../config/env.js";
import { PrismaService } from "../../prisma/prisma.service.js";
import type { RequestMeta } from "../../common/types/auth-user.js";

const userWithRoles = {
  roles: { include: { role: true } },
} as const;

@Injectable()
export class TokenService {
  constructor(private readonly prisma: PrismaService) {}

  hash(rawToken: string): string {
    return createHmac("sha256", ENV.JWT_REFRESH_SECRET)
      .update(rawToken)
      .digest("hex");
  }

  async issue(userId: string, meta: RequestMeta, familyId?: string) {
    const rawToken = randomBytes(48).toString("base64url");
    const expiresAt = new Date(
      Date.now() + ENV.JWT_REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000,
    );

    const record = await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: this.hash(rawToken),
        familyId: familyId ?? randomUUID(),
        expiresAt,
        userAgent: meta.userAgent,
        ipAddress: meta.ipAddress,
      },
    });

    return { rawToken, record };
  }

  async rotate(rawToken: string, meta: RequestMeta) {
    const existing = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hash(rawToken) },
    });

    if (!existing) {
      throw new UnauthorizedException("Refresh token inválido");
    }

    if (existing.revokedAt) {
      await this.revokeFamily(existing.familyId);
      throw new UnauthorizedException(
        "Se detectó reutilización del refresh token. Inicia sesión de nuevo",
      );
    }

    if (existing.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException("Refresh token expirado");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: existing.userId },
      include: userWithRoles,
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException("Usuario no autorizado");
    }

    const rawNext = randomBytes(48).toString("base64url");
    const expiresAt = new Date(
      Date.now() + ENV.JWT_REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000,
    );
    const claimed = await this.prisma.$transaction(async (tx) => {
      const update = await tx.refreshToken.updateMany({
        where: { id: existing.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      if (update.count !== 1) return false;

      const created = await tx.refreshToken.create({
        data: {
          userId: user.id,
          tokenHash: this.hash(rawNext),
          familyId: existing.familyId,
          expiresAt,
          userAgent: meta.userAgent,
          ipAddress: meta.ipAddress,
        },
      });
      await tx.refreshToken.update({
        where: { id: existing.id },
        data: { replacedById: created.id },
      });
      return true;
    });

    if (!claimed) {
      await this.revokeFamily(existing.familyId);
      throw new UnauthorizedException(
        "Se detectó reutilización del refresh token. Inicia sesión de nuevo",
      );
    }

    return { refreshToken: rawNext, user };
  }

  private async revokeFamily(familyId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revoke(rawToken: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: this.hash(rawToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
