// Tests for inquiry IDs, dedup and fail-safe CRM recording.
// All network is stubbed: no real CRM, no real Resend, no real Turnstile.
import test from "node:test";
import assert from "node:assert/strict";
import worker from "../src/worker.mjs";
import {
  INQUIRY_ID_PATTERN,
  DEDUP_BUCKET_MS,
  CRM_MAX_ATTEMPTS,
  buildCrmRow,
  crmConfigured,
  deriveInquiryIdentity,
  recordInquiryInCrm,
} from "../src/inquiry.mjs";

const ORIGIN = "https://kestrelridgehealth.com";
const CRM_URL = "https://crm.invalid.example";
const CRM_KEY = "synthetic-crm-insert-only-key-DO-NOT-LOG";
const PII = {
  name: "Pat Example-Synthetic",
  organization: "Synthetic Eye Clinic",
  email: "Pat.Synthetic@Example.com",
  message: "Synthetic message body with a distinctive marker QZX-7731.",
};
const validChallenge = {
  success: true,
  hostname: "kestrelridgehealth.com",
  action: "krh_contact",
};

function env(overrides = {}) {
  return {
    ENVIRONMENT: "production",
    RESEND_API_KEY: "synthetic-resend-key",
    TURNSTILE_SECRET: "synthetic-turnstile-secret",
    SENDER_FROM: "KRH Contact <notifications@kestrelridgehealth.com>",
    RATE_LIMITER: { limit: async () => ({ success: true }) },
    WAITLIST_RATE_LIMITER: { limit: async () => ({ success: true }) },
    ...overrides,
  };
}
const crmEnv = (o = {}) => env({ CRM_URL, CRM_SERVICE_KEY: CRM_KEY, ...o });

function request(fields = {}) {
  return new Request("https://example.workers.dev/submit", {
    method: "POST",
    headers: { origin: ORIGIN, "content-type": "application/json" },
    body: JSON.stringify({ ...PII, turnstileToken: "synthetic-token", ...fields }),
  });
}

// Routes stubbed fetch by host. `crm` and `resend` are status codes or
// functions returning a Response / throwing. Records every call.
function stubNetwork({ resend = 200, crm = 201 } = {}) {
  const old = globalThis.fetch;
  const calls = { resend: [], crm: [], other: [] };
  const answer = async (spec, init) => (typeof spec === "function"
    ? spec(init)
    : new Response(spec === 201 ? null : JSON.stringify({ id: "synthetic" }), { status: spec }));
  globalThis.fetch = async (url, init = {}) => {
    const href = typeof url === "string" ? url : url.url;
    if (href.includes("siteverify")) return new Response(JSON.stringify(validChallenge));
    if (href.startsWith("https://api.resend.com/")) {
      calls.resend.push({ href, init, body: JSON.parse(init.body) });
      return answer(resend, init);
    }
    if (href.startsWith(CRM_URL)) {
      calls.crm.push({ href, init, body: JSON.parse(init.body) });
      return answer(crm, init);
    }
    calls.other.push(href);
    throw new Error("unexpected network call in test");
  };
  return { calls, restore: () => { globalThis.fetch = old; } };
}

// Captures everything written through console.* during fn().
async function captureLogs(fn) {
  const methods = ["log", "info", "warn", "error", "debug"];
  const saved = Object.fromEntries(methods.map((m) => [m, console[m]]));
  const lines = [];
  for (const m of methods) console[m] = (...a) => lines.push(a.map(String).join(" "));
  try { await fn(); } finally { Object.assign(console, saved); }
  return lines.join("\n");
}

function assertNoPii(text) {
  for (const v of [PII.name, PII.organization, PII.email, PII.email.toLowerCase(), "QZX-7731", CRM_KEY, "synthetic-resend-key"]) {
    assert.ok(!text.includes(v), `log output must not contain ${JSON.stringify(v.slice(0, 6))}...`);
  }
}

// ---- ID format and determinism ----

test("inquiry ID has the KRH-INQ-YYYYMMDD-XXXXXXXXXX format", async () => {
  const now = Date.UTC(2026, 10, 17, 15, 4, 5);
  const id = await deriveInquiryIdentity(PII, now);
  assert.match(id.inquiryId, INQUIRY_ID_PATTERN);
  assert.ok(id.inquiryId.startsWith("KRH-INQ-20261117-"));
  assert.match(id.idempotencyKey, /^[0-9a-f]{64}$/);
  assert.match(id.messageHash, /^[0-9a-f]{64}$/);
  assert.equal(id.receivedAt, new Date(now).toISOString());
});

test("same submission in the same time bucket yields the same ID and key", async () => {
  const t = Date.UTC(2026, 10, 17, 15, 0, 1);
  const a = await deriveInquiryIdentity(PII, t);
  const b = await deriveInquiryIdentity({
    ...PII,
    email: "  pat.synthetic@EXAMPLE.com ",
    message: `  ${PII.message.replace(/ /g, "   ")}\n`,
  }, t + 60_000);
  assert.equal(a.inquiryId, b.inquiryId);
  assert.equal(a.idempotencyKey, b.idempotencyKey);
});

test("different message, different email, or next bucket yields a new ID", async () => {
  const t = Date.UTC(2026, 10, 17, 15, 0, 1);
  const base = await deriveInquiryIdentity(PII, t);
  const ids = await Promise.all([
    deriveInquiryIdentity({ ...PII, message: PII.message + " more" }, t),
    deriveInquiryIdentity({ ...PII, email: "other@example.com" }, t),
    deriveInquiryIdentity(PII, t + DEDUP_BUCKET_MS),
  ]);
  for (const other of ids) {
    assert.notEqual(other.inquiryId, base.inquiryId);
    assert.notEqual(other.idempotencyKey, base.idempotencyKey);
  }
});

test("client submissionId takes precedence over the time bucket", async () => {
  const sid = "sub_0123456789abcdefXYZ";
  const a = await deriveInquiryIdentity({ ...PII, submissionId: sid }, Date.UTC(2026, 10, 17, 10));
  const b = await deriveInquiryIdentity({ ...PII, submissionId: sid }, Date.UTC(2026, 10, 17, 10, 40));
  assert.equal(a.idempotencyKey, b.idempotencyKey);
  // An invalid submissionId is ignored, falling back to message + bucket.
  const c = await deriveInquiryIdentity({ ...PII, submissionId: "x" }, Date.UTC(2026, 10, 17, 10));
  const d = await deriveInquiryIdentity(PII, Date.UTC(2026, 10, 17, 10));
  assert.equal(c.idempotencyKey, d.idempotencyKey);
});

test("CRM row has only minimal fields and no message text", async () => {
  const identity = await deriveInquiryIdentity(PII);
  const row = buildCrmRow(identity, PII);
  assert.deepEqual(Object.keys(row).sort(), [
    "contact_name", "email", "form_type", "idempotency_key", "inquiry_id",
    "message_sha256", "organization", "received_at", "source",
  ]);
  assert.equal(row.email, "pat.synthetic@example.com");
  assert.ok(!JSON.stringify(row).includes("QZX-7731"));
});

// ---- Worker integration: email + CRM ----

test("accepted submission: ID in email subject/body, Resend Idempotency-Key, one CRM insert", async () => {
  const net = stubNetwork();
  try {
    const res = await worker.fetch(request(), crmEnv());
    assert.equal(res.status, 202);
    assert.deepEqual(await res.json(), { ok: true, status: "accepted_for_delivery" });
    assert.equal(net.calls.resend.length, 1);
    assert.equal(net.calls.crm.length, 1);
    const email = net.calls.resend[0];
    const crm = net.calls.crm[0];
    const id = crm.body.inquiry_id;
    assert.match(id, INQUIRY_ID_PATTERN);
    assert.ok(email.body.subject.includes(`[${id}]`));
    assert.ok(email.body.text.includes(`Inquiry ID:   ${id}`));
    assert.equal(email.init.headers["Idempotency-Key"], `krh-inq/${crm.body.idempotency_key}`);
    assert.equal(crm.href, `${CRM_URL}/rest/v1/website_inquiries`);
    assert.equal(crm.init.headers.Authorization, `Bearer ${CRM_KEY}`);
    assert.equal(crm.init.headers.Prefer, "return=minimal");
  } finally { net.restore(); }
});

test("double submit: same inquiry ID and Resend key, CRM duplicate (409) is treated as success", async () => {
  let crmInserts = 0;
  const seen = new Set();
  const net = stubNetwork({
    crm: async (init) => {
      const key = JSON.parse(init.body).idempotency_key;
      if (seen.has(key)) return new Response(null, { status: 409 });
      seen.add(key); crmInserts++;
      return new Response(null, { status: 201 });
    },
  });
  try {
    let logs;
    const statuses = [];
    logs = await captureLogs(async () => {
      for (let i = 0; i < 2; i++) statuses.push((await worker.fetch(request(), crmEnv())).status);
    });
    assert.deepEqual(statuses, [202, 202]);
    assert.equal(crmInserts, 1, "only one CRM row");
    assert.equal(net.calls.crm.length, 2);
    const [a, b] = net.calls.resend;
    assert.equal(a.init.headers["Idempotency-Key"], b.init.headers["Idempotency-Key"],
      "Resend dedupes the second send via the shared Idempotency-Key");
    assert.equal(a.body.subject, b.body.subject);
    assert.ok(!logs.includes("crm_write_failed"), "a duplicate is not a failure");
  } finally { net.restore(); }
});

test("CRM down (5xx): email still sent, 202 returned, bounded retries, failure logged without PII", async () => {
  const net = stubNetwork({ crm: 503 });
  try {
    let res;
    const logs = await captureLogs(async () => { res = await worker.fetch(request(), crmEnv()); });
    assert.equal(res.status, 202);
    assert.equal(net.calls.resend.length, 1);
    assert.equal(net.calls.crm.length, CRM_MAX_ATTEMPTS);
    assert.ok(logs.includes("crm_write_failed"));
    assert.match(logs, /KRH-INQ-\d{8}-[A-Z2-7]{10}/, "failure log carries the inquiry ID for reconcile");
    assertNoPii(logs);
  } finally { net.restore(); }
});

test("CRM network error / throw: email still sent and response unchanged", async () => {
  const net = stubNetwork({ crm: async () => { throw new TypeError("synthetic network failure"); } });
  try {
    let res;
    const logs = await captureLogs(async () => { res = await worker.fetch(request(), crmEnv()); });
    assert.equal(res.status, 202);
    assert.equal(net.calls.resend.length, 1);
    assert.ok(logs.includes('"http":"network_error"'));
    assertNoPii(logs);
  } finally { net.restore(); }
});

test("CRM auth/schema error (4xx) is not retried", async () => {
  const net = stubNetwork({ crm: 401 });
  try {
    let res;
    const logs = await captureLogs(async () => { res = await worker.fetch(request(), crmEnv()); });
    assert.equal(res.status, 202);
    assert.equal(net.calls.crm.length, 1);
    assert.ok(logs.includes('"http":401'));
    assertNoPii(logs);
  } finally { net.restore(); }
});

test("CRM timeout is bounded and does not block the email", async () => {
  const hang = (init) => new Promise((_, reject) => {
    init.signal.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), { name: "AbortError" })));
  });
  const calls = [];
  const out = await captureLogs(async () => {
    const r = await recordInquiryInCrm(
      { CRM_URL, CRM_SERVICE_KEY: CRM_KEY },
      { inquiry_id: "KRH-INQ-20261117-AAAAAAAAAA" },
      { fetch: (u, init) => { calls.push(u); return hang(init); }, timeoutMs: 20, backoffMs: 1 },
    );
    assert.deepEqual(r, { status: "failed", http: "timeout" });
  });
  assert.equal(calls.length, CRM_MAX_ATTEMPTS);
  assert.ok(out.includes('"http":"timeout"'));
});

test("CRM recovers on retry after a transient 5xx", async () => {
  let n = 0;
  const r = await captureLogs(async () => {
    const res = await recordInquiryInCrm(
      { CRM_URL, CRM_SERVICE_KEY: CRM_KEY },
      { inquiry_id: "KRH-INQ-20261117-AAAAAAAAAA" },
      { fetch: async () => new Response(null, { status: ++n === 1 ? 502 : 201 }), backoffMs: 1 },
    );
    assert.equal(res.status, "recorded");
    assert.equal(res.attempts, 2);
  });
  assert.ok(r.includes("crm_write_retry"));
});

test("email failure still records the CRM row, and the response stays 502", async () => {
  const net = stubNetwork({ resend: 422 });
  try {
    let res;
    const logs = await captureLogs(async () => { res = await worker.fetch(request(), crmEnv()); });
    assert.equal(res.status, 502);
    assert.equal(net.calls.crm.length, 1);
    assertNoPii(logs);
  } finally { net.restore(); }
});

test("CRM disabled when unconfigured: email-only, zero CRM calls", async () => {
  for (const o of [{}, { CRM_URL }, { CRM_SERVICE_KEY: CRM_KEY }, { CRM_URL: "http://insecure.example", CRM_SERVICE_KEY: CRM_KEY }, { CRM_URL, CRM_SERVICE_KEY: "" }]) {
    assert.equal(crmConfigured(env(o)), false);
    const net = stubNetwork();
    try {
      const res = await worker.fetch(request(), env(o));
      assert.equal(res.status, 202);
      assert.equal(net.calls.resend.length, 1);
      assert.equal(net.calls.crm.length, 0);
    } finally { net.restore(); }
  }
  assert.equal(await recordInquiryInCrm({}, {}).then((r) => r.status), "disabled");
});

test("uses ctx.waitUntil for the CRM write when provided", async () => {
  const net = stubNetwork();
  const waited = [];
  try {
    const res = await worker.fetch(request(), crmEnv(), { waitUntil: (p) => waited.push(p) });
    assert.equal(res.status, 202);
    assert.equal(waited.length, 1);
    assert.equal((await waited[0]).status, "recorded");
  } finally { net.restore(); }
});

test("no PII or secrets in any log line across success, duplicate and failure paths", async () => {
  for (const crm of [201, 409, 500, 401]) {
    const net = stubNetwork({ crm, resend: crm === 500 ? 500 : 200 });
    try {
      const logs = await captureLogs(() => worker.fetch(request(), crmEnv()));
      assertNoPii(logs);
    } finally { net.restore(); }
  }
});

test("waitlist path is unaffected: no CRM call", async () => {
  const net = stubNetwork();
  try {
    await worker.fetch(new Request("https://example.workers.dev/submit", {
      method: "POST",
      headers: { origin: ORIGIN, "content-type": "application/json" },
      body: JSON.stringify({ email: PII.email, source: "waitlist", website: "" }),
    }), crmEnv());
    assert.equal(net.calls.resend.length, 1, "waitlist email still sent");
    assert.equal(net.calls.crm.length, 0);
  } finally { net.restore(); }
});
