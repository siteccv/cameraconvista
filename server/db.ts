import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

const databaseUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

function requiresSsl(url: string) {
  return url.includes("supabase.co") || url.includes("pooler.supabase.com");
}

export const pool = databaseUrl
  ? new Pool({
      connectionString: databaseUrl,
      ssl: requiresSsl(databaseUrl) ? { rejectUnauthorized: false } : undefined,
      connectionTimeoutMillis: 5_000,
      idleTimeoutMillis: 30_000,
      query_timeout: 5_000,
      statement_timeout: 5_000,
    })
  : null;

export const db = pool
  ? drizzle(pool, { schema })
  : (null as unknown as ReturnType<typeof drizzle<typeof schema>>);
