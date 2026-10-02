import { localTestDatabase } from "./local-test";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

let database: ReturnType<typeof createDatabase> | null = null;

function createDatabase() {
  if(process.env.VERCEL_ENV==="preview"&&process.env.NOVA_DATABASE_ENV!=="test")throw new Error("PREVIEW_TEST_DATABASE_REQUIRED");
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_NOT_CONFIGURED");
  return drizzle(neon(url), { schema });
}

export function getDb() {
  if (!database) database = process.env.NOVA_LOCAL_TEST_DB_PATH ? localTestDatabase() as unknown as ReturnType<typeof createDatabase> : createDatabase();
  return database;
}

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL || (process.env.NODE_ENV!=="production" && process.env.NOVA_LOCAL_TEST_DB_PATH));
}

export const LEGACY_DEMO_ORGANIZATION_ID = "00000000-0000-4000-8000-000000000001";
