import test from "node:test";
import assert from "node:assert/strict";
import worker from "../src/worker.mjs";

// This suite was stale relative to the current worker.mjs contract: it
// referenced an env.EMAIL.send() binding from a design that predates the
// migration to Resend's HTTP API (RESEND_API_KEY + fetch), and never set
// ENVIRONMENT/SENDER_FROM/RATE_LIMITER, so every test failed against the
// current code before this rewrite (confirmed via `node --test`, 10/11
// failing). Rewritten to match the real, current request contract.

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

// A minimal fake Rate Limiting binding — always allows, so tests that
// aren't specifically about rate limiting aren't coupled to it.
function fakeRateLimiter(alwaysSucceed = true) {
  return { limit: async () => ({ success: alwaysSucceed }) };
}

function prodEnv(overrides = {}) {
  return {
    ENVIRONMENT: "production",
    RESEND_API_KEY: "synthetic-test-key",
    TURNSTILE_SECRET: "synthetic-unit-test-secret",
    SENDER_FROM: "KRH Contact <notifications@kestrelridgehealth.com>",
    RATE_LIMITER: fakeRateLimiter(),
    WAITLIST_RATE_LIMITER: fakeRateLimiter(),
    ...overrides,
  };
}

function simulateFetch(responder) {
  const oldFetch = globalThis.fetch;
  globalThis.fetch = responder;
  return () => { globalThis.fetch = oldFetch; };
}
function simulateSiteverify(result) {
  return simulateFetch(async () => new Response(JSON.stringify(result)));
}
function simulateResendSend(ok = true, body = { id: "synthetic" }) {
  // Must still answer siteverify calls with a valid challenge, and Resend
  // calls separately — route by URL.
  return simulateFetch(async (url) => {
    const href = typeof url === "string" ? url : url.url;
    if (href.includes("siteverify")) {
      return new Response(JSON.stringify(validChallenge));
    }
    return new Response(JSON.stringify(body), { status: ok ? 200 : 422 });
  });
}
const validChallenge = {
  success: true,
  hostname: "kestrelridgehealth.com",
  action: "krh_contact",
};

// --- Transport / method / origin basics -----------------------------------

test("rejects GET, preventing a URL-based intake", async () => {
  const response = await worker.fetch(createRequest("GET"), prodEnv());
  assert.equal(response.status, 405);
});

test("preflight has no response body and is origin-restricted", async () => {
  const response = await worker.fetch(createRequest("OPTIONS"), prodEnv());
  assert.equal(response.status, 204);
  assert.equal(await response.text(), "");
  const rejected = await worker.fetch(createRequest("OPTIONS", standard, { origin: "https://evil.example" }), prodEnv());
  assert.equal(rejected.status, 403);
});

test("rejects an unauthorized origin before validating data", async () => {
  const response = await worker.fetch(createRequest("POST", standard, { origin: "https://evil.example" }), prodEnv());
  assert.equal(response.status, 403);
});

// --- Fail-closed configuration gate (PRIORITY 0, this round) ---------------

test("production: refuses ALL traffic with 503 if RESEND_API_KEY is missing, rather than silently degrading", async () => {
  const env = prodEnv({ RESEND_API_KEY: undefined });
  const response = await worker.fetch(createRequest(), env);
  assert.equal(response.status, 503);
  assert.equal((await response.json()).ok, false);
});

test("production: refuses ALL traffic with 503 if TURNSTILE_SECRET is missing", async () => {
  const env = prodEnv({ TURNSTILE_SECRET: undefined });
  const response = await worker.fetch(createRequest(), env);
  assert.equal(response.status, 503);
});

test("production: refuses ALL traffic with 503 if SENDER_FROM is missing or not on an allowed domain", async () => {
  const missing = await worker.fetch(createRequest(), prodEnv({ SENDER_FROM: undefined }));
  assert.equal(missing.status, 503);
  const wrongDomain = await worker.fetch(createRequest(), prodEnv({ SENDER_FROM: "a@not-kestrelridgehealth.example" }));
  assert.equal(wrongDomain.status, 503);
});

test("production: refuses ALL traffic with 503 if RATE_LIMITER binding is missing", async () => {
  const env = prodEnv({ RATE_LIMITER: undefined });
  const response = await worker.fetch(createRequest(), env);
  assert.equal(response.status, 503);
});

test("production: refuses ALL traffic with 503 if WAITLIST_RATE_LIMITER binding is missing", async () => {
  const env = prodEnv({ WAITLIST_RATE_LIMITER: undefined });
  const response = await worker.fetch(createRequest(), env);
  assert.equal(response.status, 503);
});

test("waitlist: uses the dedicated WAITLIST_RATE_LIMITER binding, not RATE_LIMITER", async () => {
  const restore = simulateResendSend(true);
  try {
    let waitlistCalled = false;
    let contactLimiterCalled = false;
    const env = prodEnv({
      WAITLIST_RATE_LIMITER: { limit: async () => { waitlistCalled = true; return { success: true }; } },
      RATE_LIMITER: { limit: async () => { contactLimiterCalled = true; return { success: true }; } },
    });
    const fields = { source: "waitlist", email: "waitlist@example.com" };
    const response = await worker.fetch(createRequest("POST", fields), env);
    assert.equal(response.status, 202);
    assert.equal(waitlistCalled, true);
    assert.equal(contactLimiterCalled, false);
  } finally {
    restore();
  }
});

test("waitlist: 429 once its own (separate, stricter) rate limit is hit", async () => {
  const env = prodEnv({ WAITLIST_RATE_LIMITER: fakeRateLimiter(false) });
  const fields = { source: "waitlist", email: "waitlist@example.com" };
  const response = await worker.fetch(createRequest("POST", fields), env);
  assert.equal(response.status, 429);
});

test("staging: relaxed config gate allows missing secrets (explicit ENVIRONMENT=staging required)", async () => {
  const env = { ENVIRONMENT: "staging" }; // nothing else configured
  const fields = { ...standard, turnstileToken: undefined };
  delete fields.turnstileToken;
  const response = await worker.fetch(createRequest("POST", fields), env);
  // No RESEND_API_KEY -> send attempt fails gracefully, never a crash or a
  // false success claim.
  assert.equal(response.status, 502);
  assert.equal((await response.json()).ok, false);
});

test("staging: still rejects invalid email even with relaxed config gate", async () => {
  const env = { ENVIRONMENT: "staging" };
  const fields = { ...standard, email: "not-valid" };
  const response = await worker.fetch(createRequest("POST", fields), env);
  assert.equal(response.status, 400);
});

// --- Input validation --------------------------------------------------

test("rejects invalid input without sending", async () => {
  const restore = simulateResendSend(true);
  try {
    const fields = { ...standard, email: "not-an-email" };
    const response = await worker.fetch(createRequest("POST", fields), prodEnv());
    assert.equal(response.status, 400);
  } finally { restore(); }
});

test("honeypot: silently discards bot submissions without sending", async () => {
  let resendCalled = false;
  const restore = simulateFetch(async (url) => {
    const href = typeof url === "string" ? url : url.url;
    if (href.includes("resend.com")) resendCalled = true;
    return new Response(JSON.stringify({ ok: true }));
  });
  try {
    const fields = { ...standard, website: "I am a bot" };
    const response = await worker.fetch(createRequest("POST", fields), prodEnv());
    assert.equal(response.status, 202);
    assert.equal(resendCalled, false, "honeypot submissions must never reach Resend");
  } finally { restore(); }
});

// --- Turnstile, now mandatory in production -----------------------------

test("production: rejects a missing Turnstile token (no silent skip)", async () => {
  const fields = { ...standard, turnstileToken: "" };
  const response = await worker.fetch(createRequest("POST", fields), prodEnv());
  assert.equal(response.status, 403);
});

test("production: rejects invalid or mismatched Turnstile challenges", async () => {
  const restore = simulateSiteverify({ success: true, hostname: "evil.example", action: "krh_contact" });
  try {
    const response = await worker.fetch(createRequest(), prodEnv());
    assert.equal(response.status, 403);
  } finally { restore(); }
});

test("production: accepts a verified Turnstile challenge and sends via Resend", async () => {
  const restore = simulateResendSend(true);
  try {
    const response = await worker.fetch(createRequest(), prodEnv());
    assert.equal(response.status, 202);
    const body = await response.json();
    assert.deepEqual(body, { ok: true, status: "accepted_for_delivery" });
  } finally { restore(); }
});

test("reports send failure instead of falsely acknowledging delivery", async () => {
  const restore = simulateResendSend(false);
  const originalConsole = console.error;
  console.error = () => {};
  try {
    const response = await worker.fetch(createRequest(), prodEnv());
    assert.equal(response.status, 502);
    assert.equal((await response.json()).ok, false);
  } finally {
    restore();
    console.error = originalConsole;
  }
});

test("supports form-encoded POST but never a GET fallback", async () => {
  const restore = simulateResendSend(true);
  try {
    const fields = { ...standard, "cf-turnstile-response": standard.turnstileToken };
    delete fields.turnstileToken;
    const response = await worker.fetch(
      createRequest("POST", fields, { contentType: "application/x-www-form-urlencoded" }),
      prodEnv(),
    );
    assert.equal(response.status, 202);
  } finally { restore(); }
});

// --- Rate limiting (native Rate Limiting binding, not KV) -----------------

test("production: a rate-limiter success:false result returns 429 without sending", async () => {
  let resendCalled = false;
  const restore = simulateFetch(async (url) => {
    const href = typeof url === "string" ? url : url.url;
    if (href.includes("resend.com")) resendCalled = true;
    return new Response(JSON.stringify(validChallenge));
  });
  try {
    const env = prodEnv({ RATE_LIMITER: fakeRateLimiter(false) });
    const response = await worker.fetch(createRequest(), env);
    assert.equal(response.status, 429);
    assert.equal(resendCalled, false, "a rate-limited request must never reach Resend");
  } finally { restore(); }
});

test("a throwing rate limiter fails OPEN for that request (internal fault != reject legitimate inquiry)", async () => {
  const restore = simulateResendSend(true);
  try {
    const env = prodEnv({ RATE_LIMITER: { limit: async () => { throw new Error("transient infra fault"); } } });
    const originalWarn = console.warn;
    console.warn = () => {};
    try {
      const response = await worker.fetch(createRequest(), env);
      assert.equal(response.status, 202, "a limiter runtime error must not block a legitimate inquiry");
    } finally { console.warn = originalWarn; }
  } finally { restore(); }
});

// --- Waitlist path ---------------------------------------------------------

test("waitlist: honeypot discards without sending", async () => {
  let resendCalled = false;
  const restore = simulateFetch(async (url) => {
    const href = typeof url === "string" ? url : url.url;
    if (href.includes("resend.com")) resendCalled = true;
    return new Response(JSON.stringify({ ok: true }));
  });
  try {
    const fields = { source: "waitlist", email: "a@b.com", website: "bot" };
    const response = await worker.fetch(createRequest("POST", fields), prodEnv());
    assert.equal(response.status, 202);
    assert.equal(resendCalled, false);
  } finally { restore(); }
});

test("waitlist: rejects an invalid email", async () => {
  const fields = { source: "waitlist", email: "not-an-email" };
  const response = await worker.fetch(createRequest("POST", fields), prodEnv());
  assert.equal(response.status, 400);
});

test("waitlist: not blocked by the separate contact-path rate limiter", async () => {
  const restore = simulateResendSend(true);
  try {
    const env = prodEnv({ RATE_LIMITER: fakeRateLimiter(false) }); // contact path exhausted
    const fields = { source: "waitlist", email: "a@b.com" };
    const response = await worker.fetch(createRequest("POST", fields), env);
    assert.equal(response.status, 202); // waitlist's own limiter (WAITLIST_RATE_LIMITER) is untouched
  } finally {
    restore();
  }
});

test("waitlist: accepts and sends a valid, non-bot submission", async () => {
  const restore = simulateResendSend(true);
  try {
    const fields = { source: "waitlist", email: "real@example.com" };
    const response = await worker.fetch(createRequest("POST", fields), prodEnv());
    assert.equal(response.status, 202);
  } finally { restore(); }
});
