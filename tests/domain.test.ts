import test from "node:test";
import assert from "node:assert/strict";
import { contactInputSchema, dealInputSchema, dealPatchSchema } from "../lib/db/validation";
import { calculateProgress, getModuleAudit } from "../lib/system-status";

test("contact validation accepts a complete valid contact",()=>{
  const value=contactInputSchema.parse({firstName:"Ada",lastName:"Lovelace",company:"Nova",email:"ada@nova.test",phone:"+33 6 12 34 56 78"});
  assert.equal(value.status,"new");assert.equal(value.demo,false);
});

test("contact validation rejects an invalid email",()=>{
  assert.equal(contactInputSchema.safeParse({firstName:"Ada",lastName:"Lovelace",company:"Nova",email:"invalid"}).success,false);
});

test("deal validation rejects negative value and unsupported stage",()=>{
  assert.equal(dealInputSchema.safeParse({title:"Deal",company:"Nova",value:-1,stage:"closed"}).success,false);
});

test("deal patch accepts persistent kanban stage update",()=>{
  assert.deepEqual(dealPatchSchema.parse({stage:"negotiation"}),{stage:"negotiation"});
});

test("system status audits all business and SaaS modules and derives progress",()=>{
  const modules=getModuleAudit();assert.equal(modules.length,64);const progress=calculateProgress(modules);assert.ok(progress>=0&&progress<=100);
});
