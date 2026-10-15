import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard.js";
import { RolesGuard } from "./common/guards/roles.guard.js";
import { AuthModule } from "./modules/auth/auth.module.js";
import { HealthModule } from "./modules/health/health.module.js";
import { MetricsModule } from "./modules/metrics/metrics.module.js";
import { UsersModule } from "./modules/users/users.module.js";
import { PrismaModule } from "./prisma/prisma.module.js";

@Module({
  imports: [PrismaModule, AuthModule, UsersModule, MetricsModule, HealthModule],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
