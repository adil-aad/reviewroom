import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { FeedbackInput, ProjectFeedback } from "./data";
import { getProjects } from "./store";

const feedbackDirectory = path.join(process.cwd(), ".local-data", "feedback");

export async function getProjectFeedback(projectId: string): Promise<ProjectFeedback[]> {
  let filenames: string[];

  try {
    filenames = await readdir(feedbackDirectory);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return [];
    }
    throw error;
  }

  const entries = await Promise.all(
    filenames
      .filter((filename) => filename.endsWith(".json"))
      .sort()
      .reverse()
      .map(async (filename) => {
        const contents = await readFile(path.join(feedbackDirectory, filename), "utf8");
        return JSON.parse(contents) as ProjectFeedback;
      }),
  );

  return entries.filter((entry) => entry.projectId === projectId);
}

export async function saveProjectFeedback(
  projectId: string,
  input: FeedbackInput,
): Promise<ProjectFeedback | null> {
  const projects = await getProjects();
  if (!projects.some((project) => project.id === projectId)) {
    return null;
  }

  const now = new Date();
  const entry: ProjectFeedback = {
    ...input,
    id: randomUUID(),
    projectId,
    createdAt: now.toISOString(),
  };

  await mkdir(feedbackDirectory, { recursive: true });
  const filename = path.join(feedbackDirectory, `${now.getTime()}-${entry.id}.json`);
  const temporaryFilename = `${filename}.tmp`;

  // Each entry has its own file; readers only see it after the write finishes.
  await writeFile(temporaryFilename, JSON.stringify(entry, null, 2), {
    encoding: "utf8",
    flag: "wx",
  });
  await rename(temporaryFilename, filename);

  return entry;
}
