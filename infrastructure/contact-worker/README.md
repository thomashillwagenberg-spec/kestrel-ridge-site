# KRH Outlook contact Worker (review only, not deployed)

Status: **PROTOTYPE**. This directory is intentionally isolated from the published Next.js static export. The authoritative Next.js source has not been recovered. **No production website edits, Workers, DNS, Outlook, or billing settings are made by adding this code.**

## Goal and mailbox

A future Phase Zero web form submits an HTTPS **POST** to this Worker at `/submit`. If validation succeeds, the Worker uses Cloudflare's email-sending binding to notify exactly:

**twagenberg@kestrelridgehealth.com** (Microsoft Outlook / Microsoft 365).

The sender address in `src/worker.mjs` is `notifications@kestrelridgehealth.com` and must be authorized/onboarded with Cloudflare Email Service before deployment. Neither the sender nor receiver should be switched to Gmail. Do not change the existing Microsoft 365 MX or SPF records to Cloudflare Email Routing without careful verification and approval.

## Why Cloudflare Email Service first?

Cloudflare's current documentation says email sends to **verified destination addresses** are free on Workers Free and Workers Paid. Arbitrary recipient sending has different plan requirements. Cloudflare also documents a `send_email` Worker binding with `destination_address` to lock delivery to one verified address. Verify KRH-account availability and all onboarding DNS effects before enabling.

- Pricing: https://developers.cloudflare.com/email-service/platform/pricing/
- Workers API: https://developers.cloudflare.com/email-service/api/send-emails/workers-api/
- Binding: https://developers.cloudflare.com/email-service/configuration/send-bindings/
- Sender domain onboarding: https://developers.cloudflare.com/email-service/get-started/send-emails/
- Turnstile server verification: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/

## What is implemented

- CORS allowlist for `https://kestrelridgehealth.com` and `https://www.kestrelridgehealth.com`.
- Only POST to `/submit`, with JSON and URL-encoded form bodies accepted.
- Simple length and email checks; plain-text notification; no files or attachments.
- A hidden `website` honeypot check. **Not sufficient by itself**.
- Server-side Turnstile Siteverify. Token must be valid for an allowed KRH hostname with `data-action="krh_contact"`.
- Restricted recipient hardcoded and locked by `destination_address`.
- No message/PII/IP-address logging; no use of GA4.
- A response of HTTP 202 `accepted_for_delivery` only means the email send API accepted the message. It **does not prove Outlook inbox delivery**.

## Required before deployment (owner approval)

1. Recover the original editable Next.js site source and a reproducible build process. Avoid editing prebuilt HTML or hashed JS bundles as the long-term solution.
2. Verify `twagenberg@kestrelridgehealth.com` as an allowed email destination in the Cloudflare account. This must not change KRH's incoming Microsoft 365 MX route.
3. Verify whether Cloudflare Email Sending/domain onboarding works on the KRH account and list **all** DNS changes in advance. Confirm domain authentication and Microsoft 365 coexistence; no DNS changes without approval.
4. Register a production Turnstile widget restricted to the KRH site. Configure action `krh_contact`. Store its secret securely as a Worker secret (`TURNSTILE_SECRET`); **never commit it**. Client-side widget must submit either `turnstileToken` or `cf-turnstile-response`.
5. Add proper server-side rate limiting/bot-abuse controls (Cloudflare WAF or equivalent). Turnstile and honeypot alone are insufficient against high-volume abuse.
6. Add a real form in the **source** with explicit POST behavior so no-JavaScript use can never leak form fields in a GET query URL. Keep a direct mailto alternative. Include a visible **do not send PHI or patient records** warning.
7. Confirm production API URL, the browser Content Security Policy, allowed origins and failed-submission behavior. Consider using a same-origin route if appropriate.
8. Verify real Outlook delivery using synthetic data, not patient data. Check Microsoft 365 junk/quarantine and Cloudflare email logs. Do not declare success until a test email actually reaches the specified inbox.
9. Update the privacy notice, footer, old waitlist mentions, and exported Next.js RSC data together. Verify actual Cloudflare/Zaraz/GA4/cookie behavior and whether cookie consent is required. No default cookie banner.
10. Have the owner approve rollout after tests. Do not enable billing, Microsoft Graph, publish changes, merge or deploy through this PR.

## Example client request (illustrative only)

POST to `https://YOUR-WORKER.workers.dev/submit`, with `Content-Type: application/json`:

```json
{
  "name": "Sample Person",
  "organization": "Sample Clinic",
  "email": "sample@example.com",
  "message": "Please tell me about your Phase Zero staffing assessment.",
  "turnstileToken": "TOKEN_FROM_TURNSTILE_WIDGET"
}
```

All submitted data stays out of URLs. Server response is `202` with `status: "accepted_for_delivery"` only after `EMAIL.send()` resolves. UI must accurately describe this acceptance, rather than guaranteeing delivery.

## Local unit tests

Requires Node.js 22+, no dependency install.

```bash
cd infrastructure/contact-worker
npm test
```

The tests use synthetic input and stub the Turnstile service and Cloudflare email sender. They do **not** establish real delivery, account permissions, domain verification, or production readiness.

## Known gaps

- Original editable site source and deployment procedure missing.
- Cloudflare account authorization, domain onboarding, sender and verified destination are unconfirmed.
- Turnstile site key, Worker secret, WAF/rate limiting, routes, CSP and real delivery testing are not configured.
- Source-level form integration and no-JS behavior are not implemented.
- Cookie/privacy, GA4 redaction and historical URL-PII audits, waitlist removal, and Looker Studio are separate unfinished tasks.

See [Issue #3](https://github.com/thomashillwagenberg-spec/kestrel-ridge-site/issues/3) for the overarching remediation checklist.
