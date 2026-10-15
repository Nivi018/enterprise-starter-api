import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import bcrypt from "bcryptjs";
import { ENV } from "../../config/env.js";
import { AppRole } from "../../common/roles.js";
import type { AuthUser, RequestMeta } from "../../common/types/auth-user.js";
import { PrismaService } from "../../prisma/prisma.service.js";
import type { AuthResponseDto } from "./dto/auth.dto.js";
import { roleNames, toAuthUser, type UserWithRoles } from "./auth.mapper.js";
import { TokenService } from "./token.service.js";

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly tokenService: TokenService,
  ) {}

  async register(
    input: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
    },
    meta: RequestMeta,
  ): Promise<AuthResponseDto> {
    const email = input.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException("Ya existe una cuenta con ese correo");
    }

    const userRole = await this.prisma.role.findUnique({
      where: { name: AppRole.USER },
    });
    if (!userRole) {
      throw new ConflictException("El rol USER no está inicializado");
    }

    const user = await this.prisma.user.create({
      data: {
        email,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        passwordHash: await bcrypt.hash(input.password, BCRYPT_ROUNDS),
        roles: { create: { roleId: userRole.id } },
      },
      include: { roles: { include: { role: true } } },
    });

    return this.issueSession(user, meta);
  }

  async login(
    email: string,
    password: string,
    meta: RequestMeta,
  ): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: { roles: { include: { role: true } } },
    });

    if (!user) {
      throw new UnauthorizedException("Credenciales inválidas");
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException("Credenciales inválidas");
    }

    if (!user.isActive) {
      throw new ForbiddenException("La cuenta está desactivada");
    }

    return this.issueSession(user, meta);
  }

  async refresh(refreshToken: string, meta: RequestMeta): Promise<AuthResponseDto> {
    const rotated = await this.tokenService.rotate(refreshToken, meta);
    return this.issueSession(rotated.user, meta, rotated.refreshToken);
  }

  async logout(refreshToken: string): Promise<{ message: string }> {
    await this.tokenService.revoke(refreshToken);
    return { message: "Sesión cerrada" };
  }

  async logoutAll(userId: string): Promise<{ message: string }> {
    await this.tokenService.revokeAllForUser(userId);
    return { message: "Todas las sesiones fueron revocadas" };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { roles: { include: { role: true } } },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException("Sesión inválida");
    }
    return toAuthUser(user);
  }

  async changePassword(actor: AuthUser, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: actor.userId } });
    if (!user) throw new UnauthorizedException("Sesión inválida");

    const passwordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException("La contraseña actual no es correcta");
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await bcrypt.hash(newPassword, BCRYPT_ROUNDS) },
    });
    await this.tokenService.revokeAllForUser(user.id);
    return { message: "Contraseña actualizada. Inicia sesión de nuevo" };
  }

  private async issueSession(
    user: UserWithRoles,
    meta: RequestMeta,
    refreshToken?: string,
  ): Promise<AuthResponseDto> {
    const roles = roleNames(user);
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      roles,
      type: "access",
    });
    const issued = refreshToken
      ? refreshToken
      : (await this.tokenService.issue(user.id, meta)).rawToken;

    return {
      accessToken,
      refreshToken: issued,
      expiresIn: ENV.JWT_ACCESS_TTL_SECONDS,
      user: toAuthUser(user),
    };
  }
}
