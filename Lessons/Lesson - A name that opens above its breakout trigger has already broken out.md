---
type: lesson
date: 2026-10-06
tags: [lesson]
tickers: ["NVDA", "SPCX"]
rule_affected: "Entries: if a name opens above its breakout trigger, the breakout leg is void; o"
confidence: medium
samples: 1
---
# Lesson - A name that opens above its breakout trigger has already broken out

**Observation.** Day-2 tech breakouts that gapped through the trigger put in the day's high in the first hour and closed below the trigger; a 5-min close above the level after 09:45 was a hold, not a breakout.

**Evidence.** [[2026-10-06 Review]] — NVDA open 242.10 > trigger 240.60, high 243.37 (Invezz: 'as much as 1.9% in early trading'), close 239.24 < trigger. SPCX 175.62 at 09:44 > Mon high 172.47, high 176.42 by 10:42, close 171.98 < 172.47. Sources: stockanalysis NVDA/SPCX at close, monitor 09:44/10:42 snapshots.

**Rule implication.** Entries: if a name opens above its breakout trigger, the breakout leg is void; only a retest-and-hold of the level (within 0.1x ATR, 5-min close back above it after 09:45) is a valid entry. Applied as a tighten in v5 (sample 1 - to be re-tested on bars once Alpaca keys exist).

**Status.** applied in Rules v5
