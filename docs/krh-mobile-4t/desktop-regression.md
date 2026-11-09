# Desktop Regression Verification — METHOD (to run AFTER merge)

**Status: This is a plan/checklist only. It has NOT been executed yet.**
It describes how desktop will be verified to stay visually and
functionally intact once the 7 mobile-redesign branches
(`feat/krh-mobile-home-hero`, `-pilot-contact-funnel`,
`-product-howitworks`, `-evidence-governance`, `-claims-content`,
`-mobbin-research`, `-technical-seo`, `-screen-classification`) merge into
`main`. Nothing here is baseline data — it's the procedure to run once
merge happens.

## Why this matters
All 7 sibling branches are scoped to mobile. The implicit assumption is
"desktop behavior/layout is untouched." That assumption must be verified,
not trusted — CSS changes (new breakpoints, shared component edits,
Tailwind utility changes) commonly leak into desktop viewports even when
the stated intent is mobile-only.

## Step-by-step method

### 1. Capture a desktop "before" snapshot (do this BEFORE merging, i.e. now)
For each of the 4 key pages (`/`, `/product/`, `/contact/`, `/pilot/`) at
a standard desktop viewport (1440×900, the common baseline; optionally
also 1920×1080 and 1280×800 for a 3-width desktop sweep):
```
cdp('Emulation.setDeviceMetricsOverride', width=1440, height=900, deviceScaleFactor=1, mobile=False)
goto_url(<page url>)
wait_for_load()
capture_screenshot()   # full-page if the tool supports it, else above-the-fold
```
Save each screenshot with a clear name:
`desktop-pre-merge-<page>-<width>.png` into
`docs/krh-mobile-4t/screenshots/desktop/`.

Also capture, per page, at desktop width:
- Full computed DOM text content (`document.body.innerText`) for a text
  diff in addition to a pixel diff — catches content changes a pixel diff
  might blur past (font rendering jitter) or might over-flag (anti-alias
  noise).
- `document.title`, canonical URL meta, and any `<h1>`/structured-data
  present — these should not change as a side effect of a "mobile" PR.

**This step was NOT completed in this baseline pass** (time was spent on
accessibility/performance/the critical rendering defect in
`mobile-qa.md`). It must be done — on current live `main` — before the
first mobile branch merges, or there will be nothing to diff against.

### 2. After each branch merges (or after the final combined merge), capture "after"
Same exact procedure, same viewport widths, same pages, against the
newly-deployed `main`. Name files `desktop-post-merge-<page>-<width>.png`.

### 3. Diff
- **Pixel diff**: use a perceptual image diff (e.g. `pixelmatch`,
  `odiff`, or ImageMagick `compare -metric AE`) between matched
  before/after screenshot pairs. Flag any diff above a small noise
  threshold (e.g. >0.5% changed pixels) for manual visual review — don't
  require 0% (font hinting/antialiasing differences are expected noise).
- **Text diff**: plain `diff` of the saved `innerText` dumps. Any
  unexpected copy change on desktop is a flag — the mobile PRs should not
  be touching desktop-visible copy.
- **Functional spot-check** (manual, can't be fully automated cheaply):
  for each page, on desktop width:
  - Nav menu opens/closes and all links resolve (no new 404s).
  - Contact form on `/contact/` submits successfully (test submission, or
    at minimum: client-side validation triggers correctly, submit button
    is reachable/clickable, no console errors on interaction).
  - Pilot page CTA/links on `/pilot/` resolve correctly.
  - No new browser console errors/exceptions on page load (check via CDP
    `Runtime.enable` + `Log.enable`, same technique used in the `/product/`
    investigation in `mobile-qa.md` §0) — this is also how the critical
    defect in this baseline was caught, so it's a mandatory check post-merge.

### 4. Report
Produce `docs/krh-mobile-4t/desktop-regression-results.md` (separate file,
written after step 3 is actually run) listing: each page × viewport,
pixel-diff %, text-diff summary, functional spot-check pass/fail, and any
flagged regressions with screenshots attached side-by-side.

## Pass/fail bar
- Any page with a pixel diff that a human reviewer judges a real visual
  regression (not antialiasing noise) → fail, must be fixed before launch.
- Any broken nav link, broken form submit, or new console
  error/exception on desktop → fail, hard veto per the launch-readiness
  rubric regardless of how small the pixel diff is.
- Desktop regression check is **not optional and not deferrable** — it
  must be completed before the launch-readiness score in
  `launch-readiness.md` can move its "desktop regression" veto flag from
  TBD to a real pass/fail.

## What this baseline pass actually did
- Pre-merge desktop screenshots (1440×900) WERE captured for all 4 pages
  and saved to `screenshots/desktop/desktop-pre-merge-<page>-1440.png`.
  Caveat: 3 of the 4 (`product`, `contact`, `pilot`) show the client-side
  error state described in `mobile-qa.md` §0, not real page content —
  these screenshots are still useful as dated evidence of that defect,
  but they are **not usable as a "before" baseline for a meaningful
  pixel-diff** until §0 is fixed. Only `home` is a true content baseline
  right now. **Re-capture all 4 once §0 is fixed**, before the mobile
  branches merge, so there is a real "before" to diff against.
- No post-merge diff has been run (nothing has merged yet) — step 2/3
  above remain pending work for after merge.
