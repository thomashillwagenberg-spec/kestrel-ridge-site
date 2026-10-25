# Contact Worker — Deployment Runbook

This document covers the exact steps to deploy the Cloudflare Worker and connect it to the website.  
**All steps require your Cloudflare account access.** The engineering work is done; this is an operator checklist.

---

## Prerequisites

- [ ] Node.js 18 or later installed.  
- [ ] Wrangler CLI: `npm install -g wrangler`  
- [ ] Cloudflare account login: `npx wrangler login`  
- [ ] Your account's Cloudflare zone covers `kestrelridgehealth.com`.

---

## Step 1 — Verify the email destination in Cloudflare Email Routing

1. Open **Cloudflare dashboard → kestrelridgehealth.com → Email → Email Routing**.  
2. Confirm `twagenberg@kestrelridgehealth.com` is listed as a verified destination.  
3. If not, add it and click the verification link sent to that mailbox.  
4. Send a test email through the dashboard to confirm delivery.

The Worker's `send_email` binding uses Cloudflare Email Routing. The destination is hardcoded in `src/worker.mjs`; do not change it without a code review.

---

## Step 2 — Deploy the Worker

```bash
cd infrastructure/contact-worker
npx wrangler deploy
```

Expected output includes a line like:

```
Deployed krh-contact-inquiries (version ...) to:
  https://krh-contact-inquiries.YOUR-ACCOUNT.workers.dev
```

Note that URL (`https://krh-contact-inquiries.YOUR-ACCOUNT.workers.dev`). You need it in Step 4.

**What this deploys:**
- Staged mode (no `TURNSTILE_SECRET`): submissions are accepted without a Turnstile token.  
- Email binding is active: all valid submissions go to `twagenberg@kestrelridgehealth.com`.  
- Origin check active: only `kestrelridgehealth.com` and `www.kestrelridgehealth.com` are accepted.  
- Honeypot active: bots that fill a `website` field are silently discarded.  
- Input validation active.

---

## Step 3 — Test delivery in staging

```bash
curl -X POST https://krh-contact-inquiries.YOUR-ACCOUNT.workers.dev/submit \
  -H "Content-Type: application/json" \
  -H "Origin: https://kestrelridgehealth.com" \
  -d '{
    "name": "Test Sender",
    "organization": "Test Clinic",
    "email": "your-email@example.com",
    "message": "End-to-end staging delivery test."
  }'
```

Expected response: `{"ok":true,"status":"accepted_for_delivery"}`  
Expected result: email delivered to `twagenberg@kestrelridgehealth.com` within 60 seconds.

If this step fails:
- `503`: email binding not active — check Step 1.
- `403`: origin check blocked it — review the `Origin` header in your curl command.
- `400`: field validation failed — check the JSON body.
- `502`: delivery accepted by Cloudflare but not yet delivered to Outlook — allow up to 5 minutes.

Do not proceed to Step 4 until Step 3 passes end-to-end.

---

## Step 4 — Patch the frontend

From the **repository root**:

```bash
./scripts/set-form-endpoint.sh https://krh-contact-inquiries.YOUR-ACCOUNT.workers.dev
```

This patches two files:
- `_next/static/chunks/1t2_6z4igjn62.js` — sets `formEndpoint` to the Worker URL.
- `_headers` — adds the Worker origin to `connect-src`.

Verify:

```bash
grep formEndpoint _next/static/chunks/1t2_6z4igjn62.js
grep connect-src _headers
```

Both should show the Worker URL.

---

## Step 5 — Commit and deploy the site

```bash
git add _next/static/chunks/1t2_6z4igjn62.js _headers
git commit -m "feat: connect contact form to Cloudflare Worker endpoint"
git push
```

This triggers a Cloudflare Pages build and deployment. Wait for the build to complete before running acceptance tests.

---

## Step 6 — Acceptance tests (production)

Test from a browser — not curl — to verify CORS and the live page behavior.

| Test | Expected result |
|------|----------------|
| Submit a valid inquiry on desktop | Success message displayed. Email delivered to `twagenberg@kestrelridgehealth.com`. |
| Submit a valid inquiry on mobile | Same. |
| Submit with an invalid email | Form rejects before sending. |
| Submit with an empty required field | Form rejects before sending. |
| Submit the form twice in quick succession | Second submission is disabled until the first returns. |
| Submit from a browser with no mail client configured | Succeeds (does not open a mail application). |
| Kill the Worker (disable in Cloudflare) and submit | Form shows an error message. Does not show a false success. |

All seven tests must pass before this task is considered done.

---

## Step 7 (deferred) — Add Turnstile for production

Once the site source is recovered and rebuilt:

1. Register a Turnstile widget at **Cloudflare dashboard → Turnstile → Add site**.  
   - Type: Managed.  
   - Domain: `kestrelridgehealth.com`.  
2. Add the widget `<script>` and `<div>` to the contact form component.  
3. Pass the token from the widget in the form submission body as `turnstileToken`.  
4. Store the Turnstile secret as a Worker secret:
   ```bash
   cd infrastructure/contact-worker
   echo "YOUR_TURNSTILE_SECRET_KEY" | npx wrangler secret put TURNSTILE_SECRET
   ```
5. Verify that the staging warning no longer appears in Cloudflare Workers logs.
6. Test a valid submission — the Worker now verifies the token before sending.

Until Step 7 is complete, the form has no bot-challenge layer. Origin restriction and honeypot remain active. The risk is low given current traffic volume; set a reminder to complete Step 7 within 30 days.

---

## Rollback procedure

To revert the frontend change:

```bash
git revert HEAD  # reverts the formEndpoint commit
git push
```

The Worker can be disabled in the Cloudflare dashboard (Workers → krh-contact-inquiries → Disable). When disabled, the Worker returns 503 to all requests; the frontend falls back to `mailto:` as before.

---

## Known limitations

- `message` is a free-text field. Users may voluntarily include sensitive information.  
  The Worker strips PII from logs. Do not add full request logging without a privacy review.
- The Worker uses Cloudflare Email Routing, which provides accepted-for-delivery confirmation only — not Outlook inbox delivery confirmation. If an email is not received, check Cloudflare Email Routing delivery logs first.
- The waitlist form uses the same `formEndpoint`. When the endpoint is set, waitlist submissions will fail validation (no `name` or `message` fields) and fall back to `mailto:`. This is intentional for Phase 1. A separate `/waitlist` endpoint is tracked as Phase 2 work.
