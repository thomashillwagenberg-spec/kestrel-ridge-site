# KRH Live-Site Technical SEO Audit

**Audited:** 2026-11-09 (live site, unauthenticated `curl` against https://kestrelridgehealth.com/)
**Method:** Fetched `/sitemap.xml` and `/robots.txt`, then for each sitemap URL plus `/methodology/` ran `curl -sI` (status/headers) and `curl -s` (raw HTML) and parsed title, meta description, canonical, meta robots, `X-Robots-Tag`, H1s, JSON-LD, and internal links. Raw outputs are cached at `/Users/kestelridge/.hermes/cache/scratch/krh_audit/` for this session; structured results are in `url-inventory.csv` (same folder as this file).

24 URLs are listed in `sitemap.xml`; 1 additional known route (`/methodology/`) was checked per task instructions. `/news/` (the bare index) returns a live **404** — only the article `/news/kestrel-ridge-health-phase-zero/` exists, which is already in the sitemap.

## Pass/Fail Summary

| Check | Result |
|---|---|
| Unique `<title>` across all 25 fetched URLs | **PASS** — no duplicates |
| Unique meta description across all 25 URLs | **PASS** — no duplicates |
| Exactly one H1 per page | **FAIL (1 page)** — `/methodology/` has 0 H1s (see below); all 24 sitemap pages have exactly 1 H1 |
| Crawlable internal links (plain `<a href>`, no JS-only nav) | **PASS** — all internal hrefs are standard `/path/` anchors in server-rendered HTML, no `#` or `javascript:` navigation found |
| No accidental noindex | **PASS** — no `meta name="robots"` or `X-Robots-Tag` header containing `noindex` on any of the 25 URLs |
| No duplicate canonicals among sitemap pages | **PASS** — each of the 24 sitemap URLs self-canonicalizes; the only canonical collision is `/methodology/` → `/evidence/`, which is a deliberate redirect notice, not a sitemap page (see below) |
| Sitemap lastmod realism | **PASS** — all 24 `lastmod` dates are in the past relative to audit date (2026-11-09), none future-dated; range 2026-09-09 → 2026-11-07, consistent with an actively-updated content calendar |
| robots.txt correctness | **PASS** — `Allow: /` globally, explicit `Sitemap:` directive present and resolves (200, valid XML), targeted disallow of Next.js RSC payload files (`/*__next*`, `/*/index.txt`) is correct practice and does not block any indexable content |

## `/methodology/` — real page or thin redirect? (explicitly re-verified)

**Live HTTP behavior observed via `curl`:**
- `curl -sI https://kestrelridgehealth.com/methodology/` → **HTTP/2 200** (not a 301/302 — no HTTP-level redirect)
- `curl -s` body is a **584-byte stub page**: a full `<head>` with its own `<title>`Evaluation Methodology | Kestrel Ridge Health`</title>`, its own meta description, **`<link rel="canonical" href="https://kestrelridgehealth.com/evidence/">`**, a `<meta http-equiv="refresh" content="0;url=/evidence/">`, and `<script>window.location.replace("/evidence/")</script>`, followed by a one-line `<body>` ("Redirecting to Evidence…"). Zero H1, zero JSON-LD, 1 internal link.
- It is **not listed in `sitemap.xml`**.

**Conclusion:** `/methodology/` is a thin client/meta-refresh redirect notice to `/evidence/`, correctly self-canonicalizing to the target it redirects to, and correctly excluded from the sitemap. It is not indexable duplicate content by design (canonical + redirect both point crawlers to `/evidence/`), but it does serve HTTP 200 instead of a real 301/302 — a crawler that ignores the canonical/meta-refresh and only reads the status code would see a real (if empty) page.

**Root cause found in the worktree:** the repo's `_redirects` file (repo root) already contains the correct rule:
```
/methodology/ /evidence/ 301
/methodology  /evidence/ 301
```
This is Netlify/Vercel-style redirect syntax. Response headers on the live site (`x-github-request-id`, `server: cloudflare`, `x-served-by`/`x-fastly-request-id`) indicate the site is actually hosted on **GitHub Pages**, fronted by Cloudflare/Fastly — **GitHub Pages does not process `_redirects` files**, so this rule is silently inert on the current host. That's why the committed `methodology/index.html` static-stub fallback (meta-refresh + JS redirect, title/canonical pointing to `/evidence/`) is what actually serves, exactly matching the live `curl` output. This is a hosting-platform limitation, not a content bug — no local file fix applies here since the `_redirects` file is already correct; the gap is that the deploy target doesn't honor it. Flagging for infra attention (e.g. move the rule into a GitHub Pages–compatible mechanism, or a true edge redirect at the Cloudflare/Fastly layer) rather than making an unverifiable local change.

## JSON-LD structured data

See `jsonld-tests.md` for the full per-page breakdown. Headline findings:

- All 24 real content pages carry `Organization` + `WebSite` (site-wide) plus a page-specific type: `WebPage`, `Article`, `NewsArticle`, `FAQPage`, `CollectionPage`, `Person`, and `BreadcrumbList` as appropriate. All JSON-LD blocks parsed as valid JSON (no syntax errors).
- **FAQPage schema on `/evidence/`, `/faq/`, `/governance/`**: every `Question`/`acceptedAnswer` pair in the JSON-LD was checked against the raw page HTML text — **100% match**, all question text and answer text appear verbatim in the server-rendered body. No invalid/unmatched FAQPage schema found.
- **`SoftwareApplication` schema**: the string `"SoftwareApplication"` does appear in the raw HTML of 12 pages (`/`, `/accessibility/`, `/contact/`, `/evidence/`, `/faq/`, `/forecasting-technician-workload-by-session/`, `/governance/`, `/how-it-works/`, `/ophthalmic-technician-staffing-ratios/`, `/pilot/`, `/product/`, `/technician-shortage-session-variance/`, `/terms/`) but **it is not inside an actual rendered `<script type="application/ld+json">` tag** — it only occurs inside the page's embedded Next.js React Server Components (RSC) flight-data payload (a separate, escaped JSON blob used for client hydration, not parsed by search engines as structured data). Confirmed by isolating the two real `application/ld+json` `<script>` tags on `/product/` and verifying their parsed `@graph` types are only `['WebPage','BreadcrumbList']` and `['Organization','WebSite']` — no `SoftwareApplication`. Checked the RSC-payload `SoftwareApplication` object itself for `aggregateRating`, `offers`, or `price` fields on all 12 pages: **none present** on any of them. **No invalid/misleading SoftwareApplication schema is actually being served to crawlers.**

## Content rendering (SSR check)

Spot-checked FAQ Q&A text, H1 text, and body copy against raw `curl -s` output (no JS execution) for all 25 URLs: content is fully present in the first-byte HTML (server-side rendered), not injected client-side only. This confirms "critical content"/direct-answer text is crawlable without JS execution.

## Minor issues found (not blocking, noted for follow-up)

- Meta description on `/` (188 chars) and `/contact/` (196 chars) exceed the ~155-160 char guideline where Google typically truncates in SERPs — not broken, just long.
- Titles on 5 of the newer article pages (`ophthalmology-staffing-forecast-readiness`, `screening-schedule-changes-technician-coverage`, `adding-ophthalmologist-technician-coverage`, `ophthalmology-staffing-forecast-error-review`, `ophthalmic-technician-training-coverage`) run 78-83 chars, above the ~60 char guideline for full SERP display — not broken, cosmetic truncation risk only.
- `/methodology/` returns 200 instead of a true 3xx redirect (see above).

## What could NOT be checked (honest limitations)

- **No Google Search Console / Bing Webmaster data** — this audit has no authenticated access to Search Console, so actual impressions, click-through rate, average position, indexing status per Google, or crawl-error reports **were not and could not be retrieved**. Nothing in this report represents real ranking/impression numbers; any such figures would have to come from an authenticated GSC session, which was not available.
- No Core Web Vitals / Lighthouse performance data was gathered (out of scope per task, which asked for structural/technical SEO, not performance).
- No check of actual Google index coverage (`site:` operator results were not queried) — this would need either GSC access or a live search query, neither performed here to keep the audit to verifiable `curl` evidence only.
