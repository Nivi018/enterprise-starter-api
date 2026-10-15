import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env") });

function required(name: string, minLength = 1): string {
  const value = process.env[name]?.trim();
  if (!value || value.length < minLength) {
    throw new Error(
      minLength > 1
        ? `${name} must be set and contain at least ${minLength} characters`
        : `${name} must be set`,
    );
  }
  return value;
}

function asList(name: string, fallback: string[]): string[] {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return parsed.length > 0 ? [...new Set(parsed)] : fallback;
}

function durationToSeconds(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const match = /^(\d+)([smhd])$/.exec(value.trim());
  if (!match) return fallback;
  const amount = Number(match[1]);
  const multipliers: Record<string, number> = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
  };
  return amount * (multipliers[match[2]] ?? 1);
}

const nodeEnv = process.env.NODE_ENV?.trim() || "development";
const secretMinLength = nodeEnv === "production" ? 32 : 16;

export const ENV = Object.freeze({
  NODE_ENV: nodeEnv,
  PORT: Number(process.env.PORT ?? 3001),
  DATABASE_URL: required("DATABASE_URL"),
  JWT_ACCESS_SECRET: required("JWT_ACCESS_SECRET", secretMinLength),
  JWT_REFRESH_SECRET: required("JWT_REFRESH_SECRET", secretMinLength),
  JWT_ACCESS_TTL_SECONDS: durationToSeconds(process.env.JWT_ACCESS_TTL, 15 * 60),
  JWT_REFRESH_TTL_DAYS: Number(process.env.JWT_REFRESH_TTL_DAYS ?? 7),
  CORS_ORIGINS: asList("CORS_ORIGINS", ["http://localhost:3000"]),
  SEED_ON_START: process.env.SEED_ON_START === "true",
});
