import type { AppRole } from "../../common/roles.js";
import type { AuthUserDto } from "./dto/auth.dto.js";

export type UserWithRoles = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  roles: Array<{ role: { name: AppRole | string } }>;
};

export function toAuthUser(user: UserWithRoles): AuthUserDto {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    isActive: user.isActive,
    roles: user.roles.map((item) => item.role.name),
  };
}

export function roleNames(user: UserWithRoles): AppRole[] {
  return user.roles.map((item) => item.role.name as AppRole);
}
