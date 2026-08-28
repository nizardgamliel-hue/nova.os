import { z } from "zod";
import { permissions } from "./permissions";
export const companySchema=z.object({name:z.string().trim().min(2).max(120),industry:z.string().trim().min(2).max(120),country:z.string().trim().min(2).max(80),language:z.string().trim().min(2).max(12).default("fr"),timezone:z.string().trim().min(2).max(80).default("Europe/Paris")}).strict();
export const profileSchema=z.object({name:z.string().trim().min(2).max(120),image:z.string().url().max(500).nullable().optional(),locale:z.string().trim().min(2).max(12).optional(),timezone:z.string().trim().min(2).max(80).optional()}).strict();
export const roleSchema=z.enum(["OWNER","ADMIN","MANAGER","MEMBER","VIEWER"]);
export const invitationSchema=z.object({email:z.string().email().max(254).transform(v=>v.toLowerCase()),role:roleSchema.exclude(["OWNER"])}).strict();
export const permissionSchema=z.enum(permissions);
export const slugify=(value:string)=>value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,48)||"entreprise";
