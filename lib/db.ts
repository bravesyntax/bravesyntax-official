import "server-only";
import { neon, neonConfig } from "@neondatabase/serverless";
import { withRetry } from "./db-retry";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

neonConfig.fetchFunction = withRetry((input: RequestInfo | URL, init?: RequestInit) => fetch(input, init));

// Tagged-template SQL client over HTTP: sql`SELECT * FROM t WHERE id = ${id}`.
// Interpolated values are sent as bound parameters, never concatenated.
export const sql = neon(process.env.DATABASE_URL);

/** Types a query's rows: `await rows<User>(sql\`SELECT …\`)`. */
export const rows = <T>(query: PromiseLike<unknown>) => query as Promise<T[]>;
