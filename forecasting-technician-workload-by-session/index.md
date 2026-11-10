---
title: "Forecasting Technician Workload by Session | Kestrel Ridge"
url: https://kestrelridgehealth.com/forecasting-technician-workload-by-session/
description: "How session-level workload forecasting differs from ratio staffing, what data it needs, what the ophthalmology literature supports, and where it still fails."
---

## The unit of analysis is the whole argument

Ratio staffing asks: how many technicians should this practice employ?

Workload forecasting asks: how many technician minutes will this session consume?

These are not competing answers to one question. They are answers to two different questions, and a practice needs both. The budget question is annual and financial. The staffing question is daily and operational. Using the annual answer to settle the daily question is where the error comes from.

Consider the concrete case. Two sessions, ten patients each, same provider, same room count. Session A is postoperative cataract follow-up: short histories, refractions, pressures, brief exams. Session B is new and complex glaucoma: full histories, visual fields, OCT, pachymetry, gonioscopy prep, longer dilations, more counselling. A ratio sees two identical ten-patient sessions and staffs them identically. Anyone who has run a clinic knows they are not identical.

1. ### 354 and 198 technician minutes Kestrel Ridge Health’s own model, measured on the system’s synthetic validation set and not validated on real clinic data, produces exactly this kind of split: two ten-patient sessions forecast at 354 and 198 technician minutes respectively. That figure is an illustration of what a forecast does with mix, not evidence about any real clinic.

## What the ophthalmology literature actually establishes

The strongest published evidence on this general approach is Hribar et al.,  [“Data Driven Scheduling for Improving Patient Efficiency in Ophthalmology Clinics,” Ophthalmology 2019;126(3):347-354](https://pmc.ncbi.nlm.nih.gov/articles/PMC6391189/).

The team built a discrete event simulation from electronic health record timestamp data, validated the simulation against 120 directly observed appointments, and used it to design a scheduling template that sorted patients into short, medium, and long slots based on diagnosis and provider notes. Their validation results are worth reading carefully:

- EHR-derived physician exam time was 13.8 plus or minus 8.2 minutes against directly observed 13.3 plus or minus 7.3 minutes, p = 0.7.
- Simulated wait time was 31.2 plus or minus 10.9 minutes against observed 32.6 plus or minus 25.3 minutes, p = 0.9.
- After implementation across five providers, all five showed statistically significant volume increases of 1 to 3 patients per session, and four of five achieved 3 to 4 minute average wait time reductions.

### What this paper does prove

That routinely captured EHR timestamp data is an accurate enough record of clinic durations to model against, and that a duration-aware template outperforms a uniform one. That is the load-bearing premise underneath any workload forecast: the durations are predictable from data you already have.

### What this paper does not prove

Hribar’s team predicted physician exam time and patient wait time. They did not forecast technician minutes, and they did not build a staffing assignment model. Their unit of change was the scheduling template, not the technician roster. Anyone who tells you this paper validates technician-workload forecasting is overreading it. It validates the premise. The application to technician staffing is an extension that has not, as far as public literature shows, been demonstrated at scale.

The methodological case for volume-driven rather than ratio-driven staffing in ophthalmology specifically was made by Maureen Waddle in  [Ophthalmology Management, April 2011](https://ophthalmologymanagement.com/issues/2011/april/do-i-have-the-right-number-of-staff/), which proposes modelling staff need from three work units, office visits, diagnostic tests, and surgeries, rather than from provider headcount. That is a forecast in everything but name, built from a time-flow study rather than from machine learning. The idea is not new. What has changed is that the data needed to fit it is now sitting in every practice management system.

## What a session-level forecast needs as input

A workload forecast is only as good as the operational record behind it. In practice the minimum is:

### Per-session appointment mix

Counts by appointment type for each historical session. Not just a patient count. New patient, established follow-up, postoperative day one, postoperative week one, injection visit, and so on, as your own schedule types are actually coded.

### Diagnostic testing load

Which tests were performed, per session. Visual fields, OCT, fundus photography, topography, biometry, pachymetry. This is where a large share of technician minutes goes, and it is the variable that most sharply separates two same-count sessions.

### Complexity flags

Whatever your practice already records that predicts a longer workup. Dilation requirements, interpreter need, mobility assistance, first-visit paperwork burden, subspecialty designation. These do not need to be new fields. Most practices already capture proxies.

### Realized technician minutes

The dependent variable. This is the input most practices are missing, and it is the honest gate on this entire approach. If your system does not record when a technician started and finished with a patient, a forecast has nothing to learn from. Some practice management and EHR systems timestamp workup start and end; some do not. Establishing whether yours does is the first practical question, ahead of any vendor conversation.

### What it does not need

It does not need patient identifiers. Appointment type counts, test counts, complexity flags, and durations are operational data. A forecast of technician minutes has no use for a name, a date of birth, or a diagnosis code attached to a person. Any vendor telling you they need identified patient records to forecast staffing minutes should be asked to justify it specifically.

## How forecast quality is measured, and how to read a vendor's number

The standard measure is mean absolute error: on average, how many minutes was the forecast off by, in either direction. It is the right metric here because it is in the units you actually manage, minutes, rather than a unitless score.

The comparison that matters is not forecast error against zero.

It is forecast error against what you do today. If your current practice is to staff every session from a fixed ratio, then the fixed ratio’s error on the same sessions is the number to beat, and a vendor who will not show you that comparison is showing you half a result.

What a synthetic result can and cannot support

For illustration of what such a comparison looks like: Kestrel Ridge Health reports a mean absolute error of 23.76 minutes, against 24.01 for a linear regression with one coefficient per provider and 33.42 for a spreadsheet rule of patients times that provider’s average, all measured on the system’s synthetic validation set and none validated on real clinic data. A fixed technician-to-provider ratio scores 208.61 on the same sessions, a naive floor rather than the comparison that matters. Synthetic validation shows that the method runs and that the model is about level with a plain regression on data generated to resemble clinic operations. It does not show that either number will hold on a real schedule, and it should not be read as if it does. The same comparison run against a clinic’s own history is a different and much stronger claim, and it is the claim any practice should require before spending money.

Two further questions to ask of any forecast number:

1. **Was it validated out of sample?**  A model scored on the data it was fit to will look better than it is. Ask whether the reported error is on held-out sessions.
2. **What is the error distribution, not just the mean?**  A mean absolute error of 25 minutes made up of consistent small misses is a different operational reality from one made up of mostly perfect forecasts and occasional 3-hour misses. Ask for the tail.

## Where forecasting fails

Being clear about failure modes is more useful than the sales case.

Thin or dirty history.

A forecast learns from the past. A practice with six months of inconsistently coded appointment types has little to learn from. This is the most common real-world blocker.

Regime change.

A new subspecialty service line, a new imaging device, a new EHR, or a departing high-volume provider all break the relationship the model learned. A forecast is a statement about a stable operation.

Rare events.

Forecasts are poor at the sessions that hurt most, the unusual ones. They are best at the ordinary majority.

No slack to allocate.

A forecast that correctly tells you Tuesday needs two more technicians is useless if you do not have two more technicians. Forecasting reallocates existing capacity and sizes a real gap. It does not create staff. In a market where [O*NET reports](https://www.onetonline.org/link/summary/29-2057.00) 78,800 ophthalmic medical technicians employed as of 2024 against roughly 12,500 projected openings over the 2024 to 2034 decade, the hiring constraint is real and forecasting does not relieve it.

A forecast is not a decision.

A number is an input. Coverage, credentialing, fairness, and staff preference are judgment. The forecast should inform the person who makes the roster, not replace them.

## Forecasting and assignment are separate problems

One further distinction that is easy to collapse. Forecasting tells you how many technician minutes a session needs. Assignment tells you which technicians can supply them.

The second problem is bounded by constraints the first knows nothing about: site privileges, credential scope as defined by the  [IJCAHPO](https://www.jcahpo.org/certification/) COA, COT, and COMT credentials and their specialty certifications, device competency sign-offs, hour caps, and callout coverage.

Those constraints are hard rules, not preferences, and any system operating on them should treat them as such: a plan that violates a credentialing rule should not be produced at all, rather than produced with a warning. Kestrel Ridge Health enforces eight such rules and requires a human to approve every plan before it takes effect; the mechanism is documented on  [how it works](https://kestrelridgehealth.com/how-it-works/), and the current validation status, including that the system runs on synthetic data and is not HIPAA certified, is stated on  [evidence](https://kestrelridgehealth.com/evidence/).

## The realistic first step

You do not need to buy anything to find out whether this applies to your practice. Three questions, answerable from your own systems:

1. ### Does your system timestamp technician workup start and end? If no, that is the project, and it comes before any forecasting.
2. ### Pull twelve months of sessions and plot realized technician hours against patient count. If the relationship is tight, a ratio is serving you fine. If the scatter is wide, the width is the size of the problem, in hours, on your own operation.
3. ### Compute what a fixed ratio would have predicted for each of those sessions and how far off it was. That is your baseline. Every future claim gets measured against it.

A practice that has done those three things is in a position to evaluate any vendor sceptically, including this one. Kestrel Ridge Health’s  [Phase Zero](https://kestrelridgehealth.com/pilot/)  engagement is structured around exactly that comparison, run on the clinic’s own historical data rather than on synthetic data, and ends with findings transferring to the clinic if the forecast does not beat both the clinic’s current staffing method and a historical average.

## Sources

1. Hribar MR, Huang AE, Goldstein IH, et al.  [“Data Driven Scheduling for Improving Patient Efficiency in Ophthalmology Clinics.”](https://pmc.ncbi.nlm.nih.gov/articles/PMC6391189/)  Ophthalmology. 2019;126(3):347-354. doi:10.1016/j.ophtha.2018.10.009
2. Ophthalmology Management, Maureen Waddle,  [“Do I Have the Right Number of Staff?”](https://ophthalmologymanagement.com/issues/2011/april/do-i-have-the-right-number-of-staff/), 1 April 2011.
3. CRSToday,  [“What Is the Right Ratio?”](https://crstoday.com/articles/2016-oct/what-is-the-right-ratio), October 2016.
4. O*NET OnLine,  [29-2057.00 Ophthalmic Medical Technicians](https://www.onetonline.org/link/summary/29-2057.00).
5. IJCAHPO, [Certification](https://www.jcahpo.org/certification/).

## Related

- [How the forecast and the eight hard rules work](https://kestrelridgehealth.com/how-it-works/) The forecasting method, the assignment step, and the constraints the solver will not relax.
- [Forecast accuracy against the fixed ratio](https://kestrelridgehealth.com/evidence/) The full synthetic validation result, where the forecast is weakest, and the claims not made.
- [What Phase Zero measures on your own data](https://kestrelridgehealth.com/pilot/) The scope and the condition under which the engagement stops.

Technician Coverage Risk Check

## Check your technician coverage risk in about two minutes

Nine questions about one typical session. You see a Low, Elevated or High band for six areas of technician coverage, the reason behind each, and steps you can take this week. Answers stay in your browser. No email needed.

[Start the Risk Check](https://kestrelridgehealth.com/technician-coverage-risk-check/)[Or use the blank worksheet](https://kestrelridgehealth.com/downloads/technician-coverage-risk-check-worksheet.html)
