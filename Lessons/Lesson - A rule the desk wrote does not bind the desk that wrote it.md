---
type: lesson
date: 2026-10-12
status: applied in Rules v9
review: "[[2026-10-12 Review]]"
rules_version: 9
confidence: high
samples: 2
tickers: [SPY]
---
# A rule the desk wrote does not bind the desk that wrote it

## Observation
A rule that exists only as a prohibition is enforced by whoever happens to be acting remembering it at the moment of acting — which is to say, by nothing. The orchestrator violated a Rules v8 clause it had itself written six days earlier, in a file it had re-read that same morning, because nothing in the act of scraping forced a consult. The second failure of the same rule is not a memory problem to be solved by resolving harder; it is evidence that the rule was written in the wrong form. A prohibition tells you what not to do and leaves the compliant action to be reconstructed each time. A named known-good recipe makes the compliant action the one that is easiest to copy, and it is the only version of the rule that changes behaviour.

## Evidence
Rules v8, written 2026-10-08, states: "A scrape taken to obtain a specific number must not filter that number out of the response: no includeTags that drops the quote/price block." On 2026-10-12 at 13:10 the orchestrator scraped stockanalysis.com/etf/spy/ with includeTags ["table"] and excludeTags ["nav","footer","a"]. The response carried the statistics table and no last price — a quote containing no quote. The recovery used formats ["json"], which returned creditsUsed 5. Total for one symbol, on a day with no plan and no position: 6 credits, the entire stated refresh budget, after the 11:10 and 12:10 scrapes had been deliberately skipped to conserve 2. This is the second instance of the same clause failing: the first was the Coach's own IREN scrape on 2026-10-08, filtered to ["table","h1"], which lost IREN's 16:00 close.

## Rule implication
Data hygiene - Firecrawl, tightened in v9 three ways. (1) Budgets are stated in CREDITS PER FORMAT, with the newly measured json cost named: markdown scrape 1, search 2, json extraction 5. (2) The known-good recipe is written into the rule itself — includeTags ["table","h1","div"] with NO excludeTags returns both the statistics table and the real-time price card for 1 credit, verified twice on 2026-10-12 — so the compliant call can be copied rather than derived. (3) The clause now covers excludeTags as well as includeTags, and states explicitly that it binds the orchestrator exactly as it binds the seats. The general form of this lesson is worth carrying beyond Firecrawl: when a rule fails twice, rewrite it to name the correct action, not to forbid the wrong one more loudly.
