---
type: rules
version: 2
updated: 2026-10-06
updated_by: User — risk profile set to AGGRESSIVE (Coach may tighten, may not loosen further)
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
- Stop distance between 0.7× and 1.5× ATR14. Below 0.7× is noise (lesson: [[2026-10-06 Review]] — all four draft stops were 0.51–0.61× ATR and were widened).
- Quote R:R at T1 honestly after the stop is corrected; do not report 2.0 R:R from a noise stop.
- Opening-range filter: if the 09:30–09:45 range exceeds 1.0× ATR, breakout entries in that name are void; VWAP-retest only after 10:00.

## Entries
- No entries 09:30–09:35 (09:30–09:32 minimum). No entry inside a scheduled-data window ±2 min.
- Never buy above the prior day's high on a name that moved > 10% that day (chase rule). Pullback-and-hold entries only on day-2 of a gap.
- Day-2 of an election/macro gap: the liquid core continues at a slower pace; the +18–30% names fade. Trade the core long on held pullbacks; do not short the core.
- M&A: targets pinned to the deal price and acquirers on announcement day are not day trades (merger arb only).

## Seat 7 (smart money) usage
- Form 4 (≤ 2-day lag): a cluster of open-market buys > $1M by officers is a real signal; 10b5-1 sales and option exercises are not.
- Congress (30–45-day lag) and 13F (quarterly) are context only, never a trigger.
- Real-time items (White House, Musk, DOJ/SEC/OFAC, Gulf) are kill-switch candidates, not entries.

## Data hygiene
- Every level cites its source. "est VWAP" = HLC/3 proxy until replaced by live VWAP at 09:45; if no live VWAP, only hard prior-day levels are valid triggers.
- Alpha Vantage free key: 25 calls/day desk-wide; premium endpoints return fake sample data — discard anything with 2024 timestamps or MSFT/AAPL/IBM placeholder rows.
- Firecrawl: ~10 requests/min desk-wide; one at a time, 7 s apart.

## Change policy (binding on the Coach)
- The Coach may TIGHTEN any risk rule immediately on one piece of evidence.
- The Coach may LOOSEN a rule only with ≥ 10 journaled trades supporting it and must say so in the changelog.
- The Coach never loosens the hard daily stop (−10% at the aggressive profile) or the no-overnight rule; it may tighten the stop.
- Every rule change links the evidence note: `[[YYYY-MM-DD Review]]` or `[[Lesson - ...]]`.
