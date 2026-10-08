---
type: lesson
date: 2026-10-08
status: applied in Rules v8
review: "[[2026-10-08 Review]]"
rules_version: 8
confidence: high
tickers: [SPY, CTVA]
---
# A kill switch stops being a fact the moment the desk stops reading it

## Observation
A switch recorded as 'not tripped' from an earlier tick's read is not a record of the switch, it is a record of the desk's attention. Dropping a switch from the read list because it 'can only block a side we are not holding' destroys the one thing the switch is also for - evidence, and tomorrow's opening state.

## Evidence
SPY was last read at 12:12 ET (day low 774.18, 0.57 above the 773.61 index kill) and then deliberately not re-read, with the journal's reasoning stated plainly: 'it can only block longs and there is no long left to block'. The 15:46 kill-switch ledger therefore reads 'NOT tripped - INDEX KILL (SPY < 773.61 - last read 774.71 at 12:12)'. The actual SPY day low was 770.44: 3.17 through the 773.61 index kill and also through the 770.00 flatten-all-longs limb, with a 773.93 close that conceals the breach. The 14:40 tick was skipped, so no read existed between 12:12 and 15:41.

## Rule implication
Data hygiene, and plan kill switches. A switch's state may be recorded as tripped/not tripped only from a read taken at that tick; otherwise it is recorded 'state UNKNOWN since HH:MM'. A switch may not be dropped from the read list because of what the book currently holds. Applied as a tighten in v8, with the companion rule that a directly-recorded tick must still refresh every switch or mark it unknown.
