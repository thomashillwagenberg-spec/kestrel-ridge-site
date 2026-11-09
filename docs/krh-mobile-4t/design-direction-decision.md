# Design Direction Decision — KRH Mobile Rebuild

**Status:** Decided. This document commits the project to ONE coherent visual direction for the mobile-only rebuild of kestrelridgehealth.com. It is derived from the pattern research in `mobbin-reference-evidence.md` and the brief: *enterprise precision + clinical-adjacent trust + editorial sophistication*, inspired by (not copying) Ease's restraint, Mercury's executive clarity, and Ramp's procedural information design.

---

## 1. The direction, in one sentence

**A quiet, high-contrast editorial system: generous whitespace and single-column reading rhythm (Ease's restraint) carrying numbered, procedural content blocks (Ramp's step logic) inside an unmistakably calm, high-trust typographic frame (Mercury's executive clarity) — original KRH typography, color, and iconography, never a reskin of any one reference brand.**

## 2. What we are taking from each inspiration, and what we are explicitly NOT taking

| Source | What we adapt | What we reject |
|---|---|---|
| **Ease** | Restraint: one idea per screen, minimal simultaneous CTAs, calm color field, no visual clutter competing with content | Ease's specific color palette, logo mark, or exact hero copy/layout pixels |
| **Mercury** | Executive clarity: confident, slightly oversized headline type; numbers/data treated as first-class citizens, not decoration; dense-but-ordered layouts that read as "built for people who make decisions" | Mercury's fintech-specific iconography (cards, transactions) and its exact green/black brand palette |
| **Ramp** | Procedural info design: features and workflows presented as ordered, almost spec-like sequences (step 1 → step 2 → step 3), captions doing real explanatory work rather than marketing adjectives | Ramp's dense dashboard-style screenshots/product-UI chrome (KRH is a marketing site, not showing a live app UI) |

The result must read as its own thing: a clinical-adjacent B2B site that feels engineered and precise, not a lifestyle health brand (reject Hims/Superpower's consumer warmth) and not a generic "modern SaaS" template (reject anonymous Webflow-template features grids).

## 3. Core system decisions

### Layout & grid
- **Single-column mobile-first**, max content measure ~60–70 characters for body text, generous vertical rhythm (large section padding, not cramped stacking).
- No horizontal-scroll patterns anywhere (comparison tables, carousels) — mobile content always flows vertically. This also resolves the comparison-section research finding that collapsed/stacked cards beat horizontal scroll on mobile.
- Section transitions marked by **whitespace and a thin rule**, not heavy color blocks or illustration — keeps the "quiet" quality.

### Typography
- One primary typeface family for both headline and body (a single confident system, Mercury-style), with weight and size doing the hierarchy work rather than mixing display + body fonts. Numerals (stats, step numbers) get a distinct treatment — larger, tabular-figure style — so they read as data, echoing Mercury's "numbers as first-class citizens."
- No decorative/script fonts; nothing that reads as "wellness brand."

### Color
- A restrained, mostly neutral palette (near-white background, near-black/charcoal text) with **one** accent color reserved exclusively for primary CTAs and key data highlights — so the accent always signals "this is actionable" or "this is the number that matters." This is an original KRH palette choice, not borrowed directly from Ease/Mercury/Ramp's specific hues.
- No gradients, no illustrated mascots, no stock-photo lifestyle imagery of patients/doctors (avoids both a generic-SaaS look and any implied clinical/testimonial claim we can't back up).

### Components (per pattern, tying back to the evidence doc)
1. **Hero:** headline + one-line subhead + single CTA, no carousel/video.
2. **Navigation:** sticky header, hamburger → full-screen overlay menu, CTA button always visible outside the hamburger.
3. **Features:** stacked single-column cards, icon (decorative) + label + one-sentence benefit.
4. **Workflow:** numbered vertical steps (`<ol>` semantics) with a connecting rule, each step headline + short description.
5. **Comparison:** stacked card-per-option (never horizontal-scroll table), qualitative check/x only — **no dollar amounts, ever**.
6. **Evidence/Stats:** large numeral + label, 2–3 stacked items; populated only with real, sourced figures — qualitative process claims if no verified numbers exist yet.
7. **Pilot CTA:** closing band, visually distinct via whitespace/border shift (not heavy color fill), one headline restating value in new words, one button.
8. **Contact form:** single-column stacked fields, persistent (non-placeholder) labels, minimal required fields.
9. **Article/Blog:** single-column long-form body at readable measure, lightweight byline/date/read-time metadata, related-articles module populated only with real published content.
10. **404/Error:** full site chrome retained (header/footer/nav intact), short plain-language message, one link home, real HTTP 404 status.

## 4. Hard content constraints (apply across every component above)

- **No pricing figures anywhere** — Phase Zero pricing is withdrawn; comparison and CTA sections must stay qualitative.
- **No fabricated customers, testimonials, case studies, or certifications/badges.** If a section's credibility depends on proof we don't yet have verified, use qualitative/process language instead of invented numbers or logos.
- **No copied layouts, photography, or trademarked copy** from any Mobbin reference brand — those are principle references only, confirmed via live Mobbin MCP lookups and cited in `mobbin-reference-evidence.md`.

## 5. Accessibility & performance baseline (non-negotiable, carried from the evidence doc)

- WCAG contrast ≥4.5:1 for body text, ≥3:1 for large text/UI components.
- All interactive targets ≥44×44px; visible keyboard focus states throughout.
- Real semantic HTML: `<nav>`, `<ol>` for steps, `<table>`/ARIA table roles if any tabular comparison markup remains, proper heading hierarchy per section.
- Forms: persistent labels (not placeholder-only), `aria-live` for validation errors, correct `inputmode`/`type` per field.
- Respect `prefers-reduced-motion` for any count-up/scroll-triggered animation.
- Responsive images (srcset), lazy-load below-the-fold media, no autoplay video.
- Real HTTP status codes (404 stays 404, no soft-404-as-200).

## 6. Why this is coherent (not three styles bolted together)

Each borrowed principle serves the same underlying goal — **reduce cognitive load while increasing perceived rigor** — which is exactly what "clinical-adjacent trust" requires: a visitor evaluating a healthcare-workflow vendor should feel the site itself is evidence of careful, precise engineering. Restraint (Ease), numeric confidence (Mercury), and procedural ordering (Ramp) are three expressions of the same discipline, not three different moods, so unifying them under one typographic/color system produces one voice rather than a collage.

---

*Companion document: `docs/krh-mobile-4t/mobbin-reference-evidence.md` (pattern-by-pattern sourced references, pros/cons, accessibility/performance caveats).*
