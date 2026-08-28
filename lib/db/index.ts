import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

let database: ReturnType<typeof createDatabase> | null = null;

function createDatabase() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_NOT_CONFIGURED");
  return drizzle(neon(url), { schema });
}

export function getDb() {
  if (!database) database = createDatabase();
  return database;
}

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export const LEGACY_DEMO_ORGANIZATION_ID = "00000000-0000-4000-8000-000000000001";
