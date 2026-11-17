import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { neon } from "@neondatabase/serverless";
import type { Project } from "./project";

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(private readonly configService: ConfigService) {}

  private getDatabase() {
    const connectionString = this.configService.get<string>("DATABASE_URL")?.trim();

    if (!connectionString) {
      throw new Error("DATABASE_URL is not configured.");
    }

    return neon(connectionString);
  }

  async getProjects(): Promise<Project[]> {
    try {
      const sql = this.getDatabase();
      const rows = await sql`
        SELECT id, name, client, status, description
        FROM projects
        ORDER BY created_at DESC, id ASC
      `;

      return rows as Project[];
    } catch {
      this.logger.error(
        "Unable to list projects. Check DATABASE_URL and database availability.",
      );
      throw new ServiceUnavailableException("Project storage is unavailable.");
    }
  }

  async getProject(id: string): Promise<Project | null> {
    try {
      const sql = this.getDatabase();
      const rows = await sql`
        SELECT id, name, client, status, description
        FROM projects
        WHERE id = ${id}
      `;

      return (rows[0] as Project | undefined) ?? null;
    } catch {
      this.logger.error(
        "Unable to read a project. Check DATABASE_URL and database availability.",
      );
      throw new ServiceUnavailableException("Project storage is unavailable.");
    }
  }
}
