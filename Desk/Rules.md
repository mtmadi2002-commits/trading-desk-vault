---
type: rules
version: 5
updated: 2026-10-06
updated_by: Coach — [[2026-10-06 Review]]: late-seen triggers and gapped-through breakouts tightened; plan kill switches may not cut size for a missing feed (clarify)
---
# Desk Rules (living — read by every seat, rewritten only by the Coach)

The desk reads this note at the start of every run. The nightly [[Coach]] may change it, under the change policy at the bottom. Every change gets a line in [[Rules Changelog]] with the evidence note that justified it.

## Universe
- US-listed stocks and ETFs, price ≥ $5, average volume ≥ 1M shares (prefer ≥ 3M). No OTC, warrants, or names under an LULD/halt pattern.
- Correlated names are ONE slot (e.g. the Brazil complex EWZ/NU/ITUB/PBR/XP; the Musk complex SPCX/TSLA; SPCX+NVDA share the tech slot).

## Risk (% of equity) — profile: AGGRESSIVE (user-set 2026-10-06)
- Account: paper, starts at $200, profits compound into equity; every size is computed from live equity.
- Risk per trade: 5% default · 2.5% for `low` confidence or a second position on the same factor · never above 7.5%.
- `shares = (equity × risk%) / (entry − stop)` (fractional shares allowed in paper modes); cancel the order if the fill would be worse than entry + 0.25×ATR.
- Max 2 concurrent positions. Total open risk ≤ 10% of equity at all times. Notional per position ≤ 100% of equity.
- Soft stop −6% (no new entries); hard stop −10% (flat, done). Correlated stop-out (two stops within 15 min) = flatten and stop.
- Re-entry after a full stop: once, at 2.5%, never if daily P&L ≤ −6%, never a third attempt.
- FLOOR: equity never trades below 50% of its peak balance (ratchets up, never down); at the floor, no entries and flatten. No order may risk more than the distance to the floor.
- No overnight holds. Flat by 15:55 ET.
- Honest expectation at this profile: +1.5R days ≈ +7.5%, stopped trades −5%; a 45% win rate at 1.5R averages about +0.6%/trade with ±5–8% daily swings. The Coach may TIGHTEN these numbers on evidence; it may not loosen them further.

## Stops and targets
- Stops are structure levels (prior low/high, VWAP, opening-range extreme), never a round %.
- Stop distance between 0.7× and 1.5× ATR14. Below 0.7× is noise (lesson: [[2026-10-06 Review]] — all four draft stops were 0.51–0.61× ATR and were widened; the 0.78× ATR NVDA stop at 236.00 then held a 238.93 close-low).
- Quote R:R at T1 honestly after the stop is corrected; do not report 2.0 R:R from a noise stop. T1 is quoted from the realistic fill (trigger + expected slippage), not from the trigger alone.
- Opening-range filter: if the 09:30–09:45 range exceeds 1.0× ATR, breakout entries in that name are void; VWAP-retest only after 10:00.

## Winners (user-set 2026-10-06 — let them run)
- Scale **one third** at T1 (≥ 1.5R), stop to breakeven on the rest. The remaining two thirds is a RUNNER on the **rising stop ladder in [[Trail]]** (peak-tracked; locks 25% of peak profit at 1R, 50% at 2R, 60% at 3R … 99% at 15R; the stop only ever rises). No fixed T2 cap on a trend day. Take the runner only on the trail, a kill switch, a stall (no new high for 45 min with falling volume) or the 15:55 flat rule.
- Target the runner at ≥ 3R. A day where the runner reaches 3R is the day that pays for the week; never clip it to "lock in" a small gain.
- A trade that reaches +1R and comes all the way back to breakeven is a scratch, not a loss — do not re-enter it that day.

## Data absence (user-set 2026-10-06)
- A missing data feed never cuts size. If live VWAP is unavailable, the trade uses its HARD level (prior high/low, opening-range extreme, Monday close ± ATR) at the FULL planned size. VWAP is confirmation, never the sole trigger. The Head Trader writes every trade so a hard level is the primary trigger.
- Size is cut only by the Risk section (confidence, correlation, daily P&L) and by liquidity rules in the plan (pre-market volume, spread) — never by what the desk cannot see.
- Plan-level kill switches and session rules may not cut size for a missing feed; the Risk Manager strikes any such switch before the plan is final. A switch that is certain to trip at 09:45 is a sizing rule in disguise (clarify: [[2026-10-06 Review]] — the VWAP-feed switch halved every size for a feed the desk knew it did not have).

## Entries
- No entries 09:30–09:35 (09:30–09:32 minimum). No entry inside a scheduled-data window ±2 min.
- Never buy above the prior day's high on a name that moved > 10% that day (chase rule). Pullback-and-hold entries only on day-2 of a gap.
- Late-seen trigger: the fill cap (entry + 0.25×ATR) limits slippage on the trigger bar only. A trigger first observed after its bar has closed is valid only if the last price is within 0.1×ATR of the trigger AND T1 is ≥ 1.5R from the actual fill; otherwise skip — a late entry is a chase, not a breakout (tighten: [[2026-10-06 Review]] — NVDA trigger 240.60 on the 09:45 bar, filled 10:46 at the 241.90 cap, T1 0.80R, −0.446R).
- Gapped-through trigger: if a name opens above its breakout trigger level, the breakout leg is void for the day; the only valid entry is a retest-and-hold — price returns to within 0.1×ATR of the level and a 5-min bar closes back above it after 09:45. Pullback and VWAP-retest legs are unaffected (tighten: [[2026-10-06 Review]] — NVDA open 242.10 > 240.60, first-hour high 243.37 was the day's high, close 239.24; SPCX same shape).
- Day-2 of an election/macro gap: the liquid core continues at a slower pace; the +18–30% names fade. Trade the core long on held pullbacks; do not short the core.
- M&A: targets pinned to the deal price and acquirers on announcement day are not day trades (merger arb only).

## Seat 7 (smart money) usage
- Form 4 (≤ 2-day lag): a cluster of open-market buys > $1M by officers is a real signal; 10b5-1 sales and option exercises are not.
- Congress (30–45-day lag) and 13F (quarterly) are context only, never a trigger.
- Real-time items (White House, Musk, DOJ/SEC/OFAC, Gulf) are kill-switch candidates, not entries.

## Data hygiene
- Every level cites its source. "est VWAP" = HLC/3 proxy until replaced by live VWAP at 09:45; if no live VWAP, only hard prior-day levels are valid triggers.
- Alpha Vantage free key: 25 calls/day desk-wide; premium endpoints return fake sample data — discard anything with 2024 timestamps or MSFT/AAPL/IBM placeholder rows. TIME_SERIES_INTRADAY returned the premium/rate_limit error on 2026-10-06; until Alpaca bars exist the Coach's replay is range-based from stockanalysis quote pages.
- Firecrawl: ~10 requests/min desk-wide; one at a time, 7 s apart.

## Setup expectancy (binding on the Head Trader and the Coach)
- Every planned trade carries a `setup_type` and every execution passes it to the broker layer (`--setup`). `Desk/Expectancy.md` (generated from the ledger) is the scorecard per setup.
- Status rule: **sample** (< 10 trades) → default size · **proven** (≥ 10, avg R ≥ 0.3) → may be sized at the max risk number · **marginal** (≥ 10, 0 ≤ avg R < 0.3) → low-confidence size · **disabled** (≥ 10, avg R < 0) → not planned until the Coach reviews it with a backtest.
- Before a NEW setup_type enters the plan at default size, the Coach runs `Scripts/backtest.py` on it when 5-minute history exists (`exec.py bars`); a setup with negative backtest expectancy starts at the low-confidence size.
- Sizing up a proven setup is the only way size ever increases; it never exceeds the max in the Risk section.

## Both sides
- The Screener always delivers short candidates; when the regime is risk-off / trend-down, at least one ranked trade is a short. No forcing longs into a red tape or shorts into a green one.

## Resting orders at the broker (alpaca modes)
- When the desk runs on Alpaca (paper or live), the first monitor tick RESTS each live plan trade as a stop-limit bracket (`exec.py rest`): the broker fires the entry the moment the trigger prints, with the stop and T1 attached. The hourly tick then manages (scale, breakeven, exits) and cancels anything the premarket update scrapped. Alpaca brackets are whole shares.

## Change policy (binding on the Coach)
- The Coach may TIGHTEN any risk rule immediately on one piece of evidence.
- The Coach may LOOSEN a rule only with ≥ 10 journaled trades supporting it and must say so in the changelog.
- The Coach never loosens the hard daily stop (−10% at the aggressive profile) or the no-overnight rule; it may tighten the stop.
- Every rule change links the evidence note: `[[YYYY-MM-DD Review]]` or `[[Lesson - ...]]`.
