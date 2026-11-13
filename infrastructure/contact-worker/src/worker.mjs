// KRH contact intake Worker — Resend API delivery (no Email Routing required).
// No analytics, no raw inquiry logging, no PII in Worker logs.
const ALLOWED_ORIGINS = new Set([
  "https://kestrelridgehealth.com",
  "https://www.kestrelridgehealth.com",
]);
const MAX_BODY_BYTES = 8192;
const DESTINATION = "twagenberg@kestrelridgehealth.com";
// Sender must be an address on a domain verified in Resend dashboard.
// Until verified, Resend will reject custom domains — use resend.dev shared sender.
const SENDER_VERIFIED = "notifications@kestrelridgehealth.com";
const SENDER_FALLBACK = "KRH Contact <onboarding@resend.dev>";

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

async function sendWaitlistViaResend(apiKey, email, domainVerified) {
  const from = domainVerified ? SENDER_VERIFIED : SENDER_FALLBACK;
  const subject = "KRH waitlist signup";
  const text = [
    "New KRH waitlist signup",
    "──────────────────────────",
    "Email: " + email,
    "",
    "──────────────────────────",
    "Do not forward sensitive information to analytics or public logs.",
  ].join("\n");

  const payload = {
    from,
    to: [DESTINATION],
    reply_to: email,
    subject,
    text,
  };

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

async function sendViaResend(apiKey, name, organization, email, message, domainVerified) {
  const from = domainVerified ? SENDER_VERIFIED : SENDER_FALLBACK;
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

  const payload = {
    from,
    to: [DESTINATION],
    reply_to: email,
    subject,
    text,
  };

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

    // A cross-origin JSON POST requires an empty OPTIONS preflight.
    // Check the method and origin before reading any request body.
    if (request.method === "OPTIONS") {
      return ALLOWED_ORIGINS.has(origin)
        ? reply(204, null, origin)
        : reply(403, { ok: false }, origin);
    }
    if (request.method !== "POST") {
      return reply(405, { ok: false, error: "POST required" }, origin);
    }
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

    // Waitlist submissions send {email, source:"waitlist"}.
    if (fields.source === "waitlist") {
      const wEmail = typeof fields.email === "string" ? fields.email.trim() : "";
      if (!validEmail(wEmail)) {
        return reply(400, { ok: false, error: "Add an email address we can write to." }, origin);
      }
      if (!env.RESEND_API_KEY) {
        console.error("KRH: RESEND_API_KEY not set for waitlist.");
        return reply(503, { ok: false, error: "Signup delivery not configured" }, origin);
      }
      try {
        await sendWaitlistViaResend(env.RESEND_API_KEY, wEmail, Boolean(env.DOMAIN_VERIFIED));
        return reply(202, { ok: true, status: "accepted_for_delivery" }, origin);
      } catch (err) {
        console.error("KRH waitlist send failure:", typeof err?.message === "string" ? err.message : "unspecified");
        return reply(502, { ok: false, error: "Signup could not be sent. Please try again later." }, origin);
      }
    }
    const name = typeof fields.name === "string" ? fields.name.trim() : "";
    const organization = typeof fields.organization === "string"
      ? fields.organization.trim() : (typeof fields.org === "string" ? fields.org.trim() : "");
    const email = typeof fields.email === "string" ? fields.email.trim() : "";
    const message = typeof fields.message === "string" ? fields.message.trim() : "";
    const token = typeof fields.turnstileToken === "string"
      ? fields.turnstileToken
      : fields["cf-turnstile-response"];

    // Honeypot: bots that fill the website field are silently discarded.
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
      // Staging path: TURNSTILE_SECRET not configured. Token check is skipped.
      console.warn("KRH: TURNSTILE_SECRET is not set; Turnstile check skipped (staging only).");
    }

    if (!env.RESEND_API_KEY) {
      console.error("KRH: RESEND_API_KEY secret not configured. Run: wrangler secret put RESEND_API_KEY");
      return reply(503, { ok: false, error: "Message delivery not configured" }, origin);
    }

    try {
      await sendViaResend(
        env.RESEND_API_KEY,
        name,
        organization,
        email,
        message,
        Boolean(env.DOMAIN_VERIFIED),
      );
      return reply(202, { ok: true, status: "accepted_for_delivery" }, origin);
    } catch (error) {
      console.error("KRH email send failure:", typeof error?.message === "string" ? error.message : "unspecified");
      return reply(502, { ok: false, error: "Message could not be sent. Please try again later." }, origin);
    }
  },
};
