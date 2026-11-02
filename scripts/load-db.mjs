// Loads db/schema.sql + db/data.sql into the Neon database in DATABASE_URL.
// Usage: node --env-file=.env.local scripts/load-db.mjs [--force]
// Refuses to run if any app table already has rows, unless --force is passed
// (schema.sql drops and recreates every table).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "@neondatabase/serverless";

const dbDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "db");
const schema = fs.readFileSync(path.join(dbDir, "schema.sql"), "utf8");
const data = fs.readFileSync(path.join(dbDir, "data.sql"), "utf8");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();
try {
  if (!process.argv.includes("--force")) {
    const { rows } = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'",
    );
    for (const { table_name } of rows) {
      const { rows: c } = await client.query(`SELECT EXISTS (SELECT 1 FROM "${table_name}") AS has_rows`);
      if (c[0].has_rows) {
        console.error(`Table "${table_name}" already has data. Re-run with --force to drop and reload everything.`);
        process.exit(1);
      }
    }
  }
  await client.query("BEGIN");
  await client.query(schema);
  await client.query(data);
  await client.query("COMMIT");

  const { rows } = await client.query(
    "SELECT relname AS table, n_live_tup AS rows FROM pg_stat_user_tables ORDER BY relname",
  );
  console.log("Loaded. Tables:", rows.map((r) => r.table).join(", "));
} catch (err) {
  await client.query("ROLLBACK").catch(() => {});
  console.error("Load failed, rolled back:", err.message);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
