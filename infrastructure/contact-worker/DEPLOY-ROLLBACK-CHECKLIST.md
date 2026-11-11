# KRH Contact System: Deploy and Rollback Checklist (corrected)

Applies to: PR #18 (`release-candidate-test`, head `3b9e557`) and any later fix commit.
Replaces the deploy/rollback sections of `Work Products/KRH-Release-Checklist.md` and `infrastructure/contact-worker/DEPLOYMENT.md`, which are wrong (see RELEASE-VERIFICATION.md section 7).
Status: DO NOT START until every blocker in RELEASE-VERIFICATION.md section 9 is cleared and Thomas authorizes the deploy in writing.

Sources (checked 2026-11-11):
- Secrets: https://developers.cloudflare.com/workers/configuration/secrets/ ("`wrangler secret put` creates a new version of the Worker and deploys it immediately." ... "If using gradual deployments, instead use the `wrangler versions secret put` command.")
- Wrangler commands: https://developers.cloudflare.com/workers/wrangler/commands/workers/ (`versions upload`, `versions secret put [KEY]`, `versions deploy [VERSION-SPECS]` with `<version-id>@<percentage>`, `--percentage`, `--message`, `--yes`, `--dry-run`; `wrangler rollback [<VERSION_ID>]`)
- Gradual deployments: https://developers.cloudflare.com/workers/configuration/versions-and-deployments/gradual-deployments/
- Rollbacks: https://developers.cloudflare.com/workers/configuration/versions-and-deployments/rollbacks/ ("Resources connected to your Worker will not be changed during a rollback." Limit: 100 most recent versions.)

Re-check the syntax with `npx wrangler versions --help` on the day; Wrangler changes.

## 0. Hosting map and per-component rollback

| Component | Hosted on | Change in this release | Rollback |
|---|---|---|---|
| Static site (HTML/JS, Turnstile render) | GitHub Pages, legacy build from `main` `/` | Only if B1 is fixed on the frontend | `git revert <merge-sha>` on `main`, push, wait for the Pages build, hard-refresh. No Cloudflare Pages is involved. |
| Edge proxy, DNS, WAF/security rules | Cloudflare zone `kestrelridgehealth.com` | None. Do not change. | n/a. If anything was touched by mistake, restore from the Cloudflare audit log. |
| Contact Worker `krh-contact-inquiries` | Cloudflare Workers (`*.workers.dev`) | New code + secrets + rate-limit bindings | `npx wrangler rollback 9f1006ea-84e5-4f55-b46b-13cb85a47402 --message "rollback"` or `npx wrangler versions deploy 9f1006ea-84e5-4f55-b46b-13cb85a47402@100%`. Note: that version has no secrets and is already non-working (preflight returns 400), so rollback restores "broken but sends nothing", not a working form. |
| Resend | Resend account, domain `kestrelridgehealth.com` | None (read-only confirmation) | Revoke/rotate the API key in the Resend dashboard if it leaked. |
| Destination mailbox | Microsoft 365, `twagenberg@kestrelridgehealth.com` | None | n/a. If mail lands in Junk, add a transport rule or safe-sender entry; do not change MX/SPF. |

## 1. Pre-flight (no production change)

- [ ] All RELEASE-VERIFICATION.md blockers B1 to B7 closed, with evidence links.
- [ ] Worker tests run in CI and pass (B5): CI log shows `node --test infrastructure/contact-worker/test/worker.test.mjs` with 0 failures.
- [ ] Local burst harness re-run on the final commit; results attached.
- [ ] Resend dashboard (Thomas): domain `kestrelridgehealth.com` shows Verified. Write down the exact From address to use, e.g. `KRH Contact <notifications@kestrelridgehealth.com>`. It must be on the exact apex because `worker.mjs:18` allows only `kestrelridgehealth.com`. DNS alone is not proof.
- [ ] Turnstile dashboard (Thomas): the widget for the sitekey embedded in the live JS lists `kestrelridgehealth.com` and `www.kestrelridgehealth.com`.
- [ ] Record the rollback target: `npx wrangler deployments list` shows the active version (today `9f1006ea-84e5-4f55-b46b-13cb85a47402`, 100%).
- [ ] Rollback operator available for 30 minutes after deploy.

## 2. Stage the Worker version WITHOUT deploying it

Run from `infrastructure/contact-worker` on the reviewed commit. Never use `wrangler secret put` or `wrangler deploy` for this release: both deploy immediately.

```
npx wrangler versions upload --message "PR18 <short-sha>"
```
Record the printed Version ID as NEW_ID. This version is not serving traffic.

Add secrets to a new staged version (each command creates another version, still not deployed; Thomas types each value at the hidden prompt himself, never in chat, never via `echo ... |`):

```
npx wrangler versions secret put RESEND_API_KEY --message "PR18 secrets 1/3"
npx wrangler versions secret put TURNSTILE_SECRET --message "PR18 secrets 2/3"
npx wrangler versions secret put SENDER_FROM --message "PR18 secrets 3/3"
```
(Alternative for SENDER_FROM: set it as a plain `[vars]` entry in `wrangler.toml` before `versions upload`, since it is not secret. Choose one, not both.)

Then:
- [ ] `npx wrangler versions list` : the newest version (the one after the third secret put) is FINAL_ID. Confirm it is NOT in `npx wrangler deployments list`.
- [ ] `npx wrangler versions view FINAL_ID` : shows the rate-limit bindings `RATE_LIMITER` (10/60) and `WAITLIST_RATE_LIMITER` (3/60), `ENVIRONMENT=production`, and secret NAMES only.
- [ ] `npx wrangler versions deploy FINAL_ID@100% --dry-run` if supported by the installed Wrangler, to review the plan.

Caveat: `versions secret put` builds on the latest uploaded version. Do not upload anything else between these steps.

## 3. Deploy

The current live version is already non-functional (preflight 400, no secrets), so a split keeps a share of users on a broken form. Two supported options; Thomas picks one:

- Gradual: `npx wrangler versions deploy 9f1006ea-84e5-4f55-b46b-13cb85a47402@90% FINAL_ID@10% --message "PR18 canary"`, run the acceptance tests (expect some requests to hit the old version; retry the preflight check), then `npx wrangler versions deploy FINAL_ID@100% --message "PR18 full"`.
- Direct (recommended here, since the old version cannot serve anyone): `npx wrangler versions deploy FINAL_ID@100% --message "PR18 full"`.

- [ ] `npx wrangler deployments list` shows FINAL_ID at the intended percentage.
- [ ] If B1 is fixed on the frontend: merge the frontend change to `main` only after the Worker is live, wait for the GitHub Pages build to succeed, confirm the new chunk is served (grep the live JS for `krh_contact`).

## 4. Verify

Run PROD-ACCEPTANCE-TESTS.md. One controlled submission per path. No bursts against production.

## 5. Rollback triggers and steps

Trigger rollback if any of: preflight not 204, a submission returns 5xx, Resend shows a rejected/failed send, no Outlook receipt within 10 minutes, wrong user-facing message, unexpected error volume in `npx wrangler tail` (read-only log stream).

1. Worker: `npx wrangler rollback 9f1006ea-84e5-4f55-b46b-13cb85a47402 --message "rollback PR18"` (or `versions deploy <id>@100%`). Secrets travel with versions; the old version has none.
2. Static site (only if a frontend change shipped): `git revert <merge-sha>` on `main`, push, wait for GitHub Pages.
3. Secret wrong (e.g. SENDER_FROM): do NOT use `wrangler secret put` as a "quick fix" unless Thomas accepts that it deploys immediately. Preferred: `versions secret put` then `versions deploy <new>@100%`.
4. Leaked key: rotate in Resend / Turnstile dashboards, then stage and deploy the new value as above.
5. Confirm with `npx wrangler deployments list` and one OPTIONS preflight.

## 6. Prohibited during this release

- `wrangler deploy`, `wrangler secret put`, `wrangler secret delete` (all deploy immediately).
- Pasting secret values into chat, tickets, shell history, or `echo ... | wrangler`.
- Burst or rate-limit testing against production (it sends real email). Burst tests are local only (`burst-test-results.txt`).
- Changes to DNS, Cloudflare security rules, Resend domain settings, or GitHub Pages settings as part of this release.
