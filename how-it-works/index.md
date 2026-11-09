---
title: "How Technician Forecasting Works | Kestrel Ridge Health"
url: https://kestrelridgehealth.com/how-it-works/
description: "The ten layers from data intake through model validation, where machine learning stops, and where clinical rules take over. Ophthalmic staffing, explained."
---

The product in 60 seconds

## Forecast the work.  
Protect the rules. Keep the decision.

Ophthalmic technician staffing software turns the patient schedule into a workload forecast, then proposes a feasible staffing plan for human review.

1. 01 Operational inputs ### Read the session Appointment mix, testing demand and provider history describe the work.
2. 02 Machine learning ### Forecast the minutes A workload model estimates demand and shows uncertainty. It does not rank people.
3. 03 Constraint solver ### Check the roster A rule-based solver proposes assignments under eight hard constraints.
4. 04 Human authority ### Let a person decide Review, override with a reason, approve and publish. Each change leaves a record.

Current development stage: synthetic data only. A feasible plan is not a proven optimal plan.

The four stages

## Data in. Forecast. Validate. Publish.

Each stage hands off to the next. The forecast, the rule validator and the human reviewer are kept visually and functionally separate.

1

Data in

Sessions, roster, competencies

Appointment counts and complexity flags, plus the technician roster, availability, competencies and eligible sites. No chart, diagnosis or note.

2

Forecast

Predicted technician minutes

A learned model estimates workload per session with a range. It outputs a number, never an assignment.

3

Eight-rule validation

Solver assigns, validator re-checks

A constraint solver proposes assignments; every one is re-checked against the eight hard rules. Anything that fails is refused and named, not bent.

4

Human publish

A person approves before it is final

By default a second person approves and publishes. Until then, there is no plan of record.

## Where learning stops

The forecaster produces a workload estimate and nothing else: a number of technician minutes, a range, a recommended count, and a plain language breakdown of what drove the number. It emits no assignment. It scores, ranks and evaluates no person.

The solver consumes those forecasts alongside the roster, availability, competencies, eligible sites, travel times and hour limits. It holds no learned parameters. The consequence is the point: a model error can change a staffing quantity that a human reviews, and it cannot place an unqualified technician in a room.

What a wrong forecast can and cannot do

If the model is wrong by 40 minutes, a session may be recommended one technician light or heavy, and a scheduler sees the number, the range and the reasoning before anything is published. If the model were wrong by 400 minutes, the same is true. No forecast error can produce an assignment that violates competency, availability, site eligibility, double booking, travel, weekly hours, minimum staffing or trainee supervision, because the forecast is not consulted when those are checked.

Data through validation

The ten layers

## Data through validation

Each layer carries what it does, and the limit that goes with it.

1. 01 Data ### Data Sites, providers, technicians, availability, sessions, appointments and historical assignments in SQLite for local development, PostgreSQL in production. The contract carries no patient identifier, name, date of birth, diagnosis, medication or note. Demand is counts by appointment type plus complexity flags. The limit Today every row comes from the system's own generator. Phase Zero replaces it with your history.
2. 02 Learned ### Workload prediction A gradient boosted regressor predicts technician minutes for one provider half-day from the appointment mix, complexity, subspecialty, site, half-day and the provider's historical pace. The limit This is the only learned component that produces a number a human acts on. It never names a person.
3. 03 Learned ### Prediction uncertainty Separate quantile models at p10 and p90, widened by a split-conformal offset of 5.4 minutes each side calibrated on the last 45 days of the training window. The limit This is a prediction interval for one session, not a confidence interval, and not a guarantee. One session in five is expected to land outside its band.
4. 04 Rule ### Hard constraints Eight rules written as readable text and checked by the solver. This is where machine learning stops. The limit They are never relaxed to improve a score. A session that cannot be filled inside them is reported unfilled with a shortfall, rather than filled by bending a rule.
5. 05 Rule ### Staffing assignment A CP-SAT constraint solver assigns technicians to sessions under those eight rules, with soft objectives for travel, home site, continuity and workload balance. A greedy fallback obeys the same eight rules. The limit The solver holds no learned parameters. Within a five second limit it returns a feasible plan rather than a proven optimal one, so two runs can return different plans of equal cost.
6. 06 Record ### Explanation Per-session feature contributions for the forecast, and a plain language reason on every assignment. The limit The forecast contributions are a single-ordering attribution, not a Shapley value. The assignment reason is a post-hoc description of the chosen pair, not the solver's internal reasoning, and the product says so.
7. 07 Human ### Human review Every recommendation is overridable. An override names a technician and a reason, and is re-validated against all eight hard constraints before anything is stored. The limit An override that breaks a rule is refused with the failing checks named, and nothing is written. A reason records why a human changed a recommendation, never an assessment of a technician.
8. 08 Record ### Plan versioning Overrides, replans and new plans create new versions with a parent, and supersede what they replace. Nothing stored is rewritten. The limit Rejection is terminal. Replacing a plan that was in force leaves the date with no plan of record until a human approves and publishes the new one.
9. 09 Record ### Outcome and override feedback Intraday events, scenario state changes, replan differences, and plan-to-plan comparison against the fixed-ratio baseline. The limit The baseline comparison re-runs the forecaster over the validation history using the same assumptions that generated it. It is a simulation, not a measured outcome.
10. 10 Record ### Validation and governance Holdout evaluation against two baselines, a fairness report over historical assignments, a model card, and an append-only hash-chained audit log that survives restart. The limit The holdout comes from that same generated data. The fairness report describes what the historical fixed-ratio process did, and it detects a disparity the generator planted for it to find.

Source  README.md, The ten layers; docs/system-map.md

The solver

## Hard rules, then preferences

The eight hard rules are operations policy, checked in the solver and re-checked on every override. Everything below is a preference the solver trades off, and no preference can ever overcome a rule.

### Hard, never relaxed

#### Competency

Every required competency for the session is held by at least the minimum number of assigned technicians.

#### Availability

The technician has an available shift covering the session window on that date.

#### Site eligibility

The session site is in the technician's approved eligible sites.

#### No double booking

A technician is assigned to at most one session per half-day.

#### Travel feasible

If morning and afternoon sessions are at different sites, the travel time fits the gap and the technician is travel eligible.

#### Weekly hours

Assigned hours plus already-assigned hours in the week do not exceed the technician's weekly cap.

#### Minimum staffing

Every session has at least one technician.

#### Trainee supervision

A trainee is never the only technician in a session.

### Soft, traded off against each other

1. 01 Match assigned capacity to forecast demand, penalizing both under and over staffing.
2. 02 Balance total assigned minutes across technicians in the week.
3. 03 Minimize travel between sites.
4. 04 Prefer the technician's home site.
5. 05 Prefer provider continuity, where the technician has worked with this provider before.
6. 06 On replan, minimize changes from the published plan.

The plan is feasible, not proven optimal

The solver runs under a time limit. On a full clinic day it returns a feasible plan rather than a proven optimal one, and tie-breaking is whatever the solver reaches first, so two runs can return different plans of equal cost. The system does not claim an optimal plan, and the interface does not use the word.

Source  backend/app/schemas.py, SOFT_OBJECTIVES

In more detail

## The eight hard rules and the ten-layer model

Open any row for the full text. Nothing here is hidden from search or screen readers — these are standard HTML disclosure elements.

Eight hard rules, never relaxed

CompetencyHard rule

Every required competency for the session is held by at least the minimum number of assigned technicians.

AvailabilityHard rule

The technician has an available shift covering the session window on that date.

Site eligibilityHard rule

The session site is in the technician's approved eligible sites.

No double bookingHard rule

A technician is assigned to at most one session per half-day.

Travel feasibleHard rule

If morning and afternoon sessions are at different sites, the travel time fits the gap and the technician is travel eligible.

Weekly hoursHard rule

Assigned hours plus already-assigned hours in the week do not exceed the technician's weekly cap.

Minimum staffingHard rule

Every session has at least one technician.

Trainee supervisionHard rule

A trainee is never the only technician in a session.

Ten layers, data through validation

01 · DataLayer

Sites, providers, technicians, availability, sessions, appointments and historical assignments. No patient identifier, name, date of birth, diagnosis, medication or note. **The limit:** Today every row comes from the system's own generator. Phase Zero replaces it with your history.

02 · Workload predictionLayer

A gradient boosted regressor predicts technician minutes for one provider half-day from the appointment mix, complexity, subspecialty, site and half-day. **The limit:** The only learned component that produces a number a human acts on. It never names a person.

03 · Prediction uncertaintyLayer

Separate quantile models at p10 and p90, widened by a calibrated offset. **The limit:** A prediction interval for one session, not a confidence interval or a guarantee. One session in five is expected to land outside its band.

04 · Hard constraintsLayer

Eight rules written as readable text and checked by the solver. This is where machine learning stops. **The limit:** Never relaxed to improve a score. An unfillable session is reported with a shortfall, not filled by bending a rule.

05 · Staffing assignmentLayer

A constraint solver assigns technicians to sessions under the eight rules, with soft objectives for travel, home site, continuity and workload balance. **The limit:** Holds no learned parameters. Returns a feasible plan within a time limit, not a proven optimal one.

06 · ExplanationLayer

Per-session feature contributions for the forecast, and a plain-language reason on every assignment. **The limit:** A single-ordering attribution, not a Shapley value. The assignment rationale is post-hoc, not the solver's internal reasoning.

07 · Human reviewLayer

Every recommendation is overridable. An override names a technician and a reason, and is re-validated against all eight hard rules. **The limit:** An override that breaks a rule is refused with the failing checks named, and nothing is written.

08 · Plan versioningLayer

Overrides, replans and new plans create new versions with a parent. Nothing stored is rewritten. **The limit:** Rejection is terminal. A date has no plan of record until a human approves and publishes the new one.

09 · Outcome and override feedbackLayer

Intraday events, scenario state changes, replan differences, and plan-to-plan comparison against a fixed-ratio baseline. **The limit:** The baseline comparison is a simulation re-run over history, not a measured outcome.

10 · Validation and governanceLayer

Holdout evaluation against baselines, a fairness report, a model card, and an append-only hash-chained audit log. **The limit:** The holdout comes from the same generated data. The fairness report describes the historical process on synthetic data.

Verification

## A validator that does not trust the solver

After every solve, every override and every replan, an independent validator re-derives all eight hard constraints from the finished plan itself. It does not reuse the solver model, so the constraint report is an audit trail rather than a restatement of what the solver believed. A plan carrying a failed check is never stored and never returned: it is recorded as  `a rejected plan` and refused.

Source  backend/app/solver/validator.py; docs/governance.md section 3

Explanation

## Every assignment carries a reason

Every forecast shows its point estimate with the range, the feature contributions in plain language, what the fixed ratio would have said, and the required competencies with a reason for each. Every assignment shows what it covers, its rationale, any override fields, and whether it changed on replan. A missing field is treated as a defect, not a degraded mode.

What the explanation is not

The forecast contributions sum exactly to the prediction, because every step is a real model prediction rather than an approximation. But the split between features depends on the order they are walked in, so it is a single-ordering attribution and not a Shapley value. The assignment rationale is a post-hoc description of the pair that was chosen, not a transcript of the solver’s reasoning. The product states both of these things where a reader will meet them.

Source  docs/model-card.md, How the per-forecast explanation is computed

## What happens next

The governance page covers who may override, who may approve, and what the system refuses to be used for.

[Governance and guardrails](https://kestrelridgehealth.com/governance/)[What was measured, and on what data](https://kestrelridgehealth.com/evidence/)

Technician Coverage Risk Check

## Check your technician coverage risk in about two minutes

Nine questions about one typical session. You see a Low, Elevated or High band for six areas of technician coverage, the reason behind each, and steps you can take this week. Answers stay in your browser. No email needed.

[Start the Risk Check](https://kestrelridgehealth.com/technician-coverage-risk-check/)[Or use the blank worksheet](https://kestrelridgehealth.com/downloads/technician-coverage-risk-check-worksheet.html)
