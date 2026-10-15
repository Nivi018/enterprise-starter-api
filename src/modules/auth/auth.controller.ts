import { Body, Controller, Get, Post, Req } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import type { Request } from "express";
import { CurrentUser } from "../../common/decorators/current-user.decorator.js";
import { Public } from "../../common/decorators/public.decorator.js";
import type { AuthUser, RequestMeta } from "../../common/types/auth-user.js";
import { AuthService } from "./auth.service.js";
import {
  AuthResponseDto,
  AuthUserDto,
  ChangePasswordDto,
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
} from "./dto/auth.dto.js";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("register")
  @ApiOperation({ summary: "Registrar una cuenta con rol User" })
  @ApiOkResponse({ type: AuthResponseDto })
  register(@Body() dto: RegisterDto, @Req() request: Request) {
    return this.authService.register(dto, readMeta(request));
  }

  @Public()
  @Post("login")
  @ApiOperation({ summary: "Iniciar sesión y emitir access + refresh token" })
  @ApiOkResponse({ type: AuthResponseDto })
  login(@Body() dto: LoginDto, @Req() request: Request) {
    return this.authService.login(dto.email, dto.password, readMeta(request));
  }

  @Public()
  @Post("refresh")
  @ApiOperation({ summary: "Rotar el refresh token y emitir un access token nuevo" })
  @ApiOkResponse({ type: AuthResponseDto })
  refresh(@Body() dto: RefreshTokenDto, @Req() request: Request) {
    return this.authService.refresh(dto.refreshToken, readMeta(request));
  }

  @Public()
  @Post("logout")
  @ApiOperation({ summary: "Revocar el refresh token presentado" })
  logout(@Body() dto: RefreshTokenDto) {
    return this.authService.logout(dto.refreshToken);
  }

  @Post("logout-all")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Revocar todas las sesiones del usuario actual" })
  logoutAll(@CurrentUser() user: AuthUser) {
    return this.authService.logoutAll(user.userId);
  }

  @Get("me")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Perfil y roles efectivos del usuario autenticado" })
  @ApiOkResponse({ type: AuthUserDto })
  me(@CurrentUser() user: AuthUser) {
    return this.authService.me(user.userId);
  }

  @Post("change-password")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Cambiar contraseña y revocar sesiones activas" })
  changePassword(@CurrentUser() user: AuthUser, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(
      user,
      dto.currentPassword,
      dto.newPassword,
    );
  }
}

function readMeta(request: Request): RequestMeta {
  const forwarded = request.headers["x-forwarded-for"];
  const headerValue = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return {
    userAgent: request.headers["user-agent"],
    ipAddress: headerValue?.split(",")[0]?.trim() || request.ip,
  };
}
