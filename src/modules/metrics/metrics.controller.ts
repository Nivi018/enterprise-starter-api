import { Controller, Get } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Roles } from "../../common/decorators/roles.decorator.js";
import { AppRole } from "../../common/roles.js";
import { MetricsService } from "./metrics.service.js";

@ApiTags("Metrics")
@ApiBearerAuth()
@Controller("metrics")
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get("dashboard")
  @Roles(AppRole.ADMIN, AppRole.MANAGER)
  @ApiOperation({ summary: "KPIs y series para el dashboard" })
  dashboard() {
    return this.metricsService.dashboard();
  }
}
