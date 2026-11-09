---
title: "Ophthalmic Staffing FAQ | Kestrel Ridge Health"
url: https://kestrelridgehealth.com/faq/
description: "What Kestrel Ridge Health does, how the forecast and the eight hard rules work, what Phase Zero costs and requires, the data posture, and current limitations."
---

$/$

Skip to content

## What Kestrel Ridge Health does

### What does Kestrel Ridge Health do?

Kestrel Ridge Health builds technician staffing software for ophthalmology clinics. It does two things. It forecasts how many technician minutes a given clinic session will require, and it generates a staffing plan that assigns technicians to those sessions subject to eight non-negotiable operational rules. A person reviews and approves every plan before it takes effect, and every change is written to an append-only audit trail.

### Who is it built for?

Practice administrators, chief operating officers, and clinic operations directors at independent multi-site ophthalmology groups. The multi-site element matters: the allocation problem the system is designed around, moving technician capacity toward the sessions that need it, has more room to work when there is more than one location.

### What problem does it solve?

Staffing a clinic session from a headcount ratio treats every session with the same patient count as the same job. It is not. A ten-patient postoperative session and a ten-patient new-glaucoma session with visual fields, OCT and extended counselling consume very different amounts of technician time. Staffing both from an average means being over on one and under on the other. The system forecasts each session from what is actually on it rather than from a fixed ratio.

## How the forecast works

### How does the forecasting work?

The system takes, per session, the appointment mix, the testing load, and complexity flags. It learns the relationship between those inputs and realized technician minutes from a clinic's own historical sessions, then applies that relationship to upcoming sessions.

1. ### To illustrate what this produces in practice, two ten-patient sessions in the system's validation data forecast at 354 (PRV027, 2 technicians) and 198 (PRV011, 1 technician) minutes respectively, dated 2026-09-08. That figure is measured on the system's synthetic validation set and has not been validated on real clinic data. It shows what a mix-aware forecast does with two sessions a ratio would treat identically; it is not evidence about any real clinic.

### How accurate is the forecast?

1. ### On the system's synthetic validation set, and not validated on real clinic data, the forecast has a mean absolute error of 23.76 minutes. On the same sessions a linear regression with one coefficient per provider scores 24.01 minutes and a spreadsheet rule of patients times that provider's average scores 33.42 minutes, so on synthetic data the model is about level with a plain regression and better than the spreadsheet rule. A fixed technician-to-provider ratio scores 208.61 minutes, which is the naive floor rather than the comparison that matters. Those comparisons are the honest way to read a forecasting number, because they measure the model against what a practice could do instead rather than against zero. They are also synthetic results. Synthetic validation establishes that the method runs and beats the baseline on data generated to resemble clinic operations. It does not establish that either figure will hold on a real schedule. Producing the same comparison on a clinic's own history is the purpose of Phase Zero.

## What Phase Zero costs and requires

### What is Phase Zero?

Phase Zero is the first engagement. The clinic exports its historical operational data, per-session appointment mix, complexity flags, and realized technician minutes. The system is retrained on that data, and the resulting forecast is scored against the clinic's current staffing ratio on the clinic's own sessions.

If the forecast does not beat the status quo, the engagement ends and the findings transfer to the clinic. The clinic keeps the analysis either way.

### How is Phase Zero priced?

A fixed fee, scoped to your clinic once we see your data. Ask us for a quote. It is a fixed fee rather than an hourly or per-seat arrangement because the deliverable is a single defined comparison with a defined end.

### What does a clinic need to provide?

Historical operational data, at session level: appointment mix by type, complexity flags, and realized technician minutes for each past session.

The realized-minutes field is the one that most often decides whether a clinic is ready. If the practice management system or EHR does not timestamp when a technician started and finished a workup, there is no dependent variable for the forecast to learn from. Establishing whether that data exists is worth doing before any commercial conversation, and a clinic can check it without talking to anyone.

## How the eight hard rules work

### Does this replace clinic managers or schedulers?

No. The system produces a proposed plan. A person reviews it and approves it, and no plan takes effect without that approval. Coverage decisions, fairness across a team, individual staff circumstances, and everything a manager knows about a given week that no system does remain human judgment. The product is an input to that judgment, not a substitute for the person exercising it.

### How are recommendations reviewed?

Every plan is presented for human approval before it takes effect. Every change is written to an append-only, hash-chained audit trail recording the actor and the rationale. The chain is tamper-evident: altering an existing entry causes the built-in verification check to report the break. The governance design is documented at [/governance/](https://kestrelridgehealth.com/governance/).

### How do the eight hard rules work?

The eight rules are hard constraints, not warnings. A plan that would violate one is not produced, rather than produced with a caution attached. They cover credentialing, site approvals, hour restrictions, and coverage when staff call out. Two are named on the site directly: site eligibility and competency.

The distinction between a constraint and a warning matters operationally. A system that flags a credentialing violation has moved the compliance burden onto whoever is reading the screen at the end of a long day. A system that cannot generate the violating plan has not. The full mechanism is described at [/how-it-works/](https://kestrelridgehealth.com/how-it-works/).

## The data posture

### What is the data posture? Does patient data leave the clinic?

Patient identifiers remain in the clinic's systems. Clients export operational counts, appointment types, test counts, complexity flags, and durations, and the system does not receive raw patient data. A forecast of technician minutes does not need a patient name, date of birth, or identified diagnosis to work.

Export preparation, including classification of what is and is not protected health information, is agreed with the client's privacy office before any data moves. Any later use of production PHI would be governed by a business associate agreement and a security review, and that has not occurred.

### Is the system HIPAA compliant or certified?

No. Kestrel Ridge Health is not HIPAA certified and does not claim to be. The data posture described above is designed to keep identifiers inside the clinic rather than to substitute for a compliance program. Any engagement that would involve production protected health information would require a business associate agreement and a security review first.

It is also worth noting that no vendor is "HIPAA certified" in any formal sense, because HIPAA has no certification body. Claims to the contrary from any vendor are worth questioning.

## Current limitations

### What are the system's current limitations?

Stated plainly, and these are the material ones:

- All validation figures published to date are derived from synthetic data, not real clinic operations.
- The system has not been validated on real clinic data.
- It is not HIPAA certified.
- No pilot has run. There are no customers and no case studies.
- The company is founder-operated from Cleveland, Ohio. Kestrel Ridge Health LLC is an Ohio limited liability company.

A forecast also cannot create staff. It reallocates existing capacity and sizes a real gap. If a clinic is short two technicians, a correct forecast tells you so and does not solve it.

### What happens after Phase Zero?

That depends on what Phase Zero finds. If the forecast does not beat the clinic's current staffing ratio, the engagement ends and the findings transfer to the clinic. If it does, the next step is a scoped discussion about running the system against live sessions, which would require the business associate agreement and security review described above before any production PHI is involved.

No further phase is defined publicly beyond that, because no engagement has run and defining one in advance of evidence would be guessing. [Contact](https://kestrelridgehealth.com/contact/) is the route for a specific conversation, and the [pilot page](https://kestrelridgehealth.com/pilot/) describes the Phase Zero scope in more detail.

### How should a practice evaluate this sceptically?

Three questions worth asking, of this company and of any other in the category:

1. ### Was the reported error measured on held-out sessions, or on the data the model was fit to? A model scored on its own training data will always look better than it is.
2. ### What is the error distribution, not just the mean? A mean absolute error made up of consistent small misses is a different operational reality from one made up of mostly perfect forecasts and occasional very large ones.
3. ### What is your own baseline? Compute what your current staffing rule would have predicted for the last twelve months of sessions and how far off it was. That number makes every vendor claim an arithmetic comparison rather than a story, and it costs nothing to produce.

[Ask about Phase Zero](https://kestrelridgehealth.com/contact/)

$

/$
