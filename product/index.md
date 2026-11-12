---
title: "Technician Staffing Software for Eye Clinics | Kestrel Ridge"
url: https://kestrelridgehealth.com/product/
description: "What a scheduler does with it: build a staffing plan, get refused an override that breaks a rule, stress-test a call-off, hand the lineage to an auditor."
---

Session-level planning

## See the work  
behind the headcount.

Know how many technician minutes each session will need, then get a proposed plan from your own roster that respects competency, availability and site rules.

[Follow the forecast through the system →](https://kestrelridgehealth.com/how-it-works/)

Illustrative view · synthetic validation data

### Same volume. Different workload.

**Neuro-ophthalmology (PRV027)**10 patients

**354**forecast minutes · 2 technicians

**Glaucoma (PRV011)**10 patients

**198**forecast minutes · 1 technician

The fixed ratio recommends two technicians for both synthetic sessions. These are prototype forecasts, not observed clinic results.

[Inspect the evidence →](https://kestrelridgehealth.com/evidence/)

Interactive illustration · synthetic roster

## A call-off does not  
cancel a constraint.

An OCT session needs coverage. Choose a fictional technician and see the reason an assignment would be refused.

This demonstration reproduces two rule checks. It is not connected to the solver and does not validate a staffing plan.

Choose a technician

The reason appears here. Every choice keeps a person responsible for the decision.

How it works, in three layers

## Forecast. Validate. Approve.

Every plan passes through three layers in order. None of them can skip ahead of the one before it.

Layer 1 · Forecast

Predicts workload, not people

A model estimates technician minutes per session, with a range. It emits a number, never an assignment, and never ranks a technician.

↓

Layer 2 · Rule validator

Checks every assignment against eight hard rules

Competency, availability, site eligibility and five more. A proposed change that breaks one is refused, logged and named by rule — nothing is saved.

↓

Layer 3 · Human approval

A person publishes the plan, not the system

By default a second person approves before anything becomes final. A solo approval needs an acknowledgment and a reason, and it is recorded.

The loop

## What a Tuesday actually looks like

Five steps, and a person in the ones that matter.

1. 01 ### Before clinic See each session's expected workload, and which ones need a second look. More detail The day board shows every session with its forecast minutes, the range around it, the recommended technician count and what the fixed ratio would have said. Sessions the forecast is least sure about are flagged so they get a second look.
2. 02 ### Build Get a draft plan in one step. It never bends a rule to fill a gap. More detail One action produces a draft plan under the eight hard rules. Generating it staffs nobody. Sessions that cannot be filled inside the rules are listed with the shortfall and the solver's own suggestion, rather than filled by bending something.
3. 03 ### Argue with it Ask why for any session or assignment, and override it with a reason. More detail Open any session to see why the forecast landed where it did, which competencies the session needs and why, and the reason each assigned technician was chosen. Override anything, with a reason.
4. 04 ### Approve, separately By default a second person approves before the plan becomes final. A solo approval is allowed only with an acknowledgment and a reason, and it is recorded. More detail A second person accepts and publishes. Until they do, there is no plan of record. The creator cannot normally approve it. A solo-approval exception requires explicit acknowledgment and a recorded reason.
5. 05 ### When the day changes Record a call-off and replan with as few changes as possible to the published plan. More detail Record a call-off or an add-on and replan. The solver is told to minimize churn against what was already published, so a small change to the facts is designed not to reshuffle the whole day.

The moments worth seeing

## Seven things it does that a schedule cannot

Each of these is built and covered by automated tests.

1. 01Session Detail ### The system refuses an override and names the rule you broke Pick a technician the picker has marked blocked, give a reason, and submit. More detail The override is refused, nothing is stored, and the failing hard constraints come back by name, with the detail for each. Try a technician who is not blocked and the override is accepted, creating a new plan version whose parent is the one it replaced. An automated test confirms the refusal names the site eligibility rule.
2. 02Session Detail ### Every assignment can be second-guessed Open the counterfactual for any assigned technician and the system names the next feasible alternative, then re-validates the swapped plan and reports the simulated metric differences on synthetic data rather than estimating them. More detail Runs on the same plan comparison and counterfactual checks.
3. 03Scenario Lab ### Stress the roster before the day does Thirteen scenarios, two of them infeasible by design, applied as real state changes through the same machinery a live event uses. More detail Apply a technician call-off and read which checks on the current plan now fail, before deciding whether to reoptimize. Reset returns the date to its snapshot, and the reset is itself in the audit log. Thirteen scenarios verified in the scenario catalog.
4. 04Optimization ### See which rule the solver ran out of room on Pass, warning or fail for each of the eight hard constraints, with a plain-language explanation and the sessions each one affects, plus the solver's own account of where it stopped and the diagnostics for every session left unresolved. More detail One check per rule, re-derived by the independent validator.
5. 05Plan History ### Nothing is overwritten, and any two versions can be compared A version timeline built from plan lineage, with status, override reasons and what changed. More detail Compare any two versions, or compare a version against the fixed-ratio baseline staffed under the same eight rules and scored with the same metrics. Every override and replan keeps a link to the plan it replaced.
6. 06Local validation ### Score the model on your own data, with nothing stored There is a documented export format and a scoring service for rows a clinic exports. More detail The rows are read in memory, scored, and discarded: nothing is stored and nothing is written. A file with fewer than twenty usable rows is refused rather than scored. Validation cannot write to the database.
7. 07Economics ### An economics calculator that will not guess It computes cost, payback and a break-even threshold from rates you supply. More detail There is no default rate, no benchmark and no industry figure anywhere in it. An input you do not supply comes back marked for you to confirm, and every figure that needed it returns as not computed rather than as a filled-in guess. Each line is computed only when every rate it needs has been supplied.

Source  README.md, The eleven screens and Three-minute demo; backend/app/{scenarios,validation,economics}/; backend/tests/test_solver.py  
Verified  Scenario count and the override-refusal test were checked against the code on 2026-09-07.

The one to watch

## The refusal is the feature

Any staffing tool can produce a schedule. The question a practice administrator should ask is what happens when someone overrules it, because that is what will happen at six in the morning when a technician calls off.

A schedule without enforced constraints

If a schedule accepts changes without rechecking competencies and site eligibility, the updated plan can conflict with the clinic’s rules. An editable schedule alone does not establish that every assignment remains feasible.

What this does

Re-check all eight hard rules against the proposed change. If it breaks one, refuse it, save no change to the plan, log the refusal, and return the rules it broke by name. If it breaks none, accept it, record who made the change and why, and keep the version it replaced. An automated test confirms the refusal names the specific rule.

Source  backend/app/solver/validator.py; backend/tests/test_solver.py, test_override_breaking_site_eligibility_is_rejected

See the refusal happen

## Try an assignment that breaks a rule

Illustrative synthetic example — not a live solver. No real clinic, session or technician data is used.

Assign Dana R. to the 7:30 AM Westside session

**Session:**

Westside Clinic · 7:30 AM · Dr. Alvarez half-day

**Proposed technician:**

Dana R.

**Reason given:**

"covering a call-off"

✖ Refused

**Site eligibility.** Dana R. is not on the approved eligible-sites list for Westside Clinic. The hard rule is checked before any change is saved.

Nothing is written. The plan is unchanged, and the refusal with the rule it broke is logged for audit.

Source: backend/app/solver/validator.py · same check as the live override path.

Where the record goes

## An auditor can reconstruct the day without asking anyone

- Every plan, override, decision, scenario and export is logged with who, when and why.
- The log is append-only and hash chained, so an edited or deleted entry is detectable.
- A built-in check reports the first break by sequence number.

A plan leaving the system as a file is itself recorded, because a plan leaving the system is a disclosure.

Source  backend/app/db.py; docs/governance.md section 3; docs/security-architecture.md section 6

Boundaries

## What this is not

Four things it is routinely mistaken for, and what it does instead.

- Not an EHR It holds no chart, no diagnosis and no note. It reads counts about a clinic session and forecasts the technician minutes that session will consume.
- Not appointment scheduling It does not book, move or cancel a patient. It takes the schedule you already built as given and staffs the technician side of it.
- Not a staffing agency It supplies nobody and hires nobody. It assigns the technicians already on your roster, under your own rules, for a person to approve.
- Not credentialing software It does not verify, issue or track a credential. It reads the competencies and site approvals you maintain elsewhere and refuses any assignment that would violate them.

## Try it against your own numbers

There is a documented export format and a scoring service that tests the model on sessions you export. Rows are parsed in memory and dropped. Nothing is written, and nothing is kept. For a multi-site practice, that test is what Phase Zero is: a scoped comparison on your own history with a stop rule agreed in advance.

[Start a Phase Zero fit conversation](https://kestrelridgehealth.com/contact/)[What happens in Phase Zero](https://kestrelridgehealth.com/pilot/)[What the forecast was measured against](https://kestrelridgehealth.com/evidence/)

Technician Coverage Risk Check

## Check your technician coverage risk in about two minutes

Nine questions about one typical session. You see a Low, Elevated or High band for six areas of technician coverage, the reason behind each, and steps you can take this week. Answers stay in your browser. No email needed.

[Start the Risk Check](https://kestrelridgehealth.com/technician-coverage-risk-check/)[Or use the blank worksheet](https://kestrelridgehealth.com/downloads/technician-coverage-risk-check-worksheet.html)
