---
type: lesson
date: 2026-10-06
tags: [lesson]
tickers: ["NVDA"]
rule_affected: "Entries: the fill cap limits slippage on the trigger bar only; a trigger observe"
confidence: medium
samples: 1
---
# Lesson - A trigger seen late is a chase, not a breakout

**Observation.** When the monitor first sees a trigger more than one bar after it printed, the slippage cap becomes the fill price and T1 collapses below 1R.

**Evidence.** [[2026-10-06 Review]] — NVDA trigger 240.60 printed on the 09:45 bar (open 242.10, morning low 240.76); monitor entered 10:46 at the 241.90 cap; T1 246.60 = 0.80R from the fill vs 1.30R planned; result -0.446R (ledger) vs -0.319R at a 240.76 fill. Sources: stockanalysis NVDA at close; journal rows 10:46/15:42.

**Rule implication.** Entries: the fill cap limits slippage on the trigger bar only; a trigger observed after its bar closed is valid only if the last price is within 0.1x ATR of the trigger AND T1 is >= 1.5R from the actual fill. Applied as a tighten in v5.

**Status.** applied in Rules v5
