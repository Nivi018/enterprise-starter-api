import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ENV } from "../../config/env.js";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { JwtStrategy } from "./strategies/jwt.strategy.js";
import { TokenService } from "./token.service.js";

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.register({
      secret: ENV.JWT_ACCESS_SECRET,
      signOptions: { expiresIn: ENV.JWT_ACCESS_TTL_SECONDS },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, TokenService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
