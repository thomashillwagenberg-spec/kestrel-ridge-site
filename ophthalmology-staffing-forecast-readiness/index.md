---
title: "Before you buy a staffing forecast, check your session data | Kestrel Ridge Health"
url: https://kestrelridgehealth.com/ophthalmology-staffing-forecast-readiness/
description: "A practical readiness checklist and blank worksheet for independent ophthalmology practices evaluating technician workload forecasting."
---

# Before you buy a staffing forecast, check your session data

A practical readiness checklist and blank worksheet for independent ophthalmology practices evaluating technician workload forecasting.

By Thomas Wagenberg · November 2, 2026 · Updated November 19, 2026 · 7 min read

![Illustration of a blank planning worksheet and closed laptop beside an ophthalmology exam room.](https://kestrelridgehealth.com/assets/session-readiness-editorial.jpg)

*AI-generated editorial illustration of a fictional clinic. No customer or patient is depicted.*

The practical takeaway

I'd start with a consistent definition of a clinic session, appointment counts by visit type and a clear measure of technician work. Then I'd compare the forecast with the method the practice already uses, on sessions the model hasn't seen. If it can't make a better case than that, I wouldn't move forward.

Before I'd trust a staffing forecast, I'd want to know what we're asking it to predict. A patient count tells me how many visits are on the schedule. It doesn't tell me how much technician work falls into that morning.

I think that's a useful place to start for an independently owned ophthalmology practice considering staffing software. We need to figure out what the records can actually tell us before we decide whether a forecast will help.

I put together this checklist and a blank worksheet to make that discussion easier. There are no clinic results or assumed staffing benchmarks in it.

## Start with what you mean by a session

I'd pick one planning unit and write down its boundaries. That might be a provider's morning at one site. Use the same definition when you look back at past sessions and plan the next ones.

A full day at one office and a half-day at another aren't the same observation. If those get mixed together, I'd fix that before comparing forecasts. Use internal reference codes so your team can reconcile totals without building a patient list.

## Figure out what the minutes measure

I'd record appointment counts using the visit categories the practice already uses. I'd also label whether those counts refer to booked or completed visits, because those answer different questions.

The part I'd want to understand is how technician work was measured. Was someone observing task time? Was it estimated? Was it just the length of the appointment?

An appointment's elapsed time isn't automatically technician time. Neither is a technician's whole paid shift. If that's all we have, I want that limitation written down. I wouldn't quietly treat an estimate as something we observed.

## Use the worksheet to find the missing pieces

Use the questions below as a worksheet in your practice's approved planning tool. Record what you have, what's missing and who will check it. Keep completed versions within your practice.

| Planning question | What to record locally | What a missing answer means |
|---|---|---|
| Are sessions comparable? | Session definition, site reference and duration | Reconcile the unit before comparing results. |
| What work was expected? | Visit categories and booked counts | Patient count alone can't describe the planned mix. |
| What work happened? | Completed counts and observed technician minutes | Document what the target actually measures. |
| What would you do today? | The existing ratio, spreadsheet or planning rule | A comparison needs a reproducible baseline. |
| Could the plan be staffed? | Availability, competencies and site restrictions | A workload estimate isn't an assignment. |

## Give the current spreadsheet a fair comparison

I'd write down the practice's current planning rule before looking at model results. If a simple historical average is a reasonable alternative, I'd include that too.

Then I'd hold back later sessions for evaluation. Checking only the sessions used to develop a model doesn't tell me how it handles a new one. Each method needs the same definitions and evaluation period.

I wouldn't stop at the overall average. I'd check individual sites and session types, and keep track of missing values and unusual operating days. Removing a difficult day because it hurts the result defeats the point of the test.

### How I'd check whether the spreadsheet already works

I'd save what each method predicted when the scheduler had to make the plan. If the spreadsheet uses booked visits, keep the count from that point in time. Giving one method the final visit count lets it see cancellations the scheduler couldn't have known about.

For a provider-average comparison, I'd use earlier sessions to calculate the provider's observed technician minutes per visit. I'd multiply that rate by the visits booked when the plan was made. If there's no usable history for a new provider, agree on a fallback ahead of time and flag those sessions separately.

Keep one row per session. Copy these fields into your approved planning tool, using internal reference codes your team can reconcile locally.

| Field | Your entry |
|---|---|
| Session and site reference | _____ |
| Date and time the staffing plan was made | _____ |
| Spreadsheet prediction in technician minutes | _____ |
| Model prediction in technician minutes | _____ |
| Observed technician minutes and measurement method | _____ |
| Absolute error for each method | _____ |
| Missing data or fallback used | _____ |

For each method, subtract its prediction from the observed minutes and take the absolute value. Add those absolute errors and divide by the number of scored sessions to get mean absolute error, or MAE. The result is the average miss in technician minutes. Score both methods on the same rows. If a prediction or observation is missing, leave both error cells blank and record why. Enter zero observed minutes only when someone measured zero.

### What does a fair comparison look like?

Here's a synthetic example with four fictional sessions. Each prediction uses information available when the plan was made. The observed minutes come afterward. Four rows illustrate the arithmetic. They don't establish how much history your practice needs or how a real model will perform.

| Session | Spreadsheet | Model | Observed | Spreadsheet absolute error | Model absolute error |
|---|---|---|---|---|---|
| North 1 | 140 | 190 | 200 | 60 | 10 |
| North 2 | 160 | 210 | 220 | 60 | 10 |
| South 1 | 100 | 80 | 100 | 0 | 20 |
| South 2 | 110 | 100 | 120 | 10 | 20 |

The spreadsheet's absolute errors add to 130 minutes, so its MAE is 32.5 minutes across four sessions. The model's errors add to 60, giving an MAE of 15 minutes. At North, the spreadsheet averages 60 minutes of error and the model averages 10. At South, the spreadsheet averages five and the model averages 20. I'd flag South before making a decision about both sites.

I'd also keep the direction of the miss. All four model predictions in this example are below the observed work. Decide with the scheduling lead what a shortfall means for the work due, then use the [time-block coverage worksheet](https://kestrelridgehealth.com/ophthalmology-technician-coverage-by-time-block/) to check where qualified minutes are needed. The comparison tells us how a forecast missed. The coverage check shows what the team can staff.

I'd compare those averages for each site as well as across the practice, and report how many sessions contributed to each comparison. A busy office can drive the group average while another site gets worse. I'd also look back at the sessions where the model predicted too few minutes. That's a different scheduling problem from predicting too many, even if the absolute errors match.

If your current rule gives a headcount, keep it as a separate staffing comparison unless you have a defensible way to express it in technician work minutes. Our [staffing ratios guide](https://kestrelridgehealth.com/ophthalmic-technician-staffing-ratios/) explains what those ratios can tell you. A smaller error in minutes still leaves the question of whether the available people can cover the work.

## Decide what would make you stop

I want the decision rules agreed before the results come back. If the history can't support a useful comparison, we may need better measurement first. If the spreadsheet works just as well, I'd want to know that too.

That's how I think about [Phase Zero at KRH](https://kestrelridgehealth.com/pilot/). It starts with local evaluation and agreed gates for continuing. The scope is worked out for the clinic.

## Keep the staffing decision with a person

A workload estimate doesn't tell me which technician can cover the session. I still need to account for availability, skills, approved sites and other operating rules.

At KRH, the workload model and assignment rules do different jobs, and a person makes the staffing decision. Our [process explanation](https://kestrelridgehealth.com/how-it-works/) shows where those responsibilities sit.

Before any data exchange, we'd agree on the permitted export and handling with the practice's privacy team. Please don't email patient identifiers or a completed operational worksheet through this page.

## What I can say today

This checklist is a proposed way to prepare for a test. It isn't a validated staffing standard. KRH's published model results come from synthetic data. They don't establish performance or savings at your practice.

I've linked our [evidence and its limits](https://kestrelridgehealth.com/evidence/) and our [explanation of session workload forecasting](https://kestrelridgehealth.com/forecasting-technician-workload-by-session/) for that reason.

I want a practice to know whether the forecast helps before it changes how people are scheduled. If the evidence doesn't support that change, stopping is a useful result.

## Sources and scope

- [KRH: Phase Zero scope and evaluation gates](https://kestrelridgehealth.com/pilot/) Clinic-specific scope, local evaluation, continuation gates and export review. Checked 2026-11-19.
- [KRH: forecasting and assignment process](https://kestrelridgehealth.com/how-it-works/) Workload forecasting is separate from constrained assignment and human approval. Checked 2026-11-19.
- [Hyndman and Athanasopoulos: evaluating point forecast accuracy](https://otexts.com/fpp3/accuracy.html) Authoritative forecasting text defines held-out evaluation and mean absolute error in the units of the measured series. The four-session example here is original fictional arithmetic. Checked 2026-11-19.
- [KRH: forecast comparisons and evidence limits](https://kestrelridgehealth.com/evidence/) The published synthetic evaluation includes a provider-average spreadsheet comparison. Checked 2026-11-19.

HELP US IMPROVE

## Was this article useful?

Your response helps us choose and improve future articles.

## Technician coverage risk check

Check your technician coverage risk in about 3 minutes. Answer a few questions about your own sessions and staffing, then decide whether a longer conversation is worth having.

[Start the risk check](https://kestrelridgehealth.com/technician-coverage-risk-check/)

## Does your session history support a useful test?

Start with a conversation about your sites, your current planning method and what you can measure.

[Discuss Phase Zero](https://kestrelridgehealth.com/contact/)
