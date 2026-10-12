import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { proxy } from "../proxy";

test("proxy redirects an anonymous protected page without initializing application auth", () => {
  const response = proxy(new NextRequest("https://preview.example.test/app"));
  assert.equal(response.status, 307);
  assert.equal(response.headers.get("location"), "https://preview.example.test/login?next=%2Fapp");
});

test("proxy rejects an anonymous protected API request", async () => {
  const response = proxy(new NextRequest("https://preview.example.test/api/crm/pilot"));
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "UNAUTHORIZED" });
});

test("proxy lets a Better Auth session cookie reach the server-side authorization checks", () => {
  const request = new NextRequest("https://preview.example.test/app", { headers: { cookie: "__Secure-better-auth.session_token=unverified-routing-token" } });
  const response = proxy(request);
  assert.equal(response.headers.get("x-middleware-next"), "1");
});
