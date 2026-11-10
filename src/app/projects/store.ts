import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { projects as sampleProjects, type Project, type ProjectInput } from "./data";

const projectDirectory = path.join(process.cwd(), ".local-data", "projects");

export async function getProjects(): Promise<Project[]> {
  let filenames: string[];

  try {
    filenames = await readdir(projectDirectory);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return sampleProjects;
    }
    throw error;
  }

  const savedProjects = await Promise.all(
    filenames
      .filter((filename) => filename.endsWith(".json"))
      .sort()
      .reverse()
      .map(async (filename) => {
        const contents = await readFile(path.join(projectDirectory, filename), "utf8");
        return JSON.parse(contents) as Project;
      }),
  );

  return [...savedProjects, ...sampleProjects];
}

export async function saveProject(input: ProjectInput): Promise<Project> {
  const project: Project = {
    ...input,
    id: randomUUID(),
    status: "Awaiting feedback",
  };

  await mkdir(projectDirectory, { recursive: true });
  const filename = path.join(projectDirectory, `${Date.now()}-${project.id}.json`);
  const temporaryFilename = `${filename}.tmp`;

  // Readers only see the complete JSON file after this rename.
  await writeFile(temporaryFilename, JSON.stringify(project, null, 2), {
    encoding: "utf8",
    flag: "wx",
  });
  await rename(temporaryFilename, filename);

  return project;
}
