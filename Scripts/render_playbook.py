#!/usr/bin/env python3
"""Render the Desk Playbook page (same design as the Oct 6 page) from a plan-mode run JSON.
Usage: render_playbook.py run.json DATE out.html [run_id]
run.json = the workflow result object (keys screen/macro/tech/cat/smart/draft/risk/final) or {"result": {...}}."""
import json, sys, html, datetime
E = lambda x: html.escape(str(x if x is not None else ""), quote=True)
d = json.load(open(sys.argv[1])); DATE = sys.argv[2]; OUT = sys.argv[3]; RUN = sys.argv[4] if len(sys.argv) > 4 else d.get("run_id", "?")
if "result" in d and "final" in d.get("result", {}): d = d["result"]
f = d.get("final") or {}; r = d.get("risk") or {}; s = d.get("smart") or {}; m = d.get("macro") or {}; c = d.get("cat") or {}; t = d.get("tech") or {}; sc = d.get("screen") or {}
dt = datetime.date.fromisoformat(DATE); DAY = dt.strftime("%A, %B %d, %Y").replace(" 0", " "); SHORT = dt.strftime("%b %d").replace(" 0", " ")
trades = f.get("trades", []); vetoed = [v for v in r.get("verdicts", []) if str(v.get("verdict", "")).lower().startswith("veto")]
vmap = {v.get("ticker"): v for v in r.get("verdicts", [])}
spy = (m.get("spy_levels") or {}); spy_close = (spy.get("support") or [None])[0]
tot_risk = sum(float(x.get("size_pct_equity_at_risk") or 0) for x in trades)
CSS = '\n/* layout: sticky ticket-strip header, single reading column, dense data tables that scroll in place */\n:root{\n  --bg:#f5f4ef; --surface:#ffffff; --fg:#1b1d22; --muted:#5d6370; --line:#d9d6cc;\n  --accent:#b8611a; --accent-ink:#ffffff; --long:#1f7a4d; --short:#b3362f; --warn:#9a6a00; --warnbg:#fff4d6; --okbg:#e4f3ea; --badbg:#fbe3e1;\n  --display:"IBM Plex Sans",system-ui,sans-serif; --mono:"IBM Plex Mono",ui-monospace,Menlo,monospace;\n}\n@media (prefers-color-scheme: dark){ :root:not([data-theme="light"]){ --bg:#15171b; --surface:#1e2127; --fg:#e8e6df; --muted:#9aa0ab; --line:#33373f; --accent:#e0893a; --accent-ink:#15171b; --long:#4cc38a; --short:#ef6b61; --warn:#e6b84a; --warnbg:#3a2f12; --okbg:#173224; --badbg:#3c1d1a; color-scheme:dark } }\n:root[data-theme="dark"]{ --bg:#15171b; --surface:#1e2127; --fg:#e8e6df; --muted:#9aa0ab; --line:#33373f; --accent:#e0893a; --accent-ink:#15171b; --long:#4cc38a; --short:#ef6b61; --warn:#e6b84a; --warnbg:#3a2f12; --okbg:#173224; --badbg:#3c1d1a; color-scheme:dark }\n*{box-sizing:border-box}\nbody{background:var(--bg);color:var(--fg);font-family:var(--display);font-size:15px;line-height:1.5;padding-inline:16px;padding-block:0 48px}\n.wrap{max-width:900px;margin:0 auto}\nh1,h2,h3{text-wrap:balance;line-height:1.2;margin:0}\nh2{font-size:1.15rem;margin-block:40px 14px;padding-bottom:6px;border-bottom:2px solid var(--line);display:flex;align-items:baseline;gap:10px}\nh2 .seat{font:500 .7rem var(--mono);letter-spacing:.08em;color:var(--muted);text-transform:uppercase}\np{margin:0 0 10px;max-width:70ch}\nul{margin:4px 0 10px;padding-left:20px} li{margin-bottom:6px}\n.num,.mono{font-family:var(--mono);font-variant-numeric:tabular-nums}\n.eyebrow{font:500 .72rem var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}\n.masthead{padding-block:22px 10px;border-bottom:1px solid var(--line)}\n.masthead h1{font-size:1.7rem;font-weight:700}\n.masthead .sub{color:var(--muted);margin-top:6px}\n.strip{position:sticky;top:env(safe-area-inset-top,0px);z-index:5;background:var(--bg);display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:1px;border-bottom:1px solid var(--line);margin-top:14px}\n.strip>div{padding:8px 0} .strip .k{display:block;font:500 .66rem var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--muted)} .strip .v{font:600 1.05rem var(--mono);font-variant-numeric:tabular-nums}\n.strip .v.regime{color:var(--accent)}\n.thesis{margin-top:18px} .thesis p{max-width:80ch}\n.changes{background:var(--warnbg);border-left:4px solid var(--warn);padding:10px 14px;margin-top:10px} .changes p{margin:0}\n.trade{background:var(--surface);border:1px solid var(--line);border-radius:6px;padding:14px 16px;margin-bottom:16px}\n.trade.vetoed{opacity:.85;border-style:dashed}\n.trade-head{display:flex;flex-wrap:wrap;align-items:center;gap:10px 14px;margin-bottom:10px}\n.rank{font:600 .9rem var(--mono);color:var(--accent)}\n.tk{display:flex;align-items:center;gap:8px} .sym{font:700 1.5rem var(--mono);letter-spacing:.02em}\n.dir{font:600 .7rem var(--mono);letter-spacing:.1em;padding:3px 7px;border-radius:3px;color:#fff} .dir.long{background:var(--long)} .dir.short{background:var(--short)}\n.pills{display:flex;flex-wrap:wrap;gap:6px;margin-left:auto}\n.pill{font:500 .7rem var(--mono);padding:3px 8px;border-radius:999px;border:1px solid var(--line);color:var(--muted)}\n.pill.v-ok{background:var(--okbg);color:var(--long);border-color:transparent} .pill.v-warn{background:var(--warnbg);color:var(--warn);border-color:transparent} .pill.v-bad{background:var(--badbg);color:var(--short);border-color:transparent}\n.levels{display:grid;grid-template-columns:repeat(auto-fit,minmax(96px,1fr));gap:8px;margin:10px 0 12px;padding:10px 12px;background:var(--bg);border-radius:4px}\n.levels div{min-width:0} .levels .lbl{display:block;font:500 .64rem var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--muted)} .levels .num{font-size:1.1rem;font-weight:600} .levels .num.small{font-size:.78rem;font-weight:500;white-space:normal}\n.levels .stop{color:var(--short)} .levels .tgt{color:var(--long)}\n.setup{font-size:.92rem;color:var(--muted)}\ndetails{border-top:1px solid var(--line);padding:6px 0} details:last-child{border-bottom:0} summary{cursor:pointer;font-weight:600;font-size:.9rem;padding:4px 0} details p,details ul{font-size:.9rem} details p{max-width:none}\n.meta{margin-top:8px} .src li{font:400 .78rem var(--mono);word-break:break-word}\n.rules li,.kill li{margin-bottom:8px}\n.kill{background:var(--badbg);border-radius:6px;padding:12px 14px 12px 32px}\n.check{list-style:none;padding:0} .check li{padding:8px 0;border-bottom:1px solid var(--line)} .check label{display:flex;gap:10px;align-items:flex-start;cursor:pointer} .check input{margin-top:4px;flex:none} .check input:checked+span{color:var(--muted);text-decoration:line-through}\n.twocol{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px} .twocol>div{min-width:0}\n.rt{list-style:none;padding:0} .rt li{border-left:3px solid var(--line);padding:4px 0 4px 12px;margin-bottom:12px;font-size:.9rem} .rt-head{display:flex;flex-wrap:wrap;gap:8px;align-items:baseline} .when{font:400 .72rem var(--mono);color:var(--muted)} .impl{color:var(--muted);margin-top:2px} .tks{font:500 .72rem var(--mono);color:var(--accent)} .srcline{font:400 .7rem var(--mono);color:var(--muted);word-break:break-all;margin-top:2px}\n.flags{list-style:none;padding:0} .flags li{padding:8px 0;border-bottom:1px solid var(--line);font-size:.9rem} .flag{font:500 .68rem var(--mono);padding:2px 7px;border-radius:999px;margin-left:6px;background:var(--bg);border:1px solid var(--line)} .f-smart-money-confirms-long{color:var(--long)} .f-smart-money-contradicts,.f-insider-selling-into-strength,.f-smart-money-confirms-short{color:var(--short)}\n.tbl{overflow-x:auto;border:1px solid var(--line);border-radius:6px} table{border-collapse:collapse;width:100%;font-size:.84rem} th,td{text-align:left;padding:7px 10px;border-bottom:1px solid var(--line);vertical-align:top} th{font:500 .68rem var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--muted);background:var(--bg);white-space:nowrap} tr:last-child td{border-bottom:0} td.num{white-space:nowrap} td.mono{font-size:.76rem;word-break:break-all;min-width:220px}\n.grade{font:600 .8rem var(--mono);padding:1px 7px;border-radius:3px;background:var(--bg);border:1px solid var(--line)} .g-A{color:var(--long)} .g-B{color:var(--accent)} .g-C,.g-F{color:var(--short)}\n.lvl{display:flex;flex-wrap:wrap;gap:10px 24px;font-size:.9rem} .lvl b{font-family:var(--mono)}\n.foot{margin-top:40px;color:var(--muted);font-size:.8rem;border-top:1px solid var(--line);padding-top:12px}\na{color:var(--accent)} :focus-visible{outline:2px solid var(--accent);outline-offset:2px}\n@media (prefers-reduced-motion:reduce){*{transition:none!important}}\n'
def pill(v):
    vv = str(v or "").lower(); cls = "v-ok" if vv.startswith("approve") and "change" not in vv else ("v-bad" if vv.startswith("veto") else "v-warn")
    return f"<span class='pill {cls}'>risk: {E(v or 'n/a')}</span>"
def details(title, body, open_=False):
    return f"<details{' open' if open_ else ''}><summary>{E(title)}</summary>{body}</details>"
def ul(items, cls=""): return f"<ul{(' class=' + chr(34) + cls + chr(34)) if cls else ''}>" + "".join(f"<li>{x}</li>" for x in items) + "</ul>"
def trade_html(x):
    v = vmap.get(x.get("ticker"), {}); obj = v.get("objections") or []; req = v.get("required_changes") or []
    rm = ""
    if v:
        rm = f"<p class='meta'><b>Stop vs ATR.</b> {E(v.get('stop_distance_vs_atr',''))}</p><p class='meta'><b>Correlation.</b> {E(v.get('correlation_flag',''))}</p>"
        if obj: rm += "<p class='meta'><b>Objections</b></p>" + ul([E(o) for o in obj])
        if req: rm += "<p class='meta'><b>Required changes (applied)</b></p>" + ul([E(o) for o in req])
    lv = "".join(f"<div><span class='lbl'>{E(l)}</span><span class='num {k}'>{E(x.get(key,'—'))}</span></div>" for l, key, k in [("Entry","entry_price",""),("Stop","stop","stop"),("T1","target1","tgt"),("T2","target2","tgt"),("R:R @T1","rr","")])
    lv += f"<div><span class='lbl'>Window ET</span><span class='num small'>{E(x.get('time_window_et',''))}</span></div>"
    pills = f"<span class='pill conf'>{E(x.get('confidence','?'))} confidence</span><span class='pill risk'>{E(x.get('size_pct_equity_at_risk','?'))}% equity at risk</span><span class='pill'>{E(x.get('setup_type','?'))}</span>" + (pill(v.get("verdict")) if v else "")
    return f"""<article class="trade" id="t-{E(str(x.get('ticker','')).lower())}">
  <header class="trade-head"><div class="rank">#{E(x.get('rank','?'))}</div><div class="tk"><span class="sym">{E(x.get('ticker'))}</span><span class="dir {E(x.get('direction','long'))}">{E(str(x.get('direction','long')).upper())}</span></div><div class="pills">{pills}</div></header>
  <div class="levels">{lv}</div>
  <p class="setup">{E(x.get('setup',''))}</p>
  {details('Entry trigger', '<p>' + E(x.get('entry_trigger','')) + '</p>', True)}
  {details('Thesis', '<p>' + E(x.get('thesis','')) + '</p>')}
  {details('Sizing', '<p>' + E(x.get('position_size_formula','')) + '</p>')}
  {details('Management', '<p>' + E(x.get('management','')) + '</p>')}
  {details('Invalidation', '<p>' + E(x.get('invalidation','')) + '</p>')}
  {details('Risk Manager verdict', rm) if rm else ''}
  {details('Sources', ul([E(u) for u in x.get('sources',[])], 'src'))}
</article>"""
def veto_html(v):
    return f"""<article class="trade vetoed"><header class="trade-head"><div class="rank">✕</div><div class="tk"><span class="sym">{E(v.get('ticker'))}</span><span class="dir {E(v.get('direction','short'))}">{E(str(v.get('direction','')).upper())}</span></div><div class="pills"><span class="pill v-bad">VETOED</span></div></header>
{details('Why it was vetoed', ul([E(o) for o in (v.get('objections') or [])]) + (('<p class=meta><b>Reinstatement / required changes:</b></p>' + ul([E(o) for o in v.get('required_changes')])) if v.get('required_changes') else ''))}</article>"""
def rt(items, who="who", when="when", what="statement", impl="market_implication"):
    out = []
    for it in items or []:
        out.append(f"<li><div class='rt-head'><b>{E(it.get(who) or it.get('agency') or it.get('region') or '')}</b><span class='when'>{E(it.get(when,''))}</span></div><div>{E(it.get(what) or it.get('action') or it.get('event') or '')}</div><div class='impl'>→ {E(it.get(impl,''))} <span class='tks'>{E(', '.join(it.get('affected_tickers') or []))}</span></div><div class='srcline'>{E(it.get('source',''))}</div></li>")
    return "<ul class='rt'>" + "".join(out) + "</ul>" if out else "<p class='setup'>none found</p>"
cal_key = next((k for k in m if k.startswith("calendar")), None); cal = m.get(cal_key) or []
H = []; w = H.append
w(f"<title>Desk Playbook {E(SHORT)}</title>")
w('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap">')
w("<style>" + CSS + "</style>")
w('<div class="wrap">')
w(f"""<header class="masthead"><div class="eyebrow">Seven-seat desk · run {E(RUN)} · Rules v{E(d.get('rules_version','?'))} · generated {E(datetime.datetime.now().strftime('%a %b %d, %Y'))}</div>
  <h1>Playbook — {E(DAY)}</h1>
  <div class="sub">US cash session 09:30–16:00 ET. Paper account; sizes are % of equity at risk. Risk Manager vetoes applied. Winners: 1/3 off at T1, runner on the rising stop ladder. Re-check every level against pre-market at 08:50 ET.</div>
  <div class="strip">
    <div><span class="k">Regime</span><span class="v regime">{E(f.get('regime',''))}</span></div>
    <div><span class="k">Trades</span><span class="v">{len(trades)}</span></div>
    <div><span class="k">Vetoed</span><span class="v">{len(vetoed)}</span></div>
    <div><span class="k">Max concurrent</span><span class="v">{E(r.get('max_concurrent_allowed', 2))}</span></div>
    <div><span class="k">Planned risk</span><span class="v">{tot_risk:.2f}%</span></div>
    <div><span class="k">Daily stop</span><span class="v">−10%</span></div>
    <div><span class="k">SPY pivot</span><span class="v">{E(spy_close or '—')}</span></div>
  </div></header>""")
w(f"""<section class="thesis"><h2>Market thesis <span class="seat">Head Trader · seat 5</span></h2><p>{E(f.get('market_thesis',''))}</p>
  <div class="changes"><p><b>Portfolio objections (Risk Manager).</b> {E(' '.join(r.get('portfolio_objections') or []))}</p></div></section>""")
w(f"""<section><h2>Trades <span class="seat">ranked · total planned risk {tot_risk:.2f}% if all trigger (cap 10% open at once)</span></h2>""")
for x in trades: w(trade_html(x))
for v in vetoed: w(veto_html(v))
w("</section>")
oq = f.get("open_questions") or []
w('<section><h2>Pre-market checklist <span class="seat">08:50 ET · open questions</span></h2><ul class="check">' + "".join(f"<li><label><input type='checkbox' id='oq{i}' data-k='oq{i}'> <span>{E(q)}</span></label></li>" for i, q in enumerate(oq)) + "</ul></section>")
w('<section class="twocol"><div><h2>Kill switches <span class="seat">scrap the plan</span></h2>' + ul([E(k) for k in (f.get('kill_switches') or []) + (r.get('additional_kill_switches') or [])], 'kill') + '</div><div><h2>Session rules</h2>' + ul([E(k) for k in f.get('session_rules') or []], 'rules') + '</div></section>')
w('<section class="twocol"><div><h2>Watch only</h2>' + ul([f"<b>{E(x.get('ticker'))}</b> — {E(x.get('why'))}" for x in f.get('watch_only') or []]) + '</div><div><h2>Do not trade</h2>' + ul([f"<b>{E(x.get('ticker'))}</b> — {E(x.get('why'))}" for x in f.get('do_not_trade') or []]) + '</div></section>')
flags = "".join(f"<li><b>{E(x.get('ticker'))}</b> <span class='flag f-{E(x.get('flag'))}'>{E(x.get('flag'))}</span><div>{E(x.get('why'))}</div></li>" for x in s.get('watchlist_flags') or [])
ins = ul([f"<b>{E(i.get('ticker'))}</b> {E(i.get('who'))} ({E(i.get('role'))}) {E(i.get('action'))} {E(i.get('trade_date'))}, filed {E(i.get('filed_date'))}, ${E(i.get('value_usd'))} — {E(i.get('signal'))} <span class='when'>[{E(i.get('latency'))}]</span>" for i in s.get('insider_activity') or []])
cong = ul([f"<b>{E(i.get('ticker'))}</b> {E(i.get('politician'))} ({E(i.get('party'))}) {E(i.get('action'))} {E(i.get('amount_range'))} traded {E(i.get('trade_date'))}, filed {E(i.get('filed_date'))} — {E(i.get('signal'))}" for i in s.get('congress_trades') or []])
f13 = ul([f"<b>{E(i.get('institution'))}</b> {E(i.get('ticker'))}: {E(i.get('change'))} ({E(i.get('as_of_quarter'))}) {E(i.get('note'))}" for i in s.get('institutions_13f') or []])
top = ul([f"<b>{E(i.get('who'))}</b>: {E(i.get('what'))} [{E(i.get('when'))}] → {E(i.get('tradable_for_us'))}" for i in s.get('top_trader_positioning') or []])
feed = "<div class='tbl'><table><thead><tr><th>Feed</th><th>Source</th><th>True latency</th><th>Poll</th></tr></thead><tbody>" + "".join(f"<tr><td>{E(x.get('feed'))}</td><td class='mono'>{E(x.get('url_or_tool'))}</td><td>{E(x.get('true_latency'))}</td><td>{E(x.get('poll_interval'))}</td></tr>" for x in s.get('monitoring_feed_spec') or []) + "</tbody></table></div>"
w(f"""<section><h2>Smart money &amp; power <span class="seat">seat 7 · each item carries its true latency</span></h2>
  <h3 class="eyebrow">Watchlist flags</h3><ul class="flags">{flags}</ul>
  <div class="twocol"><div><h3 class="eyebrow" style="margin-top:14px">Public figures · real-time</h3>{rt(s.get('public_figure_statements'))}</div>
  <div><h3 class="eyebrow" style="margin-top:14px">Government actions · real-time once announced</h3>{rt(s.get('government_actions'), who='agency', what='action')}</div></div>
  <h3 class="eyebrow" style="margin-top:14px">Geopolitical · real-time</h3>{rt(s.get('geopolitical'), who='region', what='event')}
  {details('Insiders (Form 4, ≤2-day lag), Congress (30–45-day lag), 13F (quarterly), top traders', ins + cong + f13 + top)}
  {details('Monitoring feed spec (for the scheduled intraday monitor)', feed)}
  <p class='setup'>{E(s.get('data_notes',''))}</p></section>""")
calrows = "".join(f"<tr><td class='num'>{E(x.get('time_et'))}</td><td>{E(x.get('event'))}</td><td>{E(x.get('impact'))}</td></tr>" for x in cal)
w(f"""<section><h2>Macro <span class="seat">seat 2 · regime {E(m.get('regime',''))}</span></h2><p>{E(m.get('regime_rationale',''))}</p>
  <div class="lvl"><span>SPY support <b>{E(' · '.join(str(x) for x in spy.get('support') or []))}</b></span><span>resistance <b>{E(' · '.join(str(x) for x in spy.get('resistance') or []))}</b></span></div>
  <h3 class="eyebrow" style="margin-top:16px">Calendar (ET)</h3><div class="tbl"><table><thead><tr><th>Time</th><th>Event</th><th>Impact</th></tr></thead><tbody>{calrows}</tbody></table></div>
  <h3 class="eyebrow" style="margin-top:16px">No-trade windows</h3>{ul([E(x) for x in m.get('no_trade_windows') or []])}
  {details('Big story', '<p>' + E(m.get('brazil_story') or m.get('big_story') or '') + '</p>')}
  {details('Overnight', '<p>' + E(m.get('overnight','')) + '</p>')}
  {details('Sector bias', '<p>' + E(m.get('sector_bias','')) + '</p>')}
  <p class='setup'>{E(m.get('data_notes',''))}</p></section>""")
def setup_cell(sx): return f"{E(sx.get('entry'))} / {E(sx.get('stop'))} / {E(sx.get('target1'))} ({E(sx.get('rr'))})" if sx else "—"
trows = "".join(f"<tr><td><b>{E(n.get('ticker'))}</b></td><td><span class='grade g-{E(n.get('grade'))}'>{E(n.get('grade'))}</span></td><td class='num'>{E(n.get('close'))}</td><td class='num'>{E(n.get('atr14'))}</td><td class='num'>{E(n.get('rsi14'))}</td><td class='num'>{setup_cell(n.get('long_setup'))}</td><td class='num'>{setup_cell(n.get('short_setup'))}</td></tr>" for n in t.get('names') or [])
w(f"""<section><h2>Technical levels <span class="seat">seat 3 · entry / stop / T1 (R:R)</span></h2><div class="tbl"><table><thead><tr><th>Ticker</th><th>Grade</th><th>Close</th><th>ATR14</th><th>RSI14</th><th>Long setup</th><th>Short setup</th></tr></thead><tbody>{trows}</tbody></table></div>
  {details('Grade rationale, structure and key levels', ul([f"<b>{E(n.get('ticker'))}</b> [{E(n.get('grade'))}] {E(n.get('grade_why'))} — {E(n.get('intraday_structure'))} Levels: {E(n.get('key_levels'))}" for n in t.get('names') or []]))}
  <p class='setup'>{E(t.get('data_notes',''))}</p></section>""")
w(f"""<section><h2>Catalysts <span class="seat">seat 4</span></h2><p><b>Earnings, pre-market:</b> {E('; '.join(str(x) for x in (next((v for k, v in c.items() if 'premarket' in k), None) or [])))}</p><p><b>After close:</b> {E('; '.join(str(x) for x in (next((v for k, v in c.items() if 'afterclose' in k), None) or [])))}</p>
  <h3 class="eyebrow" style="margin-top:14px">Overnight and new</h3>{ul([(f"<b>{E(x.get('ticker'))}</b> {E(x.get('what') or x.get('catalyst') or x)}" if isinstance(x, dict) else E(x)) for x in c.get('new_overnight_catalysts') or []])}
  {details('Per-name catalyst and day-2 expectation', ul([f"<b>{E(n.get('ticker'))}</b> [{E(n.get('catalyst_type'))}, {E(n.get('fresh_or_stale'))}] {E(n.get('catalyst'))} → {E(n.get('day2_expectation'))} (earnings next: {E(n.get('earnings_next'))}; sentiment {E(n.get('sentiment'))})" for n in c.get('names') or []]))}
  <p class='setup'>{E(c.get('data_notes',''))}</p></section>""")
w(f"""<section><h2>Risk Manager <span class="seat">seat 6 · portfolio-level · worst case {E(r.get('worst_case_day_pct','?'))}%</span></h2>{ul([E(x) for x in r.get('portfolio_objections') or []])}
  {details('Correlation note', '<p>' + E(r.get('correlation_matrix_note','')) + '</p>')}
  {details('Data-integrity issues found', ul([E(x) for x in r.get('data_integrity_issues') or []]))}</section>""")
w(f"""<section><h2>Screener <span class="seat">seat 1 · watchlist</span></h2><div class="tbl"><table><thead><tr><th>Ticker</th><th>Close</th><th>Chg %</th><th>ATR</th><th>RSI</th><th>Rel vol</th><th>Setup</th><th>Why</th></tr></thead><tbody>""" + "".join(f"<tr><td><b>{E(x.get('ticker'))}</b></td><td class='num'>{E(x.get('close'))}</td><td class='num'>{E(x.get('change_pct'))}</td><td class='num'>{E(x.get('atr',''))}</td><td class='num'>{E(x.get('rsi',''))}</td><td class='num'>{E(x.get('rel_volume',''))}</td><td>{E(x.get('setup_type'))}</td><td>{E(x.get('why'))}</td></tr>" for x in sc.get('watchlist') or []) + f"""</tbody></table></div><p class='setup'>Themes: {E('; '.join(str(x) for x in sc.get('sector_themes') or []))}</p></section>""")
w('<div class="foot">Data: finviz and stockanalysis quote pages (15–20 min delayed), Alpha Vantage (free key), Firecrawl web search. Every number cites its source in the plan note. This is a plan produced by a research process, not financial advice; no outcome is guaranteed.</div></div>')
w("<script>(function(){document.querySelectorAll('.check input').forEach(function(cb){var k='playbook-" + DATE.replace('-', '') + "-'+cb.dataset.k;try{cb.checked=localStorage.getItem(k)==='1'}catch(e){}cb.addEventListener('change',function(){try{localStorage.setItem(k,cb.checked?'1':'0')}catch(e){}})})})();</script>")
open(OUT, "w").write("\n".join(H)); print("wrote", OUT, len("\n".join(H)), "bytes;", len(trades), "trades,", len(vetoed), "vetoed")
