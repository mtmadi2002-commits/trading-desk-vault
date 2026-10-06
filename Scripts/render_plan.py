#!/usr/bin/env python3
"""Render a desk run (plan mode JSON) into an Obsidian plan note. Usage: render_plan.py run.json DATE out.md"""
import json,sys
d=json.load(open(sys.argv[1])); DATE=sys.argv[2]; out=sys.argv[3]
if "result" in d and "final" in d.get("result",{}): d=d["result"]
f=d["final"]; r=d["risk"]; s=d["smart"]; m=d["macro"]; c=d["cat"]; t=d["tech"]
L=[]; w=L.append
w("---"); w("type: plan"); w(f"date: {DATE}"); w(f"rules_version: {d.get('rules_version','?')}"); w(f"run: {d.get('run_id','?')}"); w("status: final"); w(f"trades: {len(f['trades'])}"); w("---")
w(f"# {DATE} Plan"); w("")
w(f"Rules: [[Rules]] · Journal: [[{DATE} Journal]] · Review: [[{DATE} Review]]"); w("")
w(f"## Regime: **{f['regime']}**"); w(""); w(f["market_thesis"]); w("")
w("## Trades (ranked)")
for tr in f["trades"]:
    w(""); w(f"### #{tr['rank']} [[{tr['ticker']}]] — {tr['direction'].upper()} · {tr['confidence']} · {tr['size_pct_equity_at_risk']}% risk"); w("")
    w("| Entry | Stop | T1 | T2 | R:R | Window (ET) |"); w("|---|---|---|---|---|---|")
    w(f"| {tr['entry_price']} | {tr['stop']} | {tr['target1']} | {tr.get('target2','—')} | {tr['rr']} | {tr['time_window_et']} |"); w("")
    for k,lab in (("setup","Setup"),("thesis","Thesis"),("entry_trigger","Entry trigger"),("position_size_formula","Sizing"),("management","Management"),("invalidation","Invalidation")):
        w(f"**{lab}.** {tr[k]}"); w("")
    if tr.get("sources"): w("Sources: " + " · ".join(tr["sources"])); w("")
w("## Watch only"); [w(f"- **{x['ticker']}** — {x['why']}") for x in f["watch_only"]]
w(""); w("## Do not trade"); [w(f"- **{x['ticker']}** — {x['why']}") for x in f["do_not_trade"]]
w(""); w("## Session rules"); [w(f"- {x}") for x in f["session_rules"]]
w(""); w("## Kill switches"); [w(f"- {x}") for x in f["kill_switches"]]
w(""); w("## Open questions (09:00 ET)"); [w(f"- [ ] {x}") for x in f["open_questions"]]
w(""); w("---"); w("## Risk Manager"); w(f"Max concurrent **{r['max_concurrent_allowed']}** · worst case as drafted **{r['worst_case_day_pct']}%**"); w("")
for v in r["verdicts"]:
    w(f"### {v['ticker']} {v['direction']} → **{v['verdict'].upper()}**")
    if v.get("stop_distance_vs_atr"): w(f"- Stop vs ATR: {v['stop_distance_vs_atr']}")
    w("- Objections:"); [w(f"  - {o}") for o in v["objections"]]
    w("- Required changes:"); [w(f"  - {o}") for o in v["required_changes"]]; w("")
w("### Portfolio objections"); [w(f"- {o}") for o in r["portfolio_objections"]]
w(""); w("### Data-integrity issues"); [w(f"- {o}") for o in r["data_integrity_issues"]]
w(""); w("---"); w("## Smart Money & Power"); w("### Flags")
for x in s["watchlist_flags"]: w(f"- [[{x['ticker']}]]: `{x['flag']}` — {x['why']}")
for sec,key,who,what in (("Public figures (real-time)","public_figure_statements","who","statement"),("Government actions","government_actions","agency","action"),("Geopolitical","geopolitical","region","event")):
    w(""); w(f"### {sec}")
    for x in s[key]: w(f"- **{x[who]}** [{x['when']}]: {x[what]} → _{x['market_implication']}_ ({', '.join(x['affected_tickers'])}) — {x['source']}")
w(""); w("### Insiders (≤2-day lag)"); [w(f"- **{x['ticker']}** {x['who']} ({x.get('role','')}) {x['action']} {x['trade_date']} filed {x.get('filed_date','?')} ${x.get('value_usd','?')} — {x['signal']} [{x['latency']}]") for x in s["insider_activity"]]
w(""); w("### Congress (30–45-day lag)"); [w(f"- **{x['ticker']}** {x['politician']} {x['action']} {x.get('amount_range','')} traded {x['trade_date']} filed {x['filed_date']} — {x['signal']}") for x in s["congress_trades"]]
w(""); w("### 13F / top traders"); [w(f"- **{x['institution']}** {x['ticker']}: {x['change']} ({x['as_of_quarter']})") for x in s["institutions_13f"]]; [w(f"- **{x['who']}**: {x['what']} [{x['when']}] → {x['tradable_for_us']}") for x in s["top_trader_positioning"]]
w(""); w("---"); w("## Macro"); w(f"**{m['regime']}** — {m['regime_rationale']}"); w(""); w(f"SPY support {m['spy_levels']['support']} · resistance {m['spy_levels']['resistance']}"); w("")
w("### Calendar (ET)"); [w(f"- {x['time_et']} {x['event']} — {x['impact']}") for x in m["calendar_tuesday"]]
w(""); w("### No-trade windows"); [w(f"- {x}") for x in m["no_trade_windows"]]
w(""); w("### Big story"); w(m["brazil_story"]["what_happened"]); w(""); w(f"Day-2 bias: {m['brazil_story']['day2_bias']}"); w(""); w(f"Risks: {m['brazil_story']['key_risks']}")
w(""); w("---"); w("## Catalysts"); w("Pre-market earnings: " + "; ".join(c["tuesday_earnings_premarket"])); w(""); w("After close: " + "; ".join(c["tuesday_earnings_afterclose"])); w("")
w("### Overnight / new"); [w(f"- **{x['ticker']}**: {x['headline']} — {x['source']}") for x in c["new_overnight_catalysts"]]
w(""); w("### Per-name"); [w(f"- [[{x['ticker']}]] [{x['catalyst_type']}, {x['fresh_or_stale']}]: {x['catalyst']} → {x['day2_expectation']}") for x in c["names"]]
w(""); w("---"); w("## Technical"); w("| Ticker | Grade | Close | ATR14 | RSI14 | Prior H / L | Long e/s/T1 (R:R) | Short e/s/T1 (R:R) |"); w("|---|---|---|---|---|---|---|---|")
for n in t["names"]:
    k=n["key_levels"]; lo=n["long_setup"]; sh=n["short_setup"]
    w(f"| [[{n['ticker']}]] | {n['grade']} | {n['close']} | {n.get('atr14','—')} | {n.get('rsi14','—')} | {k.get('monday_high','—')} / {k.get('monday_low','—')} | {lo['entry']}/{lo['stop']}/{lo['target1']} ({lo['rr']}) | {sh['entry']}/{sh['stop']}/{sh['target1']} ({sh['rr']}) |")
w(""); [w(f"- **{n['ticker']}** [{n['grade']}]: {n['grade_why']}") for n in t["names"]]
w(""); w("---"); w("## Screener"); w("Themes: " + "; ".join(d["screen"]["sector_themes"])); w("")
for x in d["screen"]["watchlist"]: w(f"- [[{x['ticker']}]] {x['close']} ({x['change_pct']:+.2f}%) [{x['setup_type']}] — {x['why']}")
w(""); w("Excluded: " + "; ".join(f"{x['ticker']} ({x['reason']})" for x in d["screen"]["excluded"]))
open(out,"w").write("\n".join(L)); print("wrote",out,len(L),"lines")
