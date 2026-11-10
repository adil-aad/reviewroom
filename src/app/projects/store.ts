import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  projects as sampleProjects,
  type Project,
  type ProjectInput,
  type ProjectStatus,
} from "./data";

const projectDirectory = path.join(process.cwd(), ".local-data", "projects");

async function writeProject(filename: string, project: Project) {
  const temporaryFilename = `${filename}.${randomUUID()}.tmp`;

  // Readers only see the complete JSON file after this rename.
  await writeFile(temporaryFilename, JSON.stringify(project, null, 2), {
    encoding: "utf8",
    flag: "wx",
  });
  await rename(temporaryFilename, filename);
}

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

  const unsavedSamples = sampleProjects.filter(
    (sample) => !savedProjects.some((project) => project.id === sample.id),
  );

  return [...savedProjects, ...unsavedSamples];
}

export async function saveProject(input: ProjectInput): Promise<Project> {
  const project: Project = {
    ...input,
    id: randomUUID(),
    status: "Awaiting feedback",
  };

  await mkdir(projectDirectory, { recursive: true });
  const filename = path.join(projectDirectory, `${Date.now()}-${project.id}.json`);
  await writeProject(filename, project);

  return project;
}

export async function updateProjectStatus(
  id: string,
  status: ProjectStatus,
): Promise<Project | null> {
  const projects = await getProjects();
  const project = projects.find((project) => project.id === id);

  if (!project) {
    return null;
  }

  const updatedProject: Project = { ...project, status };
  await mkdir(projectDirectory, { recursive: true });
  const filenames = await readdir(projectDirectory);
  const existingFilename = filenames.find((filename) =>
    filename.endsWith(`-${project.id}.json`),
  );

  // A starter project gets a saved copy the first time its status changes.
  const filename = path.join(
    projectDirectory,
    existingFilename ?? `sample-${project.id}.json`,
  );
  await writeProject(filename, updatedProject);

  return updatedProject;
}
