import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common/decorators/current-user.decorator.js";
import { Roles } from "../../common/decorators/roles.decorator.js";
import { AppRole } from "../../common/roles.js";
import type { AuthUser } from "../../common/types/auth-user.js";
import {
  ListUsersQueryDto,
  UpdateUserDto,
  UpdateUserRolesDto,
} from "./dto/users.dto.js";
import { UsersService } from "./users.service.js";

@ApiTags("Users")
@ApiBearerAuth()
@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("users")
  @Roles(AppRole.ADMIN, AppRole.MANAGER)
  @ApiOperation({ summary: "Listar usuarios dentro del alcance de administración" })
  list(@Query() query: ListUsersQueryDto) {
    return this.usersService.list(query);
  }

  @Get("users/:id")
  @Roles(AppRole.ADMIN, AppRole.MANAGER)
  @ApiOperation({ summary: "Obtener un usuario" })
  getById(@Param("id", ParseUUIDPipe) id: string) {
    return this.usersService.getById(id);
  }

  @Patch("users/:id")
  @Roles(AppRole.ADMIN)
  @ApiOperation({ summary: "Actualizar perfil o estado de un usuario" })
  update(
    @CurrentUser() actor: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(actor, id, dto);
  }

  @Patch("users/:id/roles")
  @Roles(AppRole.ADMIN)
  @ApiOperation({ summary: "Reemplazar los roles de un usuario" })
  replaceRoles(
    @CurrentUser() actor: AuthUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserRolesDto,
  ) {
    return this.usersService.replaceRoles(actor, id, dto);
  }

  @Get("roles")
  @Roles(AppRole.ADMIN, AppRole.MANAGER)
  @ApiOperation({ summary: "Catálogo de roles base" })
  listRoles() {
    return this.usersService.listRoles();
  }
}
