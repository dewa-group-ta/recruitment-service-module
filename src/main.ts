import { NestFactory } from "@nestjs/core";
import * as dotenv from "dotenv";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { NestExpressApplication } from "@nestjs/platform-express";
import { useContainer } from "class-validator";
import { setupSwagger } from "./config/swagger.config";

dotenv.config();

async function bootstrap() {
  const appHttp = await NestFactory.create<NestExpressApplication>(AppModule);

  appHttp.enableShutdownHooks();

  appHttp.enableCors();

  // supaya class-validator bisa pakai dependency injection dari nestjs (misal validator custom yang butuh service)
  useContainer(appHttp.select(AppModule), { fallbackOnErrors: true });

  appHttp.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  );

  setupSwagger(appHttp);

  await appHttp.listen(process.env.PORT ?? 3000);

  console.log(
    `Service Recruitment Telah berjalan pada http://localhost:${process.env.PORT ?? 3000}/`
  );
}

void bootstrap();
