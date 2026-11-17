import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { resolve } from "node:path";
import { ProjectsController } from "./projects.controller";
import { ProjectsService } from "./projects.service";

// This module lives in backend/src/projects or backend/dist/projects.
const projectRoot = resolve(__dirname, "../../..");

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
