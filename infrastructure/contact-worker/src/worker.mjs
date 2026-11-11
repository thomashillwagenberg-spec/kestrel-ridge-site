// KRH contact intake Worker — Resend API delivery (no Email Routing required).
// No analytics, no raw inquiry logging, no PII in Worker logs.
const ALLOWED_ORIGINS = new Set([
  "https://kestrelridgehealth.com",
  "https://www.kestrelridgehealth.com",
]);
const MAX_BODY_BYTES = 8192;
const DESTINATION = "twagenberg@kestrelridgehealth.com";

// Sender configuration is explicit, not inferred. ENVIRONMENT, SENDER_FROM,
// RESEND_API_KEY and TURNSTILE_SECRET are all required Worker config in
// production (set via `wrangler.toml` [vars] / `wrangler secret put`).
// There is no default production sender address baked into this file:
// Thomas must confirm in the Resend dashboard which From address is
// actually verified/authorized to send, and set it as SENDER_FROM.
// Until that is set, production fails closed (503) rather than guessing.
const SENDER_FALLBACK = "KRH Contact <onboarding@resend.dev>"; // staging-only sandbox sender
const SENDER_DOMAIN_ALLOWLIST = ["kestrelridgehealth.com"];

function isProd(env) {
  // Fail-safe default: anything that isn't explicitly "staging" is treated
  // as production. An unset ENVIRONMENT var must never silently relax
  // production requirements.
  return env.ENVIRONMENT !== "staging";
}

function validSenderFrom(value) {
  if (typeof value !== "string" || value.length < 3 || value.length > 200) return false;
  const match = value.match(/<([^<>@\s]+@[^<>@\s]+)>\s*$/) || value.match(/^([^<>@\s]+@[^<>@\s]+)$/);
  if (!match) return false;
  const addr = match[1];
  const domain = addr.split("@")[1]?.toLowerCase();
  return SENDER_DOMAIN_ALLOWLIST.includes(domain);
}

// Explicit configuration validation, run once per request before any
// submission is processed. Replaces the old pattern of each code path
// silently falling back to a weaker behavior (skip Turnstile, use the
// sandbox sender, fail open on rate limiting) when a secret/var was
// missing. In production, a missing or invalid required setting is a
// 503 "misconfigured" response, not a silent downgrade.
function validateConfig(env) {
  const problems = [];
  if (isProd(env)) {
    if (!env.RESEND_API_KEY) problems.push("RESEND_API_KEY missing");
    if (!env.TURNSTILE_SECRET) problems.push("TURNSTILE_SECRET missing");
    if (!validSenderFrom(env.SENDER_FROM)) {
      problems.push("SENDER_FROM missing or not on an allowed/verified domain");
    }
    if (!env.RATE_LIMITER) problems.push("RATE_LIMITER binding not configured");
    if (!env.WAITLIST_RATE_LIMITER) problems.push("WAITLIST_RATE_LIMITER binding not configured");
  }
  return problems;
}

function reply(status, payload, origin) {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Vary": "Origin",
  };
  if (ALLOWED_ORIGINS.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Methods"] = "POST, OPTIONS";
    headers["Access-Control-Allow-Headers"] = "Content-Type";
  }
  return new Response(status === 204 ? null : JSON.stringify(payload), { status, headers });
}

function validEmail(value) {
  return typeof value === "string"
    && value.length <= 254
    && /^[^\s@\r\n]+@[^\s@\r\n]+\.[^\s@\r\n]+$/.test(value);
}

async function readInput(request) {
  const length = Number(request.headers.get("content-length"));
  if (Number.isFinite(length) && length > MAX_BODY_BYTES) return null;
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) return null;
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return JSON.parse(raw);
  if (contentType.includes("application/x-www-form-urlencoded")) {
    return Object.fromEntries(new URLSearchParams(raw));
  }
  return null;
}

// Rate limiting uses Cloudflare's native Workers Rate Limiting binding
// (`env.RATE_LIMITER`, GA as of Wrangler 4.36+ — the `ratelimits` binding
// type in wrangler.toml), NOT Workers KV.
//
// Why KV was rejected: KV is eventually consistent across Cloudflare's
// edge (writes can take up to ~60s to propagate globally), its
// get-then-put pattern is not atomic (two simultaneous requests at
// different edge locations can both read the same stale counter and
// both write "1", undercounting real traffic), and it has a documented
// per-key write-rate limit (~1 write/sec sustained) that bursty abuse
// traffic against a single IP key could itself exceed.
//
// IMPORTANT — accuracy, per Cloudflare's own docs (not "atomic", corrected
// 2026-11-11 after this was previously misdescribed here): the Rate
// Limiting binding is explicitly documented as APPROXIMATE and EVENTUALLY
// CONSISTENT, not atomic. Each Cloudflare location checks a local,
// independently-maintained count; updates propagate to other locations
// and other isolates in the background, not synchronously. A burst of
// requests hitting the same key across locations (or even within one
// location, before counts sync) CAN exceed the configured limit — this
// is Cloudflare's documented, intended behavior, not a bug:
// https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/#accuracy
// There is also at least one reported case (cloudflare/workers-sdk#16097,
// Oct 2026) of the binding not enforcing at all for a sustained run on a
// single edge location with a constant key. Do not treat this binding as
// a precise or guaranteed-enforced limit anywhere in this codebase or in
// any status report. What it DOES still give us over Workers KV:
//   - `period` must be 10 or 60 seconds (we approximate our 10-request/
//     10-minute requirement as 10 req/60s, the closest supported window -
//     see note in wrangler.toml).
//   - No KV-specific stale read-then-write race on OUR get/put code path
//     (we don't write our own counter at all), and no KV per-key
//     write-rate ceiling for us to exceed under abuse traffic.
//   - It is a genuine, Cloudflare-operated backstop against sustained
//     single-source abuse, even though it will not hold a hard line
//     against a determined, distributed attacker. Treat it as a speed
//     bump, not a guarantee, when assessing production risk.
//   - `limit()` can itself throw (network/infra fault). We treat that as
//     a transient limiter failure, not a security decision: we fail OPEN
//     for that one request (log a warning) rather than reject a
//     legitimate inquiry because of an internal fault. This is different
//     from the binding being entirely absent in production, which is a
//     deploy-time configuration error caught by validateConfig() above
//     and blocks ALL traffic with a 503 — it is never silently treated as
//     "rate limiting enforced" when it is not configured at all.
async function checkRateLimit(env, ip, scope) {
  const binding = scope === "waitlist" ? env.WAITLIST_RATE_LIMITER : env.RATE_LIMITER;
  if (!binding) {
    // Only reachable in staging (validateConfig blocks this in production).
    console.warn(`KRH: rate limiter binding not bound (${scope}); rate limiting not enforced (staging only).`);
    return true;
  }
  try {
    const { success } = await binding.limit({ key: `${scope}:${ip}` });
    return success;
  } catch (err) {
    console.warn(`KRH: rate limiter call failed for ${scope}, failing open for this request:`, typeof err?.message === "string" ? err.message : "unspecified");
    return true;
  }
}

async function verifyTurnstile(token, secret) {
  const data = new FormData();
  data.set("secret", secret);
  data.set("response", token);
  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    { method: "POST", body: data },
  );
  if (!response.ok) return false;
  const result = await response.json();
  return Boolean(
    result.success &&
    ["kestrelridgehealth.com", "www.kestrelridgehealth.com"].includes(result.hostname) &&
    result.action === "krh_contact",
  );
}

async function sendWaitlistViaResend(apiKey, email, from) {
  const subject = "KRH waitlist signup";
  const text = [
    "New KRH waitlist signup",
    "──────────────────────────",
    "Email: " + email,
    "",
    "──────────────────────────",
    "Do not forward sensitive information to analytics or public logs.",
  ].join("\n");

  const payload = { from, to: [DESTINATION], reply_to: email, subject, text };

  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => "");
    console.error("KRH Resend waitlist error HTTP", resp.status, errText.slice(0, 80));
    throw new Error("resend_" + resp.status);
  }
  return true;
}

async function sendViaResend(apiKey, name, organization, email, message, from) {
  const subject = organization
    ? `KRH Phase Zero inquiry — ${organization}`
    : "KRH Phase Zero inquiry";
  const text = [
    "New KRH Phase Zero inquiry",
    "──────────────────────────",
    "Name:         " + name,
    "Organization: " + (organization || "(not provided)"),
    "Reply email:  " + email,
    "",
    "Message:",
    message,
    "",
    "──────────────────────────",
    "Do not forward sensitive information to analytics or public logs.",
  ].join("\n");

  const payload = { from, to: [DESTINATION], reply_to: email, subject, text };

  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => "");
    // Log only HTTP status; never log the email body or PII.
    console.error("KRH Resend error HTTP", resp.status, errText.slice(0, 80));
    throw new Error("resend_" + resp.status);
  }
  return true;
}

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    const origin = request.headers.get("origin") || "";
    if (path !== "/submit") return reply(404, { ok: false }, origin);

    // CORS preflight MUST be handled before any body parsing or config
    // validation. Real browsers require a 2xx status on the OPTIONS
    // preflight before they will send the actual POST.
    if (request.method === "OPTIONS") {
      return ALLOWED_ORIGINS.has(origin)
        ? reply(204, null, origin)
        : reply(403, { ok: false }, origin);
    }

    // Explicit, fail-closed configuration gate. In production this blocks
    // ALL submissions with one clear 503 if required config is missing,
    // rather than letting each code path downgrade silently (skip
    // Turnstile, use the sandbox sender, treat rate limiting as "not my
    // problem"). Staging (ENVIRONMENT="staging") is exempt so local/dev
    // testing doesn't require production secrets.
    const configProblems = validateConfig(env);
    if (configProblems.length > 0) {
      console.error("KRH: refusing to process — configuration incomplete:", configProblems.join("; "));
      return reply(503, { ok: false, error: "Service temporarily unavailable" }, origin);
    }
    const from = isProd(env) ? env.SENDER_FROM : SENDER_FALLBACK;

    // Reject non-POST methods before attempting to parse a body. (Previously
    // this check ran after waitlist-detection body parsing, so a bare GET
    // with no matching content-type fell through to a 400 "Invalid form
    // data" instead of the correct 405 — harmless in practice since no
    // browser sends a GET here, but wrong, and caught by the rewritten
    // test suite.)
    if (request.method !== "POST") {
      return reply(405, { ok: false, error: "POST required" }, origin);
    }

    let preFields;
    try {
      preFields = await readInput(request.clone());
    } catch {
      return reply(400, { ok: false, error: "Invalid form data" }, origin);
    }
    if (!preFields || typeof preFields !== "object" || Array.isArray(preFields)) {
      return reply(400, { ok: false, error: "Invalid form data" }, origin);
    }

    // Waitlist path --------------------------------------------------------
    // TEMPORARY, DOCUMENTED RESTRICTION (2026-11-11), not a claim of
    // equivalent protection: this path has NO Turnstile challenge. The
    // waitlist signup form's markup and client-side JS are compiled into
    // this site's Next.js build chunks under _next/static/chunks/, which
    // are NOT present as editable source in this repo (only the built
    // output is committed here) — there is no safe, reviewable way to add
    // a real Turnstile widget to that form from this repo without
    // hand-patching minified production JS, which this session will not
    // do. Until the actual frontend source is available and a proper
    // widget can be added and verified in a real browser, the compensating
    // controls are: (1) the existing honeypot field (silently accepts and
    // discards bot submissions that fill the hidden "website" field), (2)
    // a SEPARATE, stricter rate limit on this path (WAITLIST_RATE_LIMITER,
    // 3 req/60s vs. the contact form's 10 req/60s — see wrangler.toml),
    // and (3) this path only ever sends a signup confirmation email, it
    // never relays arbitrary attacker-controlled free-text content to
    // twagenberg@kestrelridgehealth.com the way the contact form does, so
    // the abuse impact of a bypass here is spam signups, not inbox abuse
    // or phishing-via-relay. This is a real gap, not "equivalent security."
    if (preFields.source === "waitlist") {
      if (!ALLOWED_ORIGINS.has(origin)) {
        return reply(403, { ok: false, error: "Request origin not allowed" }, origin);
      }
      if (preFields.website) {
        return reply(202, { ok: true, status: "accepted_for_delivery" }, origin);
      }
      const wEmail = typeof preFields.email === "string" ? preFields.email.trim() : "";
      if (!validEmail(wEmail)) {
        return reply(400, { ok: false, error: "Add an email address we can write to." }, origin);
      }
      const wIp = request.headers.get("cf-connecting-ip") || "unknown";
      if (!(await checkRateLimit(env, wIp, "waitlist"))) {
        return reply(429, { ok: false, error: "Too many requests. Please try again later." }, origin);
      }
      try {
        await sendWaitlistViaResend(env.RESEND_API_KEY, wEmail, from);
        return reply(202, { ok: true, status: "accepted_for_delivery" }, origin);
      } catch (err) {
        console.error("KRH waitlist send failure:", typeof err?.message === "string" ? err.message : "unspecified");
        return reply(502, { ok: false, error: "Signup could not be sent. Please try again later." }, origin);
      }
    }
    // End waitlist path ----- (method already confirmed POST above)
    if (!ALLOWED_ORIGINS.has(origin)) {
      return reply(403, { ok: false, error: "Request origin not allowed" }, origin);
    }
    const fields = preFields;
    const name = typeof fields.name === "string" ? fields.name.trim() : "";
    const organization = typeof fields.organization === "string"
      ? fields.organization.trim() : (typeof fields.org === "string" ? fields.org.trim() : "");
    const email = typeof fields.email === "string" ? fields.email.trim() : "";
    const message = typeof fields.message === "string" ? fields.message.trim() : "";
    const token = typeof fields.turnstileToken === "string"
      ? fields.turnstileToken
      : fields["cf-turnstile-response"];

    if (fields.website) {
      return reply(202, { ok: true, status: "accepted_for_delivery" }, origin);
    }

    if (
      name.length < 1 || name.length > 120 ||
      organization.length > 120 ||
      !validEmail(email) ||
      message.length < 10 || message.length > 3000
    ) {
      return reply(400, { ok: false, error: "Please check your form fields" }, origin);
    }

    const contactIp = request.headers.get("cf-connecting-ip") || "unknown";
    if (!(await checkRateLimit(env, contactIp, "contact"))) {
      return reply(429, { ok: false, error: "Too many requests. Please try again later." }, origin);
    }

    // Turnstile is unconditionally required in production — validateConfig()
    // above already guaranteed TURNSTILE_SECRET exists, so there is no
    // "secret missing, skip the check" branch reachable here in prod.
    // Staging only: if TURNSTILE_SECRET truly isn't set, skip loudly.
    if (env.TURNSTILE_SECRET) {
      if (typeof token !== "string" || token.length < 1 || token.length > 2048) {
        return reply(403, { ok: false, error: "Verification required" }, origin);
      }
      let verified = false;
      try {
        verified = await verifyTurnstile(token, env.TURNSTILE_SECRET);
      } catch {
        return reply(503, { ok: false, error: "Verification temporarily unavailable" }, origin);
      }
      if (!verified) return reply(403, { ok: false, error: "Verification unsuccessful" }, origin);
    } else {
      console.warn("KRH: TURNSTILE_SECRET is not set; Turnstile check skipped (staging only — unreachable in production).");
    }

    try {
      await sendViaResend(env.RESEND_API_KEY, name, organization, email, message, from);
      return reply(202, { ok: true, status: "accepted_for_delivery" }, origin);
    } catch (error) {
      console.error("KRH email send failure:", typeof error?.message === "string" ? error.message : "unspecified");
      return reply(502, { ok: false, error: "Message could not be sent. Please try again later." }, origin);
    }
  },
};
