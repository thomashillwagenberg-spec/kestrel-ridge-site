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
function createRequest(method = "POST", fields = standard, options = {}) {
  const headers = {
    origin: options.origin === undefined ? ORIGIN : options.origin,
    "content-type": options.contentType || "application/json",
  };
  const body = method === "POST"
    ? (options.contentType === "application/x-www-form-urlencoded"
      ? new URLSearchParams(fields).toString()
      : JSON.stringify(fields))
    : undefined;
  return new Request(options.url || URL, { method, headers, body });
}
function emailEnv(send) {
  return {
    TURNSTILE_SECRET: "synthetic-unit-test-secret",
    EMAIL: { send },
  };
}
function simulateSiteverify(result) {
  const oldFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify(result));
  return () => { globalThis.fetch = oldFetch; };
}
const validChallenge = {
  success: true,
  hostname: "kestrelridgehealth.com",
  action: "krh_contact",
};

test("rejects GET, preventing a URL-based intake", async () => {
  const response = await worker.fetch(createRequest("GET"), {});
  assert.equal(response.status, 405);
});

test("preflight has no response body and is origin-restricted", async () => {
  const response = await worker.fetch(createRequest("OPTIONS"), {});
  assert.equal(response.status, 204);
  assert.equal(await response.text(), "");
  const rejected = await worker.fetch(createRequest("OPTIONS", standard, { origin: "https://evil.example" }), {});
  assert.equal(rejected.status, 403);
});

test("rejects an unauthorized origin before validating data", async () => {
  const response = await worker.fetch(createRequest("POST", standard, { origin: "https://evil.example" }), {});
  assert.equal(response.status, 403);
});

test("rejects invalid input without sending", async () => {
  let count = 0;
  const fields = { ...standard, email: "not-an-email" };
  const response = await worker.fetch(createRequest("POST", fields), emailEnv(async () => { count++; }));
  assert.equal(response.status, 400);
  assert.equal(count, 0);
});

test("rejects missing Turnstile token", async () => {
  const fields = { ...standard, turnstileToken: "" };
  const response = await worker.fetch(createRequest("POST", fields), emailEnv(async () => {}));
  assert.equal(response.status, 403);
});

test("rejects invalid or mismatched Turnstile challenges", async () => {
  const restore = simulateSiteverify({
    success: true, hostname: "evil.example", action: "krh_contact",
  });
  try {
    const response = await worker.fetch(createRequest(), emailEnv(async () => {}));
    assert.equal(response.status, 403);
  } finally { restore(); }
});

test("sends only to the fixed Outlook mailbox and does not claim mailbox delivery", async () => {
  const restore = simulateSiteverify(validChallenge);
  let email;
  try {
    const response = await worker.fetch(createRequest(), emailEnv(async (message) => {
      email = message;
      return { messageId: "synthetic-id" };
    }));
    assert.equal(response.status, 202);
    const body = await response.json();
    assert.deepEqual(body, { ok: true, status: "accepted_for_delivery" });
    assert.equal(email.to, "twagenberg@kestrelridgehealth.com");
    assert.equal(email.replyTo, "test@example.com");
    assert.match(email.text, /Sample Practice/);
  } finally { restore(); }
});

test("supports form-encoded POST but never a GET fallback", async () => {
  const restore = simulateSiteverify(validChallenge);
  let count = 0;
  try {
    const fields = {
      ...standard,
      "cf-turnstile-response": standard.turnstileToken,
      turnstileToken: undefined,
    };
    delete fields.turnstileToken;
    const response = await worker.fetch(
      createRequest("POST", fields, { contentType: "application/x-www-form-urlencoded" }),
      emailEnv(async () => { count++; }),
    );
    assert.equal(response.status, 202);
    assert.equal(count, 1);
  } finally { restore(); }
});

test("reports send failure instead of falsely acknowledging delivery", async () => {
  const restore = simulateSiteverify(validChallenge);
  const originalConsole = console.error;
  console.error = () => {};
  try {
    const response = await worker.fetch(createRequest(), emailEnv(async () => {
      throw Object.assign(new Error("synthetic failure"), { code: "E_DELIVERY_FAILED" });
    }));
    assert.equal(response.status, 502);
    assert.equal((await response.json()).ok, false);
  } finally {
    restore();
    console.error = originalConsole;
  }
});
