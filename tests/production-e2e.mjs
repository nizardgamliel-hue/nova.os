const baseUrl = process.env.NOVA_E2E_BASE_URL || "https://guyf.vercel.app";
const runId = `codex-${Date.now()}`;
const results = [];
let dealId;
let contactId;

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    cache: "no-store",
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      ...(options.headers || {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  return { response, payload };
}

function check(name, condition, detail) {
  if (!condition) throw new Error(`${name}: ${detail}`);
  results.push({ test: name, status: "PASS", detail });
}

async function cleanup() {
  if (dealId) await request(`/api/crm/deals/${dealId}`, { method: "DELETE" }).catch(() => {});
  if (contactId) await request(`/api/crm/contacts/${contactId}`, { method: "DELETE" }).catch(() => {});
}

try {
  const dealCreate = await request("/api/crm/deals", {
    method: "POST",
    body: JSON.stringify({
      title: `E2E Deal ${runId}`,
      company: "NOVA Validation",
      value: 12500,
      currency: "EUR",
      stage: "new",
      probability: 20,
      notes: "CRM-A production E2E",
    }),
  });
  dealId = dealCreate.payload.data?.id;
  check("CRM-A", dealCreate.response.status === 201 && Boolean(dealId), "création du deal en production");

  const dealRefresh = await request(`/api/crm/deals/${dealId}?refresh=${Date.now()}`);
  check("CRM-B", dealRefresh.response.ok && dealRefresh.payload.data?.title === `E2E Deal ${runId}`, "deal retrouvé après un nouveau GET sans cache");

  const dealMove = await request(`/api/crm/deals/${dealId}`, {
    method: "PATCH",
    body: JSON.stringify({ stage: "proposal" }),
  });
  const dealMoveRefresh = await request(`/api/crm/deals/${dealId}?refresh=${Date.now()}`);
  check("CRM-C", dealMove.response.ok && dealMoveRefresh.payload.data?.stage === "proposal", "déplacement Kanban vers proposal persisté après refresh");

  const dealEdit = await request(`/api/crm/deals/${dealId}`, {
    method: "PATCH",
    body: JSON.stringify({ title: `E2E Deal modifié ${runId}`, value: 17650, probability: 65 }),
  });
  const dealEditRefresh = await request(`/api/crm/deals/${dealId}?refresh=${Date.now()}`);
  check("CRM-D", dealEdit.response.ok && dealEditRefresh.payload.data?.title === `E2E Deal modifié ${runId}` && Number(dealEditRefresh.payload.data?.value) === 17650 && dealEditRefresh.payload.data?.probability === 65, "modifications persistées après refresh");

  const dealDelete = await request(`/api/crm/deals/${dealId}`, { method: "DELETE" });
  const dealDeleteRefresh = await request(`/api/crm/deals/${dealId}?refresh=${Date.now()}`);
  check("CRM-E", dealDelete.response.ok && dealDeleteRefresh.response.status === 404, "suppression persistée après refresh");
  dealId = undefined;

  const contactCreate = await request("/api/crm/contacts", {
    method: "POST",
    body: JSON.stringify({
      firstName: "Validation",
      lastName: runId,
      company: "NOVA E2E Atelier",
      email: `${runId}@example.com`,
      phone: "+33102030405",
      status: "new",
      source: "e2e-production",
      tags: ["validation", runId],
      notes: "PROS-A production E2E",
    }),
  });
  contactId = contactCreate.payload.data?.id;
  check("PROS-A", contactCreate.response.status === 201 && Boolean(contactId), "création du contact en production");

  const contactRefresh = await request(`/api/crm/contacts/${contactId}?refresh=${Date.now()}`);
  check("PROS-B", contactRefresh.response.ok && contactRefresh.payload.data?.email === `${runId}@example.com`, "contact retrouvé après un nouveau GET sans cache");

  const search = await request(`/api/crm/contacts?q=${encodeURIComponent(runId)}&status=new&refresh=${Date.now()}`);
  check("PROS-C", search.response.ok && search.payload.data?.length === 1 && search.payload.data[0].id === contactId, "recherche et filtre de statut exécutés sur PostgreSQL");

  const contactEdit = await request(`/api/crm/contacts/${contactId}`, {
    method: "PATCH",
    body: JSON.stringify({ company: "NOVA E2E Modifiée", status: "qualified", notes: "Modification persistante" }),
  });
  const contactEditRefresh = await request(`/api/crm/contacts/${contactId}?refresh=${Date.now()}`);
  const contactDelete = await request(`/api/crm/contacts/${contactId}`, { method: "DELETE" });
  const contactDeleteRefresh = await request(`/api/crm/contacts/${contactId}?refresh=${Date.now()}`);
  check("PROS-D", contactEdit.response.ok && contactEditRefresh.payload.data?.company === "NOVA E2E Modifiée" && contactEditRefresh.payload.data?.status === "qualified" && contactDelete.response.ok && contactDeleteRefresh.response.status === 404, "modification puis suppression persistées après refresh");
  contactId = undefined;

  console.table(results);
  console.log(JSON.stringify({ baseUrl, runId, passed: results.length, failed: 0, results }, null, 2));
} catch (error) {
  console.error(error);
  console.log(JSON.stringify({ baseUrl, runId, passed: results.length, failed: 9 - results.length, results }, null, 2));
  process.exitCode = 1;
} finally {
  await cleanup();
}
