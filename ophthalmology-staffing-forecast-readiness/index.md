---
title: "Before you buy a staffing forecast, check your session data | Kestrel Ridge Health"
url: https://kestrelridgehealth.com/ophthalmology-staffing-forecast-readiness/
description: "A practical readiness checklist and blank worksheet for independent ophthalmology practices evaluating technician workload forecasting."
---

Planning guide / Independent ophthalmology practices

# Before you buy a staffing forecast, check your session data

By Thomas Wagenberg · Kestrel Ridge Health · Published 2026-11-02 · Updated 2026-11-04

![Illustration of a blank planning worksheet and closed laptop beside an ophthalmology exam room.](https://kestrelridgehealth.com/assets/session-readiness-editorial.jpg)

*AI-generated editorial illustration of a fictional clinic. No customer or patient is depicted.*

The starting point

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

[Download the blank planning worksheet](https://kestrelridgehealth.com/downloads/session-readiness-worksheet.csv)

I made this as a discussion worksheet, not KRH's import specification. Keep completed versions within your practice. This page doesn't upload or send the worksheet anywhere.

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

[Download the blank forecast comparison sheet](https://kestrelridgehealth.com/downloads/session-forecast-comparison.csv). Keep one row per session, even if your separate planning worksheet has several rows for different visit types. Enter the spreadsheet prediction in column D, the model prediction in E and the observed technician minutes in F. If any of those three numbers is missing, leave both error cells blank and record the reason.

In a spreadsheet, I use `=IF(COUNT(D2:F2)=3,ABS(D2-F2),"")` for column G and `=IF(COUNT(D2:F2)=3,ABS(E2-F2),"")` for H. Copy the formulas down for the sessions you held back. The average of each error column is how many technician minutes that method missed by per scored session, in either direction. Zero observed minutes and missing observations mean different things. Only enter zero if someone actually measured it.

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

- [KRH: Phase Zero scope and evaluation gates](https://kestrelridgehealth.com/pilot/) Clinic-specific scope, local evaluation, continuation gates and export review. Checked 2026-11-04.
- [KRH: forecasting and assignment process](https://kestrelridgehealth.com/how-it-works/) Workload forecasting is separate from constrained assignment and human approval. Checked 2026-11-04.
- [Hyndman and Athanasopoulos: evaluating point forecast accuracy](https://otexts.com/fpp3/accuracy.html) Testing on observations excluded from training and interpreting mean absolute error in the units measured. Checked 2026-11-04.
- [KRH: forecast comparisons and evidence limits](https://kestrelridgehealth.com/evidence/) The published synthetic evaluation includes a provider-average spreadsheet comparison. Checked 2026-11-04.

HELP US IMPROVE

## Was this article useful?

Your response helps us choose and improve future articles.

## Technician coverage risk check

Check your technician coverage risk in about 3 minutes. Answer a few questions about your own sessions and staffing, then decide whether a longer conversation is worth having.

[Start the risk check](https://kestrelridgehealth.com/technician-coverage-risk-check/)

## Does your session history support a useful test?

Start with a conversation about your sites, your current planning method and what you can measure.

[Discuss Phase Zero](https://kestrelridgehealth.com/contact/)
