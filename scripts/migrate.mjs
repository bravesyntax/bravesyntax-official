// Applies one SQL migration file to the Neon database: node scripts/migrate.mjs db/migrations/<file>.sql
// Statements are split on ";" at line ends, so keep each statement ending with ";" + newline.
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
}
const file = process.argv[2];
if (!file) throw new Error("Usage: node scripts/migrate.mjs <file.sql>");
const sql = neon(process.env.DATABASE_URL);
const statements = readFileSync(file, "utf8")
  .split(/;\s*\r?\n/)
  .map((s) => s.replace(/^\s*--.*$/gm, "").trim())
  .filter(Boolean);
for (const s of statements) await sql.query(s);
console.log(`Applied ${statements.length} statement(s) from ${file}`);
