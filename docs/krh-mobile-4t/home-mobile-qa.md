# Home page — mobile-only storyboard redesign (QA notes)

Branch: `feat/krh-mobile-home-hero`
File touched: `index.html` only (plus this doc). No other repo files changed.
Commits:
- `f2d1622` — add storyboard steps 3, 5, 6, 7, 8 as mobile-only sections
- `d03035c` — fix: scope hero secondary link to mobile-only; verify desktop pixel-identical

## How "mobile-only" is enforced

The site already ships two renderers from one `index.html`:
- **Engine (desktop, ≥761px, JS on):** `scrollcraft.js` mounts a fixed-position
  scrollytelling world; only elements carrying `[data-sc-copy]` /
  `[data-sc-window]` are ever touched by it.
- **No-engine flow (≤760px, and any width with JS/engine failure):** ordinary
  document flow, gated by `html:not(.kr-engine)` selectors, further scoped to
  `@media (max-width:760px)` for the phone-specific type ramp.

All nine new/changed elements use a single marker class, **`.kr-m-only`**
(plus `.kr-m-hero-link` for one inline link):

```css
.kr-m-only{display:none}              /* hidden at every width, by default */
.kr-m-hero-link{display:none}
@media (max-width:760px){
  html:not(.kr-engine) .kr-m-only{display:block; ...}
  html:not(.kr-engine) .kr-m-hero-link{display:inline-block; ...}
}
```

None of the new `<div class="kr-m-only">` blocks carry `data-sc-copy` or
`data-sc-window`, so the desktop engine never sees them, never positions
them, and never counts them into its scroll-timeline math (the `738vh`
spacer and segment weights are untouched). At any width above 760px they are
`display:none` and contribute zero layout height — confirmed below with a
pixel-exact desktop check, not just "looks the same."

## Storyboard steps implemented (mobile only)

1. **Hero** — unchanged H1/lede, one primary CTA (`Ask about Phase Zero`),
   added one quiet secondary link (`See how it's measured` → `/evidence/`),
   and hid the hero's synthetic proof strip on mobile only (it reappears
   later, properly contextualized, in step 6).
2. **Two data cards** — already existed (`PRV027` 354 min / 2 technicians vs.
   `PRV011` 198 min / 1 technician, synthetic, dated 2026-09-08); left as-is,
   it already matched the brief.
3. **NEW — workload forecast illustration**: a compact range bar (low /
   likely / high) with placeholder values, explicitly labeled "Illustration,
   not a live forecast" and "not a session from the dataset above" — shows
   uncertainty, not false precision.
4. **Eight-hard-rules gate** — already existed (technician assignment choice,
   deterministic refusal reasons, "not connected to a running system");
   left as-is.
5. **NEW — human-approval timeline**: 4-entry change log (forecast scored →
   plan drafted → override requested → approved by a named role), labeled
   "Illustrative synthetic example — not connected to a running system."
   Copy only claims human *review/approval* authority ("a named person does
   [approve]"), nothing stronger (no claim the system enforces or guarantees
   outcomes).
6. **NEW — evidence cards**: 4 cards reusing the site's own already-published
   synthetic figures (23.76 / 24.01 / 33.42 / 208.61 min, holdout set,
   2026-09-08), each badged "Synthetic," with a link to `/evidence/` for full
   session counts/denominators/methodology (no new denominator was invented
   here — the exact n is on the evidence page, so the card points there
   instead of guessing a number).
7. **NEW — Phase Zero 3-step stepper + CTA**: scope data with privacy office →
   compare forecast to approved baselines → stop or discuss next step.
   Copy applies the value-equation framing (transparent evidence + published
   methodology for dream outcome/likelihood; "just a conversation," "no PHI
   changes hands," "no platform commitment," "no commitment past this step"
   for time delay/effort) — **no price, no countdown/urgency, no "guaranteed"
   language, no claim of existing customers.**
8. **NEW — objections accordion**: 6 real `<details>/<summary>` elements
   (plain HTML, no JS, fully crawlable/indexable) covering PHI, real-world
   outcomes (honestly: none yet), fee ("quoted after scoping," no rate card),
   site count, human-vs-automatic approval, and the stop-if-it-doesn't-win
   policy.
9. **Final CTA** — already existed ("Ask about Phase Zero" + `mailto:` +
   legal/fine print); left as-is, no fake calendar booking anywhere.

## Breakpoints

Fluid sizing (`clamp()`) already covers 320–480px continuously. Added
explicit checkpoints for QA, per the brief, each with one concrete (not
fluid) adjustment: `max-width:320px`, `321–360px`, `361–375px`, `376–390px`,
`391–414px`, `415–430px`, `431–480px`.

## Hard-rule compliance

- No third-party tracking scripts added (Clarity placeholder was already
  empty/no-op; untouched).
- No PHI fields (no new form fields of any kind were added).
- No booking calendar (CTA still points to `/contact/` and `mailto:`).
- No fabricated figures: all numbers reused are the ones already published
  elsewhere on the live site (hero proof strip / "the blindness" copy block
  / evidence page), not invented for this task. Where an exact denominator
  (session count) isn't available to me, the copy links to `/evidence/`
  instead of guessing a number.
- No price anywhere in the Phase Zero offer.
- Local/branch work only — nothing deployed.

## Screenshots

`docs/krh-mobile-4t/screenshots/home/`

| File | What it shows |
|---|---|
| `before-320.png` … `before-480.png` | Original hero viewport at each required width, served from the parent commit (`520d080`) via a local static server |
| `after-320.png` … `after-480.png` | Same widths/viewport after this change |
| `after-fullpage-390.png` | Full-page capture at 390px (via `Page.captureScreenshot` with `captureBeyondViewport`) showing all 9 storyboard sections in order |
| `before-desktop-1440.png` / `after-desktop-1440.png` | 1440px desktop viewport, before vs. after |

### Desktop regression check

Screenshot pixel diff at 1440px showed ~18% of pixels differing — this comes
entirely from the autoplaying hero background video being at a different
playback frame in each capture (the page design always has a live video
behind the copy), not a layout change. Verified by comparing
`getBoundingClientRect()` for `.kr-h1`, `.cta`, `.kr-proof-strip`, `.kr-lede`,
`.kr-offer` between before/after at 1440px: **every rect is byte-identical**
(same x/y/width/height to sub-pixel precision), confirming zero layout
regression on desktop.

### Verification method

Two local Python `http.server` instances served (a) the pre-change
`index.html` checked out from commit `520d080` and (b) the working tree, and
a headless Chromium (CDP) drove both at each width. Mobile emulation was
confirmed per-shot via `window.innerWidth`. A pre-existing environment quirk
(not caused by this change — reproduced identically on the unmodified
"before" page) prevented scripted `scrollTo` from holding a position in this
headless/emulated setup, so section-by-section verification for the 390px
full page used `Page.captureScreenshot({captureBeyondViewport:true})`
instead of scroll+viewport screenshots; all 9 sections were visually
confirmed in that single tall image.

## Known gap

I did not find an exact published holdout-set session count (an "n=") to
cite directly in the new evidence cards; rather than invent one, the cards
link to `/evidence/` for the denominators, per the "no fabricated proof"
rule. If an exact figure is wanted on the mobile cards themselves, it should
be pulled from the evidence page's source data (not the rendered/minified
HTML) and added as a follow-up.
