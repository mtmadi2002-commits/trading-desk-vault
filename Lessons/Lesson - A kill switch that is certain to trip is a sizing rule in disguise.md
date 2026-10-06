---
type: lesson
date: 2026-10-06
tags: [lesson]
tickers: ["NVDA", "SPCX", "NU"]
rule_affected: "Data absence: plan-level kill switches and session rules may not cut size for a "
confidence: high
samples: 1
---
# Lesson - A kill switch that is certain to trip is a sizing rule in disguise

**Observation.** The plan's VWAP-feed switch referenced a feed the desk knew it did not have (no Alpaca keys), so it halved every trade at 09:45 regardless of risk - sizing by data absence.

**Evidence.** [[2026-10-06 Review]] — Monitor tick 09:41: 'exec.py quote refused (no Alpaca keys), finviz has no VWAP field -> all sizes 1.25%'. NVDA was entered at 1.25% instead of 2.5%; the user overruled with Rules v4 'Data absence never cuts size' at 15:0x ET.

**Rule implication.** Data absence: plan-level kill switches and session rules may not cut size for a missing feed; the Risk Manager strikes any such switch before the plan is final. Applied as a clarify in v5. (The halving coincidentally saved $1.10 today; one sample does not justify re-introducing it.)

**Status.** applied in Rules v5
