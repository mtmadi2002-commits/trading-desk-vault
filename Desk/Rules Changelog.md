---
type: changelog
---
# Rules Changelog

| Date | Version | Change | Evidence | By |
|---|---|---|---|---|
| 2026-10-05 | 1 | Initial rules; stop floor raised from 0.5× to 0.7× ATR; max concurrent 3 → 2; total open risk cap 1.0% | [[2026-10-06 Plan]] risk review | Risk Manager |
| 2026-10-06 | 2 | Risk profile AGGRESSIVE: 5% default / 2.5% low-conf / 7.5% max per trade; open-risk cap 10%; notional 100%; daily stop −10% (soft −6%); account $200 compounding, fractional shares in paper | user instruction | User |
| 2026-10-06 | 2 | Floor: equity never below 50% of peak balance (ratchet); at the floor refuse entries and flatten | user instruction | User |
| 2026-10-06 | 3 | Setup expectancy: setup_type on every trade; sample/proven/marginal/disabled status rule sizes setups from the ledger; backtest before a new setup at default size | user instruction (features 2–3) | User |
| 2026-10-06 | 3 | Both sides: Screener always lists shorts; risk-off regime requires a ranked short | user instruction (feature 4) | User |
| 2026-10-06 | 3 | Resting stop-limit brackets at the broker in alpaca modes; real-time quotes via exec.py quote when keys exist | user instruction (feature 1) | User |
| 2026-10-06 | 4 | Winners: scale 1/3 at T1, breakeven, trail the 2/3 runner to ≥ 3R, no fixed T2 cap on trend days | user instruction (win big); today NVDA plan capped the runner at 1.37R | User |
| 2026-10-06 | 4 | Data absence never cuts size: hard-level trigger at full planned size when live VWAP is missing | user instruction; today every entry was halved to 1.25% by a VWAP-feed switch, not by risk | User |
| 2026-10-06 | 4 | Rising stop ladder (Desk/Trail.md): runner stop locks 25/50/60/70/80/90/95/97/99% of peak profit at 1/2/3/4/5/6/8/10/15R, and 90% after 15:25 ET ("take it all"); a denser half-R ladder was backtested and rejected (avg winner 1.4R → 0.6R); exec.py trail applies it every tick, backtest --trail measures it | user instruction ("secret weapon") | User |
| 2026-10-06 | 5 | Entries - late-seen trigger: The fill cap limits slippage on the trigger bar only. A trigger first observed after its bar has closed is valid only if the last price is within 0.1x ATR of the trigger AND T1 is >= 1.5R from the act | [[2026-10-06 Review]] (tighten, samples 1) | Coach |
| 2026-10-06 | 5 | Entries - gapped-through breakout trigger: If a name opens above its breakout trigger level, the breakout leg is void for the day; the only valid entry is a retest-and-hold: price returns to within 0.1x ATR of the level and a 5-min bar closes  | [[2026-10-06 Review]] (tighten, samples 1) | Coach |
| 2026-10-06 | 5 | Data absence - plan kill switches: Plan-level kill switches and session rules may not cut size for a missing feed; the Risk Manager strikes any such switch before the plan is final. A switch that is certain to trip at 09:45 is a sizing | [[2026-10-06 Review]] (clarify, samples 1) | Coach |
| 2026-10-07 | 6 | Seat 7 usage — third-party price items: price-bearing non-quote items (aggregator cards, social posts, screenshots, headline tickers) are information only; no entry/scale/exit/critical alert unless a desk quote source (stockanalysis / finvi | [[2026-10-07 Review]] (tighten, samples 1) | Coach |
| 2026-10-07 | 6 | Winners — flat at the cadence: at the hourly cadence the 15:40 tick IS the flat (RUNBOOK): it applies the ladder/close-lock as a stop level against its print (exit at the print only if through the stop), then flattens whatever is o | [[2026-10-07 Review]] (clarify, samples 2) | Coach |
| 2026-10-07 | 6 | Data hygiene — session-dated records: every tick/journal/snapshot record carries its session date; a seat reading the day's record discards any entry dated another session and says so | [[2026-10-07 Review]] (clarify, samples 1) | Coach |
