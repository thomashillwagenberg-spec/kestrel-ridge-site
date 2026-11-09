# Launch Readiness Scorecard — KRH Mobile Rebuild

**Status: PRE-MERGE BASELINE.** Scored against current live production
(https://kestrelridgehealth.com/) and `main` branch, before any of the 7
mobile-redesign branches have merged. Most mobile-specific categories are
correctly low/TBD here — they measure work that hasn't landed yet. This
scorecard must be re-run after merge.

> **Hard veto rule (independent of score): a score ≥95/100 is desired, but
> ANY of the following is an automatic hard veto on launch regardless of
> total score: a broken route, silent lead loss, PHI risk, a desktop
> regression, or a fabricated claim.**

## 🚨 HARD VETO ALREADY TRIGGERED — see below

`/product/`, `/contact/`, `/pilot/` currently fail to render client-side in
real browsers (confirmed in 2 independent engines: pa11y's Puppeteer and a
separately-driven CDP Chromium session, reproduced 3/3 on fresh
navigations with correct URL match — see `mobile-qa.md` §0 and screenshot
`screenshots/desktop/desktop-pre-merge-pilot-1440.png`). `/contact/` and
`/pilot/` are the lead-capture funnel. **This is silent lead loss and a
broken route on two launch-critical pages, today, in production/`main`,
before any redesign branch is even involved.** Per the stated rule, this
is a hard veto. The numeric score below is informational only — it does
not override this veto, and launch should not proceed until this is fixed
and re-verified, regardless of what the other 7 branches contribute.

## Score (/100)

| Category | Max | Score | Basis |
|---|---|---|---|
| Mobile visual craft | 15 | **0/15 — TBD** | None of the 7 mobile-redesign branches have merged yet; current production mobile layout is the pre-redesign baseline, not the target design. Nothing to score as "the rebuild" yet. |
| Mobile task UX | 15 | **0/15 — TBD, and blocked** | Cannot evaluate mobile task completion (e.g. submitting the contact form, reading the pilot page) on 3 of 4 key pages because they don't render at all (see veto above). Even post-merge, this defect must be fixed before task-UX scoring is meaningful. |
| Qualified funnel | 15 | **0/15 — blocked by veto** | The funnel pages (`/contact/`, `/pilot/`) are currently non-functional in real browsers. A funnel that silently errors out converts 0 visitors. Cannot score above 0 until fixed. |
| SEO technical | 15 | **8/15** | Positives found: correct canonical/meta viewport/lang tags, clean heading order on SSR HTML, `<title>`/meta description present and page-specific on homepage. Deductions: pages that return HTTP 200 but client-error (§0) risk Google indexing a page that real users can't actually use — a technical-SEO/UX mismatch; no sitemap/robots check was performed in this pass; no structured-data (JSON-LD) presence/correctness check was performed. Needs the dedicated `-technical-seo` branch's own audit to score higher — this is a baseline floor, not a final number. |
| AEO/GEO evidence quality | 10 | **TBD — not assessed this pass** | Out of scope for this QA/accessibility/performance baseline; owned by `-evidence-governance` and `-claims-content` branches. No claims-fabrication check was run here beyond confirming no accessibility-related false claims in markup. |
| Accessibility | 10 | **7/10** | Homepage markup: clean pass (headings, alt text, landmarks, contrast, focus-visible, skip link) — see `mobile-qa.md` §1. Product/contact/pilot *markup* (SSR HTML) also looks compliant (correct labels, landmarks, alt text) but is **untestable as experienced by a real user** because of §0 — docked 3 points for that unresolved unknown, not because a specific WCAG criterion failed. Full 2.2 AA tap-target-size and reflow-at-320px checks are still outstanding (see `mobile-qa.md` next-steps). |
| Performance | 10 | **6/10** | TTFB and script-loading strategy (async/defer, no blocking third-party scripts) are solid on all 4 pages (lab-proxy data, see `measured-performance.md`). Fonts correctly subsetted/`swap`/preloaded on Next.js pages. Docked points: no real field CWV data exists or was claimed (appropriately disclosed, not a defect, but means this category can't be fully verified yet); `/product/`+`/pilot/` carry ~2x the HTML payload of the other two pages, unverified against a budget; no mobile-network-throttled lab run performed yet. |
| Claims/privacy/security | 10 | **7/10** | Cookie-consent banner present and functional on homepage (opt-in analytics, explicit no-PHI-in-forms language: "No form contents are sent"). No PHI-handling claims were found to spot-check for accuracy in the markup reviewed. Docked points: have not independently verified that `/contact/`'s actual form submission (when the page renders) avoids transmitting PHI server-side, nor audited the Next.js pages' own privacy micro-copy, since those pages don't render — another knock-on cost of §0. |
| **TOTAL** | **100** | **28/100 scored + 45 TBD + 27 blocked-by-veto** | See veto notice above — this number is not a launch gate pass; the veto is. |

## What would move the score, in priority order
1. **Fix the `/product/`, `/contact/`, `/pilot/` client-side render
   failure.** This alone unblocks 3 full categories (funnel, task UX,
   partially mobile visual craft) and removes the hard veto. Nothing else
   matters until this is done — it blocks both scoring and launch.
2. Merge the 7 mobile-redesign branches, then re-run `mobile-qa.md`'s full
   width sweep (320–480) and re-score mobile visual craft / task UX
   against the actual delivered designs.
3. Run `desktop-regression.md`'s method against the merged result — any
   failure there is itself a veto, independent of this score.
4. Get the `-technical-seo`, `-evidence-governance`, `-claims-content`
   branches' own audits folded in to complete the SEO/AEO/claims columns
   honestly (not estimated from this QA pass alone).
5. Run a mobile-network-throttled Lighthouse pass post-merge for a
   stronger (still lab-only) performance read.

## What blocked a higher score right now
- Most mobile-specific redesign work hasn't merged — by design, this
  baseline predates it (expected, not a defect).
- A genuine, reproducible production defect (§0) blocks meaningful testing
  of 3 of 4 key pages and is itself veto-triggering independent of the
  redesign timeline.
- SEO/AEO/claims ownership sits with other branches/skills not run in this
  pass; scored conservatively from what's directly observable rather than
  guessed.
