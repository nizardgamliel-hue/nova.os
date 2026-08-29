import test from "node:test";
import assert from "node:assert/strict";
import { novaToolRegistry } from "../lib/nova/tool-registry";
import { conversationTitle } from "../lib/nova/conversations";
import { buildNovaInstructions } from "../lib/nova/system-instructions";
import { getNovaModel } from "../lib/nova/ai-provider";

test("Prompt 5 tool registry is strictly read-only and low risk",()=>{assert.ok(novaToolRegistry.length>=8);assert.ok(novaToolRegistry.every(item=>item.mode==="READ_ONLY"&&item.riskLevel==="LOW"));assert.ok(novaToolRegistry.some(item=>item.id==="crm.pipeline.summary"));assert.ok(novaToolRegistry.some(item=>item.id==="business.getBrief"))});
test("Nova instructions prohibit fabrication, writes and tenant bypass",()=>{const value=buildNovaInstructions("tenant A");assert.match(value,/Never fabricate/i);assert.match(value,/READ-ONLY/i);assert.match(value,/active organization/i);assert.match(value,/language of the user's latest message/i)});
test("Conversation title is deterministic and bounded",()=>{assert.equal(conversationTitle("Ask Nova: Summarize my pipeline"),"Summarize my pipeline");assert.ok(conversationTitle("x".repeat(100)).length<=56)});
test("Provider profiles remain centralized and configurable through Vercel AI Gateway",()=>{const fast=getNovaModel("FAST"),reasoning=getNovaModel("REASONING");assert.equal(fast.provider,"vercel-ai-gateway");assert.equal(reasoning.provider,"vercel-ai-gateway");assert.ok(fast.model.length>0);assert.ok(reasoning.model.length>0)});
