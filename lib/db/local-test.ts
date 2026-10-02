import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { resolve } from "node:path";
import * as schema from "./schema";
export function localTestDatabase(){
 const path=process.env.NOVA_LOCAL_TEST_DB_PATH;
 if(!path||process.env.NODE_ENV==="production")throw new Error("LOCAL_TEST_DATABASE_FORBIDDEN");
 const location=resolve(path);if(!location.startsWith("/tmp/nova-")&&!location.startsWith("/workspace/nova-"))throw new Error("LOCAL_TEST_DATABASE_PATH_REQUIRED");
 const global=globalThis as typeof globalThis & {novaTestDb?:ReturnType<typeof drizzle>};
 if(!global.novaTestDb)global.novaTestDb=drizzle(new PGlite(location),{schema});
 return global.novaTestDb;
}
