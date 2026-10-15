import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client.js";

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://starter:starter@localhost:5432/starter?schema=public";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const roles = [
  {
    name: "ADMIN",
    description: "Administra usuarios, roles y ve todas las métricas.",
  },
  {
    name: "MANAGER",
    description: "Consulta usuarios y el dashboard. No cambia roles.",
  },
  {
    name: "USER",
    description: "Accede a su perfil. No administra la organización.",
  },
] as const;

const users = [
  {
    email: "admin@harbor.dev",
    password: "Admin123!",
    firstName: "Ada",
    lastName: "Marín",
    role: "ADMIN",
  },
  {
    email: "manager@harbor.dev",
    password: "Manager123!",
    firstName: "Leo",
    lastName: "Vega",
    role: "MANAGER",
  },
  {
    email: "user@harbor.dev",
    password: "User12345",
    firstName: "Nora",
    lastName: "Solís",
    role: "USER",
  },
] as const;

const projects = [
  { name: "Portal de clientes", status: "ACTIVE", progress: 72 },
  { name: "App móvil de campo", status: "AT_RISK", progress: 41 },
  { name: "Migración de facturación", status: "ACTIVE", progress: 88 },
  { name: "Centro de reportes", status: "COMPLETED", progress: 100 },
  { name: "Integración de pagos", status: "PLANNED", progress: 15 },
] as const;

async function main() {
  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: role,
    });
  }

  const roleRecords = await prisma.role.findMany();
  const roleIdByName = new Map(roleRecords.map((role) => [role.name, role.id]));

  for (const user of users) {
    const passwordHash = await bcrypt.hash(user.password, 12);
    const saved = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        firstName: user.firstName,
        lastName: user.lastName,
        passwordHash,
        isActive: true,
      },
      create: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        passwordHash,
      },
    });

    const roleId = roleIdByName.get(user.role);
    if (!roleId) throw new Error(`Missing role ${user.role}`);

    await prisma.userRole.deleteMany({ where: { userId: saved.id } });
    await prisma.userRole.create({
      data: { userId: saved.id, roleId },
    });
  }

  const owner = await prisma.user.findUnique({
    where: { email: "manager@harbor.dev" },
  });
  if (!owner) throw new Error("Demo manager was not created");

  for (const project of projects) {
    await prisma.project.upsert({
      where: { name: project.name },
      update: {
        status: project.status,
        progress: project.progress,
        ownerId: owner.id,
      },
      create: {
        name: project.name,
        status: project.status,
        progress: project.progress,
        ownerId: owner.id,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
