import type { AppRole } from "../roles.js";

export type AuthUser = {
  userId: string;
  email: string;
  roles: AppRole[];
};

export type RequestMeta = {
  userAgent?: string;
  ipAddress?: string;
};
