---
title: "Ten Patients Is Not a Staffing Plan | Kestrel Ridge Health"
url: https://kestrelridgehealth.com/news/kestrel-ridge-health-phase-zero/
description: "Kestrel Ridge Health LLC announces Phase Zero, a diagnostic that tests a staffing forecast on a practice's own history."
---

CLEVELAND, Ohio, November 7, 2026 / Here is the problem. Eye practices have been short on ophthalmic technicians for years. And many still decide how many techs a clinic needs by counting patients.

A patient count doesn't tell you the work. A morning of post-op checks and a morning of new patients who need dilation and testing can have the same count and very different technician workloads. A 2015 survey of more than 6,000 technician workups, cited in Ophthalmology Management in 2024, found that a proficient technician ideally handles three to four patients an hour. That figure doesn't account for OCT or visual fields. Physicians have described the OCT as a common bottleneck in clinic flow.

Kestrel Ridge Health LLC, an Ohio company, is building software to staff by the work. It forecasts the technician minutes each half-day session will need, from its mix of appointment types and the provider's historical pace. Then it drafts a staffing plan from the practice's own roster: which technicians are trained for which tests, which offices each one covers, and weekly hours. Plans require human approval, by a second person by default.

Now the numbers, straight. The company has tested this only on synthetic sessions it generated itself, and that data was built on the assumption that appointment mix drives technician time. So the results are not evidence about any real clinic. On a synthetic test set of 2,318 sessions, the model's average error was 23.76 minutes per session. A simpler linear regression came close, at 24.01. A spreadsheet multiplying patients by each provider's average time came in at 33.42. A fixed staffing ratio came in at 208.61. The company's read: planning by the session matters more than the choice of algorithm, and only a practice's own history can show whether that holds.

That is why Phase Zero protects the downside first. A practice exports its own operational counts, including each session's appointment mix and realized technician minutes. Kestrel Ridge Health retrains the forecast on that history and compares it with the ratio the practice uses today and with a simple historical average. If the forecast doesn't beat both, the engagement stops. How the export is prepared, including whether it counts as protected health information, is agreed with the practice's privacy office before any data moves.

"Many practices staff techs by patient count. But a clinic doesn't run on patient count. It runs on workups, testing, and who can run the OCT," said Thomas Wagenberg, co-founder of Kestrel Ridge Health. "Ten post-op checks and ten new patients are both ten patients. They are not the same morning for your techs, and a patient-count ratio can't tell the difference. So we test it on the practice's own numbers first. If planning by the work doesn't beat what the practice does today, we stop, and the finding is theirs."

The plain facts: the software has not been validated on real clinic data, is not HIPAA certified, and is not connected to any EHR or scheduling system. The company has no customers yet.

## About Kestrel Ridge Health

Kestrel Ridge Health LLC is an Ohio limited liability company based in the Cleveland area. It is building technician staffing software for independent and multi-site ophthalmology practices, starting with Phase Zero, a diagnostic run on a practice's own history. The full test method and results are at [https://kestrelridgehealth.com/evidence/](https://kestrelridgehealth.com/evidence/).

Media contact: email_off[hello@kestrelridgehealth.com](mailto:hello@kestrelridgehealth.com)/email_off
