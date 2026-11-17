import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";
import { HealthService } from "./health.service";
import { ProjectsModule } from "./projects/projects.module";

@Module({
  imports: [ProjectsModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class AppModule {}
