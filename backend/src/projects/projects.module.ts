import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ProjectsController } from "./projects.controller.js";
import { ProjectsService } from "./projects.service.js";

// This module lives in backend/src/projects or backend/dist/projects.
const projectRoot = fileURLToPath(new URL("../../..", import.meta.url));

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [
        resolve(projectRoot, ".env.local"),
        resolve(projectRoot, ".env"),
      ],
    }),
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
})
export class ProjectsModule {}
