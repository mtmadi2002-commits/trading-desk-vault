---
type: lesson
date: 2026-10-07
tags: [lesson]
tickers: ["CTVA", "SPY"]
rule_affected: "Plan kill switches / correlation: no change (loosening needs >= 10 samples; today is sampl"
confidence: low
samples: 1
---
# Lesson - An index kill blocks the low-beta long that ignores the index

**Observation.** A plan-level index kill switch that was right about SPY blocked a standalone beta-0.58 name that closed near its high; the correlation assumption, not the level, was wrong — but the entry was uncatchable at the cadence anyway, so the kill cost nothing executable.

**Evidence.** INDEX 774.83 kill ruled tripped 10:44 (SPY prints 774.59/774.34, low 773.61, close 777.22 = -0.24%); CTVA (beta 0.58, stockanalysis) O 14.18 L 13.75 H 14.62 C 14.45 = +3.88%; tick prints 14.12/14.29/14.40 all above the 14.05 cap, so no tick fill existed regardless.

**Rule implication.** Plan kill switches / correlation: no change (loosening needs >= 10 samples; today is sample 1). Log every index-kill block with the blocked name's beta and its close vs trigger; if >= 10 samples show beta < 0.7 names closing in the planned direction >= 60% of the time, the Coach may scope index kills to beta >= 1 names.

**Status.** proposed
