---
type: lesson
date: 2026-10-08
status: applied in Rules v8
review: "[[2026-10-08 Review]]"
rules_version: 8
confidence: high
tickers: [IREN]
---
# Firecrawl calls are not credits, and a tag filter can cost the number

## Observation
Two separate budget defects compound on a low-credit account. First, a budget counted in calls understates the real burn by up to 2x, because a search costs 2 credits and a scrape 1 - so the desk's hardcoded '1 scrape + 5 searches' is 11 credits, not 6 calls. Second, filtering a scrape's response to save tokens can drop the element that carries the number the scrape was taken for, spending the credit and returning nothing usable.

## Evidence
Measured this session: four stockanalysis quote scrapes each returned creditsUsed 1 (TEM, CTVA, IREN, SPY) and an earlier firecrawl_search returned creditsUsed 2; Firecrawl's own agent_hint flagged the account as low on credits on every call. The hardcoded Seat 7 brief at Scripts/desk.workflow.js:461 reads 'Budget: 1 scrape + 5 searches' = 11 credits per tick, and the execution monitor's line 452 reads '7 scrapes' = 7 more. In this review the IREN scrape was taken with includeTags ['table','h1'] to limit output; the price block is in neither tag, so the 16:00 close was lost and the 4-credit budget was already spent - IREN's close is unknown in this Review for that reason alone.

## Rule implication
Data hygiene - Firecrawl. Budgets are stated in CREDITS (scrape 1, search 2) and every seat reports creditsUsed from the response metadata; a scrape taken for a specific number must not filter out the element carrying it. Applied as a tighten in v8. The code-side fix (make the hardcoded literal read from an optional arg) is proposed, not applied from this session.
