---
type: lesson
date: 2026-10-07
tags: [lesson]
tickers: ["TEM"]
rule_affected: "Winners / stall (time-stop): no change this version \u2014 the one sample shows the escape clau"
confidence: low
samples: 1
---
# Lesson - A time-stop with an escape clause is a hold rule

**Observation.** The plan's 2-h time-stop required BOTH '+0.5R unmet' AND 'wrong side of entry'; at the check the trade was +0.002R so it was held, and the escape clause — not the thesis — decided the trade.

**Evidence.** TEM at the 14:41 tick: +0.5R (69.21) never printed, last 71.33 vs entry 71.34 -> HOLD; outcome +0.178R at the 15:40-tick flat vs +0.002R had the time-stop fired (replay_2026-10-07.py; journal 14:46 row; realtime_ticks 1440).

**Rule implication.** Winners / stall (time-stop): no change this version — the one sample shows the escape clause added +0.176R, so tightening to 'flat at 2 h unless >= +0.5R' would be against the evidence; log every time-stop check (reached +0.5R? side? outcome) and revisit at 10 samples.

**Status.** proposed
