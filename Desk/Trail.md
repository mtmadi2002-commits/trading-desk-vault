---
type: trail-ladder
unit: R
rungs_at: [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 15, 20]
rungs_lock: [0.10, 0.25, 0.40, 0.50, 0.55, 0.60, 0.70, 0.80, 0.90, 0.95, 0.97, 0.99, 1.00]
arm_at: 0.5
close_lock_after_et: "15:25"
close_lock: 0.90
---
# Rising stop ladder (user-set 2026-10-06 — "trail until we hit 25, then 50, 60, 70, 80, 90, 95, 97, 99")

The stop only ever rises (falls for shorts). The desk tracks the position's **peak** price. When peak profit crosses a rung, the stop jumps to lock that rung's share of the peak profit and stays there until the next rung.

| Peak profit reaches | Stop locks this share of peak profit |
|---|---|
| 0.5R | 10% |
| 1R | 25% |
| 1.5R | 40% |
| 2R | 50% |
| 2.5R | 55% |
| 3R | 60% |
| 4R | 70% |
| 5R | 80% |
| 6R | 90% |
| 8R | 95% |
| 10R | 97% |
| 15R | 99% |
| 20R | 100% |

**Take it all (user, 2026-10-06):** rungs were densified (half-R steps up to 3R) so less is given back between rungs, and after **15:25 ET** any position in profit locks **90%** of its peak profit regardless of rung — nothing is handed back into the 15:55 flat.

`unit: R` means rungs are multiples of the initial risk (entry − stop). Set `unit: pct` and `rungs_at: [25, 50, 60, 70, 80, 90, 95, 97, 99]` to use percent-of-price gains instead (the crypto reading of the same ladder). Edit this note like `Desk/Live.md` — only the user changes it.

- Before the first rung (`arm_at`) the original structure stop holds; the Winners rule's breakeven at T1 still applies.
- `exec.py trail --symbol T --last PRICE` applies the ladder every monitor tick and reports `stop_hit` when the last price is through the stop. On Alpaca it replaces the broker's stop leg with the ladder stop, so the broker fires it between ticks.
- `backtest.py --trail` and the Coach's replay use the same ladder on 5-minute bars, so the ladder is measured, not assumed.
