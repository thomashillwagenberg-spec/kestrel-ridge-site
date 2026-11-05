# Reader feedback service

Purpose: collect optional article usefulness ratings and a fixed improvement choice from actual visitors. The service requests no name, email, free text or patient information. It stores an article-specific hash of a random browser identifier for duplicate suppression. The raw identifier is never stored by the service. Browser storage is created on submission. Clearing storage or using another browser can allow another response. Counts represent voluntary responses, with unverified identity and possible automated traffic.

Private storage uses Cloudflare D1. Public API exposes POST /rating and allowed-origin OPTIONS only. It validates article URLs against the live resource RSS feed. A repeated vote has recorded=false. Database failure returns a failure status. Retention is 180 days, enforced daily. No public aggregate endpoint is exposed.

Live deployment: `https://krh-reader-feedback.thomashillwagenberg.workers.dev/rating`. D1 binding and database ID are in wrangler.jsonc (identifiers, not credentials). The official Wrangler OAuth connection was authorized by the owner on November 5, 2026. Deploy with authenticated Wrangler, apply schema.sql only to the configured database and verify the endpoint before changing the widget. Tests use an isolated in-memory database and create no production ratings. Do not commit credentials or private response exports.

Private reporting: execute report.sql against the D1 database through authenticated Wrangler. Combine counts with Search Console page-level indexing, impressions, clicks and actual conversion data when available. Include dates and sample sizes. Unavailable and zero-response states must remain distinct. No seeded ratings or synthetic reader scores.

Cloudflare Web Analytics provides the current traffic measurement. The article rating is explicit feedback, separate from search and inquiry outcomes. The weekly report should report usefulness percentage together with response count. Statistical or causal performance claims need more evidence than a few votes.
