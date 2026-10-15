import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ENV } from "../../../config/env.js";
import { PrismaService } from "../../../prisma/prisma.service.js";
import type { AppRole } from "../../../common/roles.js";
import type { AuthUser } from "../../../common/types/auth-user.js";

type AccessPayload = {
  sub: string;
  email?: string;
  type?: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: ENV.JWT_ACCESS_SECRET,
    });
  }

  async validate(payload: AccessPayload): Promise<AuthUser> {
    if (payload.type && payload.type !== "access") {
      throw new UnauthorizedException("Tipo de token inválido");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { roles: { include: { role: true } } },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException("Sesión inválida");
    }

    return {
      userId: user.id,
      email: user.email,
      roles: user.roles.map((item) => item.role.name as AppRole),
    };
  }
}
