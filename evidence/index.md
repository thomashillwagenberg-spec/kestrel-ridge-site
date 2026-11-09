---
title: "Staffing Forecast Accuracy | Kestrel Ridge Health"
url: https://kestrelridgehealth.com/evidence/
description: "Mean absolute error against the fixed technician-to-provider ratio and the historical mean, where the forecast is weakest, and the claims we will not make."
---

Research brief / synthetic data only

## A working pipeline.  
An open question.

The forecast has been tested on generated sessions. Whether it predicts your clinic is the next question to answer.

Read how it was measured →

*Forecast error on the synthetic holdoutMean absolute error · technician minutes · lower is better*

Status

## Validation status

Every figure on this page was measured on the system’s synthetic validation set, which the system generated for itself. The system has not been validated on data from a real clinic and it is not HIPAA certified. Phase Zero closes that gap: the model is retrained on your own history and scored against the ratio you use today, and the engagement stops if it does not win.

Accuracy

## Against the two baselines worth beating

Compare with the baselines: 23.76 vs 24.01 vs 33.42 minutes

Mean absolute error in technician minutes. Time-based split:   12,154  training rows, then   2,318  holdout rows covering   2026-06-10  to  2026-09-07 , all later in time than every training row. Model  v1-20261001-spline-ridge .

| Predictor | Error, minutes |
|---|---|
| This model | 23.76 |
| Linear regression with one coefficient per providerFitted on the same training rows and scored on the same holdout. A spreadsheet can fit it. On this synthetic data the model edges past it by about a quarter minute, a modest gap. | 24.01 |
| Spreadsheet: patients times that provider's average minutesThe rule an experienced lead technician already applies. | 33.42 |
| Historical mean by subspecialty | 63.12 |
| Fixed technician-to-provider ratio, naive baselineA headcount rule converted to minutes. Included as the floor, not as the comparison that matters. | 208.61 |

**Root mean squared error**

30.59  minAbove the mean error, which says the misses are uneven: most sessions are close and a few are much further off.

**Mean absolute percentage error**

8.99  percentOn the same holdout.

**Interval coverage**

78.43  percentAgainst a nominal  80  percent, so the range is slightly narrower than advertised. That gap is reported, not smoothed.

Source  docs/model-card.md, Evaluation; regression and spreadsheet rows from the 2026-09-14 holdout re-test

How far this result carries

The generator wrote the ground truth the model then learned, so a model fitted to it scores better than the same approach would on live scheduling data, where mix, staffing and behavior all shift. The generator also assumes that visit mix drives technician time, so beating a fixed ratio on this data is partly built in. It is evidence the pipeline works end to end. It says nothing about how predictable workload is in your clinic. Phase Zero answers that on your own history.

Why the two error measures are both here

The two failures are not symmetrical. A session over-forecast by 20 minutes wastes a fraction of a shift. A session under-forecast by 90 minutes runs short, and patients wait. Watching the squared measure alongside the average is how a recalibration would notice the tail growing while the average holds. Neither number is a service level guarantee, and the range is a prediction interval for one session rather than a confidence interval about an average.

Where it is weakest

## Error by subspecialty

Error for all six subspecialties, worst first

Published worst first, because the weakest group is the one a scheduler needs to know about. Group sizes differ, so a small group is a hint rather than a measurement.

| Subspecialty | Error, minutes | Sessions |
|---|---|---|
| Comprehensive | 26.9 | 495 |
| Retina | 26.0 | 570 |
| Glaucoma | 24.6 | 498 |
| Pediatrics | 23.4 | 175 |
| Neuro-ophthalmology | 22.6 | 167 |
| Oculoplastics | 22.5 | 175 |
| Cornea | 18.6 | 238 |

Source  docs/model-card.md, Known limitations

What drives the forecast

## Which inputs matter most

Ranking of the ten inputs the forecast uses

How much error the model gains when one input is shuffled. Read it as a ranking, not a measurement: correlated inputs share credit, so the appointment counts and the patient total dilute each other here.

1. Scheduled patients65.07
2. Provider history22.57
3. Provider pattern on visual field3.60
4. Imaging share of the mix3.47
5. Follow-up share of the mix2.70
6. Provider pattern on new patient2.11
7. Complex patients1.97
8. Subspecialty1.38
9. Half-day0.89
10. Site0.85

Source  docs/model-card.md, Which inputs matter most on the holdout

The refusals

## Claims this product will not make

This list is maintained alongside the product and updated when it changes.

Show the 8 claims we will not make

- That any accuracy, coverage or operational figure describes a real clinic. It describes a generated world.
- That a pilot has run, or that cycle time, idle time, overtime or delayed testing improved anywhere. No outcome has been observed.
- Any return on investment, payback or savings figure of our own. The economics calculator returns arithmetic on rates you supply, applied to a simulated improvement over the validation history. The output is your figure, not our claim.
- That the fairness report detects real bias. It detects a pattern the generator planted.
- That the weekly hours rule is proven under pressure. This data never stresses it, so it binds only in hand-built tests.
- That a plan is optimal. Within its time limit the solver returns a feasible plan, and two runs can differ.
- That the system is HIPAA compliant or production ready.
- That schedulers find the explanations usable. No human factors evidence exists.

Source  docs/paper-traceability.md, Claims the product must never make

Limits

## What has not been measured

The questions we have not answered yet

The system runs end to end. These are the questions it has not answered yet.

- No outcome has been observed. Cycle time, idle time, overtime and delayed testing all come from the generator, not from a clinic.
- The baseline comparison is a simulation that reuses the same hidden workload formula that generated the data. It is a check on internal consistency, not evidence of any real-world effect.
- The fairness report detects a pattern planted in the validation history so the report has something to find. It says nothing about any real technician or any real site.
- The weekly hours cap is never stressed by this data. Planning a full week leaves the busiest technician at about 20 hours against caps of 24 to 40, so that rule is exercised only in hand-built tests.
- No human factors evidence exists. Whether schedulers trust the recommendations, and whether the explanations are understandable at six in the morning before clinic, has not been tested.
- No cost figures. No claim about return on investment, payback or savings is supported by anything we have measured.

Source  docs/pilot-evaluation-design.md; docs/paper-traceability.md, Claims the product must never make

What is actually tested

Engineering

## What is actually tested

The automated test suite runs  512  passing tests with   2  skipped, covering the solver, the eight hard constraints, override validation, plan lineage, the audit chain and the API contract. This is evidence about the software.

**passing tests**

512

**skipped**

2

Source  backend/tests  
Verified  Measured 2026-09-07 by running the backend suite with a five second solver limit.

## The next step

The useful conversation is about what these figures become when they are recomputed on your own sessions.

[Ask about Phase Zero](https://kestrelridgehealth.com/contact/)[How the pilot is designed to stop](https://kestrelridgehealth.com/pilot/)

$

/$
