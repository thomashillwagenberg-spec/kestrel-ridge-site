# Weekly article brief template

Copy this template into the private workspace log for each weekly slot (one new article, one improvement). Do not commit private Search Console numbers, conversation notes or names to this repository. Write nothing until every field is filled. If a field cannot be filled honestly, skip the slot this week.

## 1. Slot

- Brief id: `YYYY-Www-new-slug` or `YYYY-Www-refresh-slug` (ISO week, for example `2026-W47-refresh-call-off-coverage-eye-clinics`)
- Kind: new | refresh
- Target URL: /slug/
- Owner review needed: yes | no (yes for any merge, redirect, retirement, new claim about the product, or pricing language)

## 2. Buyer question (documented)

- Question, in the buyer's words:
- Who asks it (role, practice type):
- Evidence type (pick one): `search_console_query` | `sales_conversation` | `ai_answer_gap` | `p2_opportunity`
- Evidence detail:
  - search_console_query: query, impressions, clicks, average position, page, exact date window
  - sales_conversation: date, anonymised role, the words used, what decision they were facing
  - ai_answer_gap: engine, exact prompt, date, what the answer missed or who it cited
  - p2_opportunity: opportunity table date, rank and row name, plus the measured or HYPOTHESIS label from that row
- Why answering it helps a buyer make a decision:

## 3. Distinct intent

- Nearest existing KRH page:
- Why this question is different from that page (decision, reader, stage or data):
- If not clearly different: stop, and turn this slot into an improvement of the nearest page.

## 4. Sources (at least two, credible, current)

| Claim it supports | Source title | URL | Publisher type (primary, peer reviewed, professional body, government) | Date read |
|---|---|---|---|---|
| | | | | |
| | | | | |

Label any synthetic or illustrative numbers as synthetic. No fabricated customers, outcomes, ROI, endorsements or certifications.

## 5. Required internal links

- /product/ (where it helps):
- /pilot/ Phase Zero (where it helps):
- /evidence/ (where it helps):
- Related article 1:
- Related article 2 (optional):
- Pages that should link to this one after publishing (at least one):

## 6. Phase Zero path

- Call to action that fits the question (risk check, call-off stress test, readiness worksheet, Phase Zero conversation):
- Why this is the useful next step for this reader:
- No price amount.

## 7. Measurement

- Baseline (impressions, position, AI citation) and window:
- Day 7: indexed, internal links in place
- Day 28: impressions target and actual
- Day 90: clicks, CTA clicks, inquiries (once measurable)
- Refresh trigger:

## Public reference block for the article JSON

Add this to the article JSON. `check.py` validates it for any article published or substantively modified on or after the rule's effective date.

```json
"brief": {
  "id": "2026-W47-refresh-call-off-coverage-eye-clinics",
  "kind": "refresh",
  "evidence_type": "p2_opportunity",
  "buyer_question": "How do we cover a technician call-off in an eye clinic without cancelling patients?",
  "nearest_page": "/same-day-ophthalmology-staffing/",
  "distinct_because": "Covers the planned response to a call-off rather than same-day schedule triage."
}
```
