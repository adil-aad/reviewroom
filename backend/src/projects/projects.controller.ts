import { Controller, Get, NotFoundException, Param } from "@nestjs/common";
import { ProjectsService } from "./projects.service";

@Controller("projects")
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  getProjects() {
    return this.projectsService.getProjects();
  }

  @Get(":id")
  async getProject(@Param("id") id: string) {
    const project = await this.projectsService.getProject(id);

    if (!project) {
      throw new NotFoundException("Project not found.");
    }

    return project;
  }
}
