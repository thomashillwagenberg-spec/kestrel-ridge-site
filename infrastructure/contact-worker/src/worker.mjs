// KRH contact intake Worker. Not deployed. No analytics or raw inquiry logging.
const ALLOWED_ORIGINS = new Set([
  "https://kestrelridgehealth.com",
  "https://www.kestrelridgehealth.com",
]);
const MAX_BODY_BYTES = 8192;
const DESTINATION = "twagenberg@kestrelridgehealth.com";
const SENDER = "notifications@kestrelridgehealth.com";

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

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    const origin = request.headers.get("origin") || "";
    if (path !== "/submit") return reply(404, { ok: false }, origin);
    if (request.method === "OPTIONS") {
      return ALLOWED_ORIGINS.has(origin)
        ? reply(204, null, origin)
        : reply(403, { ok: false }, origin);
    }
    if (request.method !== "POST") {
      return reply(405, { ok: false, error: "POST required" }, origin);
    }
    // Origin checks complement Turnstile; they are not an authentication boundary.
    if (!ALLOWED_ORIGINS.has(origin)) {
      return reply(403, { ok: false, error: "Request origin not allowed" }, origin);
    }
    let fields;
    try {
      fields = await readInput(request);
    } catch {
      return reply(400, { ok: false, error: "Invalid form data" }, origin);
    }
    if (!fields || typeof fields !== "object" || Array.isArray(fields)) {
      return reply(400, { ok: false, error: "Invalid form data" }, origin);
    }
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
    if (!env.TURNSTILE_SECRET || typeof token !== "string" || token.length < 1 || token.length > 2048) {
      return reply(403, { ok: false, error: "Verification required" }, origin);
    }
    let verified = false;
    try {
      verified = await verifyTurnstile(token, env.TURNSTILE_SECRET);
    } catch {
      // No token, PII, response body, or IP address is logged.
      return reply(503, { ok: false, error: "Verification temporarily unavailable" }, origin);
    }
    if (!verified) return reply(403, { ok: false, error: "Verification unsuccessful" }, origin);
    if (!env.EMAIL || typeof env.EMAIL.send !== "function") {
      return reply(503, { ok: false, error: "Message delivery unavailable" }, origin);
    }
    try {
      const text = [
        "New KRH Phase Zero inquiry",
        "Name: " + name,
        "Organization: " + organization,
        "Reply email: " + email,
        "",
        "Message:",
        message,
        "",
        "Do not forward sensitive information to analytics or public logs.",
      ].join("\n");
      await env.EMAIL.send({
        to: DESTINATION,
        from: SENDER,
        replyTo: email,
        subject: "KRH Phase Zero inquiry",
        text,
      });
      // Accepted by the send API is NOT proof that Outlook received the message.
      return reply(202, { ok: true, status: "accepted_for_delivery" }, origin);
    } catch (error) {
      // Log only a non-PII error code; avoid logging the inquiry or exception text.
      console.error("KRH email send failure code:", typeof error?.code === "string" ? error.code : "unspecified");
      return reply(502, { ok: false, error: "Message could not be sent. Please try again later." }, origin);
    }
  },
};
