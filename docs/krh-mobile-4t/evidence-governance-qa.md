# Evidence / Governance / FAQ — Mobile Redesign QA

Branch: `feat/krh-mobile-evidence-governance`
Worktree: `/Users/kestelridge/Developer/krh-worktrees/evidence-governance`
Scope: mobile-only (320–480px) presentation fixes to `evidence/index.html`,
`governance/index.html`, `faq/index.html` and their shared stylesheet. No
desktop layout changes, no new copy claims, no fabricated badges/certs, no
pricing, no new tracking/analytics.

## What changed

- **Stylesheet**: copied the site's cache-busted stylesheet
  `_next/static/chunks/krh-site-20261008a.css` to a new dated file
  `_next/static/chunks/krh-site-20261108a.css` and added mobile rules under
  `@media (max-width:480px)` (and a `360px` tightening tier) covering:
  - Evidence bar-chart/cards: full-width stacked bars, larger min font size
    for numeric labels/units, wrapping for long baseline-comparison strings,
    spacing around the synthetic-data disclosure badge so it doesn't get
    visually absorbed into the chart.
  - Governance boundary/prohibited-use lists and the "unverified" callout:
    single-column stacking, legible line length, visible borders between
    "what we do / don't do" blocks at narrow widths.
  - FAQ accordion: full-width tap targets for `<summary>`, visible
    chevron/plus affordance, adequate answer-text line length, no
    horizontal scroll.
  - All 3 pages' `<link rel="stylesheet">` references repointed to the new
    CSS filename (this produced the small diffs seen in each HTML file).

- **FAQ accordion**: confirmed/left on native `<details>/<summary>` markup
  (16 `<details>` elements across 6 topic sections; one item per section
  pre-opened via `open=""`). This means the **full answer text is present
  in the server-rendered HTML** for every question — collapsed items hide
  visually via native `<details>` semantics, not via a JS-only disclosure,
  so a crawler or no-JS client still receives 100% of the answer text and
  real heading structure (`h2` per topic, `h3` per question).

## Verification method

The direct `/evidence/`, `/governance/`, `/faq/` routes throw a client-side
Next.js hydration error ("This page couldn't load") in this dev-preview
environment — confirmed on all three routes but **not** on `/` (homepage
hydrates fine), so this is a pre-existing environment/build limitation
unrelated to this change, not a regression introduced here. This is why a
`docs/_noscript_preview/<page>/` mirror (stripped of the hydration-failing
inline scripts) already existed in this worktree before this session and
was used for screenshot verification instead.

That mirror strips the site's scroll-reveal script, which left sections
under `.section-edge{opacity:0}` permanently invisible (they're normally
flipped to `opacity:1` by an IntersectionObserver on scroll). This produced
misleading "blank" screenshots on the first capture pass. Root-caused via
`getComputedStyle`/`elementFromPoint` inspection (content was present with
correct color/height — just `opacity:0` on an ancestor `<section>`), then
corrected by injecting a one-off `opacity:1 !important` override **in the
screenshot-capture script only** (not shipped to the site) before
recapturing. Final screenshots below reflect real rendered content.

No real horizontal-overflow bug was found: `document.documentElement.scrollWidth`
equals `window.innerWidth` at 320/375/480px on all three pages.

## Screenshots

`docs/krh-mobile-4t/screenshots/evidence-governance/`

- Before (pre-existing from earlier in this session): `before_{evidence,governance,faq}_{320,375,480}.png`
- Final verified full-page captures: `final_{evidence,governance,faq}_{320,375,480}.png`

Spot-checked via vision inspection:
- **Evidence**: bar comparison shows legible units ("min"), a visible
  synthetic-data disclosure ("2,318 synthetic holdout sessions. No
  real-clinic validation or observed operational benefit."), a weak→strong
  baseline ladder (fixed-ratio floor → historical mean → spreadsheet rule →
  linear regression → model), and a "Read how it was measured →" link to
  methodology. No overlap/overflow at 375px.
- **Governance**: boundary/prohibited-use list, human-authority-over-automation
  statement, data posture, and an explicit unverified/limitations section
  all present and legible at mobile widths; no certification-badge imagery
  anywhere on the page (confirmed by DOM inspection — no `badge`/`cert`
  image or SVG nodes).
- **FAQ**: accordion renders as question rows with chevron affordance;
  open items show full answer paragraphs; closed items show question text
  only (expected collapse behavior); no overflow.

## Numeric cross-check (Evidence vs FAQ)

Checked for the exact figures both pages cite for forecast accuracy and
baselines:

- Evidence: "23.76 minutes" model MAE vs baselines "24.01" (per-provider
  regression), "33.42" (spreadsheet rule), "208.61" (fixed technician:provider
  ratio floor); comprehensive-session weak point "26.9 minutes".
- FAQ: same four figures (23.76 / 24.01 / 33.42 / 208.61) quoted verbatim in
  the methodology question.

**No contradiction found** between FAQ and Evidence for these figures —
they match exactly. I did not find a differing "technician-minutes" number
between the two pages in this pass. If the parallel `feat/krh-mobile-claims-content`
workstream has already normalized a discrepancy I'm not seeing (e.g. in
Product copy rather than these three pages), that's out of scope here and
I'm not touching copy/numbers — only presentation/CSS and the stylesheet
`<link>` href.

## Hard-rule compliance

- No fabricated certifications/compliance badges added or found.
- No price anywhere in the diff.
- No new tracking/analytics scripts added (only `_next/static/chunks/*.css`
  and 3 HTML `<link href>` attribute edits).
- No production deploy performed; all verification against local dev
  server (`http://localhost:8743`).

## Known follow-ups (not fixed here, flagged for awareness)

- The `/evidence/`, `/governance/`, `/faq/` hydration crash in this preview
  environment pre-dates this session and affects all three target routes;
  worth a separate ticket if it's not just a stale local dev-server
  artifact.
- Scroll-reveal `.section-edge{opacity:0}` sections rely entirely on JS to
  ever reach `opacity:1`. This is a sitewide pattern (not unique to these
  3 pages) and out of scope for this task, but worth noting: if that JS
  ever fails to load/execute for a real visitor (not just this dev
  preview), whole sections of the page would stay invisible. Doesn't
  affect the FAQ answer-text/crawler requirement since that's solved via
  native `<details>`, independent of the reveal script.
