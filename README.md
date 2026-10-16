# NestJS Enterprise API

Backend empresarial en NestJS + PostgreSQL, listo para SaaS B2B. Autenticación JWT con refresh tokens revocables, autorización RBAC, Prisma con migraciones y Swagger autogenerado. Se levanta con un solo comando de Docker.

No es una plantilla pegada a Supabase: aquí el backend es dueño de la autenticación y de los permisos.

## Qué incluye

- Login y registro. Access token de 15 minutos y refresh token opaco con rotación y detección de reutilización.
- Contraseñas con bcrypt. Logout revoca el refresh token. Cambiar contraseña revoca todas las sesiones.
- RBAC con tres roles sembrados: `ADMIN`, `MANAGER` y `USER`.
- Guards globales: una ruta sin `@Public()` exige JWT, y `@Roles()` restringe por rol. El rol efectivo se lee de la base, no solo del token.
- Prisma 7 + PostgreSQL, migración inicial y datos demo.
- Swagger en `/docs`.
- Docker Compose para PostgreSQL y la API.

## Arranque con Docker

```bash
cp .env.example .env
docker compose up --build
```

La API queda en http://localhost:3001 y la documentación en http://localhost:3001/docs.

## Cuentas demo

| Rol | Correo | Contraseña |
| --- | --- | --- |
| Admin | `admin@harbor.dev` | `Admin123!` |
| Manager | `manager@harbor.dev` | `Manager123!` |
| User | `user@harbor.dev` | `User12345` |

En producción cambia `JWT_ACCESS_SECRET` y `JWT_REFRESH_SECRET`.

## Desarrollo local

```bash
cp .env.example .env
npm install
npm run db:deploy
npm run db:seed
npm run start:dev
```

## Endpoints principales

| Método | Ruta | Acceso |
| --- | --- | --- |
| POST | `/auth/register` | Público |
| POST | `/auth/login` | Público |
| POST | `/auth/refresh` | Público, con refresh token |
| POST | `/auth/logout` | Público, revoca el refresh token |
| POST | `/auth/logout-all` | Autenticado |
| GET | `/auth/me` | Autenticado |
| POST | `/auth/change-password` | Autenticado |
| GET | `/users` | Admin, Manager |
| PATCH | `/users/:id` | Admin |
| PATCH | `/users/:id/roles` | Admin |
| GET | `/roles` | Admin, Manager |
| GET | `/metrics/dashboard` | Admin, Manager |
| GET | `/health` | Público |

## Arquitectura RBAC

1. El login emite un access token JWT de corta duración y un refresh token aleatorio.
2. Solo se guarda el HMAC del refresh token. Al renovar, el anterior se revoca y se emite otro de la misma familia. Si reaparece un token ya revocado, se invalida la familia.
3. `JwtAuthGuard` protege todo por defecto. `JwtStrategy` carga usuario y roles desde PostgreSQL, así un cambio de rol aplica en la siguiente petición.
4. `RolesGuard` lee `@Roles()`. Sin ese decorador, basta con estar autenticado.

No se puede desactivar al último administrador activo ni quitarle ese rol.

---

> **¿Quieres el dashboard en Next.js con Tailwind y ECharts listo para producción?**
>
> Consigue la versión Pro completa — consola con sidebar, tema claro/oscuro, tabla de usuarios y gráficos interactivos — en Gumroad:
>
> **[👉 Consigue la versión Pro en Gumroad](https://ivndvz.gumroad.com/l/enterprise-starter)**
