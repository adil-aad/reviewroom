import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { neon } from "@neondatabase/serverless";
import nextEnv from "@next/env";

// Scripts run outside Next.js, so load its environment files explicitly.
nextEnv.loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

async function readLocalRecords(folder, fields) {
  const directory = path.join(process.cwd(), ".local-data", folder);
  let filenames;
  try {
    filenames = await readdir(directory);
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }

  return Promise.all(
    filenames
      .filter((filename) => filename.endsWith(".json"))
      .sort()
      .map(async (filename) => {
        const contents = await readFile(path.join(directory, filename), "utf8");
        const record = JSON.parse(contents);
        if (!record || !fields.every((field) => typeof record[field] === "string")) {
          throw new Error(`Invalid local ${folder} record: ${filename}`);
        }
        return { record, filename };
      }),
  );
}

async function setupDatabase() {
  // Schema setup uses the direct URL; ordinary app queries use DATABASE_URL.
  const connectionString = process.env.DATABASE_URL_UNPOOLED?.trim()
    || process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    console.error("Set DATABASE_URL in .env.local before running db:setup. The app can still use local files.");
    process.exitCode = 1;
    return;
  }

  const sql = neon(connectionString);
  const schema = await readFile(new URL("../db/schema.sql", import.meta.url), "utf8");
  const seed = await readFile(new URL("../db/seed.sql", import.meta.url), "utf8");
  // This schema contains only simple DDL statements, with no embedded semicolons.
  const schemaQueries = schema
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean)
    .map((statement) => sql.query(statement));

  const savedProjects = await readLocalRecords("projects", [
    "id", "name", "client", "description", "status",
  ]);
  const savedFeedback = await readLocalRecords("feedback", [
    "id", "projectId", "author", "message", "createdAt",
  ]);

  // Sorting above and keeping the last record matches the local store's newest copy.
  const projects = [...new Map(savedProjects.map((entry) => [entry.record.id, entry])).values()];
  const projectQueries = projects.map(({ record, filename }) => {
    const timestamp = filename.match(/^(\d+)-/);
    const createdAt = timestamp
      ? new Date(Number(timestamp[1])).toISOString()
      : "2000-01-01T00:00:00.000Z";
    return sql`
      INSERT INTO projects (id, name, client, description, status, created_at)
      VALUES (${record.id}, ${record.name}, ${record.client}, ${record.description}, ${record.status}, ${createdAt})
      ON CONFLICT (id) DO NOTHING
      RETURNING id
    `;
  });
  const feedbackQueries = savedFeedback.map(({ record }) => sql`
    INSERT INTO project_feedback (id, project_id, author, message, created_at)
    VALUES (${record.id}::uuid, ${record.projectId}, ${record.author}, ${record.message}, ${record.createdAt})
    ON CONFLICT (id) DO NOTHING
    RETURNING id
  `);

  // Import saved projects before seeding, preserving locally edited starter statuses.
  // A failure rolls back the whole setup, including imported records.
  const results = await sql.transaction([
    ...schemaQueries,
    ...projectQueries,
    sql.query(seed),
    ...feedbackQueries,
  ]);
  const projectEnd = schemaQueries.length + projectQueries.length + 1;
  const projectCount = results
    .slice(schemaQueries.length, projectEnd)
    .reduce((sum, rows) => sum + rows.length, 0);
  const feedbackCount = results
    .slice(projectEnd)
    .reduce((sum, rows) => sum + rows.length, 0);
  console.log(`Database ready. Added ${projectCount} projects and ${feedbackCount} feedback entries. Existing IDs kept.`);
  console.log("Local JSON files were kept. Restart the app to use DATABASE_URL.");
}

await setupDatabase().catch((error) => {
  console.error("Database setup failed. Check DATABASE_URL, database access, and local JSON records.");
  if (typeof error.code === "string") console.error(`Database error code: ${error.code}`);
  process.exitCode = 1;
});
