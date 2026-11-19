// Inquiry identity, deduplication and CRM recording for the KRH contact Worker.
//
// Design summary (see crm/README.md for the full runbook):
// - Every accepted contact submission gets a traceable inquiry ID of the form
//   KRH-INQ-YYYYMMDD-XXXXXXXXXX (10 base32 chars). The ID is derived from the
//   idempotency key, so a retry or double click of the same submission maps to
//   the SAME inquiry ID, the SAME Resend Idempotency-Key and the SAME CRM row.
// - Idempotency key = SHA-256 over a versioned string built from the
//   normalized email plus either a client-supplied submission id (when the
//   frontend sends one) or the message hash and a 15 minute time bucket.
// - The CRM write is optional and fail-safe: it runs only when CRM_URL and
//   CRM_SERVICE_KEY are both present. It never blocks or changes the email
//   outcome. Failures are retried a bounded number of times and logged with
//   the inquiry ID and HTTP status only (no name, email, org or message).
// - Only minimal, non-clinical fields are written. The message body is NOT
//   stored in the CRM, only its SHA-256, so free text (which could contain
//   PHI if a visitor typed it) never lands in the CRM via this path. The
//   full message stays in the notification email, keyed by the inquiry ID.

export const INQUIRY_ID_PATTERN = /^KRH-INQ-\d{8}-[A-Z2-7]{10}$/;
export const DEDUP_BUCKET_MS = 15 * 60 * 1000;
export const CRM_TABLE = "website_inquiries";
export const CRM_MAX_ATTEMPTS = 3;
export const CRM_TIMEOUT_MS = 4000;
const SUBMISSION_ID_PATTERN = /^[A-Za-z0-9_-]{16,64}$/;
const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

const encoder = new TextEncoder();

async function sha256Hex(text) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function base32(hex, length) {
  let bits = "";
  for (const ch of hex) bits += parseInt(ch, 16).toString(2).padStart(4, "0");
  let out = "";
  for (let i = 0; out.length < length && i + 5 <= bits.length; i += 5) {
    out += BASE32[parseInt(bits.slice(i, i + 5), 2)];
  }
  return out;
}

export function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function normalizeMessage(message) {
  return String(message || "").trim().replace(/\s+/g, " ");
}

export function validSubmissionId(value) {
  return typeof value === "string" && SUBMISSION_ID_PATTERN.test(value);
}

// Returns { inquiryId, idempotencyKey, messageHash, receivedAt }.
// `now` is injectable for tests.
export async function deriveInquiryIdentity({ email, message, submissionId }, now = Date.now()) {
  const normEmail = normalizeEmail(email);
  const messageHash = await sha256Hex(normalizeMessage(message));
  const bucket = Math.floor(now / DEDUP_BUCKET_MS);
  const material = validSubmissionId(submissionId)
    ? `krh-inq-v1|sid|${normEmail}|${submissionId}`
    : `krh-inq-v1|msg|${normEmail}|${messageHash}|${bucket}`;
  const idempotencyKey = await sha256Hex(material);
  // Date part comes from the bucket start, so every retry inside one bucket
  // carries an identical ID even across a UTC midnight boundary.
  const day = new Date(bucket * DEDUP_BUCKET_MS).toISOString().slice(0, 10).replace(/-/g, "");
  const inquiryId = `KRH-INQ-${day}-${base32(idempotencyKey, 10)}`;
  return { inquiryId, idempotencyKey, messageHash, receivedAt: new Date(now).toISOString() };
}

export function crmConfigured(env) {
  return Boolean(
    env
    && typeof env.CRM_URL === "string" && /^https:\/\/[^\s/]+/.test(env.CRM_URL)
    && typeof env.CRM_SERVICE_KEY === "string" && env.CRM_SERVICE_KEY.length > 0,
  );
}

// Minimal CRM row. Column names match crm/migrations/*_website_inquiries.sql.
export function buildCrmRow(identity, { name, organization, email }) {
  return {
    inquiry_id: identity.inquiryId,
    idempotency_key: identity.idempotencyKey,
    received_at: identity.receivedAt,
    form_type: "contact",
    contact_name: name,
    organization: organization || null,
    email: normalizeEmail(email),
    message_sha256: identity.messageHash,
    source: "website_contact_worker",
  };
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function logCrm(level, event, inquiryId, extra = {}) {
  // Deliberately no name, email, organization or message. inquiry_id is an
  // opaque pseudo-random token and is what the reconcile runbook keys on.
  const line = JSON.stringify({ event, inquiry_id: inquiryId, ...extra });
  (level === "error" ? console.error : console.warn)("KRH crm:", line);
}

// Insert-only write through PostgREST (Supabase REST API):
//   POST {CRM_URL}/rest/v1/website_inquiries   Prefer: return=minimal
// Plain INSERT, so the credential needs only INSERT privilege (no SELECT,
// UPDATE or DELETE). Dedup is enforced by the table's UNIQUE
// (idempotency_key): a retry of the same submission gets HTTP 409 (SQLSTATE
// 23505), which is treated as success ("duplicate").
// Retries: up to CRM_MAX_ATTEMPTS on network error, timeout, 408, 429 or 5xx.
// Other 4xx (bad key, schema drift) are permanent and not retried. Never throws.
export async function recordInquiryInCrm(env, row, options = {}) {
  const fetchImpl = options.fetch || globalThis.fetch;
  const backoffMs = options.backoffMs ?? 250;
  const timeoutMs = options.timeoutMs ?? CRM_TIMEOUT_MS;
  if (!crmConfigured(env)) return { status: "disabled", attempts: 0 };

  const base = env.CRM_URL.replace(/\/+$/, "");
  const url = `${base}/rest/v1/${CRM_TABLE}`;
  const headers = {
    // Supabase's API gateway wants a project API key in `apikey`; the
    // Authorization bearer carries the insert-only role JWT. CRM_API_KEY is
    // optional (the project's public anon/publishable key); without it the
    // service key is used for both, which suits a bare PostgREST endpoint.
    "apikey": env.CRM_API_KEY || env.CRM_SERVICE_KEY,
    "Authorization": "Bearer " + env.CRM_SERVICE_KEY,
    "Content-Type": "application/json",
    "Prefer": "return=minimal",
  };
  const body = JSON.stringify(row);

  let lastStatus = "none";
  for (let attempt = 1; attempt <= CRM_MAX_ATTEMPTS; attempt++) {
    let retryable = true;
    try {
      const controller = typeof AbortController === "function" ? new AbortController() : null;
      const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
      let resp;
      try {
        resp = await fetchImpl(url, { method: "POST", headers, body, signal: controller?.signal });
      } finally {
        if (timer) clearTimeout(timer);
      }
      // Drain without reading into logs: PostgREST error bodies can echo values.
      try { await resp.body?.cancel(); } catch { /* ignore */ }
      if (resp.ok) return { status: "recorded", attempts: attempt, http: resp.status };
      if (resp.status === 409) return { status: "duplicate", attempts: attempt, http: 409 };
      lastStatus = resp.status;
      retryable = resp.status === 408 || resp.status === 429 || resp.status >= 500;
    } catch (err) {
      lastStatus = err?.name === "AbortError" ? "timeout" : "network_error";
    }
    if (!retryable || attempt === CRM_MAX_ATTEMPTS) break;
    logCrm("warn", "crm_write_retry", row.inquiry_id, { attempt, http: lastStatus });
    await sleep(backoffMs * attempt);
  }
  logCrm("error", "crm_write_failed", row.inquiry_id, { http: lastStatus, attempts_max: CRM_MAX_ATTEMPTS });
  return { status: "failed", http: lastStatus };
}
