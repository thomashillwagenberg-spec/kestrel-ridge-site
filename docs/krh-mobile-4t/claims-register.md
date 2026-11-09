# Claims Register — KRH Public Site

Audit date: 2026-11-08. Scope: `claims-content` worktree (branch
`feat/krh-mobile-claims-content`). Catalogues every quantitative and
material qualitative claim found on the public pages, its source/evidence
tier, and verification status after this audit. All figures below are
confirmed consistent across every page that repeats them (desktop and
mobile render blocks checked), unless noted under "Status".

Evidence tiers used:
- **T1 — External citation**: sourced to a named third party (BLS, O*NET),
  linked.
- **T2 — Internal synthetic measurement**: the company's own synthetic
  validation pipeline, explicitly labeled synthetic / not clinically
  validated.
- **T3 — Policy/process statement**: a commitment about how the product or
  company operates (governance rule, pricing structure, data handling),
  not a measured result.
- **T4 — Illustrative/fictional demo**: explicitly marked as not connected
  to a live system (e.g. the call-off demo panel).

---

## 1. Forecast accuracy claims (T2 — synthetic, not clinically validated)

| Claim | Value | Pages | Date | Status |
|---|---|---|---|---|
| Workload forecast mean absolute error | 23.76 min/session | Home, Product (via evidence link), Evidence | synthetic holdout, undated point estimate | **Verified consistent** |
| Linear regression baseline | 24.01 min | Home, Evidence | synthetic holdout | **Verified consistent** |
| Spreadsheet (patient × provider average) baseline | 33.42 min | Home, Evidence | synthetic holdout | **Verified consistent** |
| Historical subspecialty mean baseline | 63.12 min | Evidence | synthetic holdout | **Verified consistent** (not repeated elsewhere, no conflict) |
| Fixed-ratio (naive) baseline | 208.61 min | Home, Evidence | synthetic holdout | **Verified consistent** |
| Weakest subgroup (comprehensive sessions) error | 26.9 min | Evidence | synthetic holdout | Present only on Evidence; no conflicting figure found elsewhere |
| Holdout sample size | 2,318 synthetic sessions | Evidence | — | Single occurrence, no cross-page figure to conflict |

**Worked example — two illustrative sessions (PRV027 / PRV011):**

| Claim | Value | Pages | Date | Status before this audit | Status now |
|---|---|---|---|---|---|
| Neuro-ophthalmology session (PRV027), 10 patients | 354 forecast minutes / 2 technicians | Home, Product (visible DOM) | 2026-09-08 | Correct | **Unchanged — correct** |
| Neuro-ophthalmology session (PRV027) | 345 min / 2 technicians | Product (embedded Next.js RSC hydration JSON only — not visible text) | — | **Stale duplicate of pre-reconciliation figure**, would have caused a hydration mismatch | **FIXED this audit** → now 354, matches visible DOM |
| Glaucoma session (PRV011), 10 patients | 198 forecast minutes / 1 technician | Home, Product (visible DOM) | 2026-09-08 | Correct | **Unchanged — correct** |
| Glaucoma session (PRV011) | 181 min / 1 technician | Product (embedded RSC hydration JSON only) | — | Stale | **FIXED this audit** → now 198 |
| Same worked example, prose form | "...forecast at 345 and 181 technician minutes respectively" | FAQ (×2 occurrences incl. an `&#x27;` apostrophe variant) | none given | **Entirely stale** — neither figure matched the reconciled 354/198, no PRV ID, no date | **FIXED this audit** → now reads "354 (PRV027, 2 technicians) and 198 (PRV011, 1 technician) minutes respectively, dated 2026-09-08" |
| Same worked example | — | Evidence | — | Page does not reference PRV027/PRV011 at all; earlier grep hits for "181"/"198" substrings were false positives inside CSS width decimals (e.g. `...8148698523`) | No claim present — no action needed |

## 2. External wage/labor-market citations (T1 — cited, verified accurate to source pages)

| Claim | Value | Page | Source | Status |
|---|---|---|---|---|
| O*NET 2025 median hourly wage, ophthalmic medical technicians | $21.91/hr, 78,800 employed (2024) | `ophthalmic-technician-staffing-ratios/` | O*NET (linked) | Verified — cited external figure, not a company claim |
| BLS OEWS May 2022 mean annual wage | $42,480, 66,060 employed, 10th–90th pctile $29,830–$58,970 | `ophthalmic-technician-staffing-ratios/`, `technician-shortage-session-variance/` | BLS OEWS (linked) | Verified — cited external figure; not Phase Zero pricing (confirmed no co-location with Phase Zero copy) |

## 3. Phase Zero — pricing & structure (T3 — process statement; pricing is PERMANENTLY WITHDRAWN per owner directive)

| Claim | Pages | Status |
|---|---|---|
| "Phase Zero is a fixed-fee diagnostic, scoped to your clinic" / "Ask about Phase Zero" / "Ask us for a quote" | Home, Product, FAQ, Pilot | **Verified compliant** — no dollar figure, no free-trial promise, no fixed timeline anywhere near "Phase Zero" copy (checked via targeted regex for `$`/"free" within 300 chars of every "Phase Zero" mention — zero matches) |
| "How is Phase Zero priced?" FAQ answer | FAQ | "A fixed fee, scoped to your clinic once we see your data. Ask us for a quote." — **compliant, no amount stated** |
| Pilot Phase 2 (Compare) duration | "8–12 weeks, planning estimate" | Pilot | Explicitly hedged as a planning estimate, not a committed/fixed timeline — compliant |
| Pilot Phase 1 (Observe) duration | "Shadow mode, 4 weeks" | Pilot | Stated once, no conflicting duration found elsewhere |

## 4. Analytics / tracking claims (T3 — process statement; corrected this audit to match actual code)

| Claim (before fix) | Reality found in code | Pages affected | Status |
|---|---|---|---|
| "This site uses Cloudflare Web Analytics for traffic and performance measurement. Fonts are served from this domain." | No `static.cloudflareinsights.com` script, no `cf-beacon`, no Cloudflare Web Analytics tag anywhere in the repo's HTML | Footer template (`.growth/templates/footer.html`) + 24 rendered pages (404, about, accessibility, 6 content/landing pages, contact, evidence, faq, forecasting page, governance, how-it-works, news/phase-zero, pilot, privacy, product, resources, same-day-staffing, screening-schedule, technician-shortage, terms) | **FIXED** — now states the site does not run Cloudflare Web Analytics; fonts-served-from-this-domain disclosure kept |
| "Cloudflare adds its Web Analytics script to this website..." / "Our existing Cloudflare traffic measurement..." / "Cloudflare also supplies traffic measurement..." (4 separate passages) | Same as above — no such script loads | `privacy/index.html` | **FIXED** — 4 passages corrected; voluntary reader-ratings and legitimate Cloudflare infra roles (Worker/D1/DNS/hosting/form processing) left intact since those are real |
| "No analytics, no tracking pixels, no third-party scripts and no embedded fonts from anyone else. There is no cookie banner because there are no cookies to consent to." | `contact/index.html` loads `assets/site-analytics.js`, which implements **consent-gated Google Analytics** behind an "Allow analytics" control, and the page has a visible consent banner | `contact/index.html` (×2, desktop + mobile blocks) | **FIXED** — now states GA loads only on opt-in via the consent control, directs to privacy notice |
| Home page footer/body | Checked for "no cookies, no analytics" style language | `index.html` | **No fix needed** — only match was a disabled `CLARITY_PROJECT_ID = ""` dev comment (Microsoft Clarity, empty project ID = inert, never loads); no visible false claim on this page |
| Google Analytics — consent-gated, opt-in | `assets/site-analytics.js` | Sitewide (loaded via consent banner component) | Confirmed real and consent-gated; privacy policy's existing GA section (`id="google-analytics"`) was already accurate and untouched |

## 5. Validation / compliance status (T3 — process statement)

| Claim | Pages | Status |
|---|---|---|
| "Not yet validated on a real clinic, and not HIPAA certified" | Evidence | Verified consistent with no contradicting "HIPAA certified" or "validated on real clinic data" claim found anywhere else on the site |
| "On the system's synthetic validation holdout, not validated on real clinic data" | Home | Consistent with Evidence page framing |
| "Synthetic forecasts for 2026-09-08, not validated on real clinic data" | Home | Consistent |
| "These are prototype forecasts, not observed clinic results" | Product | Consistent |
| "Proposed evaluation design. No clinic pilot or real-world outcome is claimed." | Pilot | Consistent |

## 6. Illustrative / demo content (T4 — explicitly fictional, not live system)

| Claim | Pages | Status |
|---|---|---|
| Call-off coverage demo (T-041/T-018/T-062 technician panel) | Home, Product | Both copies carry the disclaimer "not connected to a running system" / "does not validate a staffing plan" — consistent |

## 7. Governance / prohibited-use claims (T3 — policy statement)

| Claim | Page | Status |
|---|---|---|
| "No per-technician score exists anywhere in it... Hiring. Firing. Promotion. Discipline. Compensation. Performance scoring of any kind [prohibited]." | Governance | No quantitative figure, no conflict found; sourced to `docs/governance.md section 5` |

## 8. `/methodology/` page

| Before | After |
|---|---|
| Thin redirect stub: meta-refresh + JS redirect to bare `/evidence/` with only "Redirecting to Evidence…" — landed at the top of the Evidence page with no way to locate the actual methodology section among ~7 sections | **FIXED**: now redirects (canonical + meta-refresh + JS) to `/evidence/#what-is-actually-tested`, the real methodology section on the Evidence page, and the fallback link text names the destination instead of just "Redirecting…" |

---

## Summary of fixes made this audit (commits on `feat/krh-mobile-claims-content`)

1. `a98323d` — Corrected false "Cloudflare Web Analytics" claims in the shared footer template (25 files) and 4 deeper passages in `privacy/index.html`; corrected `contact/index.html`'s "no analytics/no cookies" claim to accurately describe the consent-gated GA script that actually runs on that page.
2. `dbf129e` — Fixed stale PRV027/PRV011 figures: `product/index.html`'s embedded RSC hydration JSON (345/181 → 354/198, matching the already-correct visible DOM); `faq/index.html`'s entirely-stale prose worked example (345/181 → 354 (PRV027, 2 technicians) / 198 (PRV011, 1 technician), dated 2026-09-08); verified `evidence/index.html` has no PRV027/PRV011 reference and no genuine conflict. Rebuilt `/methodology/` as a real redirect to the actual methodology section instead of a dead-end stub.

## Items checked and found already correct (no change made)

- All "Phase Zero" pricing/timeline language sitewide — no dollar figures, no free-trial promises, no fixed timelines found anywhere (confirmed by targeted search of a 300-char window around every "Phase Zero" mention across every HTML file).
- Forecast-accuracy baseline figures (23.76 / 24.01 / 33.42 / 63.12 / 208.61 min) — consistent between Home and Evidence, nowhere contradicted.
- BLS/O*NET wage citations — accurate to source, not conflated with Phase Zero pricing.
- HIPAA / real-clinic-validation disclaimers — consistent sitewide, no page overclaims certification or clinical validation.
- Privacy policy's own Google Analytics section (`id="google-analytics"`) — already accurately described the real, consent-gated GA implementation; left untouched.
- Governance prohibited-use claims — no quantitative figures, nothing to reconcile.
