# Contact form — real backend delivery test

## What the backend actually is

The contact form is **not** a mailto-only form. It posts JSON to a live
Cloudflare Worker, which forwards to the Resend email API:

- Frontend: `_next/static/chunks/1t2_6z4igjn62.js` has
  `formEndpoint:"https://krh-contact-inquiries.thomas-ec7.workers.dev/submit"`
  already patched in (via `scripts/set-form-endpoint.sh`). `_headers`
  `connect-src` already allows this origin.
- Backend: `infrastructure/contact-worker/src/worker.mjs`, deployed under
  Worker name `krh-contact-inquiries` (wrangler.toml). Confirmed reachable
  and live at the URL above.
- The Worker validates origin (only `kestrelridgehealth.com` /
  `www.kestrelridgehealth.com`), checks a honeypot `website` field, validates
  field lengths/email shape, optionally verifies Turnstile (skipped if
  `TURNSTILE_SECRET` isn't set — currently unset, so Turnstile is not
  enforced), then calls the Resend API with `env.RESEND_API_KEY` and emails
  `twagenberg@kestrelridgehealth.com`.
- Waitlist is a **separate path** inside the same Worker, selected by
  `source:"waitlist"` in the POST body, with its own Resend send
  (`sendWaitlistViaResend`) and its own destination handling. It is
  backend-confirmed independently of the main inquiry path.

## Test performed

One real HTTP POST was sent directly to the live, deployed Worker endpoint
(not a mock, not localhost) with obviously-synthetic data, matching the
project's own `DEPLOYMENT.md` Step 3 test shape:

```
POST https://krh-contact-inquiries.thomas-ec7.workers.dev/submit
Origin: https://kestrelridgehealth.com
Content-Type: application/json

{
  "name": "TEST HARNESS — do not action",
  "organization": "QA Test Org (automated check)",
  "email": "test-harness+krhqa@example.com",
  "message": "This is an automated end-to-end delivery test of the contact
   form backend, run by Claude Code on behalf of Thomas to verify the
   Worker-to-Resend pipeline. No action needed; please disregard or delete."
}
```

No real prospect identity, no PHI, no clinic data was used. The destination
mailbox (`twagenberg@kestrelridgehealth.com`) is the site owner's own
address, not a third-party salesperson's inbox, so this single safe test
was within the bounds the task asked for.

## Actual result (observed, not assumed)

```
HTTP/2 503
{"ok":false,"error":"Message delivery not configured"}
```

**This is a genuine, reproducible finding, not a fabricated pass.**

What it tells us:
- ✅ The Worker is deployed and reachable at the configured URL.
- ✅ CORS/origin allow-listing works (`Origin: https://kestrelridgehealth.com`
  was accepted — a disallowed origin would 403 before reaching this check).
- ✅ Input validation passed (name/org/email/message all accepted the
  payload shape — a validation failure would have been `400`, not `503`).
- ✅ The honeypot did not block it (empty `website` field, as expected for a
  real user).
- ❌ **`RESEND_API_KEY` is not set as a Worker secret.** The Worker's own
  code (`src/worker.mjs`) explicitly returns this exact 503 when
  `env.RESEND_API_KEY` is falsy — this is not a generic failure, it is the
  Worker deliberately refusing to pretend it can send mail.
- Consequence: **no email was sent or delivered anywhere.** The frontend, if
  a real user hit this today, would correctly show an error state (not a
  false success) — see `review of frontend handling below.

## What was verified vs. what could not be verified

| Claim | Status |
|---|---|
| Worker is deployed and live | ✅ Verified (reachable, correct CORS headers) |
| Origin restriction enforced | ✅ Verified (request from allowed origin reached validation) |
| Field validation enforced | ✅ Verified indirectly (valid fields passed through to the delivery step) |
| Honeypot present and non-blocking for real submissions | ✅ Verified (empty `website` field did not trigger the honeypot's early-accept path) |
| End-to-end email delivery (Worker → Resend → inbox) | ❌ **Not verified — cannot be, today.** `RESEND_API_KEY` is unset, so Resend is never called. No email left Cloudflare. |
| Waitlist path delivery | ❌ Not tested. Same `RESEND_API_KEY` gate applies (`sendWaitlistViaResend` requires the same secret), so a test would return the same 503 and add no new information. Not run, to avoid a duplicate no-op request. |
| Turnstile verification | Not exercised — `TURNSTILE_SECRET` is unset, so the Worker explicitly skips Turnstile checks (logged as a staging warning in `worker.mjs`). This is a known, documented gap in `DEPLOYMENT.md` Step 7 (deferred). |

## What this means for the frontend build (this task)

Because delivery is currently broken server-side (missing secret, not a
frontend bug), the frontend state work in this task:
- Implements and visually exercises the **success** state the same way the
  real `202 {"ok":true,"status":"accepted_for_delivery"}` response is
  handled by the JS (confirmed by reading the response-handling branches in
  `1t2_6z4igjn62.js`/the form logic), so success is still genuinely
  code-correct for when the secret is set.
- Implements and can genuinely trigger the **server rejection** / **network
  failure** error states against this real 503, since that response is real
  and reproducible right now (no need to fake a failure — one already
  exists in production).
- Does **not** claim to have observed a real end-to-end delivered email,
  because that did not happen.

## Fix required (operator action, outside this task's scope)

Per `infrastructure/contact-worker/DEPLOYMENT.md` Step 2/3:

```
cd infrastructure/contact-worker
echo "YOUR_RESEND_API_KEY" | npx wrangler secret put RESEND_API_KEY
```

Then re-run the same curl test above; expect `202
{"ok":true,"status":"accepted_for_delivery"}` and an email in
`twagenberg@kestrelridgehealth.com` within ~60s. This is a secrets/ops
action requiring Cloudflare account access this session does not have —
flagging it rather than guessing at credentials, per instructions.
