export const AppRole = {
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  USER: "USER",
} as const;

export type AppRole = (typeof AppRole)[keyof typeof AppRole];

export const APP_ROLES: AppRole[] = [
  AppRole.ADMIN,
  AppRole.MANAGER,
  AppRole.USER,
];
