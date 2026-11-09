# Mobile QA Baseline — KRH Mobile Rebuild

**Status:** PRE-MERGE BASELINE. Captured against the CURRENT LIVE site
(https://kestrelridgehealth.com/) and the `main` branch of
`kestrel-ridge-site` (read-only, not checked out) on 2026-11-08, before any
of the 7 sibling mobile-redesign branches have merged. **A full re-run at
every listed width is required after merge** before this doc can be used to
sign off on launch.

Tooling used: `pa11y` (via `npx --yes pa11y`, WCAG2AA ruleset), a headless
Chromium session (CDP `Emulation.setDeviceMetricsOverride` for width
emulation + screenshots), and manual HTML/CSS source inspection (`curl` +
`git show main:<path>`). No local dev server was required — checks ran
directly against production.

## 0. CRITICAL FINDING — broken client-side render on 3 of 4 key pages

`curl` returns HTTP 200 with fully-formed SSR HTML (correct `<title>`,
meta, content) for `/product/`, `/contact/`, and `/pilot/`. But in **two
independent real browser engines** — pa11y's bundled Puppeteer/Chromium and
an isolated CDP-driven Chromium session — all three pages fail to hydrate
and render the Next.js **generic client error screen**:

```
html id="__next_error__", document.title = "🐴"
"This page couldn't load — Reload to try again, or go back."
```

Confirmed at 375×812 mobile viewport (screenshot captured) and at desktop
viewport; reload does not fix it. `/` (homepage, static HTML, not
Next.js-rendered) works correctly in both engines. All JS chunks referenced
by `/product/` return HTTP 200 individually (not a 404/asset problem) — this
is a client-side runtime exception during hydration, not a missing asset.

**This is a hard veto per the launch-readiness rubric**: `/contact/` and
`/pilot/` are the lead-capture funnel pages. If this reproduces after
merge, it is silent lead loss — a visitor on a real phone sees a dead error
screen instead of the contact form or pilot page, with no server-side
signal (200 status) to alert monitoring. **Root-cause and fix this before
any launch decision**, independent of what the mobile-redesign branches
change, since it already exists in current production/`main`.

Action for whoever owns this: reproduce with React DevTools / Next.js
error overlay in dev mode (the error digest is swallowed in production
builds); check for an SSR/CSR mismatch or a thrown exception in a client
component shared by product/contact/pilot but not the homepage.

## 1. Accessibility spot checks (manual + pa11y, WCAG 2.2 AA)

| Page | pa11y (prod URL) | Heading order | Image alt | Landmarks | Form labels | Focus state | Notes |
|---|---|---|---|---|---|---|---|
| `/` (index) | **Pass** — 0 errors | h1→h2→h2→h2→h2, no skips | 7 imgs, 0 missing alt (1 decorative img intentionally empty-alt, documented in source comment) | header/nav×3/main — single nav set, no duplicates | n/a (no form on homepage) | `:focus-visible{outline:2px solid var(--sc-accent);outline-offset:3px}` defined globally, no `outline:none` found | Clean |
| `/product/` | **Fail** — 2 errors (`__next_error__`, see §0), both caused by the renderer giving up, not by this page's own markup | SSR HTML: h1→h2→h3→h2→h2(h3×5)→h2→h2→h2→h2→h2 — no skips | SSR HTML: 3 imgs, 0 missing alt | SSR HTML: header×2, nav×6 (Primary [desktop]/Primary [mobile, `hidden`]/Breadcrumb/On this page/Footer/Reading — each has a distinct `aria-label`), main×1, footer×1 | n/a (no form) | Global Tailwind rule `:focus-visible{outline:2px solid var(--primary);outline-offset:2px}`, no `outline:none` | Markup itself looks compliant; the page simply doesn't render client-side (§0) |
| `/contact/` | **Fail** — 2 errors, same cause as above | SSR HTML: h1→h2→h2→h2→h2→h2→h2, no skips | 3 imgs, 0 missing alt | header×2, nav×5, main×1, footer×1, aside×1 | **name/org/email/message/waitlist-contact** all have matching `<label for>`/`id` pairs — correct | Same global rule as product | Form markup is correctly labeled; untestable live due to §0 |
| `/pilot/` | **Fail** — 2 errors, same cause | h1→h2(h3×3)→h2(h3×3)→h2×6, no skips | 3 imgs, 0 missing alt | header×2, nav×6, main×1, footer×1 | n/a (no form) | Same global rule | Markup compliant; untestable live due to §0 |

All 4 pages: `<html lang="en">` present, `<meta name="viewport"
content="width=device-width, initial-scale=1">` present, "Skip to content"
link present and correctly targets `id="main"`.

**pa11y's 2 "errors" on product/contact/pilot are an artifact of §0**
(the error page itself has no `<title>` text and no `lang` attr) — they are
not independent accessibility bugs in the intended page markup, but they
will not go away until §0 is fixed, because pa11y (like a real user) only
sees what actually renders.

### Color contrast (computed WCAG contrast ratios from CSS custom properties)
Homepage design tokens (`scrollcraft.css` + inline `:root`):

| Pair | Ratio | AA normal text (4.5:1) | AA large text (3:1) |
|---|---|---|---|
| ink `#f4f2ef` on canvas `#08090b` | 17.83:1 | Pass | Pass |
| ink-soft `#9a9ba1` on canvas `#08090b` | 7.19:1 | Pass | Pass |
| ink `#f4f2ef` on surface `#101217` | 16.77:1 | Pass | Pass |
| accent-ink `#08090b` on accent `#d8ff3e` | 17.35:1 | Pass | Pass |
| accent `#d8ff3e` on canvas `#08090b` | 17.35:1 | Pass | Pass |

All sampled pairs clear AA (most clear AAA 7:1 too). No contrast failures
found in the current token set. **Caveat**: this only covers the token
pairs used; it does not cover every literal/inline color a redesign branch
might introduce. Re-check token contrast after merge if any branch adds
new color combinations.

## 2. Viewport widths — 320 / 360 / 375 / 390 / 414 / 430 / 480

Browser automation (CDP `Emulation.setDeviceMetricsOverride`) was
available and used for 375px (screenshot captured, see §0 for the
evidence screenshot of the broken page). **Full screenshot sweep across
all 7 widths is NOT done in this baseline pass** — time was spent
confirming and documenting the §0 defect instead, since it blocks
meaningful UX screenshots on 3 of 4 pages anyway. Pending work:

- [ ] Screenshot `/`, `/product/`, `/contact/`, `/pilot/` at 320/360/375/
      390/414/430/480 once §0 is fixed and mobile branches are merged.
- [ ] Compare against each mobile branch's intended breakpoints.

### CSS breakpoints currently in production (from source, confirms a
mobile-aware layout already exists pre-redesign):
- Homepage (`scrollcraft.css` + inline): `max-width:760px`,
  `max-width:860px`, `max-width:1000px`, `min-width:761px`,
  `min-width:1001px`, `prefers-reduced-motion: reduce`.
- Next.js pages (Tailwind, `krh-site-*.css`): `max-width:600/640/767/1000px`,
  `min-width:640/768/1024/1280/1536px` (standard Tailwind sm/md/lg/xl/2xl),
  `hover:hover` (pointer-capable detection), `prefers-reduced-motion:reduce`.

All 7 target widths (320–480) fall below the smallest `md`/`760px`
breakpoint, so they should all receive the same mobile layout rules today
— but this has not been visually verified at each discrete width.

## 3. Summary of defects found (baseline, pre-merge)
1. **[CRITICAL / hard veto]** `/product/`, `/contact/`, `/pilot/` fail to
   render client-side in real browsers — see §0.
2. No accessibility defects found in markup that does render (homepage).
   Form labeling, landmarks, alt text, contrast, and focus states all pass
   on the pages/markup inspectable.
3. Mobile-width screenshot sweep (320–480) is outstanding, blocked in part
   by #1 and in part by not yet having the redesign branches merged.

## Next steps (post-merge re-run checklist)
- [ ] Re-run pa11y against all 4 pages once branches merge; confirm §0 is
      resolved before treating pa11y's current 2 errors/page as closed.
- [ ] Screenshot sweep at 320/360/375/390/414/430/480 for all 4 pages.
- [ ] Re-check color contrast for any new tokens/components introduced by
      `feat/krh-mobile-home-hero`, `-pilot-contact-funnel`,
      `-product-howitworks`, `-evidence-governance`, `-claims-content`.
- [ ] Confirm forms on contact/pilot are actually operable on a real phone
      (tap targets ≥24×24px per WCAG 2.2 SC 2.5.8, keyboard reachability).
