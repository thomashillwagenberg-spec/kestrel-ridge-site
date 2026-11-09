# Mobbin Reference Evidence — KRH Mobile Rebuild

**Purpose:** Real, tool-verified design references for the 10 critical mobile patterns on the KRH mobile-only rebuild. All examples below were retrieved live via the Mobbin MCP (`search_sections`) on 2026-11-08 — not fabricated, not screenshotted-and-guessed. Each entry lists the actual `site_name` and the live `mobbin_url` returned by the API so the references can be reopened and re-verified.

**Non-negotiable:** these are inspiration for *principles* (layout logic, information hierarchy, interaction patterns) — never for copying pixel layouts, proprietary photography, or trademarked copy. KRH's implementation must be an original system.

---

## 1. Hero Section

**Query:** `hero section healthcare SaaS website mobile`

| Brand | Reference |
|---|---|
| Hims | https://mobbin.com/sites/sections/2aac84d2-0606-4ed6-a558-71871c6ee181 |
| Employment Hero | https://mobbin.com/sites/sections/49719c64-fd2a-4b0e-a454-c639b69f1bd7 |
| Ease | https://mobbin.com/sites/sections/6695790f-7142-4e99-86a9-2632963b795d |
| Superpower | https://mobbin.com/sites/sections/a66c7229-39c5-4f24-b34c-c09db551575d |
| Amperos | https://mobbin.com/sites/sections/482dc765-0fbb-4212-8b79-83bdd1930a2b |

**Principle to adapt:** Single dominant value proposition in a large, restrained serif/sans pairing, one primary CTA above the fold, minimal competing elements. Ease and Superpower both use a short headline + one-line subhead + single button, no carousel, no auto-playing video — this is the right register for clinical-adjacent trust (vs. Hims' more consumer/lifestyle tone, which KRH should NOT mirror).

**Pros:** Fast to scan on mobile, loads light, communicates authority without noise.
**Cons:** Risk of generic "enterprise SaaS hero" sameness if typography/spacing isn't distinctive.
**Accessibility/perf caveats:** Avoid hero background video/autoplay (CPU + battery on mobile, WCAG 2.2.2 pause requirement); ensure headline contrast ≥4.5:1; reserve CTA tap target ≥44×44px; hero image (if any) needs real `alt`, no text baked into images for screen readers, and should be served responsive (srcset) to avoid desktop-resolution payloads on mobile.

---

## 2. Navigation

**Query:** `mobile navigation menu healthcare website`

| Brand | Reference |
|---|---|
| Superpower | https://mobbin.com/sites/sections/570d1933-5cc4-430a-9d4a-8cf67b35403f |
| T1 Energy | https://mobbin.com/sites/sections/08b1da0a-e784-4a8c-8d23-0359ff00b023 |
| Hims | https://mobbin.com/sites/sections/d1277569-a3eb-49b0-b201-7a2f6b59b30b |
| Monte | https://mobbin.com/sites/sections/2f083c6a-8cf1-40af-823b-bee1ce8f419a |
| Maxima Therapy | https://mobbin.com/sites/sections/fc167e3e-e2f2-4340-bfcf-52cc593edfbb |

**Principle to adapt:** Sticky top bar with logo + hamburger-triggered full-screen (or slide-in) menu; primary CTA (e.g. "Request Pilot" equivalent) persists outside the hamburger so it's always one tap away. Maxima Therapy and Monte (both health-adjacent) keep the menu to 4–6 items — matches KRH's thin IA (no bloated mega-menu).

**Pros:** Predictable pattern users already know; keeps header height small on mobile viewport.
**Cons:** Full-screen overlay menus can trap focus incorrectly if not built carefully; hamburger-only nav hides wayfinding (no breadcrumbs) which can hurt discoverability of secondary pages.
**Accessibility/perf caveats:** Hamburger button needs `aria-expanded`/`aria-controls` and a visible focus ring; overlay menu must trap focus while open and return it to the trigger on close; nav must be reachable and dismissable via keyboard (Esc) even though primary input is touch; avoid layout-shift when sticky header appears (reserve height, don't inject).

---

## 3. Features

**Query:** `features section enterprise SaaS website`

| Brand | Reference |
|---|---|
| Current | https://mobbin.com/sites/sections/8526fee5-8a22-4bf2-a643-921e3d800cd6 |
| Clerk | https://mobbin.com/sites/sections/6716a237-837a-4634-8aa7-c0592e15e2f6 |
| Typeform | https://mobbin.com/sites/sections/1c561695-c156-4bd3-bd18-2f9e12babe72 |
| Mural | https://mobbin.com/sites/sections/ac340129-6796-44e2-b04e-76a5789a8dce |
| Webflow | https://mobbin.com/sites/sections/6ee55e98-0817-43cc-84cd-f875e0fd3f42 |

**Principle to adapt:** Clerk's pattern — icon/label + one-sentence benefit, stacked vertically on mobile (not a 3-col grid squeezed down), each item scannable in under 2 seconds. This matches Ramp's "procedural info design" brief note: each feature reads like a step in a system, not a marketing adjective.

**Pros:** Stacked single-column cards are inherently mobile-safe (no awkward grid reflow).
**Cons:** Long feature lists become an endless scroll — needs strong visual rhythm (alternating backgrounds or dividers) so it doesn't feel like a wall of text.
**Accessibility/perf caveats:** Icons must be decorative (`aria-hidden`) with text labels carrying the meaning, never icon-only; keep SVG icons inline/sprited to avoid icon-font FOUT; respect heading hierarchy (one h2 for the section, h3 per feature) for screen-reader section-skipping.

---

## 4. Workflow / How It Works

**Query:** `how it works steps section B2B website`

| Brand | Reference |
|---|---|
| Trawelt | https://mobbin.com/sites/sections/629aae31-4a94-46df-a97f-3180a6ae22e0 |
| FLORA | https://mobbin.com/sites/sections/35657c50-f894-4f9e-9a02-7ec46c414587 |
| Titan | https://mobbin.com/sites/sections/0d103afa-c85e-4568-a98a-0a1e7cbd5e8f |
| Kastle | https://mobbin.com/sites/sections/a14eaef1-524c-4927-bc6f-ab54dd2aecff |
| Clay | https://mobbin.com/sites/sections/28c16d19-1b1c-4c38-b06e-660c77901cbc |

**Principle to adapt:** Numbered vertical step sequence (1→2→3→4) with a connecting line/rule down the left edge on mobile — Kastle and Titan use this for operationally-dense B2B products, which maps well to a clinical pilot-onboarding workflow (assessment → pilot setup → deployment → review).

**Pros:** Numbering gives users a clear sense of process length/effort before committing — important for a pilot-conversion flow.
**Cons:** If steps have uneven text length, the connecting line/rule can look broken on mobile; must design for variable copy length.
**Accessibility/perf caveats:** Use an ordered list (`<ol>`) semantically, not just visual numbers, so assistive tech announces "step 2 of 4"; connecting lines should be CSS (border/pseudo-element), not images, to scale with text zoom.

---

## 5. Comparison

**Query:** `comparison table section SaaS website`

| Brand | Reference |
|---|---|
| Framer | https://mobbin.com/sites/sections/7506bd76-c42f-431d-8478-8f477d4ba895 |
| Plain | https://mobbin.com/sites/sections/7e0fc745-3555-4bdf-8792-6aa8b35522ca |
| Clerk | https://mobbin.com/sites/sections/6716a237-837a-4634-8aa7-c0592e15e2f6 |
| Browserbase | https://mobbin.com/sites/sections/e44a18da-8d88-40ed-a067-f064f9fc1622 |
| Webflow | https://mobbin.com/sites/sections/c8e3e98a-5a37-4c70-b480-2287f1cd5772 |

**Note on search results:** most of these examples are pricing-tier comparison tables (plan A vs B vs C), not competitor-vs-us comparisons. Since **no pricing figures may appear anywhere on the KRH site** (Phase Zero pricing is withdrawn), the *table mechanic* is the only transferable piece here — not the pricing content.

**Principle to adapt:** On mobile, wide comparison tables collapse into a stacked "accordion" or single-column card-per-option layout (seen in Browserbase/Clerk responsive teardown) rather than horizontal-scroll tables, which are a known mobile usability failure. For KRH this becomes a capability comparison (status quo workflow vs. KRH workflow) with qualitative check/x marks — never $ amounts.

**Pros:** Stacked cards avoid horizontal scroll; check/x iconography scans fast.
**Cons:** Comparison sections can feel adversarial/salesy if overused — must stay factual and restrained per the "enterprise precision" brief.
**Accessibility/perf caveats:** A visual table collapsed to cards must still use a real `<table>` with `scope` attributes (or ARIA table roles) underneath if any tabular markup is kept, so screen readers get row/column relationships; icons for yes/no need text equivalents, not color-only (red/green) meaning.

---

## 6. Evidence / Stats

**Query:** `statistics metrics trust section website`

| Brand | Reference |
|---|---|
| Visitors | https://mobbin.com/sites/sections/93f206e0-5582-417b-804d-25ddb3fca994 |
| OpenSea | https://mobbin.com/sites/sections/6ac9e923-3352-4222-9a85-0bcaad3624bf |
| Aave | https://mobbin.com/sites/sections/fd814c66-d371-40ae-939e-4f574df586f2 |
| Givingli | https://mobbin.com/sites/sections/79548eee-c275-48cb-96dc-9be95788cbc0 |
| Symbolic | https://mobbin.com/sites/sections/68a031a2-1f8b-4a88-af2c-64a8ba9d39ff |

**Principle to adapt:** Large numeral + short label, 2 or 3 stats stacked vertically on mobile (not a cramped 4-across row), each with one line of supporting context. This is the "evidence" section's job: communicate rigor without inventing numbers.

**Pros:** Numerals draw the eye and break up text-heavy pages; strong for the "editorial sophistication" brief note when paired with generous whitespace.
**Cons:** **Hard constraint for KRH:** every stat must be real and sourced — no fabricated customer counts, outcome percentages, or certifications. If KRH does not yet have verifiable published stats, this section should state qualitative, defensible claims (e.g., methodology or process facts) instead of numbers, or be deferred until real data exists.
**Accessibility/perf caveats:** If numerals animate/count-up on scroll, respect `prefers-reduced-motion`; stat numerals as text (not images) for zoom/reflow and screen-reader access; avoid dense text blocks that shrink below 16px on small viewports.

---

## 7. Pilot CTA

**Query:** `CTA call to action section book demo enterprise`

| Brand | Reference |
|---|---|
| Melius | https://mobbin.com/sites/sections/d1ac4e79-634f-4d1a-a49c-3c91612641b6 |
| Givingli | https://mobbin.com/sites/sections/6202ece4-cbc9-4a8c-a94d-5cc0944af4e5 |
| Bird | https://mobbin.com/sites/sections/e714124a-88f5-4309-8aa5-af226b8b2564 |
| Plain | https://mobbin.com/sites/sections/0b66be9c-4045-47a5-8ae8-352cc5dbc154 |
| Readymag | https://mobbin.com/sites/sections/198d2322-c28e-47dd-aba4-6ed77d507217 |

**Principle to adapt:** A dedicated closing-of-page CTA band, visually distinct (background shift or border), single headline restating the core value prop in different words than the hero, one button. Melius and Plain keep it to one action, not a menu of options, which fits KRH's single "pilot" conversion goal.

**Pros:** Clear single next step reduces decision friction at the point of highest intent (end of page).
**Cons:** If every page ends with the identical CTA band, it reads as boilerplate — needs light copy variation per page context (home vs. feature page vs. article).
**Accessibility/perf caveats:** CTA button must have accessible name describing the actual destination/action (not just "Click here"); sufficient color contrast against the band background; keep the band's tap target comfortably large and away from page edges for thumb reach.

---

## 8. Contact Form

**Query:** `contact form design website`

| Brand | Reference |
|---|---|
| Maxima Therapy | https://mobbin.com/sites/sections/939927f7-47b9-47b3-ad9f-0a2945a3927d |
| Jeton | https://mobbin.com/sites/sections/a88761d5-7a05-4341-af7e-a0e428183a20 |
| Rains | https://mobbin.com/sites/sections/82ce6566-c33e-4b16-8750-670aa04be011 |
| SOTF | https://mobbin.com/sites/sections/184339d4-5fbc-4936-8aa7-f1813bc6fd96 |
| GSAP | https://mobbin.com/sites/sections/4a9ecc99-08f1-41b6-96ef-2c0d0b030048 |

**Principle to adapt:** Maxima Therapy (health-adjacent) uses stacked, full-width single-column fields with persistent (not placeholder-only) labels — the right call for a clinical-trust context, since placeholder-only labels disappear once typing starts and hurt usability/accessibility.

**Pros:** Single-column stacked fields are the mobile-safe default (no side-by-side field cramping); persistent labels reduce input errors.
**Cons:** Long forms on mobile increase abandonment — KRH's contact/pilot-inquiry form should ask only for fields truly needed at this stage.
**Accessibility/perf caveats:** Every input needs a real, programmatically-associated `<label>` (not placeholder-as-label); inline validation errors must be announced via `aria-live` and associated with the field via `aria-describedby`; appropriate `inputmode`/`type` (email, tel) for correct mobile keyboards; visible focus states; avoid CAPTCHA patterns that fail on mobile/screen readers if spam protection is needed — prefer honeypot/server-side checks.

---

## 9. Article / Blog

**Query:** `blog article page layout website`

| Brand | Reference |
|---|---|
| monday.com | https://mobbin.com/sites/sections/cd29c418-cd35-44e3-a85f-5b35b996ca90 |
| Beside | https://mobbin.com/sites/sections/05aaed53-7701-4c04-b0a7-df9929cab889 |
| incident.io | https://mobbin.com/sites/sections/5780061e-69f1-42a8-bba2-03003cfc05d7 |
| Pitch | https://mobbin.com/sites/sections/5c087f48-be52-4fb4-b5c4-87202563bbff |
| Wise | https://mobbin.com/sites/sections/6cb42340-7c5b-4330-b5b0-42061d555f4d |
| Pitch | https://mobbin.com/sites/sections/5c087f48-be52-4fb4-b5c4-87202563bbff |

**Principle to adapt:** incident.io and Wise both use a restrained single-column article body with generous line-height/measure (not full-bleed text edge-to-edge), a lightweight metadata line (author/date/read-time), and related-article cards at the end — strong fit for the "editorial sophistication" brief.

**Pros:** Single-column long-form reading is proven for comprehension on mobile; metadata builds authorial credibility without needing invented bylines/awards.
**Cons:** Related-article modules need real content to populate — must not be filled with placeholder/fabricated article titles at launch.
**Accessibility/perf caveats:** Body text line-length should stay ~45–75 characters even at mobile widths (use max-width, not 100% viewport); images need real `alt`; code/callout blocks (if any) need sufficient contrast; lazy-load below-the-fold images for performance.

---

## 10. 404 / Error

**Query:** `404 error page not found website`

| Brand | Reference |
|---|---|
| Monte | https://mobbin.com/sites/sections/0ea5dd3c-6c40-447e-b451-758a11c3f51b |
| Unify | https://mobbin.com/sites/sections/755f662a-53fe-47e2-a1c0-8e07dcb20f51 |
| Becane | https://mobbin.com/sites/sections/8177c87f-f68e-498f-8fa0-670a2d5ca8c1 |
| Vucko | https://mobbin.com/sites/sections/91855e0a-0354-45f7-8a78-6d7e2b1a0b67 |
| GitBook | https://mobbin.com/sites/sections/3b9621ea-464f-485c-b449-3e65ebe1c6f7 |

**Principle to adapt:** Keep the brand chrome (header/nav/footer) fully intact on the error page (Unify, GitBook do this) so a lost mobile visitor never loses the ability to navigate back into the real site; short, plain-language message + one primary link home — no attempt at humor/mascot illustration, which would clash with clinical-adjacent trust.

**Pros:** Consistent chrome means the error page never feels like a dead end or a different, broken site.
**Cons:** A too-minimal error page (just text, no visual anchor) can look like a template/placeholder rather than an intentional brand moment — needs at least typographic treatment consistent with the rest of the system.
**Accessibility/perf caveats:** Serve real HTTP 404 status code (not a soft-404 masquerading as 200) for SEO/crawler correctness; the page needs a proper `<h1>` ("Page not found") for screen readers and a visible, keyboard-reachable link back to the homepage/nav.

---

## Summary of cross-cutting constraints applied throughout

- **No pricing figures** anywhere (comparison, CTA, or elsewhere) — Phase Zero pricing is withdrawn.
- **No fabricated customers, testimonials, or certifications** — the Evidence/Stats and Article sections are the highest-risk spots for this; defer to qualitative/process claims if no real data exists yet.
- All examples are principle references only — KRH's actual layout, type system, photography (if any), and copy must be original, not a reskin of any single brand above.
