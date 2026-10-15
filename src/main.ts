import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import helmet from "helmet";
import { AppModule } from "./app.module.js";
import { ENV } from "./config/env.js";
import { setupSwagger } from "./config/swagger.js";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet({ contentSecurityPolicy: false }));
  app.enableCors({
    origin: ENV.CORS_ORIGINS,
    credentials: true,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  setupSwagger(app);
  await app.listen(ENV.PORT, "0.0.0.0");
}

void bootstrap();
