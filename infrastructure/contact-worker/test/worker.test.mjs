import test from "node:test";
import assert from "node:assert/strict";
import worker from "../src/worker.mjs";

const ORIGIN = "https://kestrelridgehealth.com";
const URL = "https://example.workers.dev/submit";
const standard = {
  name: "Test Person",
  organization: "Sample Practice",
  email: "test@example.com",
  message: "I'd like to learn about Phase Zero staffing.",
  turnstileToken: "synthetic-test-token",
};
const env = {
  TURNSTILE_SECRET: "synthetic-unit-test-secret",
  RESEND_API_KEY: "synthetic-resend-key",
};
const validChallenge = {
  success: true,
  hostname: "kestrelridgehealth.com",
  action: "krh_contact",
};

function createRequest(method = "POST", fields = standard, options = {}) {
  const headers = { origin: options.origin ?? ORIGIN };
  let body;
  if (method === "OPTIONS") {
    headers["access-control-request-method"] = "POST";
    headers["access-control-request-headers"] = "content-type";
  } else if (method === "POST") {
    const contentType = options.contentType ?? "application/json";
    headers["content-type"] = contentType;
    body = contentType === "application/x-www-form-urlencoded"
      ? new URLSearchParams(fields).toString()
      : JSON.stringify(fields);
  }
  return new Request(URL, { method, headers, body });
}

function mockTransport(t, { challenge = validChallenge, deliveryStatus = 200 } = {}) {
  const calls = { verification: 0, emails: [] };
  t.mock.method(globalThis, "fetch", async (url, options) => {
    if (url === "https://challenges.cloudflare.com/turnstile/v0/siteverify") {
      calls.verification++;
      return Response.json(challenge);
    }
    assert.equal(url, "https://api.resend.com/emails");
    assert.equal(options.method, "POST");
    assert.equal(options.headers.Authorization, "Bearer synthetic-resend-key");
    calls.emails.push(JSON.parse(options.body));
    return Response.json({}, { status: deliveryStatus });
  });
  return calls;
}

test("rejects GET before parsing a body", async () => {
  const response = await worker.fetch(createRequest("GET"), {});
  assert.equal(response.status, 405);
});

test("an empty browser preflight permits JSON POST from KRH without external calls", async (t) => {
  const calls = mockTransport(t);
  const response = await worker.fetch(createRequest("OPTIONS"), {});
  assert.equal(response.status, 204);
  assert.equal(await response.text(), "");
  assert.equal(response.headers.get("access-control-allow-origin"), ORIGIN);
  assert.equal(response.headers.get("access-control-allow-methods"), "POST, OPTIONS");
  assert.equal(response.headers.get("access-control-allow-headers"), "Content-Type");

  const rejected = await worker.fetch(createRequest("OPTIONS", standard, { origin: "https://evil.example" }), {});
  assert.equal(rejected.status, 403);
  assert.equal(rejected.headers.has("access-control-allow-origin"), false);
  assert.deepEqual(calls, { verification: 0, emails: [] });
});

test("rejects unauthorized origins before parsing malformed input", async () => {
  const request = new Request(URL, {
    method: "POST",
    headers: { origin: "https://evil.example", "content-type": "application/json" },
    body: "invalid JSON",
  });
  const response = await worker.fetch(request, {});
  assert.equal(response.status, 403);
});

test("rejects invalid input without sending", async (t) => {
  const calls = mockTransport(t);
  const fields = { ...standard, email: "not-an-email" };
  const response = await worker.fetch(createRequest("POST", fields), env);
  assert.equal(response.status, 400);
  assert.deepEqual(calls, { verification: 0, emails: [] });
});

test("rejects missing Turnstile token", async (t) => {
  const calls = mockTransport(t);
  const fields = { ...standard, turnstileToken: "" };
  const response = await worker.fetch(createRequest("POST", fields), env);
  assert.equal(response.status, 403);
  assert.deepEqual(calls, { verification: 0, emails: [] });
});

test("rejects invalid or mismatched Turnstile challenges", async (t) => {
  const calls = mockTransport(t, {
    challenge: { success: true, hostname: "evil.example", action: "krh_contact" },
  });
  const response = await worker.fetch(createRequest(), env);
  assert.equal(response.status, 403);
  assert.deepEqual(calls, { verification: 1, emails: [] });
});

test("sends only to the fixed Outlook mailbox and acknowledges provider acceptance", async (t) => {
  const calls = mockTransport(t);
  const response = await worker.fetch(createRequest(), env);
  assert.equal(response.status, 202);
  assert.deepEqual(await response.json(), { ok: true, status: "accepted_for_delivery" });
  assert.equal(calls.verification, 1);
  assert.equal(calls.emails.length, 1);
  assert.deepEqual(calls.emails[0].to, ["twagenberg@kestrelridgehealth.com"]);
  assert.equal(calls.emails[0].reply_to, "test@example.com");
  assert.match(calls.emails[0].text, /Sample Practice/);
});

test("supports a form-encoded POST with the standard Turnstile field", async (t) => {
  const calls = mockTransport(t);
  const { turnstileToken, ...contact } = standard;
  const fields = { ...contact, "cf-turnstile-response": turnstileToken };
  const response = await worker.fetch(
    createRequest("POST", fields, { contentType: "application/x-www-form-urlencoded" }),
    env,
  );
  assert.equal(response.status, 202);
  assert.equal(calls.verification, 1);
  assert.equal(calls.emails.length, 1);
});

test("honeypot silently acknowledges the request without provider delivery", async (t) => {
  const calls = mockTransport(t);
  const response = await worker.fetch(createRequest("POST", { ...standard, website: "bot" }), env);
  assert.equal(response.status, 202);
  assert.deepEqual(await response.json(), { ok: true, status: "accepted_for_delivery" });
  assert.deepEqual(calls, { verification: 0, emails: [] });
});

test("reports provider send failure without acknowledging acceptance", async (t) => {
  const calls = mockTransport(t, { deliveryStatus: 503 });
  t.mock.method(console, "error", () => {});
  const response = await worker.fetch(createRequest(), env);
  assert.equal(response.status, 502);
  assert.equal((await response.json()).ok, false);
  assert.equal(calls.emails.length, 1);
});

test("staging without TURNSTILE_SECRET can accept valid input", async (t) => {
  const calls = mockTransport(t);
  const warning = t.mock.method(console, "warn", () => {});
  const { turnstileToken, ...fields } = standard;
  const response = await worker.fetch(createRequest("POST", fields), { RESEND_API_KEY: env.RESEND_API_KEY });
  assert.equal(response.status, 202);
  assert.equal(calls.verification, 0);
  assert.equal(calls.emails.length, 1);
  assert.match(warning.mock.calls[0].arguments[0], /TURNSTILE_SECRET/);
});

test("staging still rejects invalid email when TURNSTILE_SECRET is absent", async (t) => {
  const calls = mockTransport(t);
  const response = await worker.fetch(createRequest("POST", { ...standard, email: "not-valid" }), {});
  assert.equal(response.status, 400);
  assert.deepEqual(calls, { verification: 0, emails: [] });
});
