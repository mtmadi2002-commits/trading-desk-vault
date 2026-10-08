---
type: rules
version: 8
updated: 2026-10-08
updated_by: Coach — thesis verdicts settle on the 16:00 close; a kill switch's state must be read, not assumed; the three-session carry clock counts calendar sessions; Firecrawl budgets in credits; book-wide switches must record what they blocked; AND-switches must name the disagreement case; `ath-breakout` family defined; a flat no-decision tick may be recorded directly.
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
- Where ATR14 is contaminated (a corporate action inside the lookback, fewer than 10 clean bars), the 0.7× floor is measured against `max(ATR14, the prior session's own range)` and the plan says so. A stop that passes against a stale ATR but fails against the real range is a target-driven stop and is struck or re-levelled, not accepted with conditions (tighten: [[2026-10-08 Review]] — CTVA's 0.48 stop was 0.71× the spin-contaminated ATR 0.68 but only 0.55× of Wednesday's actual 0.87 range; it was approved with caps and broke 0.57 through inside twelve minutes, day low 13.61, close 13.75).
- Quote R:R at T1 honestly after the stop is corrected; do not report 2.0 R:R from a noise stop. T1 is quoted from the realistic fill (trigger + expected slippage), not from the trigger alone.
- Opening-range filter: if the 09:30–09:45 range exceeds 1.0× ATR, breakout entries in that name are void; VWAP-retest only after 10:00.

## Winners (user-set 2026-10-06 — let them run)
- Scale **one third** at T1 (≥ 1.5R), stop to breakeven on the rest. The remaining two thirds is a RUNNER on the **rising stop ladder in [[Trail]]** (peak-tracked; locks 25% of peak profit at 1R, 50% at 2R, 60% at 3R … 99% at 15R; the stop only ever rises). No fixed T2 cap on a trend day. Take the runner only on the trail, a kill switch, a stall (no new high for 45 min with falling volume) or the 15:55 flat rule.
- Target the runner at ≥ 3R. A day where the runner reaches 3R is the day that pays for the week; never clip it to "lock in" a small gain.
- A trade that reaches +1R and comes all the way back to breakeven is a scratch, not a loss — do not re-enter it that day.
- Flat at the cadence: at the hourly cadence the 15:40 tick IS the 15:55 flat (RUNBOOK: `flatten` after the seat's actions; no later run exists). That tick first applies the ladder / 15:25 close-lock as a STOP level against its print (exit at the print only if the print is through the stop), then flattens whatever is still open at the tick's print. The Coach's replay scores the 15:40-tick print as the exit, never the 16:00 close (clarify: [[2026-10-07 Review]] — TEM short covered 70.58 at 15:44 with the 70.674 close-lock untouched; the 16:00 close 70.35 was worth +0.232R vs +0.178R booked — a cadence gap, not an execution error).

## Multi-day thesis, daily position (user-set 2026-10-08)
- The 15:55 flat ends the **position**, not the **thesis**. A setup whose thesis is still intact at the 15:40 flat tick is carried forward as a named continuation candidate for the next session instead of being dropped.
- At the 15:40 tick, for every position it flattens and for every named carry candidate, the monitor records a **PROVISIONAL** `thesis_intact: yes|no` in the journal row, naming the test (structure / catalyst / group tell), the level, and the margin to it. The verdict is **FINAL only on the 16:00 close**, which the Coach reads at 16:24 and which OVERRIDES the tick. Only the Coach's close-settled verdict reaches the evening plan.
- A carried thesis whose margin to its level decayed **monotonically** across the session inside an unchanged range on rising volume is recorded **NOT intact** regardless of which side the last tick sits on — that shape is absorption, not extension (tighten: [[2026-10-08 Review]] — TEM last 68.49 at 15:41, 0.17 *below* the 68.66 level and recorded intact-conditional, closed **69.28**, 0.62 *above* it and at 84.5% of the 66.71–69.75 range from the low, after the margin decayed 1.95 → 1.02 → 0.34 → 0.17 while the range froze 4.5 h and volume went 2.54M → 7.02M. The close retired a thesis the tick would have carried).
- A carried thesis is a **NEW trade under every ordinary rule**: a fresh hard level from the latest session's range, a fresh structure stop at 0.7–1.5× ATR, T1 ≥ 1.5R from the realistic fill, full size per the Risk section, and it counts against max 2 concurrent. Yesterday's entry, stop and target are never reused. Carrying a thesis never widens a stop, never averages down and never adds to a closed position.
- A thesis may be carried at most **three consecutive CALENDAR sessions**, counted from the session in which it first appears in a plan as a ranked trade or a named carry — **whether or not a position was ever opened**. That first appearance is session 1; a session the desk was blocked out of still burns a session. After the third it is retired until a new catalyst or a new structure level appears. A thesis that has produced two losing days is retired immediately (mirrors the same-day "never a third attempt" cap in Risk) (clarify: [[2026-10-08 Review]] — TEM and IREN both reached the 15:40 flat with no position ever opened; the expressed-sessions-only reading would lengthen a thesis's life and is therefore a LOOSEN needing ≥ 10 journaled carries).
- **Overnight exposure remains FORBIDDEN** and the Coach may not loosen it. That is the point of this rule's shape: the desk cannot act on a gap, and the names the Screener surfaces are the gap-prone ones (TEM beta 3.54, IREN beta 4.27). Measured on the only two closed trades (2026-10-07): holding both to the next close scored −0.518R against the −0.268R actually booked. Giving a thesis more days is the edge; giving a position more hours is the gap.

## Data absence (user-set 2026-10-06)
- A missing data feed never cuts size. If live VWAP is unavailable, the trade uses its HARD level (prior high/low, opening-range extreme, Monday close ± ATR) at the FULL planned size. VWAP is confirmation, never the sole trigger. The Head Trader writes every trade so a hard level is the primary trigger.
- Size is cut only by the Risk section (confidence, correlation, daily P&L) and by liquidity rules in the plan (pre-market volume, spread) — never by what the desk cannot see.
- Plan-level kill switches and session rules may not cut size for a missing feed; the Risk Manager strikes any such switch before the plan is final. A switch that is certain to trip at 09:45 is a sizing rule in disguise (clarify: [[2026-10-06 Review]] — the VWAP-feed switch halved every size for a feed the desk knew it did not have).

## Entries
- No entries 09:30–09:35 (09:30–09:32 minimum). No entry inside a scheduled-data window ±2 min.
- Never buy above the prior day's high on a name that moved > 10% that day (chase rule). Pullback-and-hold entries only on day-2 of a gap.
- Late-seen trigger: the fill cap (entry + 0.25×ATR) limits slippage on the trigger bar only. A trigger first observed after its bar has closed is valid only if the last price is within 0.1×ATR of the trigger AND T1 is ≥ 1.5R from the actual fill; otherwise skip — a late entry is a chase, not a breakout (tighten: [[2026-10-06 Review]] — NVDA trigger 240.60 on the 09:45 bar, filled 10:46 at the 241.90 cap, T1 0.80R, −0.446R).
- Gapped-through trigger: if a name opens above its breakout trigger level, the breakout leg is void for the day; the only valid entry is a retest-and-hold — price returns to within 0.1×ATR of the level and a 5-min bar closes back above it after 09:45. Pullback and VWAP-retest legs are unaffected (tighten: [[2026-10-06 Review]] — NVDA open 242.10 > 240.60, first-hour high 243.37 was the day's high, close 239.24; SPCX same shape).
  - OPEN, NOT CHANGED: the 0.1×ATR retest tolerance is under review. A gap-scaled tolerance — `max(0.1×ATR, 25% of the gap through the level)` — would LOOSEN the fill test and needs ≥ 10 journaled samples. Journaled so far: **3** (IREN band floor 38.08 vs day high 38.06, a 0.02 miss, [[2026-10-08 Review]]; CTVA 13.84 undercut by 0.09, [[2026-10-07 Review]]; NU 15.20 0.13 under the day low, [[2026-10-06 Review]]). Until 10, the band stands as written and the plan states the expected fill probability.
- Day-2 of an election/macro gap: the liquid core continues at a slower pace; the +18–30% names fade. Trade the core long on held pullbacks; do not short the core.
- M&A: targets pinned to the deal price and acquirers on announcement day are not day trades (merger arb only).

## Plan kill switches
- A switch that blocks entries across the BOOK (commodity, geopolitical, index) records, for EACH name it blocks at that tick, whether that name had a live trigger at that tick (`yes` / `no` / `level-not-reached`) and the distance from the last print to the trigger. The Coach sums the measured cost in R in every Review. Any proposal to SCOPE such a switch to a transmission channel is a LOOSEN and needs ≥ 10 of these journaled rows (tighten: [[2026-10-08 Review]] — the Brent > $102 switch blocked the whole session across a genomics short and an AI-datacenter short with no crude exposure, and its measured cost was 0R because neither blocked name ever reached a trigger; the desk had an opinion and no data).
  - OPEN, NOT CHANGED: scoping commodity switches by transmission channel. Journaled samples: **1** of 10.
- A switch whose condition is an AND across two instruments must also state what happens when the limbs DISAGREE. The default is the conservative limb: no new entries in the direction the disagreeing limb would support, until a later tick resolves both. A switch that cannot return a verdict on a split tape is not a switch, and the Risk Manager strikes or completes it before the plan is final (tighten: [[2026-10-08 Review]] — AUCTION_TAIL needed TLT < 76.43 AND SPY < 773.61; SPY broke 773.61 to a 770.44 low while TLT rallied to 77.73, 0.41 through its 77.32 risk-on level, under a +4–5% Brent move; the AND never resolved and the switch fired its own inverse no-new-shorts limb instead. The oil → yields → TLT correlation is NOT changed — one sample cannot overturn a correlation; the fault is the switch's shape, not its sign).
- An index kill blocks every long regardless of the name's beta. Journaled samples toward scoping it to beta ≥ 1: **1** (CTVA +3.88% vs SPY −0.24%, [[2026-10-07 Review]]). Not changed.

## Seat 7 (smart money) usage
- Form 4 (≤ 2-day lag): a cluster of open-market buys > $1M by officers is a real signal; 10b5-1 sales and option exercises are not.
- Congress (30–45-day lag) and 13F (quarterly) are context only, never a trigger.
- Real-time items (White House, Musk, DOJ/SEC/OFAC, Gulf) are kill-switch candidates, not entries.
- Price-bearing items from non-quote sources (aggregator cards, social posts, screenshots, headline tickers) are information only: they never trigger an entry, a scale, an exit or a `critical` alert unless a desk quote source (stockanalysis / finviz / `exec.py quote`) shows the same print at that time; a card that contradicts the desk's own prints is logged as disproved and dropped (tighten: [[2026-10-07 Review]] — a 247wallst card "TEM $64.17 −9.2% at 12:40" was relayed as critical at 13:47 while the desk's real-time prints were 71.34 / 70.84 / 70.60 / 70.56).

## Data hygiene
- Every level cites its source. "est VWAP" = HLC/3 proxy until replaced by live VWAP at 09:45; if no live VWAP, only hard prior-day levels are valid triggers.
- **A kill switch's state is recorded as tripped / not tripped ONLY from a read taken at that tick.** With no read at that tick it is recorded `state UNKNOWN since HH:MM` — never "not tripped". A switch may not be dropped from the read list because it can only block a side the book is not currently holding: its state is also the next session's opening input and the Coach's evidence (tighten: [[2026-10-08 Review]] — SPY last read 12:12 at a 774.18 day low and deliberately not re-read because the index kill "can only block longs and there is no long left to block"; the 15:46 ledger recorded INDEX KILL "NOT tripped", while SPY's actual day low 770.44 broke both the 773.61 kill and the 770.00 flatten-all-longs limb and the 773.93 close concealed it).
- Alpha Vantage free key: 25 calls/day desk-wide; premium endpoints return fake sample data — discard anything with 2024 timestamps or MSFT/AAPL/IBM placeholder rows. TIME_SERIES_INTRADAY returned the premium/rate_limit error on 2026-10-06, 2026-10-07 and again on 2026-10-08; **until Alpaca bars exist the Coach's replay is RANGE-BASED** — the verified 16:00 O/H/L/C/V from a desk quote page plus the day's timestamped tick prints — and every Review says so rather than implying bar-level precision.
- Firecrawl: ~10 requests/min desk-wide; one at a time, 7 s apart. **Budgets are stated in CREDITS, not calls** — a page scrape costs 1 credit, a `firecrawl_search` costs 2 (measured 2026-10-08) — and every seat reports `creditsUsed` from the response metadata in its output. A scrape taken to obtain a specific number must not filter that number out of the response: no `includeTags` that drops the quote/price block (tighten: [[2026-10-08 Review]] — every per-tick budget written that day counted calls and understated burn by up to 2× on an account Firecrawl flagged as low on every response; and the Coach's own IREN scrape filtered to `['table','h1']` lost IREN's 16:00 close).
- Every tick, journal and snapshot record carries its session date; a seat reading the day's record discards any entry dated another session and says so (clarify: [[2026-10-07 Review]]).

## Monitor cadence
- A scheduled monitor tick MAY be recorded directly, without spawning seats, when ALL of: (i) the book is flat; (ii) no entry is permitted at that tick, either by the plan's own session rules or because every entry window has already closed; (iii) the deviation is logged in the journal naming those reasons. A directly-recorded tick MUST still refresh every live kill switch's state or mark it UNKNOWN per Data hygiene — the saving is seat tokens, never the switch record (clarify: [[2026-10-08 Review]] — the 14:40 skip was correct on its facts and saved ~180–220k subagent tokens plus credits later needed, but it removed the only SPY read between 12:12 and 15:41 and SPY's 770.44 low went unrecorded).

## Setup expectancy (binding on the Head Trader and the Coach)
- Every planned trade carries a `setup_type` and every execution passes it to the broker layer (`--setup`). `Desk/Expectancy.md` (generated from the ledger) is the scorecard per setup.
- Status rule: **sample** (< 10 trades) → default size · **proven** (≥ 10, avg R ≥ 0.3) → may be sized at the max risk number · **marginal** (≥ 10, 0 ≤ avg R < 0.3) → low-confidence size · **disabled** (≥ 10, avg R < 0) → not planned until the Coach reviews it with a backtest.
- `ath-breakout` covers any breakout to a new high with no overhead supply in the TRADEABLE series — all-time, 52-week, or post-corporate-action stub high. Families are not split on the label of the high: splitting an n=1 row into two n=1 rows postpones every setup's promotion to `proven` indefinitely. A series with fewer than 10 clean post-corporate-action bars is flagged in the plan (adjusted ATR/RSI/SMA unreliable) but keeps the family tag (clarify: [[2026-10-08 Review]] — CTVA's 14.62 trigger was its true 52-week high on a series with ≤ 5 clean post-spin bars; ruled one family).
- Before a NEW setup_type enters the plan at default size, the Coach runs `Scripts/backtest.py` on it when 5-minute history exists (`exec.py bars`); a setup with negative backtest expectancy starts at the low-confidence size.
- Sizing up a proven setup is the only way size ever increases; it never exceeds the max in the Risk section.

## Both sides
- The Screener always delivers short candidates; when the regime is risk-off / trend-down, at least one ranked trade is a short. No forcing longs into a red tape or shorts into a green one.

## Resting orders at the broker (alpaca modes)
- When the desk runs on Alpaca (paper or live), the first monitor tick RESTS each live plan trade as a stop-limit bracket (`exec.py rest`): the broker fires the entry the moment the trigger prints, with the stop and T1 attached. The hourly tick then manages (scale, breakeven, exits) and cancels anything the premarket update scrapped. Alpaca brackets are whole shares.

## Change policy (binding on the Coach)
- The Coach may TIGHTEN any risk rule immediately on one piece of evidence.
- The Coach may LOOSEN a rule only with ≥ 10 journaled trades supporting it and must say so in the changelog.
- The Coach never loosens the hard daily stop (−10% at the aggressive profile), the floor, or the no-overnight rule; it may tighten the stop.
- Every rule change links the evidence note: `[[YYYY-MM-DD Review]]` or `[[Lesson - ...]]`.
- Rules that are OPEN and NOT CHANGED carry their journaled sample count in the text, so a loosening becomes a counted decision rather than a recurring argument.
