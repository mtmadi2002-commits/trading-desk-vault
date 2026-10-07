---
type: lesson
date: 2026-10-07
tags: [lesson]
tickers: ["TEM"]
rule_affected: "Seat 7 usage / Data hygiene: tighten \u2014 price-bearing non-quote items (aggregator cards, so"
confidence: high
samples: 1
---
# Lesson - A third-party price card is not a print

**Observation.** A price-bearing item from a non-quote source was relayed as a critical alert on the open position while the desk's own real-time prints contradicted it; had the monitor acted, it would have scaled 1/3 at T1 on a price that never traded.

**Evidence.** 247wallst card 'TEM $64.17 -9.2% at 12:40' relayed by Seat 7 at 13:47 as critical; stockanalysis real-time prints 71.34 (12:40), 70.84 (13:11), 70.60 (13:40), 70.56 (13:43); day low 68.66 — 64.17 never printed. Same day Seat 7 itself flagged a fabricated Truth Social screenshot: 'only a post visible on the feed counts'.

**Rule implication.** Seat 7 usage / Data hygiene: tighten — price-bearing non-quote items (aggregator cards, social posts, screenshots) are information only and never trigger an entry, scale, exit or critical alert unless a desk quote source shows the same print; contradicted cards are logged as disproved. Applied in v6.

**Status.** applied in Rules v6
