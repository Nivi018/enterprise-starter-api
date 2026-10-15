import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator.js";
import { ROLES_KEY } from "../decorators/roles.decorator.js";
import type { AppRole } from "../roles.js";
import type { AuthUser } from "../types/auth-user.js";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const required = this.reflector.getAllAndOverride<AppRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) return true;

    const request = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    const roles = request.user?.roles ?? [];
    const allowed = required.some((role) => roles.includes(role));

    if (!allowed) {
      throw new ForbiddenException("No tienes permiso para esta acción");
    }

    return true;
  }
}
