import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { FeedbackInput, ProjectFeedback } from "./data";
import { getDatabase } from "./database";
import { getProject } from "./store";

const feedbackDirectory = path.join(process.cwd(), ".local-data", "feedback");

type FeedbackRow = Omit<ProjectFeedback, "createdAt"> & { createdAt: Date | string };

function toFeedback(row: FeedbackRow): ProjectFeedback {
  return { ...row, createdAt: new Date(row.createdAt).toISOString() };
}

export async function getProjectFeedback(projectId: string): Promise<ProjectFeedback[]> {
  const sql = getDatabase();
  if (sql) {
    const rows = await sql`
      SELECT id, project_id AS "projectId", author, message, created_at AS "createdAt"
      FROM project_feedback
      WHERE project_id = ${projectId}
      ORDER BY created_at DESC, id DESC
    `;
    return (rows as FeedbackRow[]).map(toFeedback);
  }

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
  const sql = getDatabase();
  if (sql) {
    // Selecting the project and inserting happen in one SQL statement.
    const rows = await sql`
      INSERT INTO project_feedback (id, project_id, author, message)
      SELECT ${randomUUID()}::uuid, id, ${input.author}, ${input.message}
      FROM projects
      WHERE id = ${projectId}
      RETURNING id, project_id AS "projectId", author, message, created_at AS "createdAt"
    `;
    const row = rows[0] as FeedbackRow | undefined;
    return row ? toFeedback(row) : null;
  }

  if (!(await getProject(projectId))) {
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
