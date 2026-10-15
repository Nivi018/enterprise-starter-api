import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Public } from "../../common/decorators/public.decorator.js";
import { PrismaService } from "../../prisma/prisma.service.js";

@ApiTags("Health")
@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: "Comprueba que la API y PostgreSQL responden" })
  async check() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: "ok" };
  }
}
