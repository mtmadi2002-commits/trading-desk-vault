---
type: dashboard
---
# Trading Desk — Dashboard

**Rules:** [[Rules]] · [[Rules Changelog]] · [[Seats]] · [[Live]] (mode + guards) · [[Targets]] (user milestones $500 → $1,000 → $10,000 and what the limits allow) · [[Expectancy]] (per-setup stats, sizes setups) · `Backtests/` (setup replays on 5-min bars)

## Latest
- Plan: [[2026-10-08 Plan]] (yesterday: [[2026-10-07 Plan]])
- Journal: [[2026-10-08 Journal]] (yesterday: [[2026-10-07 Journal]])
- Review: [[2026-10-07 Review]] (yesterday: [[2026-10-06 Review]])

## Scorecard (updated by the Coach)
| Date | Trades planned | Triggered | Wins | Losses | Day R | Day P&L % | Rules v |
|---|---|---|---|---|---|---|---|
| 2026-10-06 | 3 | 1 (NVDA) | 0 | 1 | -0.446 | -0.55% | 5 |
| 2026-10-07 | 4 | 1 (TEM) | 1 | 0 | +0.178 | +0.44% | 6 |
| 2026-10-08 | 2 | — | — | — | — | — | 7 |

## Lessons
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
