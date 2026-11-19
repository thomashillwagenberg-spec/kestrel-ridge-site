# Inquiry to CRM recording (contact Worker)

Status: built on branch `feat/inquiry-crm`. NOT deployed. The migration in
`crm/migrations/` is NOT applied to the production CRM. The feature is off
until the owner sets the CRM secrets below.

## What it does

For every accepted `/submit` contact inquiry the Worker:

1. Derives a server-side inquiry ID, `KRH-INQ-YYYYMMDD-XXXXXXXXXX`, from an
   idempotency key = SHA-256 of (normalized email + client `submissionId` when
   valid, otherwise message hash + 15 minute UTC bucket).
2. Sends the notification email through Resend with the ID in the subject
   (`KRH Phase Zero inquiry [KRH-INQ-...]`) and body (`Inquiry ID:` line), and
   with `Idempotency-Key: krh-inq/<key>` so Resend drops a repeat send of the
   same submission within 24 hours.
3. If `CRM_URL` and `CRM_SERVICE_KEY` are both set, inserts one row into
   `public.website_inquiries` through the Supabase REST API (PostgREST). A
   repeat of the same submission hits `UNIQUE (idempotency_key)` and returns
   HTTP 409, which the Worker treats as "already recorded".

The waitlist path is unchanged and does not write to the CRM.

## Privacy

Stored fields: inquiry_id, idempotency_key, received_at, form_type,
contact_name, organization, email (lowercased), message_sha256, source.
The free-text message is NOT stored (only its hash), so anything a visitor
types, including possible PHI, never reaches the CRM by this path. The full
message stays in the notification email, matched by inquiry ID.

Logs contain only event name, inquiry ID and HTTP status / error class.
Never names, emails, organizations, message text, or keys
(enforced by `test/inquiry-crm.test.mjs`).

## Failure behavior

- CRM config missing or not https: CRM step skipped, email-only (previous
  behavior, byte-for-byte except the ID in the subject/body and the Resend
  idempotency header).
- CRM network error, timeout (4 s), 408, 429, 5xx: retried, at most 3 attempts
  with short backoff, run under `ctx.waitUntil` so the visitor response is not
  delayed. Other 4xx (bad key, schema drift): not retried.
- Final failure logs `crm_write_failed` with the inquiry ID. The email is
  still sent and the visitor still gets 202.
- If the email fails, the CRM row is still attempted, and the visitor gets the
  existing 502 so they can retry; the retry reuses the same ID and key.

## Manual reconcile

Run whenever `crm_write_failed` appears, or weekly while the feature is new.

1. Find failures: Cloudflare dashboard > Workers > krh-contact-inquiries >
   Logs, filter `crm_write_failed` (or `npx wrangler tail` by the owner).
   Note each inquiry ID.
2. Find the email: search the twagenberg@kestrelridgehealth.com inbox for the
   inquiry ID (it is in the subject).
3. In the CRM (signed in as a CRM user), check
   `select inquiry_id from website_inquiries where inquiry_id = '<ID>';`.
   If missing, insert it from the email with the same fields (compute
   `message_sha256` with `printf %s "<normalized message>" | shasum -a 256`,
   or enter 64 zeros and note it in the contact record). Do not paste the
   message body into the CRM.
4. Link to a contact: create or find the contact in Atomic CRM, then
   `update website_inquiries set contact_id = <id>, reconciled_at = now() where inquiry_id = '<ID>';`.
5. Open items: `select * from website_inquiries where reconciled_at is null order by received_at;`.

## Owner actions to enable (all free tier)

Requires owner approval of this PR and of a separate release. In order:

1. Review and apply `crm/migrations/20261117120000_krh_website_inquiries.sql`
   to the KRH Atomic CRM Supabase project (copy into
   `~/atomic-crm/supabase/migrations/` and push with the Supabase CLI, or run
   in the SQL editor). Verify locally first: `crm/verify-migration-local.sh`
   (throwaway local Postgres, never production).
2. Create the insert-only credential: a JWT signed with the project JWT
   secret, claims `{"role":"krh_inquiry_writer","iss":"supabase"}` plus an
   expiry, using the Supabase dashboard JWT tooling or a local script. Do NOT
   use the service_role key. If the project uses the new asymmetric API keys,
   also set `CRM_API_KEY` to the project's publishable (anon) key so the
   gateway accepts the request; the role still comes from the bearer JWT.
3. Set Worker secrets (owner only, at release time):
   `npx wrangler secret put CRM_URL` (https://<project>.supabase.co),
   `npx wrangler secret put CRM_SERVICE_KEY`, optionally `CRM_API_KEY`.
4. Deploy in the owner-gated release, send one synthetic inquiry, confirm one
   row and one email share the same inquiry ID, then double-submit and confirm
   still one row and one email.

Rollback: delete the `CRM_*` secrets (Worker returns to email-only), then if
needed `drop table public.website_inquiries; drop role krh_inquiry_writer;`.
