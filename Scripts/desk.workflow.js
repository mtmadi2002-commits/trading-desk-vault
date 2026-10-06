export const meta = {
  name: 'trading-desk',
  description: 'Seven-seat day-trading desk with four modes: plan (evening), premarket (09:00 ET), monitor (intraday, paper execution), coach (after close, learns and rewrites rules)',
  phases: [
    { title: 'Screen', detail: 'Screener builds the watchlist' },
    { title: 'Analyze', detail: 'Macro, Technical, Catalyst, Smart-Money analysts in parallel' },
    { title: 'Plan', detail: 'Head Trader drafts the playbook' },
    { title: 'Risk Review', detail: 'Risk Manager tries to veto every trade' },
    { title: 'Finalize', detail: 'Head Trader issues the final plan' },
    { title: 'Premarket', detail: 'Re-level the plan against pre-market prices' },
    { title: 'Monitor', detail: 'Execution seat (paper) + Smart-Money watch' },
    { title: 'Coach', detail: 'Replay vs actual bars, grade seats, rewrite rules' },
  ],
}

// ---- args: { mode, date (session YYYY-MM-DD), day (weekday name), now_et, vault_dir, vault_url, rules, prior_notes, plan (json for premarket/monitor/coach), journal (json rows), premarket (json), av_calls_remaining }
const A = args || {}
const MODE = A.mode || 'plan'
const DATE = A.date || 'UNKNOWN-DATE'
const DAY = A.day || 'the session day'
const NOW = A.now_et || 'unknown'
const VAULT = A.vault_dir || '/tmp/vault'
const VURL = A.vault_url || ''
const RULES = A.rules || '(rules not supplied — use desk defaults: 0.5% risk, max 2 concurrent, 1.0% open-risk cap, -1.5% daily stop, stops 0.7-1.5x ATR)'
const PRIOR = A.prior_notes || 'none supplied — discover the prior session from finviz (SPY/QQQ/IWM quote pages and the screeners).'
const AVLEFT = (A.av_calls_remaining !== undefined) ? A.av_calls_remaining : 20

const CTX = `
=== DESK CONTEXT (shared by every seat) ===
Mode: ${MODE}. Session being traded: ${DAY} ${DATE} (US regular session 09:30-16:00 ET). Time now: ${NOW} ET.
PRIOR NOTES (from the orchestrating session; verified unless marked otherwise):
${PRIOR}

=== DATA SOURCES & HARD LIMITS ===
1) Alpha Vantage MCP (load with ToolSearch 'select:mcp__Alpha_Vantage_MCP_Server__<NAME>'): FREE key = 25 requests/DAY shared across the whole desk, 1 req/sec. About ${AVLEFT} remain today. You have a per-seat CAP stated in your brief. NEVER exceed it. Space calls >=2s apart. Endpoints marked 'premium' (e.g. REALTIME_BULK_QUOTES) return FAKE sample data on this key — if a response says 'premium endpoint' or shows 2024 timestamps or MSFT/AAPL/IBM placeholder rows, DISCARD it. Working: GLOBAL_QUOTE, TIME_SERIES_INTRADAY (interval 5min, outputsize compact, extended_hours false, datatype json), TIME_SERIES_DAILY, EARNINGS_CALENDAR, NEWS_SENTIMENT, CONGRESS_TRADES, INSIDER_TRANSACTIONS. On a rate_limit error STOP calling Alpha Vantage and fall back to web.
2) Firecrawl scrape (ToolSearch 'select:mcp__Firecrawl__firecrawl_scrape'): works on finviz.com — https://finviz.com/quote.ashx?t=NU (price, prev close, AH, ATR, RSI, avg vol, rel vol, short float, earnings date, SMA20/50/200, 52w range, insider rows, headlines), https://finviz.com/screener.ashx?v=171&s=ta_topgainers&f=sh_avgvol_o1000,sh_price_o5 (technical view; also s=ta_toplosers, ta_unusualvolume, ta_mostactive), https://finviz.com/insidertrading.ashx (live Form 4 feed), and on stockanalysis.com quote pages (Open / Day's Range / Volume / AH). Use formats ['markdown'], onlyMainContent true, maxAge 0. finviz free quotes are 15-20 min delayed.
3) WEB SEARCH: mcp__Firecrawl__firecrawl_search (ToolSearch 'select:mcp__Firecrawl__firecrawl_search'; {query, limit: 6, sources: ['web']}, tbs 'qdr:d' last 24h or 'qdr:h' last hour). Do NOT use mcp__Parallel_Search__* (it hung for 8+ minutes in a previous run). One objective per call.
3b) FIRECRAWL RATE LIMIT: ~10 requests/MINUTE shared by the whole desk (scrape AND search), up to four seats at once. Issue requests ONE AT A TIME with 'sleep 7' via Bash between them. On 'Rate limit exceeded': 'sleep 35', retry ONCE, then move on. Large pages are saved to a file path — parse with jq -r '.markdown' | grep for the row labels you need; never read the whole file.
4) THE VAULT (Obsidian, local copy at ${VAULT}): Desk/Rules.md (living rules — binding), Plans/<date> Plan.md, Journal/<date> Journal.md, Reviews/, Lessons/, Tickers/. Read what your brief names; write NOTHING to the vault yourself — return data; the orchestrator writes notes.
Raw curl to the internet is BLOCKED — do not try.

=== DESK RULES (summary; the full living rules are passed to the Head Trader, Risk Manager and Coach) ===
- Cite every number with its source (finviz / stockanalysis / AV / article URL). Never invent prices or levels; say 'unknown' instead.
- Universe: US-listed, price >= $5, avg volume >= 1M. Correlated names are ONE slot.
- Sizes in % of equity: 0.5% default, 0.25% low confidence, never > 0.75%; max 2 concurrent; total open risk <= 1.0%; daily hard stop -1.5%; no overnight holds; flat by 15:55 ET.
- Your output is DATA for the next seat, not prose for a human. Dense and specific.
`

// ---------- shared schemas (used by plan mode) ----------
const SCREEN_SCHEMA = {
  type: 'object',
  properties: {
    watchlist: { type: 'array', items: { type: 'object', properties: {
      ticker: { type: 'string' }, close: { type: 'number' }, change_pct: { type: 'number' },
      volume: { type: 'number' }, avg_volume: { type: 'number' }, rel_volume: { type: 'number' },
      atr: { type: 'number' }, rsi: { type: 'number' }, short_float_pct: { type: 'number' },
      why: { type: 'string' }, setup_type: { type: 'string', enum: ['gap-and-go','gap-fade','momentum-continuation','mean-reversion','range','news-catalyst','sector-sympathy','avoid'] },
      source: { type: 'string' } }, required: ['ticker','close','change_pct','why','setup_type','source'] } },
    excluded: { type: 'array', items: { type: 'object', properties: { ticker: { type: 'string' }, reason: { type: 'string' } }, required: ['ticker','reason'] } },
    sector_themes: { type: 'array', items: { type: 'string' } },
    data_notes: { type: 'string' },
  },
  required: ['watchlist','excluded','sector_themes','data_notes'],
}

const MACRO_SCHEMA = {
  type: 'object',
  properties: {
    regime: { type: 'string', enum: ['risk-on','risk-off','chop','event-driven'] },
    regime_rationale: { type: 'string' },
    spy_levels: { type: 'object', properties: { support: { type: 'array', items: { type: 'number' } }, resistance: { type: 'array', items: { type: 'number' } }, source: { type: 'string' } }, required: ['support','resistance','source'] },
    overnight: { type: 'string' },
    calendar_tuesday: { type: 'array', items: { type: 'object', properties: { time_et: { type: 'string' }, event: { type: 'string' }, impact: { type: 'string' }, source: { type: 'string' } }, required: ['time_et','event','impact','source'] } },
    brazil_story: { type: 'object', properties: { what_happened: { type: 'string' }, day2_bias: { type: 'string' }, key_risks: { type: 'string' }, sources: { type: 'array', items: { type: 'string' } } }, required: ['what_happened','day2_bias','key_risks','sources'] },
    sector_bias: { type: 'array', items: { type: 'object', properties: { sector: { type: 'string' }, bias: { type: 'string' }, why: { type: 'string' } }, required: ['sector','bias','why'] } },
    no_trade_windows: { type: 'array', items: { type: 'string' } },
    data_notes: { type: 'string' },
  },
  required: ['regime','regime_rationale','spy_levels','overnight','calendar_tuesday','brazil_story','sector_bias','no_trade_windows','data_notes'],
}

const TECH_SCHEMA = {
  type: 'object',
  properties: {
    names: { type: 'array', items: { type: 'object', properties: {
      ticker: { type: 'string' }, close: { type: 'number' }, atr14: { type: 'number' }, rsi14: { type: 'number' },
      intraday_structure: { type: 'string' },
      key_levels: { type: 'object', properties: { resistance: { type: 'array', items: { type: 'number' } }, support: { type: 'array', items: { type: 'number' } }, monday_high: { type: 'number' }, monday_low: { type: 'number' }, monday_vwap_est: { type: 'number' } }, required: ['resistance','support'] },
      long_setup: { type: 'object', properties: { trigger: { type: 'string' }, entry: { type: 'number' }, stop: { type: 'number' }, target1: { type: 'number' }, target2: { type: 'number' }, rr: { type: 'number' }, invalidation: { type: 'string' } }, required: ['trigger','entry','stop','target1','rr','invalidation'] },
      short_setup: { type: 'object', properties: { trigger: { type: 'string' }, entry: { type: 'number' }, stop: { type: 'number' }, target1: { type: 'number' }, target2: { type: 'number' }, rr: { type: 'number' }, invalidation: { type: 'string' } }, required: ['trigger','entry','stop','target1','rr','invalidation'] },
      grade: { type: 'string', enum: ['A','B','C','F'] }, grade_why: { type: 'string' }, sources: { type: 'array', items: { type: 'string' } } },
      required: ['ticker','close','intraday_structure','key_levels','long_setup','short_setup','grade','grade_why','sources'] } },
    av_calls_used: { type: 'number' },
    data_notes: { type: 'string' },
  },
  required: ['names','av_calls_used','data_notes'],
}

const CAT_SCHEMA = {
  type: 'object',
  properties: {
    names: { type: 'array', items: { type: 'object', properties: {
      ticker: { type: 'string' }, catalyst: { type: 'string' }, catalyst_date: { type: 'string' },
      catalyst_type: { type: 'string', enum: ['earnings','M&A','FDA/clinical','macro/political','guidance','analyst','index/flow','unknown'] },
      fresh_or_stale: { type: 'string', enum: ['fresh-<24h','1-3d','stale','unknown'] },
      day2_expectation: { type: 'string' }, earnings_next: { type: 'string' },
      sentiment: { type: 'string' }, sources: { type: 'array', items: { type: 'string' } } },
      required: ['ticker','catalyst','catalyst_type','fresh_or_stale','day2_expectation','sources'] } },
    tuesday_earnings_premarket: { type: 'array', items: { type: 'string' } },
    tuesday_earnings_afterclose: { type: 'array', items: { type: 'string' } },
    new_overnight_catalysts: { type: 'array', items: { type: 'object', properties: { ticker: { type: 'string' }, headline: { type: 'string' }, source: { type: 'string' } }, required: ['ticker','headline','source'] } },
    av_calls_used: { type: 'number' },
    data_notes: { type: 'string' },
  },
  required: ['names','tuesday_earnings_premarket','tuesday_earnings_afterclose','new_overnight_catalysts','av_calls_used','data_notes'],
}

const SMART_SCHEMA = {
  type: 'object',
  properties: {
    insider_activity: { type: 'array', items: { type: 'object', properties: {
      ticker: { type: 'string' }, who: { type: 'string' }, role: { type: 'string' }, action: { type: 'string', enum: ['buy','sell','option-exercise','other'] },
      shares: { type: 'number' }, value_usd: { type: 'number' }, trade_date: { type: 'string' }, filed_date: { type: 'string' },
      signal: { type: 'string' }, latency: { type: 'string' }, source: { type: 'string' } },
      required: ['ticker','who','action','trade_date','signal','latency','source'] } },
    congress_trades: { type: 'array', items: { type: 'object', properties: {
      ticker: { type: 'string' }, politician: { type: 'string' }, party: { type: 'string' }, action: { type: 'string' },
      amount_range: { type: 'string' }, trade_date: { type: 'string' }, filed_date: { type: 'string' }, signal: { type: 'string' }, source: { type: 'string' } },
      required: ['ticker','politician','action','trade_date','filed_date','signal','source'] } },
    institutions_13f: { type: 'array', items: { type: 'object', properties: {
      institution: { type: 'string' }, ticker: { type: 'string' }, change: { type: 'string' }, as_of_quarter: { type: 'string' }, note: { type: 'string' }, source: { type: 'string' } },
      required: ['institution','ticker','change','as_of_quarter','source'] } },
    top_trader_positioning: { type: 'array', items: { type: 'object', properties: {
      who: { type: 'string' }, what: { type: 'string' }, when: { type: 'string' }, tradable_for_us: { type: 'string' }, source: { type: 'string' } },
      required: ['who','what','when','tradable_for_us','source'] } },
    public_figure_statements: { type: 'array', items: { type: 'object', properties: {
      who: { type: 'string' }, when: { type: 'string' }, statement: { type: 'string' }, market_implication: { type: 'string' }, affected_tickers: { type: 'array', items: { type: 'string' } }, source: { type: 'string' } },
      required: ['who','when','statement','market_implication','affected_tickers','source'] } },
    government_actions: { type: 'array', items: { type: 'object', properties: {
      agency: { type: 'string' }, when: { type: 'string' }, action: { type: 'string' }, market_implication: { type: 'string' }, affected_tickers: { type: 'array', items: { type: 'string' } }, source: { type: 'string' } },
      required: ['agency','when','action','market_implication','affected_tickers','source'] } },
    geopolitical: { type: 'array', items: { type: 'object', properties: {
      region: { type: 'string' }, when: { type: 'string' }, event: { type: 'string' }, market_implication: { type: 'string' }, affected_tickers: { type: 'array', items: { type: 'string' } }, source: { type: 'string' } },
      required: ['region','when','event','market_implication','affected_tickers','source'] } },
    watchlist_flags: { type: 'array', items: { type: 'object', properties: { ticker: { type: 'string' }, flag: { type: 'string', enum: ['smart-money-confirms-long','smart-money-confirms-short','smart-money-contradicts','insider-selling-into-strength','no-signal'] }, why: { type: 'string' } }, required: ['ticker','flag','why'] } },
    monitoring_feed_spec: { type: 'array', items: { type: 'object', properties: { feed: { type: 'string' }, url_or_tool: { type: 'string' }, true_latency: { type: 'string' }, poll_interval: { type: 'string' } }, required: ['feed','url_or_tool','true_latency','poll_interval'] } },
    av_calls_used: { type: 'number' },
    data_notes: { type: 'string' },
  },
  required: ['insider_activity','congress_trades','institutions_13f','top_trader_positioning','public_figure_statements','government_actions','geopolitical','watchlist_flags','monitoring_feed_spec','av_calls_used','data_notes'],
}

const PLAN_SCHEMA = {
  type: 'object',
  properties: {
    market_thesis: { type: 'string' },
    regime: { type: 'string' },
    trades: { type: 'array', items: { type: 'object', properties: {
      rank: { type: 'number' }, ticker: { type: 'string' }, direction: { type: 'string', enum: ['long','short'] },
      setup: { type: 'string' }, thesis: { type: 'string' },
      entry_trigger: { type: 'string' }, entry_price: { type: 'number' }, stop: { type: 'number' },
      target1: { type: 'number' }, target2: { type: 'number' }, rr: { type: 'number' },
      size_pct_equity_at_risk: { type: 'number' }, position_size_formula: { type: 'string' },
      time_window_et: { type: 'string' }, management: { type: 'string' }, invalidation: { type: 'string' },
      confidence: { type: 'string', enum: ['high','medium','low'] }, sources: { type: 'array', items: { type: 'string' } } },
      required: ['rank','ticker','direction','setup','thesis','entry_trigger','entry_price','stop','target1','rr','size_pct_equity_at_risk','position_size_formula','time_window_et','management','invalidation','confidence','sources'] } },
    watch_only: { type: 'array', items: { type: 'object', properties: { ticker: { type: 'string' }, why: { type: 'string' } }, required: ['ticker','why'] } },
    do_not_trade: { type: 'array', items: { type: 'object', properties: { ticker: { type: 'string' }, why: { type: 'string' } }, required: ['ticker','why'] } },
    session_rules: { type: 'array', items: { type: 'string' } },
    kill_switches: { type: 'array', items: { type: 'string' } },
    open_questions: { type: 'array', items: { type: 'string' } },
  },
  required: ['market_thesis','regime','trades','watch_only','do_not_trade','session_rules','kill_switches','open_questions'],
}

const RISK_SCHEMA = {
  type: 'object',
  properties: {
    verdicts: { type: 'array', items: { type: 'object', properties: {
      ticker: { type: 'string' }, direction: { type: 'string' },
      verdict: { type: 'string', enum: ['approve','approve-with-changes','veto'] },
      objections: { type: 'array', items: { type: 'string' } },
      required_changes: { type: 'array', items: { type: 'string' } },
      corrected_stop: { type: 'number' }, corrected_size_pct: { type: 'number' },
      stop_distance_vs_atr: { type: 'string' }, correlation_flag: { type: 'string' } },
      required: ['ticker','direction','verdict','objections','required_changes'] } },
    portfolio_objections: { type: 'array', items: { type: 'string' } },
    correlation_matrix_note: { type: 'string' },
    worst_case_day_pct: { type: 'number' },
    max_concurrent_allowed: { type: 'number' },
    additional_kill_switches: { type: 'array', items: { type: 'string' } },
    data_integrity_issues: { type: 'array', items: { type: 'string' } },
  },
  required: ['verdicts','portfolio_objections','correlation_matrix_note','worst_case_day_pct','max_concurrent_allowed','additional_kill_switches','data_integrity_issues'],
}


// ================= MODE: PLAN (seven seats) =================
async function runPlan() {
phase('Screen')
log('Seat 1/7 — Screener building the ' + DATE + ' watchlist')
const screen = await agent(`You are SEAT 1: the SCREENER on a seven-seat day-trading desk.
${CTX}
YOUR JOB: Build the ${DATE} watchlist (6-10 names) from the PRIOR SESSION's action (the last completed US session before ${DATE}). Universe rule: price >= $5 AND average volume >= 1M (prefer >= 3M) — liquidity so stops actually fill.
Method:
1. Scrape finviz screener TECHNICAL view (v=171) for signals ta_topgainers, ta_toplosers, ta_unusualvolume, ta_mostactive with filter f=sh_avgvol_o1000,sh_price_o5 — this gives ATR, RSI, rel volume, change, gap per row. URL pattern: https://finviz.com/screener.ashx?v=171&s=<signal>&f=sh_avgvol_o1000,sh_price_o5
2. For each candidate that interests you (max 10), scrape https://finviz.com/quote.ashx?t=<TICKER> to get avg volume, short float, earnings date, SMA distances, and the headline list (note the top 3 headlines + dates).
3. Classify each name by setup_type. Group CORRELATED names (same country ETF basket, same sector theme, same deal) into ONE slot and keep only the 1-2 most liquid vehicles of each group; list single-name catalyst movers separately; include 1-2 liquid losers for bounce/continuation shorts. Use PRIOR NOTES for the big story if supplied; otherwise infer it from the screens' headlines.
4. Exclude and list why: anything < $5, thin, halted-prone, or purely sub-$1 lottery tickers (MI, BEAT, etc.).
Alpha Vantage CAP for this seat: 0 calls. Firecrawl budget: 12 scrapes TOTAL (4 screens + up to 8 quote pages), one at a time, 'sleep 7' between. NO web searches — the Catalyst and Macro seats own the news; just note the headlines finviz shows. Finish within ~6 minutes; a complete list of 8 beats a perfect list of 10.
Return the watchlist with numeric fields filled from finviz (write null-free numbers only where you actually read them; otherwise omit the optional field).`,
  { label: 'screener', phase: 'Screen', schema: SCREEN_SCHEMA })

const tickers = screen.watchlist.filter(w => w.setup_type !== 'avoid').map(w => w.ticker)
log(`Watchlist: ${tickers.join(', ')} — fanning out Macro, Technical, Catalyst`)
const WL = JSON.stringify(screen.watchlist, null, 1)

phase('Analyze')
const [macro, tech, cat, smart] = await parallel([
  () => agent(`You are SEAT 2: the MACRO / REGIME analyst.
${CTX}

WATCHLIST FROM SCREENER (for sector-bias context): ${tickers.join(', ')}
Firecrawl budget for this seat: 2 scrapes + 5 searches.
YOUR JOB: Tell the desk what kind of day ${DAY} ${DATE} is likely to be and where the index lines are.
1. Web-search (firecrawl_search) for: 'stock market today' + the prior session's date (close recap: S&P/Nasdaq/Dow levels, breadth, yields, oil); 'stock futures ${DATE}' (overnight); 'economic calendar ${DATE}' (data releases, Fed speakers, Treasury auctions — verify against an official source such as bls.gov before listing a release); the prior session's BIG STORY (from PRIOR NOTES or the Screener's headlines) — what happened, why markets moved, what is scheduled next; 'Asia markets' for the overnight tone.
2. SPY levels: take the prior session's O/H/L/C from PRIOR NOTES if present, else scrape https://stockanalysis.com/etf/spy/ (Open, Day's Range, Previous Close). Scrape https://finviz.com/quote.ashx?t=SPY for SMA20/50, 52w high, ATR, RSI. Derive support/resistance from the prior session's H/L, the prior day's levels, and round numbers; state each level's source.
3. Define no-trade windows (e.g. 10:00 ET data release ±5 min, first 2 minutes after the open if gap > X).
Alpha Vantage CAP for this seat: 1 call max (optional — e.g. GLOBAL_QUOTE on VXX or TLT). Prefer web.
Be concrete about the day-2 bias for the prior session's biggest theme: after an outsized one-day move on a surprise, what tends to happen on day 2 (gap-and-fade vs continuation), and what would flip it. Label anything from memory as 'not web-verified'.
    { label: 'macro', phase: 'Analyze', schema: MACRO_SCHEMA }),

  () => agent(`You are SEAT 3: the TECHNICAL analyst.
${CTX}

SCREENER WATCHLIST (with the numbers the screener already pulled — reuse them, do not re-fetch what is here):
${WL}
Firecrawl budget for this seat: 6 scrapes, 0 searches.
YOUR JOB: For the TOP 6 names (by liquidity and setup quality — choose them), produce precise intraday levels and both a long and a short setup, each with entry/stop/target/R:R. Grade each A/B/C/F for ${DATE}.
Data plan — Alpha Vantage CAP for this seat: 6 calls TOTAL, spaced >=2s apart. Spend them on TIME_SERIES_INTRADAY (interval '5min', outputsize 'compact', extended_hours false, datatype 'json') for your 4-6 highest-conviction names to read the prior session's intraday structure: where the open was, whether it closed at highs or faded, the afternoon range, approximate VWAP (sum(close*vol)/sum(vol) over the prior session's bars — compute it with a quick python3 -I or jq script over the returned bars rather than eyeballing). If a response says 'premium' or is rate-limited, stop and fall back to finviz quote pages + web.
For ATR/RSI/SMA use finviz quote pages (https://finviz.com/quote.ashx?t=X) — do not spend AV calls on indicators.
Rules for setups: stop must be a structure level (prior-session low/high, VWAP, pre-market level), not an arbitrary %; stop distance must be >= 0.7x ATR14 and <= 1.5x (the living rules' floor) so noise does not stop you; R:R >= 1.5 at T1 after that stop for grade A/B. Group correlated names and recommend the single best vehicle per group.
Report av_calls_used accurately.`,
    { label: 'technical', phase: 'Analyze', schema: TECH_SCHEMA }),

  () => agent(`You are SEAT 4: the CATALYST / NEWS analyst.
${CTX}

SCREENER WATCHLIST: ${tickers.join(', ')} (full detail: ${WL})
Firecrawl budget for this seat: 2 scrapes + 8 searches.
YOUR JOB: For every watchlist name, establish WHAT moved it, WHEN, whether it is fresh or stale, and what day-2 usually looks like for that catalyst type. Then find anything NEW overnight.
1. Start with the saved news dump (jq over the JSON file in the context) — it is free.
2. Web-search each name's prior-session move: '<TICKER> stock jumps|falls <prior-session date>' — one firecrawl_search call per name (max 8). Capture the headline, publisher, time, and URL.
3. The big story (PRIOR NOTES / Screener themes): confirm the facts and the next scheduled catalyst date; note whether any watchlist name reports earnings this week.
4. ${DAY} earnings: web-search 'earnings ${DATE}' and scrape https://finviz.com/screener.ashx?v=111&f=earningsdate_tomorrow,sh_avgvol_o1000,sh_price_o5 (if the run is the evening before) or f=earningsdate_today (if the run is the same morning) — list pre-market and after-close reporters; flag any watchlist name reporting (that changes the trade).
5. Overnight: web-search 'after hours movers' + prior-session date and 'premarket movers ${DATE}' for anything new.
Alpha Vantage CAP for this seat: 2 calls (EARNINGS_CALENDAR horizon '3month' once, then grep it for ${DATE}; NEWS_SENTIMENT with tickers for 3-4 watchlist names, limit 30, returned nothing useful in a previous run — only use it if the first call was wasted). Space calls >=2s.
Report av_calls_used accurately. Every claim needs a URL.`,
    { label: 'catalyst', phase: 'Analyze', schema: CAT_SCHEMA }),

  () => agent(`You are SEAT 7: the SMART MONEY & POWER monitor. You watch what the people who move markets are doing — top traders, corporate insiders, institutions (BlackRock, Vanguard, big hedge funds), Congress, the White House (Trump, Vance), Elon Musk, and government/intelligence agencies (FBI, DOJ, SEC, OFAC, CIA, Mossad) — and translate it into flags for the watchlist.
${CTX}
SCREENER WATCHLIST: ${tickers.join(', ')}
Firecrawl budget for this seat: 2 scrapes + 9 searches. Alpha Vantage CAP: 3 calls (CONGRESS_TRADES symbol=<ticker> for your 2 most important watchlist names; INSIDER_TRANSACTIONS with from_date = 14 days before ${DATE} for 1 name). Responses may be a 'preview' with trades_truncated — use what the preview gives you and note it.
HONESTY RULE: label every item with its TRUE LATENCY. Form 4 insider filings lag the trade by up to 2 business days; congressional STOCK Act disclosures lag 30-45 days; 13F institutional holdings are quarterly with a 45-day lag; public statements/posts and government announcements are real-time. Intelligence agencies (FBI/CIA/Mossad) do NOT publish what they do — the only tradable signal is what becomes PUBLIC (an announced raid, indictment, sanction, strike, leak). Never claim knowledge of non-public agency activity. Track PEOPLE BY ROLE AND NAME only (title, fund, office) — never by ethnicity, religion or nationality.
Tasks:
1. INSIDERS: scrape https://finviz.com/insidertrading.ashx (latest Form 4 feed; it is large and lands in a file) then jq -r '.markdown' | grep for watchlist tickers ('stock?t=<TICKER>') and for large (>$1M) open-market BUYs by CEOs/CFOs/10% owners (cluster buys matter; option exercises and 10b5-1 sales do not). Spend 1 AV INSIDER_TRANSACTIONS call on the watchlist name with the biggest prior-session move.
2. CONGRESS: AV CONGRESS_TRADES for 2 watchlist names. Also firecrawl_search 'congress stock trades disclosed' + current month/year.
3. INSTITUTIONS / TOP TRADERS: firecrawl_search 'BlackRock 13F biggest buys' + latest quarter, 'hedge fund 13F Burry Ackman Tepper Druckenmiller' + latest quarter, and 'top traders positioning' + the prior session's big theme — capture named positions with dates and whether they are actionable for a DAY trade (usually not; say so).
4. PUBLIC FIGURES (real-time): firecrawl_search with tbs 'qdr:d': 'Trump Truth Social post stocks tariffs' + prior-session date, 'JD Vance statement' + prior-session date, 'Elon Musk post X Tesla SpaceX' + prior-session date — list any statement from the last 48h with a market implication and affected tickers (tariffs → importers/China ADRs; drug pricing → pharma; Musk → TSLA/SPCX/crypto/whatever he names).
5. GOVERNMENT ACTIONS (real-time): firecrawl_search tbs 'qdr:d': 'FBI raid company shares', 'DOJ indictment company stock' + month/year, 'SEC charges' + month/year, 'OFAC sanctions' + month/year.
6. GEOPOLITICAL (real-time): firecrawl_search tbs 'qdr:d': 'Israel Iran strike oil' + month/year, 'Mossad' + month/year, 'Middle East overnight oil prices' — implications for USO/XLE/ITA and risk-off.
7. For EACH watchlist name set a watchlist_flag. Then write monitoring_feed_spec: the exact feeds (URL or MCP tool), their true latency, and a sensible poll interval, so this seat can run on a schedule during market hours.
Report av_calls_used accurately. Every item needs a source URL.`,
    { label: 'smart-money', phase: 'Analyze', schema: SMART_SCHEMA }),
])

if (!screen || !tech) throw new Error('screener or technical seat failed — cannot plan')
log(`Seat 5/6 — Head Trader drafting the playbook`)

phase('Plan')
const draft = await agent(`You are SEAT 5: the HEAD TRADER. You synthesize the desk's work into the executable playbook for ${DAY} ${DATE}.
${CTX}
=== SCREENER ===
${JSON.stringify(screen, null, 1)}
=== MACRO ===
${JSON.stringify(macro, null, 1)}
=== TECHNICAL ===
${JSON.stringify(tech, null, 1)}
=== CATALYST ===
${JSON.stringify(cat, null, 1)}
=== SMART MONEY & POWER (Seat 7) ===
${JSON.stringify(smart, null, 1)}

YOUR JOB: Produce the playbook for ${DATE}. First, the LIVING DESK RULES (binding, maintained by the Coach):
${RULES}
Rules:
- 3 to 5 ranked trades max, only grade A/B technical setups whose catalyst is understood and whose direction agrees with the macro regime. No two trades that are the same bet (a correlated basket = one slot).
- Each trade: conditional entry trigger (what must print before you click), entry price, structure stop, T1/T2, R:R, size as % equity at risk (default 0.5%, 0.25% for 'low' confidence, never above 0.75%), the share-count formula (shares = (equity * risk%) / (entry - stop)), time window, management (scale at T1, trail to breakeven), invalidation.
- Mark which trades are mutually exclusive and the max concurrent count.
- session_rules: open behaviour (no entries first N minutes), no-trade windows from macro, daily loss limit -1.5% hard stop, max 3 positions, flat by 15:55 ET.
- kill_switches: conditions under which the whole plan is scrapped (e.g. SPY opens below X, the theme ETF gaps down > Y%, a named real-time headline).
- Use Seat 7's watchlist_flags: 'smart-money-contradicts' or 'insider-selling-into-strength' lowers confidence one notch or drops the trade; a real-time political/government/geopolitical item touching a name is a kill-switch candidate. Respect Seat 7's latency labels — a 45-day-old congressional trade is context, not a signal.
- Do NOT use any number you cannot trace to a seat's cited source. If seats conflict, say which you trust and why in the thesis.
- open_questions: things to check at 09:00 ET pre-market that would change sizing (pre-market gap, overnight news).
You do not need to call any tools; synthesize. Alpha Vantage CAP: 0.`,
  { label: 'head-trader-draft', phase: 'Plan', schema: PLAN_SCHEMA })

log(`Draft has ${draft.trades.length} trades — Seat 6/6 Risk Manager attacking it`)

phase('Risk Review')
const risk = await agent(`You are SEAT 6: the RISK MANAGER. Your job is to VETO. Assume every trade in the draft is a loser until proven otherwise.
${CTX}
=== DRAFT PLAYBOOK ===
${JSON.stringify(draft, null, 1)}
=== TECHNICAL (for ATR / levels) ===
${JSON.stringify(tech.names.map(n => ({ ticker: n.ticker, close: n.close, atr14: n.atr14, rsi14: n.rsi14, key_levels: n.key_levels, grade: n.grade })), null, 1)}
=== SMART MONEY FLAGS (Seat 7) ===
${JSON.stringify({ flags: smart && smart.watchlist_flags, public_figures: smart && smart.public_figure_statements, government: smart && smart.government_actions, geopolitical: smart && smart.geopolitical }, null, 1)}
=== MACRO (for regime / calendar) ===
${JSON.stringify({ regime: macro && macro.regime, calendar: macro && macro.calendar_tuesday, no_trade_windows: macro && macro.no_trade_windows, brazil_day2: macro && macro.brazil_story }, null, 1)}

The LIVING DESK RULES (binding):
${RULES}
For EACH trade check and write explicit findings:
1. Stop distance vs ATR14: if stop < 0.5x ATR it is noise and will be hit — require a change. If > 1.5x ATR the R:R is probably fiction.
2. Does the entry trigger actually prevent chasing? A 'buy above the prior session's high' on a name already +30% is a chase — demand a pullback/hold structure or veto.
3. Day-2 statistics for the catalyst type: large-cap election/macro gaps vs small-cap biotech pops vs M&A (M&A targets are DEAD money — veto day-trades on an acquired company at the deal price).
4. Correlation: count how many trades are effectively one bet (same country basket, same sector, risk-on). Set max_concurrent_allowed.
5. Liquidity: avg volume >= 1M and spread sane for the stop size; otherwise veto.
6. Data integrity: did any seat cite numbers that look like Alpha Vantage premium sample data (2024 timestamps, MSFT/AAPL/IBM placeholder rows), or levels with no source? List them.
7. Compute worst_case_day_pct = sum of size_pct across the max concurrent trades assuming all stop out with 20% slippage — must be <= 1.5% or demand smaller sizes.
8. Verify the position_size_formula is dimensionally right.
Verdict options: approve / approve-with-changes (give corrected_stop and corrected_size_pct) / veto. Be specific and quantitative. If you need a datum, you may scrape a finviz quote page (no Alpha Vantage calls — CAP 0).`,
  { label: 'risk-manager', phase: 'Risk Review', schema: RISK_SCHEMA })

const vetoed = risk.verdicts.filter(v => v.verdict === 'veto').map(v => v.ticker)
log(`Risk: ${vetoed.length} vetoed (${vetoed.join(', ') || 'none'}), ${risk.verdicts.filter(v => v.verdict === 'approve-with-changes').length} need changes — finalizing`)

phase('Finalize')
const final = await agent(`You are SEAT 5 again: the HEAD TRADER, issuing the FINAL playbook after risk review. The Risk Manager's vetoes are BINDING. 'approve-with-changes' items must adopt the corrected stop/size exactly. Address every portfolio objection and data-integrity issue (drop any number flagged as unsourced or sample data).
${CTX}
=== YOUR DRAFT ===
${JSON.stringify(draft, null, 1)}
=== RISK MANAGER REVIEW ===
${JSON.stringify(risk, null, 1)}

Output the final PLAN_SCHEMA object. In market_thesis, add a short paragraph 'Changes after risk review:' listing what was vetoed/resized and why. Keep max concurrent <= risk.max_concurrent_allowed. Merge risk.additional_kill_switches into kill_switches. No tools needed.`,
  { label: 'head-trader-final', phase: 'Finalize', schema: PLAN_SCHEMA })

return { screen, macro, tech, cat, smart, draft, risk, final }
}


// ================= MODE: PREMARKET =================
const PREMARKET_SCHEMA = {
  type: 'object',
  properties: {
    as_of_et: { type: 'string' },
    quotes: { type: 'array', items: { type: 'object', properties: { ticker: { type: 'string' }, premarket: { type: 'number' }, prev_close: { type: 'number' }, gap_pct: { type: 'number' }, premarket_volume: { type: 'number' }, source: { type: 'string' } }, required: ['ticker','prev_close','source'] } },
    index_check: { type: 'string' },
    overnight_news: { type: 'array', items: { type: 'string' } },
    trade_status: { type: 'array', items: { type: 'object', properties: { ticker: { type: 'string' }, status: { type: 'string', enum: ['live','live-halved','vwap-retest-only','scrapped'] }, why: { type: 'string' }, relevelled: { type: 'object', properties: { entry: { type: 'number' }, stop: { type: 'number' }, target1: { type: 'number' }, target2: { type: 'number' }, size_pct: { type: 'number' } } } }, required: ['ticker','status','why'] } },
    kill_switches_tripped: { type: 'array', items: { type: 'string' } },
    checklist_answers: { type: 'array', items: { type: 'object', properties: { question: { type: 'string' }, answer: { type: 'string' } }, required: ['question','answer'] } },
    alert_text: { type: 'string' },
    data_notes: { type: 'string' },
  },
  required: ['as_of_et','quotes','index_check','overnight_news','trade_status','kill_switches_tripped','checklist_answers','alert_text','data_notes'],
}

async function runPremarket() {
  phase('Premarket')
  log('Premarket re-level of the plan for ' + DATE)
  const plan = A.plan ? JSON.stringify(A.plan, null, 1) : '(no plan supplied)'
  return await agent(`You are the HEAD TRADER at 09:00 ET doing the pre-market re-level.
${CTX}
=== LIVING RULES ===
${RULES}
=== TONIGHT'S FINAL PLAN (from Plans/${DATE} Plan.md, structured) ===
${plan}

YOUR JOB (Firecrawl budget: 8 scrapes + 3 searches, one at a time, 'sleep 7' between; Alpha Vantage CAP: 0):
1. Scrape finviz quote pages for every plan ticker, plus SPY, EWZ (if any Brazil name is in the plan), and TLT (10Y proxy). From each page read Prev Close, the premarket/aftermarket quote line (finviz shows 'Premarket' or 'Aftermarket' with % change) and the first 3 headlines with times. Compute gap_pct = (premarket / prev_close - 1) * 100.
2. Three firecrawl_search calls (tbs 'qdr:h' or 'qdr:d'): 'stock futures premarket ${DATE}', one for the plan's dominant theme (e.g. 'Brazil Ibovespa futures ${DATE}', 'Iran Gulf overnight ${DATE}'), and one for the top-ranked ticker's overnight news.
3. Answer EVERY open question in the plan from what you found (say 'unknown' if not found).
4. Apply the plan's own kill switches and sizing rules mechanically to the pre-market numbers: for each trade set status live / live-halved / vwap-retest-only / scrapped with the exact rule that fired, and relevel entry/stop/targets ONLY if the plan says to (e.g. 're-level if the 09:00 pull differs').
5. alert_text: a 6-10 line message for the trader's phone: what is live, what is scrapped and why, the two numbers to watch at 09:45.
Return PREMARKET_SCHEMA.`, { label: 'premarket-relevel', phase: 'Premarket', schema: PREMARKET_SCHEMA })
}

// ================= MODE: MONITOR =================
const MONITOR_SCHEMA = {
  type: 'object',
  properties: {
    as_of_et: { type: 'string' },
    quote_delay_note: { type: 'string' },
    quotes: { type: 'array', items: { type: 'object', properties: { ticker: { type: 'string' }, last: { type: 'number' }, change_pct: { type: 'number' }, day_high: { type: 'number' }, day_low: { type: 'number' }, volume: { type: 'number' }, source: { type: 'string' } }, required: ['ticker','last','source'] } },
    paper_actions: { type: 'array', items: { type: 'object', properties: {
      ticker: { type: 'string' }, action: { type: 'string', enum: ['enter','scale','stop','target','exit-rule','none'] }, direction: { type: 'string' },
      price: { type: 'number' }, size_pct: { type: 'number' }, rule: { type: 'string' }, evidence: { type: 'string' }, indicative: { type: 'boolean' } },
      required: ['ticker','action','rule','evidence','indicative'] } },
    open_positions: { type: 'array', items: { type: 'object', properties: { ticker: { type: 'string' }, direction: { type: 'string' }, entry: { type: 'number' }, stop: { type: 'number' }, size_pct: { type: 'number' }, unrealized_r: { type: 'number' } }, required: ['ticker','direction','entry','stop','size_pct'] } },
    kill_switches_tripped: { type: 'array', items: { type: 'string' } },
    day_pnl_pct_indicative: { type: 'number' },
    alerts: { type: 'array', items: { type: 'object', properties: { severity: { type: 'string', enum: ['info','warn','critical'] }, text: { type: 'string' }, source: { type: 'string' } }, required: ['severity','text'] } },
    next_check_focus: { type: 'string' },
    data_notes: { type: 'string' },
  },
  required: ['as_of_et','quote_delay_note','quotes','paper_actions','open_positions','kill_switches_tripped','day_pnl_pct_indicative','alerts','next_check_focus','data_notes'],
}
const WATCH_SCHEMA = {
  type: 'object',
  properties: {
    hits: { type: 'array', items: { type: 'object', properties: { who_or_what: { type: 'string' }, when: { type: 'string' }, headline: { type: 'string' }, affected_tickers: { type: 'array', items: { type: 'string' } }, severity: { type: 'string', enum: ['info','warn','critical'] }, implication: { type: 'string' }, source: { type: 'string' } }, required: ['who_or_what','when','headline','affected_tickers','severity','implication','source'] } },
    insider_new: { type: 'array', items: { type: 'string' } },
    nothing_found: { type: 'array', items: { type: 'string' } },
    data_notes: { type: 'string' },
  },
  required: ['hits','insider_new','nothing_found','data_notes'],
}

async function runMonitor() {
  phase('Monitor')
  log('Monitor tick ' + NOW + ' ET for ' + DATE)
  const plan = A.plan ? JSON.stringify(A.plan, null, 1) : '(no plan supplied)'
  const pre = A.premarket ? JSON.stringify(A.premarket, null, 1) : '(no premarket update supplied)'
  const journal = A.journal ? JSON.stringify(A.journal, null, 1) : '[]'
  const tickers = (A.plan && A.plan.trades) ? A.plan.trades.map(t => t.ticker) : []
  const [exec, watch] = await parallel([
    () => agent(`You are the EXECUTION seat (Head Trader intraday, PAPER account) at ${NOW} ET.
${CTX}
=== LIVING RULES ===
${RULES}
=== PLAN ===
${plan}
=== PREMARKET UPDATE ===
${pre}
=== JOURNAL SO FAR TODAY (paper actions already taken, chronological) ===
${journal}

HONESTY: finviz quotes are 15-20 minutes DELAYED and this check runs every 30 minutes, so you can only see whether a trigger/stop/target level has PRINTED on the day's range so far — you cannot fill at a precise tick. Mark every paper action indicative=true; the Coach will replay the plan against exact 5-minute bars after the close and overwrite your fills with the exact ones. Never claim a fill at a price the day's range has not reached.
YOUR JOB (Firecrawl budget: 7 scrapes, one at a time, 'sleep 7' between; Alpha Vantage CAP: 0):
1. Scrape finviz quote pages for ${tickers.join(', ') || 'the plan tickers'}, SPY, and whichever of EWZ/TLT/USO the plan's kill switches reference (max 7 pages). Read last price, change %, day high/low (finviz 'Volatility'/'Range' row shows the day's range), volume, and any new headline in the last 2 hours.
2. For each planned trade, in order: (a) is it scrapped/halved per the premarket update? (b) has a kill switch tripped (SPY level, EWZ level, 10Y proxy via TLT, headline)? (c) if flat: has the entry trigger level printed within its time window AND not above the no-chase cap? If yes, record action 'enter' at the trigger price (indicative). (d) if in a position (from the journal): has the stop or T1/T2 printed? Record 'stop' / 'target' / 'scale' accordingly, in the order the day's range makes most likely (if both stop and target printed and you cannot tell the order, assume the STOP hit first — conservative). (e) apply time-of-day rules (no entries after the window; flat by 15:55 — if NOW >= 15:50, exit everything at last).
3. Keep open_positions consistent with the journal + your actions. Compute day_pnl_pct_indicative from closed trades (R x size_pct) + unrealized.
4. alerts: 'critical' for a kill switch or a stop; 'warn' for a trigger approaching (within 0.25 ATR) or a headline on a plan name; 'info' otherwise. Keep each alert to one line with the number that matters.
Return MONITOR_SCHEMA.`, { label: 'execution', phase: 'Monitor', schema: MONITOR_SCHEMA }),
    () => agent(`You are SEAT 7 (Smart Money & Power) on intraday WATCH at ${NOW} ET.
${CTX}
PLAN TICKERS: ${tickers.join(', ') || '(none)'}. Plan themes: ${(A.plan && A.plan.market_thesis) ? String(A.plan.market_thesis).slice(0, 600) : ''}
Budget: 1 scrape + 5 searches, one at a time, 'sleep 7' between. Alpha Vantage CAP: 0.
1. firecrawl_search (tbs 'qdr:h', last hour) for: 'Trump Truth Social post' + today; 'Elon Musk post' + the Musk-complex name if in the plan; 'Iran Israel Gulf strike oil' + today; 'FBI raid OR DOJ indictment OR SEC charges company shares' + today; and one search for the top-ranked plan ticker + 'shares' + today.
2. Scrape https://finviz.com/insidertrading.ashx once and list any Form 4 row for a plan ticker filed today, and any open-market officer BUY >= $1M on any name.
3. Only report items from the LAST 2 HOURS; everything else goes in nothing_found. Severity: critical if it touches a plan ticker's thesis or a kill switch; warn if sector-level; info otherwise. Track people by name/role/office only; never by ethnicity, religion or nationality; never claim knowledge of non-public agency activity.
Return WATCH_SCHEMA.`, { label: 'smart-money-watch', phase: 'Monitor', schema: WATCH_SCHEMA }),
  ])
  return { exec, watch }
}

// ================= MODE: COACH =================
const COACH_SCHEMA = {
  type: 'object',
  properties: {
    replay: { type: 'array', items: { type: 'object', properties: {
      ticker: { type: 'string' }, direction: { type: 'string' }, planned_entry: { type: 'number' }, planned_stop: { type: 'number' }, planned_t1: { type: 'number' },
      trigger_printed: { type: 'boolean' }, trigger_time_et: { type: 'string' }, fill: { type: 'number' }, stop_hit: { type: 'boolean' }, t1_hit: { type: 'boolean' }, t2_hit: { type: 'boolean' },
      exit_price: { type: 'number' }, exit_reason: { type: 'string' }, result_r: { type: 'number' }, result_pct_equity: { type: 'number' },
      monitor_vs_replay: { type: 'string' }, bars_source: { type: 'string' } },
      required: ['ticker','direction','trigger_printed','result_r','result_pct_equity','exit_reason','monitor_vs_replay','bars_source'] } },
    day_r: { type: 'number' }, day_pnl_pct: { type: 'number' },
    actual_day: { type: 'array', items: { type: 'object', properties: { ticker: { type: 'string' }, open: { type: 'number' }, high: { type: 'number' }, low: { type: 'number' }, close: { type: 'number' }, volume: { type: 'number' }, source: { type: 'string' } }, required: ['ticker','open','high','low','close','source'] } },
    seat_grades: { type: 'array', items: { type: 'object', properties: { seat: { type: 'string' }, grade: { type: 'string', enum: ['A','B','C','D','F'] }, evidence: { type: 'string' } }, required: ['seat','grade','evidence'] } },
    what_worked: { type: 'array', items: { type: 'string' } },
    what_failed: { type: 'array', items: { type: 'string' } },
    lessons: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, observation: { type: 'string' }, evidence: { type: 'string' }, rule_implication: { type: 'string' }, tickers: { type: 'array', items: { type: 'string' } }, confidence: { type: 'string', enum: ['low','medium','high'] } }, required: ['title','observation','evidence','rule_implication','confidence'] } },
    rule_changes: { type: 'array', items: { type: 'object', properties: { rule: { type: 'string' }, from: { type: 'string' }, to: { type: 'string' }, kind: { type: 'string', enum: ['tighten','loosen','clarify'] }, evidence: { type: 'string' }, samples: { type: 'number' }, applied: { type: 'boolean' }, why_not_applied: { type: 'string' } }, required: ['rule','from','to','kind','evidence','samples','applied'] } },
    new_rules_md: { type: 'string' },
    review_md: { type: 'string' },
    av_calls_used: { type: 'number' },
    data_notes: { type: 'string' },
  },
  required: ['replay','day_r','day_pnl_pct','actual_day','seat_grades','what_worked','what_failed','lessons','rule_changes','new_rules_md','review_md','av_calls_used','data_notes'],
}

async function runCoach() {
  phase('Coach')
  log('Coach: replaying ' + DATE + ' against actual bars')
  const plan = A.plan ? JSON.stringify(A.plan, null, 1) : '(no plan supplied)'
  const pre = A.premarket ? JSON.stringify(A.premarket, null, 1) : '(none)'
  const journal = A.journal ? JSON.stringify(A.journal, null, 1) : '[]'
  const tickers = (A.plan && A.plan.trades) ? A.plan.trades.map(t => t.ticker) : []
  return await agent(`You are the COACH. The session ${DATE} is over. You learn from it and rewrite the desk's rules under the change policy.
${CTX}
=== LIVING RULES (current; you may rewrite them) ===
${RULES}
=== PLAN ===
${plan}
=== PREMARKET UPDATE ===
${pre}
=== INTRADAY JOURNAL (indicative paper actions from 30-min checks on delayed quotes) ===
${journal}

YOUR JOB. Alpha Vantage CAP: ${Math.min(tickers.length + 1, 5)} calls (TIME_SERIES_INTRADAY interval '5min' outputsize 'compact' extended_hours false datatype 'json' for each plan ticker, max 4, plus SPY) spaced >= 2 s. If AV is rate-limited or returns 'premium' sample data, fall back to stockanalysis.com / finviz quote pages (Firecrawl, 7 s apart, max 6) for the day's O/H/L/C and state that the replay is then range-based, not bar-based.
1. REPLAY each planned trade mechanically against the 5-minute bars (write a short python3 -I script over the JSON rather than eyeballing): did the trigger print inside its window and below the no-chase cap? fill at the trigger price (or next bar open if the bar gapped through). Then walk forward bar by bar: stop hit (bar low <= stop for longs) before T1 (bar high >= T1)? If both in the same bar, assume stop first. Apply scale at T1 / breakeven / T2 and the 15:55 flat rule exactly as the plan's management text says. Report result in R and in % equity (R x size_pct). Compare to the monitor's indicative actions.
2. Pull the actual day O/H/L/C/volume for each plan ticker and SPY (from the same bars).
3. GRADE every seat A-F with one sentence of evidence each: Screener (were the right names on the list?), Macro (regime/levels right?), Technical (did stops/targets respect structure; were levels accurate vs actual?), Catalyst (fresh/stale calls right?), Head Trader (plan executable? sizes right?), Risk Manager (did the vetoes/changes add or subtract R?), Smart Money (did any flag matter?), Execution monitor (indicative vs replay gap).
4. LESSONS: 1-4 lessons, each a specific, falsifiable observation with evidence, NOT platitudes. Say which rule it touches.
5. RULE CHANGES under the change policy in the living rules: you MAY tighten on one sample; you may LOOSEN only with >= 10 journaled samples (state samples honestly — today is probably sample 1, so loosening is not allowed); never change the -1.5% hard stop or the no-overnight rule. For each change set applied true/false and why. Then produce new_rules_md: the COMPLETE new Desk/Rules.md text with the frontmatter version incremented ONLY if at least one change is applied (else return the current text unchanged), and every applied change citing [[${DATE} Review]].
6. review_md: the complete Reviews/${DATE} Review.md note in Obsidian markdown with frontmatter (type: review, date, plan: "[[${DATE} Plan]]", journal: "[[${DATE} Journal]]", day_r, day_pnl_pct, rules_version_after), the replay table, seat grades, what worked/failed, lessons as [[Lesson - <title>]] links, and the rule-change table.
Return COACH_SCHEMA. Report av_calls_used accurately.`, { label: 'coach', phase: 'Coach', schema: COACH_SCHEMA })
}

// ================= DISPATCH =================
if (MODE === 'premarket') { const premarket = await runPremarket(); return { mode: MODE, date: DATE, premarket } }
if (MODE === 'monitor') { const r = await runMonitor(); return { mode: MODE, date: DATE, now_et: NOW, ...r } }
if (MODE === 'coach') { const coach = await runCoach(); return { mode: MODE, date: DATE, coach } }
// default: plan
const planResult = await runPlan()
return { mode: 'plan', date: DATE, ...planResult }
