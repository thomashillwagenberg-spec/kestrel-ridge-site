# Lead funnel measurable events — proposal (not yet implemented)

Per task constraints: no new third-party trackers, propose don't silently
add tracking. This document proposes what *should* be measurable to know
whether the Phase Zero funnel works, using only infrastructure already in
place (Cloudflare Web Analytics is already disclosed in the site footer;
the contact Worker's own logs). Nothing below has been wired up as actual
tracking code — it's a specification for review.

## Why these events, not more

The Worker's own code comment is explicit: "No analytics, no raw inquiry
logging, no PII in Worker logs." Any event scheme must respect that. The
events below are counts/statuses only — never name, email, organization, or
message content.

## Proposed event set

| Event | Fired when | Data captured | Where it would live |
|---|---|---|---|
| `pilot_cta_click` | Visitor taps a CTA on `/pilot/` or `/` that routes to `/contact/` | page path, CTA label (static string, not free text) | Client-side, Cloudflare Web Analytics custom event (already-disclosed tool, no new vendor) |
| `contact_form_attempt` | Visitor submits the main inquiry form (client-side, before the network call resolves) | page path only | Client-side analytics event |
| `contact_form_accepted` | Worker responds `202 {"ok":true}` for the main inquiry | HTTP status only | Client-side analytics event, fired from the real fetch response handler (not assumed) |
| `contact_form_rejected` | Worker responds `400`/`403`/`502`/`503` for the main inquiry | HTTP status only (no error text, which could theoretically echo input) | Client-side analytics event |
| `contact_mailto_fallback_used` | User clicks the direct-email `mailto:` fallback link (e.g. JS disabled, or after repeated failures) | page path only | Client-side analytics event |
| `waitlist_attempt` | Visitor submits the separate waitlist opt-in | none beyond the fact of the event | Client-side analytics event |
| `waitlist_accepted` | Worker responds `202` specifically on the `source:"waitlist"` branch | HTTP status only | Client-side analytics event |
| `contact_form_server_delivery_verified` | **Server-side**, not client-side: Resend accepts the message (i.e. `sendViaResend`/`sendWaitlistViaResend` complete without throwing) | boolean outcome only, no payload | Worker-side log line (already partially present as `console.error` on failure; would add a matching non-PII success counter) |

## What "qualified" would need (explicitly out of scope today)

A `contact_form_qualified` event (e.g. a human at KRH triages the inbound
email and marks it as a real clinic, not spam/recruiting/vendor pitch)
cannot be automated safely without either (a) a CRM webhook, which does not
exist yet, or (b) parsing message content, which risks exactly the PII
handling the Worker avoids. Proposed: a manual tag applied when triaging
the inbox, counted separately, not inferred from form data.

## Explicitly not proposed

- No session recording, no fingerprinting, no third-party pixel/tag beyond
  the Cloudflare Web Analytics already disclosed on the site.
- No event payload includes name, email, organization, or message text —
  only the fact an event happened and its HTTP outcome class.
- No client-side event fires speculatively before a real server response is
  received for `_accepted`/`_rejected` events — those are gated on the
  actual `fetch()` resolution, consistent with never claiming a success the
  backend didn't confirm (see `form-delivery-test.md`).

## Status

**Proposal only.** No analytics code has been added to the site as part of
this task. If approved, implementation would hook into the existing
Cloudflare Web Analytics snippet (`/assets/site-analytics.js`) already
present on every page, using its custom-event API rather than adding a new
vendor script.
