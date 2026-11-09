# Performance Baseline (Lab Proxy) — KRH Mobile Rebuild

**Status:** PRE-MERGE BASELINE, captured 2026-11-08 against the live
production site. All numbers below are **lab proxy measurements from a
single-request `curl` from this machine's network location — they are NOT
real user field Core Web Vitals (LCP/INP/CLS)**. No RUM/CrUX/field data was
collected or is claimed here. A field-data pass (e.g. PageSpeed Insights
CrUX, or real-device testing) is still needed and is out of scope for this
baseline.

## Method
`curl -s -o /dev/null -w "<timing fields>"` against each page, single
request, no cache-busting repeats, no throttling simulation (i.e. this is
best-case network conditions, not "fast 3G" mobile-representative
conditions). Byte sizes are the initial HTML document only, not full page
weight (CSS/JS/images/fonts are listed separately below, not summed).

## Response time & initial HTML size (lab proxy, not field CWV)

| Page | DNS | Connect | TTFB | Total | HTML size |
|---|---|---|---|---|---|
| `/` | 0.003s | 0.032s | 0.109s | 0.110s | 47,979 bytes |
| `/product/` | 0.003s | 0.029s | 0.210s | 0.230s | 87,185 bytes |
| `/contact/` | 0.003s | 0.026s | 0.119s | 0.124s | 49,490 bytes |
| `/pilot/` | 0.001s | 0.023s | 0.143s | 0.173s | 92,764 bytes |

Observations:
- TTFB for `/` and `/contact/` is ~0.1–0.12s (fast). `/product/` and
  `/pilot/` are slower to first byte (~0.14–0.21s) and have ~2x the HTML
  payload of `/` and `/contact/` — likely more inline SSR content
  (how-it-works / pilot phase detail sections).
- These are single-sample measurements from one location; not a
  statistically robust baseline. Treat as directional only.
- **These pages also fail to render client-side** (see
  `mobile-qa.md` §0) — so "fast TTFB" here does not mean the page is
  usable; it means the server responded fast with HTML that the browser
  then fails to hydrate into a working page.

## Render-blocking resources

### Homepage (`/`, static HTML, not Next.js)
- One synchronous inline `<script>` in `<head>` (Microsoft Clarity loader
  stub). It is a no-op today (empty project ID, early-returns before any
  network call) so it does not block on a request, but it does execute
  synchronously before paint. Negligible cost but worth flagging: if/when
  a real Clarity ID is set, this becomes a blocking third-party script tag
  in `<head>` and should be converted to `async`/moved to end of `<body>`.
- No other synchronous `<script src>` found in `<head>`.
- Final script before `</body>` (`site-analytics.js`) is `defer` —
  correctly non-blocking.
- Fonts: 3 self-hosted `@font-face` declarations (Public Sans, Source
  Serif 4, IBM Plex Mono), all `latin`-subsetted variable fonts,
  `font-display: swap` set on all three. Sizes: Public Sans 26.8 KB,
  Source Serif 4 49.6 KB, IBM Plex Mono 14.4 KB (woff2). Not preloaded in
  `<head>` via `<link rel=preload>` on the static homepage — only declared
  via `@font-face`, so the browser discovers them after CSS parse
  (standard behavior, not a severe issue given `font-display:swap`, but a
  `<link rel=preload as=font>` for the above-the-fold display font would
  shave a render-delay step).

### Next.js pages (`/product/`, `/contact/`, `/pilot/`)
- No synchronous `<script src>` in `<head>` — all chunk scripts use
  `async` (standard Next.js App Router output, confirmed in source).
  `/product/` references 9 chunk files, all independently verified
  returning HTTP 200 (not 404s — see `mobile-qa.md` §0 for why the page
  still fails to render despite assets loading fine).
  One of those chunks is explicitly tagged `fetchPriority="low"`.
- Fonts: same two font families reused (Public Sans, Source Serif 4),
  served from `/_next/static/media/...woff2`, **preloaded** via
  `<link rel="preload" as="font" crossorigin type="font/woff2">` in
  `<head>` — this is the more correct pattern vs. the homepage's
  unpreloaded `@font-face`-only approach. Same byte sizes as homepage
  fonts (26,832 / 50,824 bytes) — i.e. not re-bundled/duplicated, good.
- Hero image uses responsive `imageSrcSet` (640/828/1080/1280/1920w) with
  `fetchPriority="high"` preload — correct responsive-image practice.

## Findings summary
1. No render-blocking synchronous third-party `<script>` found on any of
   the 4 pages today. Current script loading strategy (async/defer) is
   sound and should be preserved by the redesign branches.
2. Fonts are self-hosted, subsetted to `latin`, and use `font-display:
   swap` — good baseline. Next.js pages preload fonts; the static
   homepage does not — a minor, low-risk inconsistency to note for the
   home-hero redesign branch.
3. `/product/` and `/pilot/` have roughly double the initial HTML byte
   size of `/` and `/contact/` and higher TTFB — worth a post-merge check
   that mobile redesign branches don't add further payload to these
   already-heavier pages.
4. The real performance risk right now isn't bytes or blocking scripts —
   it's that 3 of 4 pages don't render at all client-side (critical
   defect, see `mobile-qa.md` §0). Fix that before optimizing further.

## Outstanding / explicitly not claimed
- No LCP, INP, or CLS numbers are reported — collecting real field CWV
  requires either CrUX/PageSpeed Insights (needs sufficient field traffic,
  which this early-stage site likely lacks) or a Lighthouse/WebPageTest
  lab run, neither of which was run in this pass. **Do not treat anything
  in this document as a Core Web Vitals score.**
- No mobile network throttling simulation (e.g. "Slow 4G") was applied;
  all timings are best-case broadband from this host.
- Post-merge: re-run this same `curl` timing sweep plus a proper
  Lighthouse mobile run (lab proxy only) once mobile branches land, and
  flag any regression in HTML size or TTFB versus the numbers above.
