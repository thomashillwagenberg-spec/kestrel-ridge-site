# KRH Contact System: Minimal Production Acceptance Tests

Run ONLY after Thomas authorizes and DEPLOY-ROLLBACK-CHECKLIST.md sections 1 to 3 are complete.
Limits: at most ONE real submission per path (contact, waitlist). No bursts, no scripted POSTs to production. Rollback operator on standby.
Record for each step: time (UTC), result, evidence (screenshot or command output).

| # | Test | How | Pass criteria |
|---|---|---|---|
| A1 | Deployed version | `npx wrangler deployments list` | FINAL_ID at the intended %; rollback target `9f1006ea-84e5-4f55-b46b-13cb85a47402` recorded |
| A2 | Secret names present | `npx wrangler secret list` (names only) | `RESEND_API_KEY`, `TURNSTILE_SECRET`, `SENDER_FROM` (unless SENDER_FROM is a var) listed; no values printed |
| A3 | Browser preflight, allowed origin | `curl -s -o /dev/null -w '%{http_code}\n' -X OPTIONS -H 'Origin: https://kestrelridgehealth.com' -H 'Access-Control-Request-Method: POST' https://krh-contact-inquiries.thomas-ec7.workers.dev/submit` and also check the Network tab on `/contact/` | 204 with `Access-Control-Allow-Origin: https://kestrelridgehealth.com` |
| A4 | Preflight, foreign origin | same with `Origin: https://evil.example` | 403, no ACAO |
| A5 | Frontend build | View source / grep the live `/contact/` JS chunk for `action:"krh_contact"` | present; Pages build succeeded |
| A6 | Turnstile | Desktop browser, `/contact/`: widget renders and completes | token issued; no console errors besides known challenge-iframe noise |
| A7 | Contact path, one submission | Fill the form with a clearly marked test ("ACCEPTANCE TEST, ignore"), submit once | Network: POST 202 `{"ok":true,"status":"accepted_for_delivery"}`; page shows the success message (not an error, not a mailto fallback) |
| A8 | Waitlist path, one submission | Submit one waitlist signup with a test address Thomas controls | POST 202; page shows the waitlist success message |
| A9 | Sender acceptance and Resend id | Resend dashboard > Emails | two sends from the exact `SENDER_FROM`, status Delivered (not bounced/failed); record both Resend message ids (the Worker does not log them) |
| A10 | Inbox receipt | Outlook `twagenberg@kestrelridgehealth.com` | Contact email arrives with Reply-To = submitter; waitlist email arrives as an INTERNAL "KRH waitlist signup" notification with Reply-To = subscriber. The subscriber receives nothing. Check Junk too. Within 10 minutes. |
| A11 | Headers | View message source in Outlook | SPF/DKIM/DMARC pass for the From domain |
| A12 | Failure message (non-sending) | In DevTools, block the request URL `krh-contact-inquiries.thomas-ec7.workers.dev` and submit | page shows the user-facing failure message; no email sent |
| A13 | Logs | `npx wrangler tail` during A7/A8 (read-only) | no `refusing to process`, no `Resend error` lines |
| A14 | Rollback readiness | Confirm operator, command `npx wrangler rollback 9f1006ea-84e5-4f55-b46b-13cb85a47402` ready, and `git revert` plan for any frontend merge | written down before A7 |

Not tested in production by design: rate limiting, oversized bodies, honeypot, malformed input. Those are covered by the local harness (`burst-test-results.txt`).

Sign-off: all of A1 to A14 pass, then Thomas marks the release accepted. Any failure: follow DEPLOY-ROLLBACK-CHECKLIST.md section 5.
