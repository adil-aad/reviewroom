import "server-only";

import { neon } from "@neondatabase/serverless";

export function getDatabase() {
  const connectionString = process.env.DATABASE_URL?.trim();

  // Without a connection string, this lesson still uses the local JSON store.
  return connectionString ? neon(connectionString) : null;
}
