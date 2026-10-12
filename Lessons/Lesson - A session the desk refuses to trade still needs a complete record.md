---
type: lesson
date: 2026-10-12
status: applied in Rules v9
review: "[[2026-10-12 Review]]"
rules_version: 9
confidence: medium
samples: 2
tickers: []
---
# A session the desk refuses to trade still needs a complete record

## Observation
On a day when a standing refusal is in force, every tick says the same thing, and recording them all feels like padding. It is the opposite. A gap in the tick chain is indistinguishable, after the fact, from a scheduled run that silently failed — and the desk has now lived through exactly that failure mode, losing seventeen runs to worker restarts with nothing in the vault to show it. The completeness of the chain is what lets a later reader tell "the desk looked and declined" apart from "the desk was not there". That distinction is worth more than the tokens a skipped tick saves, because it is the only thing standing between a disciplined zero and an unexplained silence.

## Evidence
2026-10-12 was a standing-refusal session: no Plans/2026-10-12 Plan.md existed because the Sunday 20:55 run never completed. Ticks were recorded at 09:44, 10:41, 11:41, 12:41, 13:40, 14:40 and 15:40, plus refresh records at 10:12, 11:11, 12:11, 13:11, 14:11 and 15:11 - no gap anywhere in 09:30-16:05, each naming the ground of refusal and each re-reading equity, positions and the P&L/floor guards from exec.py preflight at that tick rather than carrying the 08:57 numbers forward. Against that, 2026-10-08 skipped its 14:40 tick on defensible grounds (flat book, entry window closed, ~200k subagent tokens saved) and that gap is now the single hole in an otherwise complete day - the same day on which a SPY kill switch had in fact tripped, at a low of 770.44, unseen because the desk stopped reading SPY at 12:12.

## Rule implication
Added to Rules v9: a session the desk refuses to trade must still produce a COMPLETE record. When a standing refusal is in force for a whole session - no plan, a tripped book-wide switch, or a halt - every scheduled tick inside 09:30-16:05 is recorded, none skipped, each naming the ground and re-reading the book and the guards. The v8 allowance for recording a flat no-decision tick directly governs HOW a tick is written, never WHETHER it is written; the saving is seat tokens, never the record.
