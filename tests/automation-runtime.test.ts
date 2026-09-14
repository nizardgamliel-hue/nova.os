import assert from "node:assert/strict";
import test from "node:test";
import { MAX_AUTOMATION_DEPTH, canPropagateChildEvent, childEventIdempotencyKey, childEventLineage, evaluateConditions } from "../lib/nova/automation-engine";

test("automation conditions support ALL and ANY",()=>{
  const context={contact:{status:"qualified",score:90}};
  assert.equal(evaluateConditions({mode:"ALL",items:[{path:"contact.status",operator:"equals",value:"qualified"},{path:"contact.score",operator:"greaterThan",value:80}]},context),true);
  assert.equal(evaluateConditions({mode:"ANY",items:[{path:"contact.status",operator:"equals",value:"lost"},{path:"contact.score",operator:"greaterThan",value:80}]},context),true);
});

test("child lineage preserves root, assigns parent and increments depth",()=>{
  assert.deepEqual(childEventLineage({id:"11111111-1111-4111-8111-111111111111",rootExecutionId:"22222222-2222-4222-8222-222222222222",depth:3}),{rootExecutionId:"22222222-2222-4222-8222-222222222222",parentEventId:"11111111-1111-4111-8111-111111111111",depth:4});
});

test("recursive event propagation stops beyond the configured maximum",()=>{
  for(let depth=0;depth<MAX_AUTOMATION_DEPTH;depth++)assert.equal(canPropagateChildEvent(depth),true);
  assert.equal(canPropagateChildEvent(MAX_AUTOMATION_DEPTH),false);
});

test("child event idempotency is deterministic per source automation step",()=>{
  const key=childEventIdempotencyKey("event","automation","emit","deal.created");
  assert.equal(key,"event:automation:emit:deal.created");
  assert.equal(childEventIdempotencyKey("event","automation","emit","deal.created"),key);
  assert.notEqual(childEventIdempotencyKey("event","automation","other","deal.created"),key);
});
