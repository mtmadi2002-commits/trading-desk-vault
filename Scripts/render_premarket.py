#!/usr/bin/env python3
"""Append a premarket update section to a plan note. Usage: render_premarket.py run.json DATE plan_note.md [label]"""
import json,sys
d=json.load(open(sys.argv[1])); DATE=sys.argv[2]; note=sys.argv[3]; label=sys.argv[4] if len(sys.argv)>4 else ""
p=d["result"]["premarket"] if "result" in d else d["premarket"]
L=[]; w=L.append
w(""); w(f"## Premarket update ({label + ' ' if label else ''}{p['as_of_et'][:30]})"); w("")
w("| Ticker | Prev close | Pre-market | Gap % | Source |"); w("|---|---|---|---|---|")
for q in p["quotes"]: w(f"| {q['ticker']} | {q['prev_close']} | {q.get('premarket','—')} | {q.get('gap_pct','—')} | {q['source'][:90]} |")
w(""); w(f"**Index check.** {p['index_check']}"); w("")
w("**Trade status**"); w("")
for t in p["trade_status"]:
    r=t.get("relevelled") or {}
    rl=(" → re-levelled: " + ", ".join(f"{k} {v}" for k,v in r.items() if v is not None)) if r else ""
    w(f"- **{t['ticker']}** — `{t['status']}`{rl} — {t['why']}")
w(""); w("**Kill switches tripped:** " + ("; ".join(p["kill_switches_tripped"]) if p["kill_switches_tripped"] else "none")); w("")
w("**Overnight**"); [w(f"- {x}") for x in p["overnight_news"]]
w(""); w("**Checklist answers**"); [w(f"- {x['question'][:120]} → {x['answer']}") for x in p["checklist_answers"]]
w(""); w("**Alert**"); w(""); w("> " + p["alert_text"].replace("\n","\n> ")); w("")
w(f"_Data notes: {p['data_notes']}_"); w("")
open(note,"a").write("\n".join(L)); print("appended", len(L), "lines to", note)
