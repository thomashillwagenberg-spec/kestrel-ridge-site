# Mobile-only redesign QA — Product & How It Works

Worktree: `product-howitworks` · Branch: `feat/krh-mobile-product-howitworks`
Scope: `product/index.html`, `how-it-works/index.html`, new CSS chunk
`_next/static/chunks/krh-site-20261108a.css` (copy of `krh-site-20261008a.css`
plus a `@media(max-width:767px)` block; no other page's `<link>` was
repointed, so no other page is affected).

## Commits

- `36cd0a4` — final, correct version (desktop-safe). Message explains the
  fix below.
- An earlier commit (`77f059a`, since amended away) inserted the new blocks
  as siblings *before* the target `<section>` elements. That changed the
  `:first-child`/structural position of those sections even though the new
  divs were `display:none` at desktop width — `display:none` does not
  remove an element from sibling/structural-selector counting. One
  pre-existing CSS rule keyed off that position (the `rule-top` divider on
  `how-it-works`'s "Where learning stops" section), so the divider and a
  background edge silently disappeared at desktop width. Caught by a
  pixel diff against a pre-change baseline screenshot (see below), not by
  eyeballing.
- Fix: every insertion now happens *inside* an existing section (as its
  first or last child) instead of as a new sibling, so no section's
  position among its siblings ever changes. Re-diffed desktop screenshots
  before/after: **bbox: None, zero pixel difference** at 1440px for both
  pages.

## What was added (gated to `max-width:767px` via `.kr-m-only`)

### `product/index.html`
1. **3-layer mechanism explainer** — "Forecast → Rule validator → Human
   approval", color-coded cards (blue/amber/green), inserted as the first
   child of the existing "What a Tuesday actually looks like" section.
2. **Interactive invalid-assignment refusal demo** — native
   `<details>/<summary>` ("Assign Dana R. to the 7:30 AM Westside session");
   expanding it shows a synthetic refusal (site-eligibility rule, reason
   named, nothing written). Explicitly labeled "Illustrative synthetic
   example — not a live solver." Appended as the last child of the existing
   "The refusal is the feature" section.
3. **Sticky mobile Phase Zero CTA** — reuses the pre-existing
   `.kr-mobile-sticky` pattern (already used on the homepage/contact page),
   appended before `</body>`. This is the "repeated but non-spammy" CTA: one
   persistent bottom bar, on top of the inline CTAs the desktop copy already
   has — no extra banners or popups.
4. **"What a Tuesday looks like" / "what it is not"** — both already existed
   in the desktop copy as plain, already-responsive prose/step lists; no
   mobile-only change was needed there (confirmed by screenshot).

### `how-it-works/index.html`
1. **Four-stage visual** — "Data in → Forecast → Eight-rule validation →
   Human publish", numbered circles color-coded by lane (gray/blue/amber/
   green so forecast, validator and human are visually distinct), inserted
   as the first child of the existing "Where learning stops" section.
2. **Progressive-disclosure accordions** — native `<details>/<summary>` for
   all eight hard rules and all ten layers of the model, with real text in
   each `<summary>` and body (not hidden by JS — crawlable, works with
   JS disabled), appended as the last child of the existing "Hard rules,
   then preferences" section.
3. **Sticky mobile Phase Zero CTA** — same reused pattern as above.

## Verification method

Chrome's headless bundler (`google-chrome --headless --disable-gpu
--no-sandbox`) was used for screenshots because the available browser-use
backend (cloud + local) could not reach the local static file server or
`file://` assets reliably in this environment. The Next.js static export
throws a client-side hydration error (`__next_error__`, pre-existing on this
export for *any* page with React islands, confirmed on `contact/index.html`
and `evidence/index.html` too — not something this change introduced) when
served from a plain `python -m http.server` without the original asset/CDN
setup, so screenshots were taken against script-stripped copies of the
exact same HTML (`<script>` tags removed, CSS `data-reveal` opacity forced
to visible) purely to defeat (a) the hydration crash and (b) the
IntersectionObserver-driven reveal animation that would otherwise hide
below-the-fold content when JS is absent. No content or markup was edited
for the screenshot copies beyond that; they were never committed.

- Desktop regression check: full 1440×3000 screenshot of the committed
  `product/index.html` and `how-it-works/index.html` vs. a screenshot of the
  same files from the parent commit (`520d080`, i.e. pre-mobile-change).
  `PIL.ImageChops.difference(...).getbbox()` → `None` for both pages (exact
  pixel match).
- Mobile checks: full-page screenshots at 390px (iPhone 12/13/14 width) and
  320px (iPhone SE / smallest common breakpoint) for the product page, and
  390px for how-it-works, reviewed section-by-section.

## Screenshots (`docs/krh-mobile-4t/screenshots/product-howitworks/`)

| File | What it shows |
|---|---|
| `product-desktop-1440-BEFORE.png` | Product page, 1440px, pre-mobile-change baseline |
| `product-desktop-1440-top.png` | Product page, 1440px, after — pixel-identical to BEFORE |
| `how-it-works-desktop-1440-BEFORE.png` | How-it-works page, 1440px, pre-change baseline |
| `how-it-works-desktop-1440-top.png` | How-it-works page, 1440px, after — pixel-identical to BEFORE |
| `product-mobile-390-full.png` | Product page, full page, 390px width |
| `product-mobile-320-full.png` | Product page, full page, 320px width (smallest breakpoint) |
| `how-it-works-mobile-390-full.png` | How-it-works page, full page, 390px width |

## Checklist against the ask

- [x] 3-layer mechanism explainer (product)
- [x] "What a Tuesday looks like" concrete walkthrough (pre-existing,
      confirmed mobile-safe; not duplicated)
- [x] Interactive invalid-assignment refusal example, labeled illustrative
      synthetic example, not a live solver (product)
- [x] Concise "what it is / what it is not" (pre-existing, confirmed
      mobile-safe)
- [x] Repeated, non-spammy Phase Zero CTA (sticky bar, one instance, reused
      site-wide pattern) on both pages
- [x] Four-stage visual with forecast/validator/human lanes visually
      distinct (how-it-works)
- [x] Progressive-disclosure accordion for the eight hard rules and
      ten-layer model, real crawlable text via native `<details>`, not
      JS-only hidden content (how-it-works)
- [x] Breakpoints 320–480px checked (320px and 390px screenshots)
- [x] Desktop unchanged, confirmed via pixel diff, not just visual
      inspection
- [x] No fabricated customer proof, no price, no new tracking scripts, no
      production deploy
