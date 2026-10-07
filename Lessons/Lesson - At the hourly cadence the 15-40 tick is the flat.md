---
type: lesson
date: 2026-10-07
tags: [lesson]
tickers: ["TEM", "NVDA"]
rule_affected: "Winners (flat rule) + Coach replay convention: clarify \u2014 the 15:40 tick applies the ladder"
confidence: high
samples: 1
---
# Lesson - At the hourly cadence the 15-40 tick is the flat

**Observation.** The desk has no run between 15:40 and 16:00, so the 15:55 flat and the 15:25 close-lock are both executed at the 15:40 tick's print; a replay scored on the 16:00 close overstates what the desk can book.

**Evidence.** TEM: close-lock stop 70.674 (90% of the 0.78 peak) set at 15:42 and never printed (15:40 print 70.61, 15:41 70.58, close 70.35); covered 70.58 at 15:44 = +0.178R booked vs +0.232R on the close; RUNBOOK line 35 'at the 15:40 tick ... flatten'. NVDA 2026-10-06: 239.27 vs close 239.24 (flat).

**Rule implication.** Winners (flat rule) + Coach replay convention: clarify — the 15:40 tick applies the ladder/close-lock as a stop against its print, then flattens at that print; the replay scores the 15:40-tick print, never the 16:00 close. Applied in v6.

**Status.** applied in Rules v6
