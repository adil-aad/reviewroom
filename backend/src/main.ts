import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  await app.listen(3001, "127.0.0.1");
  console.log("ReviewRoom API: http://127.0.0.1:3001/health");
}

void bootstrap();
