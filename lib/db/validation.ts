import { z } from "zod";

export const uuidSchema = z.string().uuid();
const optionalText = z.string().trim().max(2000).nullable().optional();

export const contactInputSchema = z.object({
  organizationId: uuidSchema.optional(),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  company: z.string().trim().min(1).max(160),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().regex(/^\+?[0-9 .()\-]{6,30}$/).nullable().optional(),
  status: z.enum(["new", "qualified", "contacted", "customer", "inactive"]).default("new"),
  source: z.string().trim().min(1).max(100).default("manual"),
  tags: z.array(z.string().trim().min(1).max(50)).max(20).default([]),
  notes: optionalText,
  lastActivityAt: z.coerce.date().nullable().optional(),
  demo: z.boolean().default(false),
});

export const contactPatchSchema = z.object({
  organizationId: uuidSchema.optional(), firstName:z.string().trim().min(1).max(100).optional(), lastName:z.string().trim().min(1).max(100).optional(), company:z.string().trim().min(1).max(160).optional(), email:z.string().trim().email().max(254).optional(), phone:z.string().trim().regex(/^\+?[0-9 .()\-]{6,30}$/).nullable().optional(), status:z.enum(["new","qualified","contacted","customer","inactive"]).optional(), source:z.string().trim().min(1).max(100).optional(), tags:z.array(z.string().trim().min(1).max(50)).max(20).optional(), notes:optionalText, lastActivityAt:z.coerce.date().nullable().optional(), demo:z.boolean().optional(),
}).refine(value => Object.keys(value).length > 0, "Aucune modification");

export const dealInputSchema = z.object({
  organizationId: uuidSchema.optional(),
  contactId: uuidSchema.nullable().optional(),
  title: z.string().trim().min(2).max(180),
  company: z.string().trim().min(1).max(160),
  value: z.coerce.number().finite().min(0).max(999999999999),
  currency: z.string().trim().length(3).transform(value => value.toUpperCase()).default("EUR"),
  stage: z.enum(["new", "qualified", "proposal", "negotiation", "won", "lost"]).default("new"),
  probability: z.coerce.number().int().min(0).max(100).default(10),
  expectedCloseDate: z.coerce.date().nullable().optional(),
  notes: optionalText,
  demo: z.boolean().default(false),
});

export const dealPatchSchema = z.object({
  organizationId:uuidSchema.optional(), contactId:uuidSchema.nullable().optional(), title:z.string().trim().min(2).max(180).optional(), company:z.string().trim().min(1).max(160).optional(), value:z.coerce.number().finite().min(0).max(999999999999).optional(), currency:z.string().trim().length(3).transform(value=>value.toUpperCase()).optional(), stage:z.enum(["new","qualified","proposal","negotiation","won","lost"]).optional(), probability:z.coerce.number().int().min(0).max(100).optional(), expectedCloseDate:z.coerce.date().nullable().optional(), notes:optionalText, demo:z.boolean().optional(),
}).refine(value => Object.keys(value).length > 0, "Aucune modification");
