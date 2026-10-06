#!/usr/bin/env python3
"""Backtest the desk's setup types against 5-minute bars BEFORE a setup risks money.

Input: one or more bar files saved from Alpha Vantage TIME_SERIES_INTRADAY (interval 5min, extended_hours false, datatype json,
outputsize full, month YYYY-MM) under Data/bars/<TICKER>-<YYYY-MM>.json. The scheduled runs fetch them with the MCP tool
(1 call per ticker-month) and save the raw JSON; this script never calls the network.

  python3 -I Scripts/backtest.py NU                      # every setup, every NU file on disk
  python3 -I Scripts/backtest.py NU --setup orb-breakout --stop-atr 0.8 --t1 1.5 --t2 2.5
  python3 -I Scripts/backtest.py NU SPCX NVDA --md Backtests/   # write one note per ticker

Setups (mechanical versions of what the desk trades):
  orb-breakout        5-min close above the 09:30-09:45 range high after 09:45 (short: below the low). Stop = other side of the range
                      (capped at --stop-atr x ATR). Fill cap = trigger + 0.25 ATR.
  day2-continuation   only on days after a >= +4% day (short: <= -4%): close above the prior day high (short: below the low) after 09:45.
  vwap-pullback       after 09:45, price was >= 0.5 ATR above running VWAP, pulls back to within 0.2 ATR of VWAP, then a 5-min close back
                      above VWAP (short mirrored). Stop = entry - stop-atr x ATR.
  breakout-prior-high  close above the prior day high after 09:45, any day (short: below prior low).
Management (same as the living rules): scale 1/2 at T1 (--t1 R), stop to breakeven, remainder to T2 (--t2 R) or 15:55 close. If a bar
touches both stop and target, the STOP is assumed first (conservative). One trade per setup per day, no entries after 15:00.
ATR = average (high-low) of the prior 14 session days in the files (first 14 days are skipped for ATR-dependent setups).
"""
import argparse, json, pathlib, statistics, datetime, collections
V = pathlib.Path(__file__).resolve().parents[1]
BARS = pathlib.Path(__import__('os').environ.get('DESK_BARS', V / 'Data' / 'bars'))

def load_bars(ticker):
    files = sorted(BARS.glob(f"{ticker.upper()}-*.json"))
    if not files: raise SystemExit(f"no bar files for {ticker} in {BARS} (save TIME_SERIES_INTRADAY json as {ticker}-YYYY-MM.json)")
    bars = {}
    for f in files:
        d = json.loads(f.read_text())
        ts = next((v for k, v in d.items() if k.startswith("Time Series")), None)
        if not ts: raise SystemExit(f"{f.name}: no 'Time Series (5min)' key — is this an error/premium payload? keys={list(d)[:3]}")
        for t, o in ts.items():
            bars[t] = dict(o=float(o["1. open"]), h=float(o["2. high"]), l=float(o["3. low"]), c=float(o["4. close"]), v=float(o["5. volume"]))
    days = collections.OrderedDict()
    for t in sorted(bars):
        d, hm = t.split(" ")[0], t.split(" ")[1][:5]
        if "09:30" <= hm < "16:00": days.setdefault(d, []).append((hm, bars[t]))
    return days, [f.name for f in files]

def day_stats(bars):
    return dict(o=bars[0][1]["o"], h=max(b["h"] for _, b in bars), l=min(b["l"] for _, b in bars), c=bars[-1][1]["c"])

def read_ladder():
    """Desk/Trail.md frontmatter -> (unit, rungs_at, rungs_lock); None if the note is missing."""
    import re
    f = V / "Desk" / "Trail.md"
    if not f.exists(): return None
    m = re.match(r"^---\n(.*?)\n---", f.read_text(), re.S)
    if not m: return None
    fm = dict(l.split(":", 1) for l in m.group(1).splitlines() if ":" in l)
    num = lambda v: [float(x) for x in re.findall(r"-?\d+(?:\.\d+)?", v)]
    return (fm.get("unit", "R").strip().lower(), num(fm.get("rungs_at", "1 2 3 4 5 6 8 10 15")), num(fm.get("rungs_lock", "0.25 0.5 0.6 0.7 0.8 0.9 0.95 0.97 0.99")))

def ladder_stop(ladder, sgn, fill, risk, peak, cur_stop):
    unit, at, lock = ladder; gain = sgn * (peak - fill)
    prog = gain / risk if unit == "r" else 100.0 * gain / fill
    rung = None
    for a, l in zip(at, lock):
        if prog + 1e-9 >= a: rung = l
    if rung is None: return cur_stop
    new = fill + sgn * rung * gain
    return max(cur_stop, new) if sgn == 1 else min(cur_stop, new)

def simulate_trail(bars, i, side, entry, stop, t1, cap, ladder, scale=1/3):
    """v4 Winners + rising-stop ladder: scale `scale` at T1 (breakeven), the runner follows the ladder (stop only rises) until hit or 15:55."""
    sgn = 1 if side == "long" else -1
    fill = bars[i][1]["c"]
    if sgn * (fill - entry) > cap: return None
    risk = abs(fill - stop)
    if risk <= 0: return None
    T1 = fill + sgn * t1 * risk; cur_stop = stop; peak = fill; scaled = False; r_total = 0.0
    for hm, b in bars[i + 1:]:
        hit_stop = (b["l"] <= cur_stop) if sgn == 1 else (b["h"] >= cur_stop)
        if hit_stop:
            return r_total + ((1 - scale) if scaled else 1.0) * sgn * (cur_stop - fill) / risk
        if not scaled and ((b["h"] >= T1) if sgn == 1 else (b["l"] <= T1)):
            r_total += scale * t1; scaled = True; cur_stop = max(cur_stop, fill) if sgn == 1 else min(cur_stop, fill)
        peak = max(peak, b["h"]) if sgn == 1 else min(peak, b["l"])
        cur_stop = ladder_stop(ladder, sgn, fill, risk, peak, cur_stop)
        if hm >= "15:55": return r_total + ((1 - scale) if scaled else 1.0) * sgn * (b["c"] - fill) / risk
    last = bars[-1][1]["c"]
    return r_total + ((1 - scale) if scaled else 1.0) * sgn * (last - fill) / risk

def simulate(bars, i, side, entry, stop, t1, t2, cap):
    """Walk forward from bar i (entry fills at the trigger bar close if within the cap). Returns R multiple (half at T1, half at T2/close)."""
    sgn = 1 if side == "long" else -1
    fill = bars[i][1]["c"]
    if sgn * (fill - entry) > cap: return None  # fill worse than cap -> cancelled
    risk = abs(fill - stop)
    if risk <= 0: return None
    T1 = fill + sgn * t1 * risk; T2 = fill + sgn * t2 * risk
    half_done = False; cur_stop = stop; r_total = 0.0
    for hm, b in bars[i + 1:]:
        hit_stop = (b["l"] <= cur_stop) if sgn == 1 else (b["h"] >= cur_stop)
        hit_t1 = (b["h"] >= T1) if sgn == 1 else (b["l"] <= T1)
        hit_t2 = (b["h"] >= T2) if sgn == 1 else (b["l"] <= T2)
        if hit_stop:  # conservative: stop first
            r_stop = sgn * (cur_stop - fill) / risk
            return r_total + (0.5 if half_done else 1.0) * r_stop
        if not half_done and hit_t1:
            r_total += 0.5 * t1; half_done = True; cur_stop = fill
            if hit_t2: return r_total + 0.5 * t2
            continue
        if half_done and hit_t2: return r_total + 0.5 * t2
        if hm >= "15:55":
            return r_total + (0.5 if half_done else 1.0) * sgn * (b["c"] - fill) / risk
    last = bars[-1][1]["c"]
    return r_total + (0.5 if half_done else 1.0) * sgn * (last - fill) / risk

def run_setup(days, setup, side, stop_atr, t1, t2, ladder=None):
    names = list(days); out = []
    for di in range(14, len(names)):
        d = names[di]; bars = days[d]
        atr = statistics.mean(day_stats(days[n])["h"] - day_stats(days[n])["l"] for n in names[di - 14:di])
        prev = day_stats(days[names[di - 1]]); prev2 = day_stats(days[names[di - 2]]) if di >= 2 else prev
        sgn = 1 if side == "long" else -1
        cap = 0.25 * atr
        orb = [b for hm, b in bars if hm < "09:45"]
        if not orb: continue
        orh, orl = max(b["h"] for b in orb), min(b["l"] for b in orb)
        if setup == "day2-continuation":
            chg = 100.0 * (prev["c"] - prev2["c"]) / prev2["c"]
            if (side == "long" and chg < 4.0) or (side == "short" and chg > -4.0): continue
        vwap_num = vwap_den = 0.0; was_extended = pulled_back = False
        for i, (hm, b) in enumerate(bars):
            typ = (b["h"] + b["l"] + b["c"]) / 3.0; vwap_num += typ * b["v"]; vwap_den += b["v"]; vwap = vwap_num / vwap_den if vwap_den else b["c"]
            if hm < "09:45" or hm >= "15:00": continue
            trig = None
            if setup == "orb-breakout":
                if sgn * (b["c"] - (orh if sgn == 1 else orl)) > 0: trig = (orh if sgn == 1 else orl); stop = (orl if sgn == 1 else orh)
            elif setup in ("day2-continuation", "breakout-prior-high"):
                lvl = prev["h"] if sgn == 1 else prev["l"]
                if sgn * (b["c"] - lvl) > 0: trig = lvl; stop = b["c"] - sgn * stop_atr * atr
            elif setup == "vwap-pullback":
                if sgn * (b["c"] - vwap) >= 0.5 * atr: was_extended = True
                elif was_extended and abs(b["c"] - vwap) <= 0.2 * atr: pulled_back = True
                if pulled_back and sgn * (b["c"] - vwap) > 0 and sgn * (b["c"] - vwap) < 0.5 * atr: trig = b["c"]; stop = b["c"] - sgn * stop_atr * atr
            if trig is None: continue
            if setup == "orb-breakout" and abs(b["c"] - stop) > stop_atr * atr: stop = b["c"] - sgn * stop_atr * atr
            r = simulate_trail(bars, i, side, trig, stop, t1, cap, ladder) if ladder else simulate(bars, i, side, trig, stop, t1, t2, cap)
            if r is not None: out.append(dict(day=d, side=side, time=hm, fill=round(b["c"], 2), stop=round(stop, 2), atr=round(atr, 2), r=round(r, 2)))
            break
    return out

def summarize(trades):
    n = len(trades)
    if not n: return dict(n=0)
    rs = [t["r"] for t in trades]; wins = [r for r in rs if r > 0]
    worst_run = run = 0
    for r in rs:
        run = run + 1 if r <= 0 else 0; worst_run = max(worst_run, run)
    return dict(n=n, win_rate=round(100.0 * len(wins) / n, 1), avg_r=round(statistics.mean(rs), 3), sum_r=round(sum(rs), 2),
                avg_win_r=round(statistics.mean(wins), 2) if wins else 0, avg_loss_r=round(statistics.mean([r for r in rs if r <= 0]), 2) if len(wins) < n else 0, worst_losing_run=worst_run)

if __name__ == "__main__":
    ap = argparse.ArgumentParser(); ap.add_argument("tickers", nargs="+"); ap.add_argument("--setup", default="all"); ap.add_argument("--side", default="both")
    ap.add_argument("--stop-atr", type=float, default=0.8); ap.add_argument("--t1", type=float, default=1.5); ap.add_argument("--t2", type=float, default=2.5); ap.add_argument("--md", help="directory to write <TICKER> Backtest.md into"); ap.add_argument("--trail", action="store_true", help="manage with Rules v4 Winners + the rising-stop ladder in Desk/Trail.md instead of fixed T1/T2")
    a = ap.parse_args()
    setups = ["orb-breakout", "day2-continuation", "vwap-pullback", "breakout-prior-high"] if a.setup == "all" else [a.setup]
    sides = ["long", "short"] if a.side == "both" else [a.side]
    report = {}; ladder = read_ladder() if a.trail else None
    if a.trail and not ladder: raise SystemExit("--trail needs Desk/Trail.md")
    for tk in a.tickers:
        days, files = load_bars(tk); rows = []
        for s in setups:
            for sd in sides:
                tr = run_setup(days, s, sd, a.stop_atr, a.t1, a.t2, ladder); rows.append(dict(setup=s, side=sd, **summarize(tr), trades=tr))
        report[tk.upper()] = dict(files=files, sessions=len(days), params=dict(stop_atr=a.stop_atr, t1=a.t1, t2=a.t2, management=("v4 winners + ladder" if ladder else "fixed T1/T2")), results=rows)
        if a.md:
            md = [f"---\ntype: backtest\nticker: {tk.upper()}\nsessions: {len(days)}\nparams: stop {a.stop_atr}xATR, T1 {a.t1}R, {'runner on the Desk/Trail.md ladder' if ladder else f'T2 {a.t2}R'}\nfiles: {', '.join(files)}\n---",
                  f"# {tk.upper()} backtest — {len(days)} sessions ({list(days)[0]} → {list(days)[-1]})", "",
                  "Mechanical replay of the desk's setup types on 5-minute bars (Alpha Vantage). Stop first when a bar touches both. Scale 1/2 at T1, breakeven, rest to T2 or 15:55. One trade per setup per day. **A setup with avg R < 0 here should not be in the plan at default size.**", "",
                  "| Setup | Side | Trades | Win % | Avg R | Sum R | Avg win | Avg loss | Worst run |", "|---|---|---|---|---|---|---|---|---|"]
            for r in rows:
                md.append(f"| {r['setup']} | {r['side']} | {r['n']} | {r.get('win_rate','—')} | {r.get('avg_r','—')} | {r.get('sum_r','—')} | {r.get('avg_win_r','—')} | {r.get('avg_loss_r','—')} | {r.get('worst_losing_run','—')} |")
            md += ["", "## Trades", "", "| Day | Setup | Side | Time | Fill | Stop | ATR | R |", "|---|---|---|---|---|---|---|---|"]
            for r in rows:
                for t in r["trades"]: md.append(f"| {t['day']} | {r['setup']} | {t['side']} | {t['time']} | {t['fill']} | {t['stop']} | {t['atr']} | {t['r']} |")
            out = pathlib.Path(a.md); out.mkdir(parents=True, exist_ok=True); (out / f"{tk.upper()} Backtest.md").write_text("\n".join(md) + "\n")
    print(json.dumps({k: dict(sessions=v["sessions"], results=[{kk: vv for kk, vv in r.items() if kk != "trades"} for r in v["results"]]) for k, v in report.items()}, indent=1))
