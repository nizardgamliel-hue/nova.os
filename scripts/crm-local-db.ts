import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { resolve } from "node:path";
async function main(){const path=resolve(process.env.NOVA_LOCAL_TEST_DB_PATH||"/tmp/nova-crm-pilot-test");if(process.env.NODE_ENV==="production"||(!path.startsWith("/tmp/nova-")&&!path.startsWith("/workspace/nova-")))throw Error("TEST_PATH_REQUIRED");const db=new PGlite(path);await migrate(drizzle(db),{migrationsFolder:"./drizzle"});console.log(`Base de test locale migrée : ${path}. Aucune base distante utilisée.`);await db.close();}void main();
