import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { getDb } from "@/lib/db";
import * as schema from "@/lib/db/schema";

export const auth=betterAuth({
  database:drizzleAdapter(getDb(),{provider:"pg",schema}),
  secret:process.env.BETTER_AUTH_SECRET,
  baseURL:process.env.BETTER_AUTH_URL||(process.env.VERCEL_URL?`https://${process.env.VERCEL_URL}`:"http://localhost:3000"),
  trustedOrigins:["https://guyf.vercel.app","http://localhost:3000"],
  emailAndPassword:{enabled:true,minPasswordLength:10},
  user:{additionalFields:{locale:{type:"string",required:false,defaultValue:"fr"},timezone:{type:"string",required:false,defaultValue:"Europe/Paris"}}},
  session:{expiresIn:60*60*24*7,updateAge:60*60*24},
  advanced:{database:{generateId:"uuid"},useSecureCookies:process.env.NODE_ENV==="production"},
  plugins:[nextCookies()],
});
