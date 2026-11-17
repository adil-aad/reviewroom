import { readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";
import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

async function seedDemo() {
  const connectionString = process.env.DATABASE_URL_UNPOOLED?.trim()
    || process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error("Set DATABASE_URL for the dedicated demo database before seeding.");
  }

  const sql = neon(connectionString);
  const schema = await readFile(new URL("../db/schema.sql", import.meta.url), "utf8");
  const seed = await readFile(new URL("../db/seed.sql", import.meta.url), "utf8");
  const queries = schema.split(";").map((statement) => statement.trim())
    .filter(Boolean).map((statement) => sql.query(statement));

  await sql.transaction([
    ...queries,
    sql.query(seed),
    sql`
      INSERT INTO project_feedback (id, project_id, author, message, created_at)
      VALUES
        ('a4e47b5e-1a4e-4d9c-91a3-019d5ab2e001'::uuid, 'brand-identity',
         'Maji Studio', 'The direction feels right. Could we see the wordmark at a smaller size?',
         '2026-11-17T08:00:00Z'),
        ('a4e47b5e-1a4e-4d9c-91a3-019d5ab2e002'::uuid, 'website-homepage',
         'Northline', 'Approved. The service section is clear and the next step is easy to find.',
         '2026-11-17T09:00:00Z')
      ON CONFLICT (id) DO NOTHING
    `,
  ]);
  console.log("Demo schema and sample records are ready. Existing records were preserved.");
}

await seedDemo().catch(() => {
  console.error("Demo setup failed. Check its DATABASE_URL and database access.");
  process.exitCode = 1;
});
