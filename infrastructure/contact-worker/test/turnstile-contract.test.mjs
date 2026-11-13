// Contract tests between the DEPLOYED frontend (the committed Next.js export
// in this repo) and the contact Worker's Turnstile verification.
//
// Why this file exists (release blocker B1, 2026-11-11): the earlier suite's
// siteverify mock always answered action:"krh_contact", a property the
// production frontend never asked Turnstile for. Every test passed while
// every real submission would have been refused with 403. These tests derive
// the Turnstile render options and the POST body shape from the committed
// frontend chunk itself, so a mock can never claim something the frontend
// does not supply.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import worker from "../src/worker.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..", "..", "..");
const CHUNKS = join(REPO, "_next", "static", "chunks");
const WORKER_SRC = readFileSync(join(HERE, "..", "src", "worker.mjs"), "utf8");

// --- Read the real contract from the committed artifacts ------------------

function workerContract() {
  const action = WORKER_SRC.match(/const TURNSTILE_ACTION = "([^"]+)";/)?.[1];
  const hosts = WORKER_SRC.match(/const TURNSTILE_HOSTNAMES = \[([^\]]+)\];/)?.[1];
  assert.ok(action, "worker.mjs must declare TURNSTILE_ACTION");
  assert.ok(hosts, "worker.mjs must declare TURNSTILE_HOSTNAMES");
  return { action, hostnames: [...hosts.matchAll(/"([^"]+)"/g)].map((m) => m[1]) };
}

// Every committed chunk that loads the Turnstile API and renders the widget.
function frontendContracts() {
  const out = [];
  for (const f of readdirSync(CHUNKS)) {
    if (!f.endsWith(".js")) continue;
    const src = readFileSync(join(CHUNKS, f), "utf8");
    if (!src.includes("challenges.cloudflare.com/turnstile/v0/api.js")) continue;
    const m = src.match(/\.render\(\w+,\{(sitekey:"[^"]+"[\s\S]*?)callback:/);
    assert.ok(m, `${f}: loads Turnstile but no render(...) options found`);
    const opts = m[1];
    out.push({
      file: f,
      sitekey: opts.match(/sitekey:"([^"]+)"/)[1],
      // undefined when the frontend renders without an action (the B1 bug)
      action: opts.match(/(?:^|,)action:"([^"]*)"/)?.[1],
      sendsTurnstileToken: /turnstileToken:\w+\.current/.test(src),
      formEncoded: /body:new URLSearchParams\(/.test(src),
      contactFields: src.match(/\{name:\w,org:\w,email:\w,message:\w,source:\w,website:\w\}/) !== null,
    });
  }
  return out;
}

const W = workerContract();
const FE = frontendContracts();

// What Siteverify would return for a token minted by the deployed widget.
// action is ONLY present if the frontend actually passed one to render().
function siteverifyForFrontend(fe, hostname = "kestrelridgehealth.com") {
  const r = { success: true, hostname, challenge_ts: new Date().toISOString(), "error-codes": [] };
  if (fe.action !== undefined) r.action = fe.action;
  return r;
}

// --- Harness ----------------------------------------------------------------

function prodEnv(overrides = {}) {
  return {
    ENVIRONMENT: "production",
    RESEND_API_KEY: "synthetic-test-key",
    TURNSTILE_SECRET: "synthetic-unit-test-secret",
    SENDER_FROM: "KRH Contact <notifications@kestrelridgehealth.com>",
    RATE_LIMITER: { limit: async () => ({ success: true }) },
    WAITLIST_RATE_LIMITER: { limit: async () => ({ success: true }) },
    ...overrides,
  };
}

// Same body the production form sends: form-encoded, fields from the chunk.
function frontendBody(token) {
  const b = new URLSearchParams({
    name: "Synthetic Tester",
    org: "Synthetic Eye Practice",
    email: "synthetic@example.com",
    message: "Synthetic contract test message, not a real enquiry.",
    source: "kestrelridgehealth.com",
    website: "",
  });
  if (token !== undefined) b.set("turnstileToken", token);
  return b;
}

function post(body, origin = "https://kestrelridgehealth.com") {
  return new Request("https://krh-contact-inquiries.example.workers.dev/submit", {
    method: "POST",
    headers: { origin, "content-type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body,
  });
}

// Routes fetch: siteverify -> handler(result), resend -> 200. Records calls.
function stubNetwork(siteverify) {
  const old = globalThis.fetch;
  const calls = { siteverify: [], resend: 0 };
  globalThis.fetch = async (url, init) => {
    const href = typeof url === "string" ? url : url.url;
    if (href.includes("/turnstile/v0/siteverify")) {
      const form = init?.body;
      calls.siteverify.push({ response: form?.get?.("response"), secret: form?.get?.("secret") });
      return siteverify(form?.get?.("response"));
    }
    if (href.includes("api.resend.com")) { calls.resend++; return new Response('{"id":"synthetic"}'); }
    throw new Error("unexpected fetch " + href);
  };
  return { calls, restore: () => { globalThis.fetch = old; } };
}
const json = (o, status = 200) => new Response(JSON.stringify(o), { status });

// --- Frontend <-> Worker contract ------------------------------------------

test("contract: the committed frontend contains the Turnstile contact widget", () => {
  assert.ok(FE.length >= 1, "no chunk renders Turnstile");
  for (const fe of FE) {
    assert.equal(fe.sendsTurnstileToken, true, `${fe.file}: must post turnstileToken`);
    assert.equal(fe.formEncoded, true, `${fe.file}: posts URLSearchParams`);
    assert.equal(fe.contactFields, true, `${fe.file}: contact payload shape changed`);
  }
});

test("contract: every deployed render() passes the exact action the Worker requires (B1)", () => {
  for (const fe of FE) {
    assert.equal(fe.action, W.action, `${fe.file}: frontend renders action=${fe.action}, Worker requires ${W.action}`);
  }
});

test("contract: a token minted by the deployed widget is accepted end to end", async () => {
  for (const fe of FE) {
    const net = stubNetwork(() => json(siteverifyForFrontend(fe)));
    try {
      const r = await worker.fetch(post(frontendBody("frontend-minted-token")), prodEnv());
      assert.equal(r.status, 202, `${fe.file}: deployed frontend token refused`);
      assert.equal(net.calls.siteverify.length, 1, "Siteverify must be called");
      assert.equal(net.calls.siteverify[0].response, "frontend-minted-token");
      assert.equal(net.calls.siteverify[0].secret, "synthetic-unit-test-secret");
      assert.equal(net.calls.resend, 1);
    } finally { net.restore(); }
  }
});

// --- Required Turnstile cases ----------------------------------------------

async function attempt(result, opts = {}) {
  const net = stubNetwork(() => (result instanceof Response ? result : json(result)));
  try {
    const r = await worker.fetch(post(frontendBody(opts.token ?? "tok")), prodEnv());
    return { status: r.status, calls: net.calls };
  } finally { net.restore(); }
}

test("token WITHOUT an action is refused (403), nothing sent", async () => {
  const r = await attempt({ success: true, hostname: "kestrelridgehealth.com" });
  assert.equal(r.status, 403); assert.equal(r.calls.resend, 0);
});

test("token with an EMPTY action is refused (403)", async () => {
  const r = await attempt({ success: true, hostname: "kestrelridgehealth.com", action: "" });
  assert.equal(r.status, 403); assert.equal(r.calls.resend, 0);
});

test("token with the CORRECT action is accepted (202) on apex and www", async () => {
  for (const hostname of W.hostnames) {
    const r = await attempt({ success: true, hostname, action: W.action });
    assert.equal(r.status, 202, hostname); assert.equal(r.calls.resend, 1);
  }
});

test("token with an INCORRECT action is refused (403)", async () => {
  for (const action of ["krh_waitlist", "KRH_CONTACT", "krh_contact ", "login"]) {
    const r = await attempt({ success: true, hostname: "kestrelridgehealth.com", action });
    assert.equal(r.status, 403, action); assert.equal(r.calls.resend, 0);
  }
});

test("INCORRECT hostname is refused (403), including look-alikes", async () => {
  for (const hostname of ["evil.example", "kestrelridgehealth.com.evil.example", "example.com", "", undefined]) {
    const r = await attempt({ success: true, hostname, action: W.action });
    assert.equal(r.status, 403, String(hostname)); assert.equal(r.calls.resend, 0);
  }
});

test("INVALID token is refused (403)", async () => {
  const r = await attempt({ success: false, "error-codes": ["invalid-input-response"], hostname: "kestrelridgehealth.com", action: W.action });
  assert.equal(r.status, 403); assert.equal(r.calls.resend, 0);
});

test("EXPIRED or already-redeemed token is refused (403)", async () => {
  const r = await attempt({ success: false, "error-codes": ["timeout-or-duplicate"] });
  assert.equal(r.status, 403); assert.equal(r.calls.resend, 0);
});

test("success must be boolean true, not truthy", async () => {
  const r = await attempt({ success: "true", hostname: "kestrelridgehealth.com", action: W.action });
  assert.equal(r.status, 403);
});

test("MISSING token is refused (403) without calling Siteverify", async () => {
  const net = stubNetwork(() => json({ success: true, hostname: "kestrelridgehealth.com", action: W.action }));
  try {
    for (const body of [frontendBody(undefined), frontendBody("")]) {
      const r = await worker.fetch(post(body), prodEnv());
      assert.equal(r.status, 403);
    }
    assert.equal(net.calls.siteverify.length, 0); assert.equal(net.calls.resend, 0);
  } finally { net.restore(); }
});

test("Siteverify HTTP error fails closed (403); network failure fails closed (503)", async () => {
  let r = await attempt(new Response("err", { status: 500 }));
  assert.equal(r.status, 403); assert.equal(r.calls.resend, 0);
  const net = stubNetwork(() => { throw new Error("network down"); });
  try {
    const res = await worker.fetch(post(frontendBody("tok")), prodEnv());
    assert.equal(res.status, 503); assert.equal(net.calls.resend, 0);
  } finally { net.restore(); }
});

test("production without TURNSTILE_SECRET refuses everything (503), never skips verification", async () => {
  const net = stubNetwork(() => json({ success: true, hostname: "kestrelridgehealth.com", action: W.action }));
  try {
    const r = await worker.fetch(post(frontendBody("tok")), prodEnv({ TURNSTILE_SECRET: undefined }));
    assert.equal(r.status, 503); assert.equal(net.calls.resend, 0);
  } finally { net.restore(); }
});
