import { spawnSync } from "node:child_process";
// Require an explicit independently supplied test host/database, never infer it from the URL.
if(process.env.NOVA_DATABASE_ENV!=="test")throw Error("Migration refusée : NOVA_DATABASE_ENV=test requis.");
const url=new URL(process.env.DATABASE_URL_UNPOOLED||process.env.DATABASE_URL||"");
if(!process.env.NOVA_TEST_DB_HOST||!process.env.NOVA_TEST_DB_NAME||url.hostname!==process.env.NOVA_TEST_DB_HOST||decodeURIComponent(url.pathname.slice(1))!==process.env.NOVA_TEST_DB_NAME)throw Error("Migration refusée : destination de test non identifiée.");
const r=spawnSync("npx",["--no-install","drizzle-kit","migrate"],{stdio:"inherit",env:process.env});process.exit(r.status??1);
