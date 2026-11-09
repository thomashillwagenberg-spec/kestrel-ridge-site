---
title: "Pilot Design & Stopping Rules | Kestrel Ridge Health"
url: https://kestrelridgehealth.com/pilot/
description: "Phase Zero runs on an operational export with a pre-registered measure, six stopping rules, and an expansion decision agreed upfront. Scoped to your clinic."
---

The path to a decision

## Earn the next phase.

Agree on the gates before collecting results. Stop when the evidence says to stop.

1. 00Readiness ### Phase Zero Fixed fee, scoped per clinic Retrain on an approved operational export. Compare error with both baselines. Decision gate Continue only if local validation supports it.
2. 01Observe ### Shadow mode 4 weeks Show recommendations while the existing staffing process stays in force. Decision gate Review prospective accuracy and scheduler trust.
3. 02Compare ### Controlled pilot 8–12 weeks, planning estimate Use paired sites and human-reviewed staffing. Measure a preselected primary outcome. Decision gate Expand only if the agreed criteria hold.

Proposed evaluation design. No clinic pilot or real-world outcome is claimed.

Step 1

#### Privacy-scoped data handoff

You export an approved slice of your own historical session data — no PHI, no new software, agreed with your privacy office before anything moves.

Step 2

#### Forecast vs. baseline comparison

We train a model on that export and score its error against the staffing rule you already use — on your own data, not a demo dataset.

Step 3

#### Stop-or-continue decision

If the model doesn’t clear the agreed threshold, the engagement ends — that finding is yours either way. If it does, we scope a fixed fee for what’s next.

Phases

## Three phases, each with an exit gate

Nothing about your staffing changes until Phase Two, and Phase Two only happens if Phase Zero and Phase One pass.

1. 00 ### Phase Zero, readiness Before anything runs. Fixed fee, scoped per clinic. Retrain and validate on your own history. A model trained on generated data says nothing about your clinic until it has been retrained on your data. It runs on operational counts you export: per-session appointment mix, complexity flags and realized technician minutes. Patient identifiers stay in your systems. How the export is prepared, including whether it is protected health information in your hands, is agreed with your privacy office before anything moves. Exit gate The model must beat both the fixed-ratio rule and the historical mean on error, with interval coverage near 80 percent. If it does not, the pilot stops. That the fixed ratio is adequate for you is a legitimate finding.
2. 01 ### Phase One, shadow mode 4 weeks Schedulers see forecasts and recommended plans. The fixed-ratio process stays the plan of record, so behavior does not change and no patient is exposed. Exit gate Forecast accuracy measured prospectively, and scheduler trust. Not outcomes, because nothing has changed yet.
3. 02 ### Phase Two, site-paired comparison 8 to 12 weeks Pair sites on volume, subspecialty mix and staffing profile. One site in each pair staffs from the forecast with scheduler override, the other keeps the fixed ratio. Exit gate Pairing is at site level because technicians are shared within a site-day, so finer randomization contaminates the control.

Source  docs/pilot-evaluation-design.md, Design

The gate that most vendors do not offer

Phase Zero can end the engagement. If a model retrained on your own history does not beat both your fixed ratio and a simple historical mean, there is no case for continuing, and finding that out costs you a few weeks rather than a year. Your fixed ratio being adequate is a real possible outcome. The finding is yours to keep either way.

Phase Zero

## What Phase Zero costs and what it touches

Priced and scoped before anything is signed.

A fixed fee, scoped per clinic

Phase Zero is a fixed fee,  scoped to your clinic . We size it to how many sites and how much history you bring. If the forecast does not beat the ratio you use today, the engagement stops there and the finding is yours to keep.

Operational counts only

Phase Zero runs on operational counts you export: per-session appointment mix, complexity flags and realized technician minutes. Patient identifiers stay in your systems. How the export is prepared, including whether it is protected health information in your hands, is agreed with your privacy office before anything moves. Production use with protected health information is a later step, under a business associate agreement and a security review.

Measures

## Defined before they are collected

Each measure needs an operational definition and a data source, or the comparison is unfalsifiable. One measure is designated primary before the pilot starts, and the pilot is not powered on the others.

| Measure | Operational definition | Direction |
|---|---|---|
| Provider idle time | Provider minutes in session with no patient ready. | Lower |
| Patient cycle time | Mean arrival-to-departure minutes per session. | Lower |
| Overtime hours | Paid technician minutes beyond scheduled shift end. | Lower |
| Technician workload balance | Standard deviation of assigned minutes across technicians per week. | Lower |
| Reassignment frequency | Technician moves after publication on the service day. | Lower |
| Delayed testing | Ordered tests not completed because no qualified technician was free. | Lower |
| Throughput | Patients completed per session and site-day. | Higher |
| Competency rule compliance | Share of assignments covering every required competency. | Floor of 100 percent, not an improvement measure |

Source  docs/pilot-evaluation-design.md, Success measures

The recommended primary measure

Provider idle time per session: minutes in session with no patient ready. It is the measure most directly caused by staffing alignment, it is cheaper to capture than cycle time, and it is less confounded by front-desk variation. You designate it, or another, before anything is collected.

Two measures that will be under-powered

Delayed testing and reassignment frequency are low-count events. They are reported descriptively with intervals rather than significance tested, because a test on a handful of events invites a conclusion the data cannot carry. Patient and staff satisfaction need an instrument you already own, and the cadence is yours to set.

Stopping rules

## Any one of these stops the pilot and reverts to the fixed ratio

These are one-directional. There is no early stop for success, because staffing effects are seasonal and a short-window win is not durable evidence.

1. 01 Any competency, availability, site eligibility, weekly hours or supervision violation reaching the floor.
2. 02 Overtime at an intervention site materially above its paired control for two consecutive weeks.
3. 03 A patient safety or care-delay concern raised by clinical staff and attributed to staffing, acted on before any statistical confirmation.
4. 04 Forecast error exceeding the fixed-ratio baseline over a rolling two-week window.
5. 05 A fairness flag confirmed on investigation as a real disparity not explained by the competency rules.
6. 06 A scheduler override rate so high that the recommendation is not in use, against a threshold you set before starting.

Source  docs/pilot-evaluation-design.md, Stopping rules

**The stop rule is the risk reversal.** We agree the pass/fail threshold before we see your data. If Phase Zero doesn’t clear it, the engagement stops there — you keep the finding, we don’t ask you to continue funding a model that isn’t working.

### Know where you’ll be short — before it’s a crisis

✓

**The outcome:** a clear read on technician coverage gaps weeks out, scored against your own history, not a sales pitch.

✓

**Why you can trust the read:** the scoring method is written down and public — see the methodology link — and this is explicitly synthetic-stage, no real-clinic validation claimed yet.

✓

**How fast the first step is:** one scoped data export, no platform-wide commitment, no calendar to clear.

✓

**What it costs you to find out:** approved historical data you already have, no PHI, nothing new to learn — yet.

[Ask about Phase Zero](https://kestrelridgehealth.com/contact/)[Read the methodology](https://kestrelridgehealth.com/methodology/)

Agreed before the pilot begins, not argued afterwards

Expansion

## Agreed before the pilot begins, not argued afterwards

Expand only if all six hold at the end of phase two.

1. 01 Zero hard-constraint violations across the pilot.
2. 02 The primary measure improved against paired controls by at least the minimum effect set beforehand.
3. 03 No secondary measure moved materially the wrong way. A cycle-time gain bought with overtime or worse workload balance is not success.
4. 04 Staff satisfaction did not decline, and schedulers would keep using it.
5. 05 The fairness report shows no confirmed disparity introduced or worsened.
6. 06 Ongoing cost, priced from pilot experience rather than forecast, is justified by the improvement.

What happens when the result is mixed

If the first rule fails, the pilot stops permanently and the constraint layer is fixed before anything else is discussed.

If the primary measure fails while the rest hold, your fixed ratio is close enough at those sites, and the sensible move is higher variance sites rather than expansion.

If the primary measure holds but a secondary one, staff satisfaction, or fairness fails, the improvement cost more than the pilot was built to accept.

Where results are positive but inside the noise, the answer is a time-boxed continuation at the same sites, not a decision.

Source  docs/pilot-evaluation-design.md, Decision rule for expansion

A planning estimate, not a calculation

Sizing

## A planning estimate, not a calculation

A site-day is the unit of analysis. A pilot site running roughly ten provider sessions a day across four paired sites gives on the order of 400 site-days over ten weeks, which is enough for a moderate effect on a continuous session-level measure and not enough for rare events.

The required duration is computed in Phase Zero from the variance actually observed in your data. Until then, eight to twelve weeks is a planning estimate and is labelled as one. The minimum meaningful effect is set by your leadership beforehand, not read off the results: a smaller reduction in idle time is not a success even if it is statistically significant.

Source  docs/pilot-evaluation-design.md, Sample size reasoning

## Start with Phase Zero

The first conversation is about what history you can export and who owns the decision to stop.

[Ask about Phase Zero](https://kestrelridgehealth.com/contact/)
