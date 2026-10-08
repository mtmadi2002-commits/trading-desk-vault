---
type: lesson
date: 2026-10-08
status: applied in Rules v8
review: "[[2026-10-08 Review]]"
rules_version: 8
confidence: high
tickers: [TEM]
---
# A thesis is decided by the close, not by the 15:40 tick

> Filename note: the title carries a colon (`A thesis is decided by the close, not by the 15:40 tick`); an Artifact published path may not, so the file is hyphenated. The heading keeps the real title.

## Observation
A carried thesis whose margin to its level has decayed monotonically inside a frozen range on rising volume is being absorbed, and the 16:00 close - not the 15:40 tick print - is the number that settles it. The 15:40 clock that correctly scores a POSITION is the wrong clock for a THESIS, because the thesis is an input to tomorrow and the close is tomorrow's reference price.

## Evidence
TEM: last 68.49 at 15:41 ET, 0.17 BELOW the 68.66 thesis level, which the monitor recorded as 'intact, weakest form, conditional on the close'. Actual close 69.28 - 0.62 ABOVE the level, at 84.5% of the 66.71-69.75 day range from the low. The session had OPENED 68.86 and run 69.75, both above 68.66; the margin decayed 1.95 (10:46) to 1.02 (11:12) to 0.34 (15:12) to 0.17 (15:41) while the range stayed frozen for 4.5 hours and volume went 2.54M to 7.02M. One scrape (1 credit) flipped the verdict from carry to retired and kept TEM out of the evening plan.

## Rule implication
Multi-day thesis, daily position - thesis_intact. The 15:40 verdict becomes PROVISIONAL and names its test and level; the Coach's 16:00 close is FINAL and overrides it. Monotonic margin decay inside an unchanged range on rising volume is recorded NOT intact regardless of where the last tick sits. Applied as a tighten in v8.
