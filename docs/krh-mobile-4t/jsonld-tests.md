# JSON-LD Structured Data Tests — Per Page

Source: raw `curl -s` HTML for each live URL, 2026-11-09. Only JSON-LD found inside real `<script type="application/ld+json">` tags is counted as 'served structured data' (parsed and validated as JSON). Content-matching was done by substring-checking each FAQPage Q/A pair against the same raw HTML.

## `/`

- JSON-LD present: **yes**
- Types found (real `<script type="application/ld+json">` only): Organization, WebPage, WebSite
- JSON parse errors: none

## `/about/`

- JSON-LD present: **yes**
- Types found (real `<script type="application/ld+json">` only): BreadcrumbList, Organization, Person, WebPage, WebSite
- JSON parse errors: none

## `/accessibility/`

- JSON-LD present: **yes**
- Types found (real `<script type="application/ld+json">` only): Organization, WebPage, WebSite
- JSON parse errors: none
- `SoftwareApplication` string present in page source, but only inside the Next.js RSC flight-data payload (escaped JSON used for client hydration) — **not** inside a real `application/ld+json` script tag, so it is not parsed as structured data by crawlers. Checked for `aggregateRating`/`offers`/`price` on this object: **none present** (no invalid rating/pricing claims even in the inert payload).

## `/contact/`

- JSON-LD present: **yes**
- Types found (real `<script type="application/ld+json">` only): BreadcrumbList, Organization, WebPage, WebSite
- JSON parse errors: none
- `SoftwareApplication` string present in page source, but only inside the Next.js RSC flight-data payload (escaped JSON used for client hydration) — **not** inside a real `application/ld+json` script tag, so it is not parsed as structured data by crawlers. Checked for `aggregateRating`/`offers`/`price` on this object: **none present** (no invalid rating/pricing claims even in the inert payload).

## `/evidence/`

- JSON-LD present: **yes**
- Types found (real `<script type="application/ld+json">` only): BreadcrumbList, FAQPage, Organization, WebPage, WebSite
- JSON parse errors: none
- FAQPage: 2 Q/A pairs. VALID — all Q/A text matches visible page content
- `SoftwareApplication` string present in page source, but only inside the Next.js RSC flight-data payload (escaped JSON used for client hydration) — **not** inside a real `application/ld+json` script tag, so it is not parsed as structured data by crawlers. Checked for `aggregateRating`/`offers`/`price` on this object: **none present** (no invalid rating/pricing claims even in the inert payload).

## `/faq/`

- JSON-LD present: **yes**
- Types found (real `<script type="application/ld+json">` only): BreadcrumbList, FAQPage, Organization, WebPage, WebSite
- JSON parse errors: none
- FAQPage: 21 Q/A pairs. VALID — all Q/A text matches visible page content
- `SoftwareApplication` string present in page source, but only inside the Next.js RSC flight-data payload (escaped JSON used for client hydration) — **not** inside a real `application/ld+json` script tag, so it is not parsed as structured data by crawlers. Checked for `aggregateRating`/`offers`/`price` on this object: **none present** (no invalid rating/pricing claims even in the inert payload).

## `/governance/`

- JSON-LD present: **yes**
- Types found (real `<script type="application/ld+json">` only): BreadcrumbList, FAQPage, Organization, WebPage, WebSite
- JSON parse errors: none
- FAQPage: 3 Q/A pairs. VALID — all Q/A text matches visible page content
- `SoftwareApplication` string present in page source, but only inside the Next.js RSC flight-data payload (escaped JSON used for client hydration) — **not** inside a real `application/ld+json` script tag, so it is not parsed as structured data by crawlers. Checked for `aggregateRating`/`offers`/`price` on this object: **none present** (no invalid rating/pricing claims even in the inert payload).

## `/how-it-works/`

- JSON-LD present: **yes**
- Types found (real `<script type="application/ld+json">` only): BreadcrumbList, Organization, WebPage, WebSite
- JSON parse errors: none
- `SoftwareApplication` string present in page source, but only inside the Next.js RSC flight-data payload (escaped JSON used for client hydration) — **not** inside a real `application/ld+json` script tag, so it is not parsed as structured data by crawlers. Checked for `aggregateRating`/`offers`/`price` on this object: **none present** (no invalid rating/pricing claims even in the inert payload).

## `/pilot/`

- JSON-LD present: **yes**
- Types found (real `<script type="application/ld+json">` only): BreadcrumbList, Organization, WebPage, WebSite
- JSON parse errors: none
- `SoftwareApplication` string present in page source, but only inside the Next.js RSC flight-data payload (escaped JSON used for client hydration) — **not** inside a real `application/ld+json` script tag, so it is not parsed as structured data by crawlers. Checked for `aggregateRating`/`offers`/`price` on this object: **none present** (no invalid rating/pricing claims even in the inert payload).

## `/privacy/`

- JSON-LD present: **yes**
- Types found (real `<script type="application/ld+json">` only): Organization, WebPage, WebSite
- JSON parse errors: none

## `/product/`

- JSON-LD present: **yes**
- Types found (real `<script type="application/ld+json">` only): BreadcrumbList, Organization, WebPage, WebSite
- JSON parse errors: none
- `SoftwareApplication` string present in page source, but only inside the Next.js RSC flight-data payload (escaped JSON used for client hydration) — **not** inside a real `application/ld+json` script tag, so it is not parsed as structured data by crawlers. Checked for `aggregateRating`/`offers`/`price` on this object: **none present** (no invalid rating/pricing claims even in the inert payload).

## `/resources/`

- JSON-LD present: **yes**
- Types found (real `<script type="application/ld+json">` only): BreadcrumbList, CollectionPage, Organization, WebPage, WebSite
- JSON parse errors: none

## `/terms/`

- JSON-LD present: **yes**
- Types found (real `<script type="application/ld+json">` only): Organization, WebPage, WebSite
- JSON parse errors: none
- `SoftwareApplication` string present in page source, but only inside the Next.js RSC flight-data payload (escaped JSON used for client hydration) — **not** inside a real `application/ld+json` script tag, so it is not parsed as structured data by crawlers. Checked for `aggregateRating`/`offers`/`price` on this object: **none present** (no invalid rating/pricing claims even in the inert payload).

## `/forecasting-technician-workload-by-session/`

- JSON-LD present: **yes**
- Types found (real `<script type="application/ld+json">` only): Article, BreadcrumbList, Organization, WebPage, WebSite
- JSON parse errors: none
- `SoftwareApplication` string present in page source, but only inside the Next.js RSC flight-data payload (escaped JSON used for client hydration) — **not** inside a real `application/ld+json` script tag, so it is not parsed as structured data by crawlers. Checked for `aggregateRating`/`offers`/`price` on this object: **none present** (no invalid rating/pricing claims even in the inert payload).

## `/ophthalmic-technician-staffing-ratios/`

- JSON-LD present: **yes**
- Types found (real `<script type="application/ld+json">` only): Article, BreadcrumbList, Organization, WebPage, WebSite
- JSON parse errors: none
- `SoftwareApplication` string present in page source, but only inside the Next.js RSC flight-data payload (escaped JSON used for client hydration) — **not** inside a real `application/ld+json` script tag, so it is not parsed as structured data by crawlers. Checked for `aggregateRating`/`offers`/`price` on this object: **none present** (no invalid rating/pricing claims even in the inert payload).

## `/technician-shortage-session-variance/`

- JSON-LD present: **yes**
- Types found (real `<script type="application/ld+json">` only): Article, BreadcrumbList, Organization, WebPage, WebSite
- JSON parse errors: none
- `SoftwareApplication` string present in page source, but only inside the Next.js RSC flight-data payload (escaped JSON used for client hydration) — **not** inside a real `application/ld+json` script tag, so it is not parsed as structured data by crawlers. Checked for `aggregateRating`/`offers`/`price` on this object: **none present** (no invalid rating/pricing claims even in the inert payload).

## `/same-day-ophthalmology-staffing/`

- JSON-LD present: **yes**
- Types found (real `<script type="application/ld+json">` only): Article, BreadcrumbList, Organization, WebSite
- JSON parse errors: none

## `/call-off-coverage-eye-clinics/`

- JSON-LD present: **yes**
- Types found (real `<script type="application/ld+json">` only): Article, BreadcrumbList, Organization, WebSite
- JSON parse errors: none

## `/ophthalmology-staffing-forecast-readiness/`

- JSON-LD present: **yes**
- Types found (real `<script type="application/ld+json">` only): Article, BreadcrumbList, Organization
- JSON parse errors: none

## `/screening-schedule-changes-technician-coverage/`

- JSON-LD present: **yes**
- Types found (real `<script type="application/ld+json">` only): Article, BreadcrumbList, Organization
- JSON parse errors: none

## `/adding-ophthalmologist-technician-coverage/`

- JSON-LD present: **yes**
- Types found (real `<script type="application/ld+json">` only): Article, BreadcrumbList, Organization
- JSON parse errors: none

## `/ophthalmology-staffing-forecast-error-review/`

- JSON-LD present: **yes**
- Types found (real `<script type="application/ld+json">` only): Article, BreadcrumbList, Organization
- JSON parse errors: none

## `/ophthalmic-technician-training-coverage/`

- JSON-LD present: **yes**
- Types found (real `<script type="application/ld+json">` only): Article, BreadcrumbList, Organization
- JSON parse errors: none

## `/news/kestrel-ridge-health-phase-zero/`

- JSON-LD present: **yes**
- Types found (real `<script type="application/ld+json">` only): BreadcrumbList, NewsArticle, Organization
- JSON parse errors: none

## `/methodology/`

- JSON-LD present: **no**
- Types found (real `<script type="application/ld+json">` only): none
- JSON parse errors: none
