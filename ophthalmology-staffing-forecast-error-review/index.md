---
title: "How to review an ophthalmology staffing forecast that misses | Kestrel Ridge Health"
url: https://kestrelridgehealth.com/ophthalmology-staffing-forecast-error-review/
description: "Check forecast error, session data and coverage decisions with a practical review process for independent ophthalmology practices."
---

THE PRACTICAL TAKEAWAY

I'd preserve the original prediction, check how technician minutes were measured and compare errors with the existing planning method on the same sessions. Then document whether the issue concerns data, demand or coverage, and record a named decision to continue, pause or stop.

When an ophthalmology staffing forecast misses, I'd first check what was predicted and what was measured. A busy session can expose a problem. It doesn't tell me whether the problem came from the forecast, the data or the coverage plan.

I think the review needs to answer a practical question: can the scheduler keep using this forecast, or should the practice fall back to its approved planning method? I'd write down that decision before changing the model.

This is a practical guide for independent practices evaluating a staffing forecast. It isn't a report of a new clinical finding. The review below is my suggested operating process, informed by [NIST's voluntary AI Risk Management Framework](https://airc.nist.gov/airmf-resources/airmf/5-sec-core/) and KRH's published evaluation boundaries.

## Keep the forecast that existed before the session

I'd keep the original forecast, its creation time and the appointment information available then. I'd also keep the planning method being used for comparison. Changing either after the session would make the result harder to interpret.

A retrospective prediction that includes information learned during the day answers a different question. For example, the final cancellation count wasn't necessarily known when the schedule was approved. KRH's [governance policy](https://kestrelridgehealth.com/governance/) excludes realized no-shows and cancellations from forecast inputs for this reason.

I'd give each comparison a session identifier, site, date and morning or afternoon label. Use the practice's approved operational records. This review doesn't require a public patient list or an export of patient identifiers.

## Check the definition of technician minutes

Before calling the model wrong, I'd confirm that the observed number measures the same work as the prediction. Paid shift minutes, hands-on work minutes and patient elapsed time describe different things. I'd ask whoever maintains the export to explain what starts and stops the measurement.

I'd check whether the session includes training, interruptions or work completed after its scheduled end. Those details need consistent treatment. I wouldn't quietly remove a difficult session because it makes the forecast look worse.

If the observation is missing or its definition changed, I'd mark the comparison as unresolved. A blank observation can't establish a zero-minute error. Keep a count of unresolved sessions beside any accuracy result.

## Compare errors without letting the average hide them

For a session with comparable observations, I'd calculate signed error as observed technician minutes minus forecast minutes. A positive value means the forecast was below the observed workload. A negative value means it was above it.

I'd also calculate absolute error, which ignores direction. Mean absolute error is the sum of those absolute session errors divided by the number of comparable sessions. Mean signed error can look small when errors in opposite directions cancel, so I'd show both measures.

I'd compare the forecast and the practice's existing planning method on the same sessions, using the same definitions. Record which sessions were excluded and why. If a model only wins after removing the sessions the scheduler struggles with, I'd want that limitation visible.

A session's position outside a prediction interval is another useful observation. I'd review interval coverage across comparable sessions rather than treating one miss as proof that the model failed. A wide interval also needs to be useful for the scheduling decision. Accuracy and practical usefulness both need a review.

## Separate the miss from the decision it informed

I'd ask the scheduler and the person responsible for the data to work through the same short review. The table is a suggested diagnostic aid. It doesn't establish the cause by itself.

| What you find | What I'd check next | What to record |
|---|---|---|
| The original forecast can't be reproduced | Was the input snapshot or model version changed? | The missing version or record, and who will recover it. |
| The observed minutes use a different definition | Did the export, timing rule or session boundary change? | The definition change and which sessions it affects. |
| Comparable sessions repeatedly exceed the forecast | Has the appointment mix or operating process changed? | The pattern, comparison window and evidence still needed. |
| Demand was estimated reasonably, but coverage wasn't feasible | Were availability, competencies, supervision and travel checked? | The coverage constraint and the approved response. |
| A person changed the plan during the day | What changed, when, and why? | The original plan, override reason and resulting plan. |

I'd avoid treating overtime as a direct measurement of forecast error. Overtime is an operating outcome with its own definition and possible causes. It belongs beside the error review, with enough context to explain the day's decisions.

## Finish with a named decision and a review date

I'd end the review with one of three recorded decisions. Continue under the current evaluation rules, pause use while the measurement is repaired, or stop and return to the approved fallback. Name the decision owner and the next review date.

The practice should agree on its thresholds before evaluating results. KRH's [proposed pilot design](https://kestrelridgehealth.com/pilot/) includes a stopping rule when forecast error exceeds the fixed-ratio baseline over a rolling two-week window. That is KRH's published evaluation rule. It isn't a universal threshold for every clinic or model.

I wouldn't turn this review into a ranking of technicians. KRH prohibits using its outputs for individual performance scoring, compensation or employment decisions. A workload miss needs an explanation about the model, records and operating conditions.

[KRH's published evidence uses synthetic data](https://kestrelridgehealth.com/evidence/). It doesn't establish accuracy, savings or staffing outcomes in your practice. [Consistent session data](https://kestrelridgehealth.com/ophthalmology-staffing-forecast-readiness/) and a fair local comparison are still needed. Phase Zero is a diagnostic scoped per clinic.

I want the review to leave the scheduler with a clear answer about the next session. Keep the original prediction, document what can actually be compared, and record who decided whether to continue.

## Sources and scope

- [NIST: AI Risk Management Framework Core](https://airc.nist.gov/airmf-resources/airmf/5-sec-core/) The 2023 voluntary framework supports ongoing monitoring and evaluation in deployment-like conditions. It does not prescribe this article’s clinic checklist. Checked 2026-11-06.
- [NIST: Challenges to the Monitoring of Deployed AI Systems](https://www.nist.gov/news-events/news/2026/03/new-report-challenges-monitoring-deployed-ai-systems) Published March 9, 2026. Discusses distinct functionality, operational and human-factors monitoring questions. Background research, not same-day news. Checked 2026-11-06.
- [KRH: Governance and prohibited uses](https://kestrelridgehealth.com/governance/) Realized cancellations and no-shows are excluded from forecast inputs. Individual performance scoring and employment uses are prohibited. Checked 2026-11-06.
- [KRH: Pilot evaluation and stopping rules](https://kestrelridgehealth.com/pilot/) Proposed local evaluation compares baselines and specifies a rolling two-week forecast-error stopping rule. Phase Zero is scoped per clinic. No completed clinic pilot is claimed. Checked 2026-11-06.
- [KRH: Current evidence limits](https://kestrelridgehealth.com/evidence/) Published evaluation uses synthetic data and does not establish local accuracy or real-practice outcomes. Checked 2026-11-06.

HELP US IMPROVE

## Was this article useful?

Your response helps us choose and improve future articles.

## Technician coverage risk check

Check your technician coverage risk in about 3 minutes. Answer a few questions about your own sessions and staffing, then decide whether a longer conversation is worth having.

[Start the risk check](https://kestrelridgehealth.com/technician-coverage-risk-check/)

## Does your session history support a useful test?

Start with a conversation about your sites, your current planning method and what you can measure.

[Discuss Phase Zero](https://kestrelridgehealth.com/contact/)
