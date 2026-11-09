---
title: "Governance & Guardrails | Kestrel Ridge Health"
url: https://kestrelridgehealth.com/governance/
description: "Prohibited uses, the inputs kept out of the optimizer, the fairness report, and where human authority sits. The guardrails are the product, not add-ons."
---

Prohibited uses

## What the output may never be used for

Output from this system may not be used for any of the following. No per-technician score exists anywhere in it, and none may be derived from its output.

- Hiring.
- Firing.
- Promotion.
- Discipline.
- Compensation.
- Performance scoring of any kind.

Why this needs saying out loud

Forecast error, assigned minutes, workload balance and fairness slices are operational diagnostics. Differences between technicians reflect assignment history and the constraints of the day, not ability. A system that measures minutes will be asked at some point to rate people, and the answer has to already be written down. The system makes no autonomous clinical or employment decision and is never an institutional determination about a person.

Source  docs/governance.md section 5

Authority by design

## The model forecasts work.  
It never evaluates a person.

Healthcare workforce AI needs explicit limits on inputs, assignments and authority. These boundaries are visible in the product.

Forecast

### Workload, not worker scores

Session demand and uncertainty. No individual productivity rating.

Validate

### Rules before preferences

An independent validator checks all eight hard constraints on every changed plan.

Approve

### A named human decision

Separate approval by default. A solo-approval exception requires acknowledgment and a recorded reason.

Record

### A reconstructable history

Versioned plans and a hash-chained audit log make later changes detectable.

[See how these safeguards become pilot stopping rules →](https://kestrelridgehealth.com/pilot/)

Optimizer inputs

## What is kept out of the optimizer

Several things would improve a number on a slide and were kept out anyway. Each one was built, measured, and rejected for a stated reason.

**Realized no-shows and cancellations**

They are outcomes, not inputs. Nobody knows them when a forecast is made the day before, so using them would inflate every published figure and produce a model that cannot run in front of a scheduler.

**Historical no-show and cancellation rates**

The legitimate pre-session version was built and measured over seven seeds. It moved holdout error by 0.026 minutes against a 0.182 minute seed spread, which is noise, so it was reverted and is not in the shipped model.

**Technician assignments**

The forecast estimates the work a session generates, not the work a particular staffing level absorbed.

**Certification level as a ranking**

A review found the greedy fallback ordered candidates by certification level, placing trainees last. That was removed. Certification now enters the solver in exactly one place, the trainee supervision hard constraint.

**Any per-technician productivity score**

No such score exists anywhere in the system and none may be derived from its output. Two technicians who close the same capacity gap cost the model exactly the same.

Source  docs/model-card.md; docs/governance.md sections 5 and 9

Human authority

## Four acts, and a person in each one

A recommendation is a recommendation until a human moves it forward, and each move is a separate act with its own record.

1. 01 ### Draft Generating a plan staffs nothing. Each solver run is bracketed in the log by a start and a completion entry.
2. 02 ### Modify An override names a technician to add or remove plus a reason, and is re-validated against all eight hard constraints. On failure the failing checks come back and nothing is stored. On success a new version carries a parent, so the original survives.
3. 03 ### Accept or reject A decision writes the actor and a note, then the new status. Rejection is terminal: a rejected plan is kept for lineage, can never be approved, published, or overridden into a new draft, and is never the active plan for its date.
4. 04 ### Publish A separate act. Only a published plan is the plan of record. Replacing a plan that was in force produces a draft, so the date has no plan of record until a human approves and publishes the new version, and the system says so.

One person does not both build and approve

A plan may not be approved or published by the account that created it. A genuinely solo shift exists, so the same person may proceed by sending an explicit acknowledgment and a reason of at least a few words. That path is recorded as  `a self-approval`, naming the account, the plan and the reason given, so the exception is visible in the log rather than silent.

An edited audit entry is detectable

The audit log is append only, enforced by database triggers that abort any update or delete. Each entry carries a sequence number and a hash of its own contents chained to the hash before it, so an edited row, a deleted row and an inserted row all break the chain. A built-in verification check recomputes it and reports the first break by sequence number and entry.

Source  backend/app/auth/separation.py; backend/app/db.py; docs/governance.md section 3; docs/security-architecture.md section 6  
Verified  Append-only triggers and chain verification confirmed against the running database on 2026-09-07.

Bias review

## The fairness report, and what it detects

The report slices historical assignment patterns by group and reports, per group, the technician count, mean assigned minutes per shift, share of high-volume sessions, and travel share. The unit is always the group, never an individual. A flag prompts an investigation, never an automatic model change.

- Certification level
- Home site
- Tenure band
- Home site by tenure band
- Recorded throughput band

What the fairness report does not prove

Today the report detects a disparity the data generator planted for it to find. That shows the detector works on a case built for it. It says nothing about whether it would catch a real one, and nothing about any real technician or any real site.

It also describes what the historical fixed-ratio process did rather than what the model does. A gap by certification level in high-complexity sessions may be the competency rules working correctly. A gap by tenure or site without one is a finding.

Source  docs/governance.md section 7

Security

## The technical controls exist. The certification does not.

The system is not HIPAA compliant and not certified, and it holds no protected health information.

What Phase Zero ingests

Phase Zero ingests per-session counts: appointment counts by type, a complexity flag, the site, the provider, the half-day and realized technician minutes. Patient identifiers stay in your systems, and how the export is prepared, including whether it is protected health information in your hands, is agreed with your privacy office before anything moves. The contract carries no patient name, date of birth, diagnosis or note, because there is nowhere in the schema to put them. Production use with protected health information is a later step, under a business associate agreement and the security roadmap below.

### Implemented in the software

- Per-person accounts with Argon2id password hashing, no shared logins and no default credentials, with a forced initial password change.
- Server-side sessions with idle and absolute timeouts, and revocation of every session on a password change.
- Default-deny authorization over every route, so a path absent from the permission table is refused rather than allowed.
- Login lockout and per-identity rate limiting, with lockout counters that survive a restart.
- An append-only, hash-chained audit log with a built-in verification check, recording reads of a person’s record as well as writes.
- A data model that holds no patient identifier, name, date of birth, diagnosis, medication or note.

### Not done, and openly outstanding

- No certification or third-party audit of any kind has been carried out.
- No emergency access procedure exists. That is a procedure with named approvers before it is code.
- Application-level database encryption is designed but not in place, so disk encryption is the only control on a copied file.
- Whether appointment type plus time plus site is identifiable in combination at a low-volume clinic is unresolved and is a question for your privacy office.
- Availability edits and intraday events are not confined by site scope, so a scoped account can still act at another site.
- No drift monitoring and no recalibration schedule. A real deployment needs both.

Source  docs/security-architecture.md; docs/hipaa-control-mapping.md
