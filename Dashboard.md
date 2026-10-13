---
type: dashboard
---
# Trading Desk — Dashboard

**Rules:** [[Rules]] · [[Rules Changelog]] · [[Seats]] · [[Live]] (mode + guards) · [[Targets]] (user milestones $500 → $1,000 → $10,000 and what the limits allow) · [[Expectancy]] (per-setup stats, sizes setups) · `Backtests/` (setup replays on 5-min bars)

## Latest
- Plan: **[[2026-10-13 Plan]]** — 2 ranked, max 1 concurrent, IONQ at the new 7.5% size (previous: [[2026-10-08 Plan]])
- Journal: [[2026-10-13 Journal]] (previous: [[2026-10-12 Journal]]; last traded session: [[2026-10-08 Journal]])
- Outage: [[Outage 2026-10-09 to 2026-10-12]] — 17 runs lost to worker restarts; Friday 2026-10-09 never ran
- Review: [[2026-10-12 Review]] — no replay possible, no seat graded; the faults reviewed are the orchestrator's (yesterday: [[2026-10-08 Review]])

## Scorecard (updated by the Coach)
| Date | Trades planned | Triggered | Wins | Losses | Day R | Day P&L % | Rules v |
|---|---|---|---|---|---|---|---|
| 2026-10-06 | 3 | 1 (NVDA) | 0 | 1 | -0.446 | -0.55% | 5 |
| 2026-10-07 | 4 | 1 (TEM) | 1 | 0 | +0.178 | +0.44% | 6 |
| 2026-10-08 | 2 | 0 | 0 | 0 | 0.00 | 0.00% | 8 |
| 2026-10-09 | — | **NO SESSION** | — | — | — | — | 8 |
| 2026-10-12 | 0 | **NO PLAN** | — | — | 0.00 | 0.00% | 9 |
| 2026-10-13 | 2 | — | — | — | — | — | 10 |

## Lessons
- [[Lesson - A rule the desk wrote does not bind the desk that wrote it]]
- [[Lesson - A session the desk refuses to trade still needs a complete record]]
- [[Lesson - A thesis is decided by the close, not by the 15-40 tick]]
- [[Lesson - A kill switch stops being a fact the moment the desk stops reading it]]
- [[Lesson - A retest band built from 0.1x ATR arithmetic is not a structure level]]
- [[Lesson - Firecrawl calls are not credits, and a tag filter can cost the number]]
- [[Lesson - A time-stop with an escape clause is a hold rule]]
- [[Lesson - At the hourly cadence the 15-40 tick is the flat]]
- [[Lesson - A third-party price card is not a print]]
- [[Lesson - An index kill blocks the low-beta long that ignores the index]]
- [[Lesson - A trigger seen late is a chase, not a breakout]]
- [[Lesson - A name that opens above its breakout trigger has already broken out]]
- [[Lesson - A kill switch that is certain to trip is a sizing rule in disguise]]
- [[Lesson - Day-2 pullback entries miss the strongest continuation]]

## How this vault is used
Each evening the desk writes `Plans/<date> Plan`. During the session the monitor appends to `Journal/<date> Journal`. After the close the Coach writes `Reviews/<date> Review` and `Lessons/…`, then edits [[Rules]] under its change policy. Open this folder as an Obsidian vault.
