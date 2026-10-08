---
type: lesson
date: 2026-10-08
status: applied in Rules v8
review: "[[2026-10-08 Review]]"
rules_version: 8
confidence: medium
tickers: [IREN, CTVA, NU]
---
# A retest band built from 0.1x ATR arithmetic is not a structure level

## Observation
When a name gaps THROUGH its level, the retest tolerance that matters scales with the gap, not with a fixed fraction of ATR. A fixed 0.1x ATR band is a number the market has no reason to respect, and three sessions running it has missed by pennies on names whose theses then paid.

## Evidence
IREN gapped to 37.82, 0.52 below the 38.34 level, voiding the breakdown leg. The surviving retest-and-fail leg needed a day high of at least 38.08 (= 38.34 - 0.1 x ATR 2.65). The day high was 38.06 - two cents short - and stayed pinned there for five consecutive ticks. Price then fell to 35.24, 2.82 points (1.06x ATR, +1.16R from a 38.06 fill) in the thesis's favour. Prior journaled near-misses of the same shape: CTVA's 13.84 band floor undercut by 0.09 (2026-10-07) and NU's 15.20 entry 0.13 under the day low (2026-10-06).

## Rule implication
Entries - gapped-through trigger. The proposed fix is tolerance = max(0.1x ATR, 25% of the gap through the level), which WIDENS a fill test and is therefore a LOOSEN. Not applied: the change policy requires >= 10 journaled samples and this is sample 3. Logged as sample 3 of 10 so the decision becomes measurable rather than repeated.
