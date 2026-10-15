import { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle("Harbor API")
    .setDescription(
      "API del starter empresarial. Autenticación JWT, refresh tokens revocables y RBAC con Admin, Manager y User.",
    )
    .setVersion("1.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document, {
    swaggerOptions: { persistAuthorization: true },
  });
}
