import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller.js";
import { HealthService } from "./health.service.js";
import { ProjectsModule } from "./projects/projects.module.js";

@Module({
  imports: [ProjectsModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class AppModule {}
