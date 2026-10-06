#!/usr/bin/env python3
"""Desk execution layer. One entry point, three backends, hard interlocks.
Paper account compounds: equity = paper_equity (Live.md) + sum of realized P&L; every size is computed from that live equity.

  exec.py [--unattended] preflight        -> checks mode, keys, clock, account; prints JSON (routines always pass --unattended)
  exec.py enter  --symbol NU --side buy --entry 15.20 --stop 14.72 --t1 16.00 [--t2 16.40] --risk-pct 0.5 [--limit-cap 15.37]
  exec.py scale  --symbol NU --fraction 0.5
  exec.py stop-to-breakeven --symbol NU
  exec.py exit   --symbol NU --reason "kill switch: EWZ < 42.74"
  exec.py flatten --reason "15:55 flat rule"
  exec.py positions
  exec.py ledger                           -> paper-local ledger (positions, closed trades, day P&L %)

Mode comes from the vault note Desk/Live.md (frontmatter `mode:`):
  paper-local   simulate fills locally against the quote you pass (--fill) or the entry price; ledger in Journal/ledger.json
  alpaca-paper  real orders on Alpaca's paper account (paper-api.alpaca.markets) — real-time fills, no money
  alpaca-live   real money. Requires ALL of: mode alpaca-live, confirm_live: "I understand this is real money",
                env ALPACA_LIVE_ARMED=1, and the daily/loss/notional guards below passing.

Env: ALPACA_KEY_ID, ALPACA_SECRET_KEY (set as environment secrets). Never printed.
Guards (all modes except paper-local read the account): risk per order <= max_risk_pct_per_trade, open risk <= max_open_risk_pct,
day P&L <= -daily_stop_pct => refuse new entries and flatten, notional per order <= max_notional_pct of equity, no entries after no_entry_after_et,
flatten at flat_by_et. Every refusal prints a JSON {ok:false, reason} and exits 2; nothing is sent to the broker.
"""
import argparse, json, os, sys, re, datetime, urllib.request, urllib.error, pathlib, math

VAULT = pathlib.Path(os.environ.get("DESK_VAULT", pathlib.Path(__file__).resolve().parents[2]))
LIVE_NOTE = VAULT / "Desk" / "Live.md"
LEDGER = VAULT / "Journal" / "ledger.json"

def et_now():
    try:
        from zoneinfo import ZoneInfo
        return datetime.datetime.now(ZoneInfo("America/New_York"))
    except Exception:
        return datetime.datetime.utcnow() - datetime.timedelta(hours=4)

def read_frontmatter(path):
    if not path.exists(): return {}
    txt = path.read_text()
    m = re.match(r"^---\n(.*?)\n---", txt, re.S)
    if not m: return {}
    fm = {}
    for line in m.group(1).splitlines():
        if ":" in line:
            k, v = line.split(":", 1); v = v.strip().strip('"').strip("'")
            try: v = float(v) if re.match(r"^-?\d+(\.\d+)?$", v) else v
            except: pass
            if v in ("true","false"): v = (v == "true")
            fm[k.strip()] = v
    return fm

CFG = read_frontmatter(LIVE_NOTE)
MODE = CFG.get("mode", "paper-local")
G = dict(floor_pct_of_peak=float(CFG.get("floor_pct_of_peak", 0)), equity_start=float(CFG.get("paper_equity", 100000)), max_risk_pct_per_trade=float(CFG.get("max_risk_pct_per_trade", 0.5)), max_open_risk_pct=float(CFG.get("max_open_risk_pct", 1.0)),
         daily_stop_pct=float(CFG.get("daily_stop_pct", 1.5)), max_notional_pct=float(CFG.get("max_notional_pct", 25)),
         max_concurrent=int(CFG.get("max_concurrent", 2)), no_entry_after_et=str(CFG.get("no_entry_after_et", "15:00")),
         flat_by_et=str(CFG.get("flat_by_et", "15:55")), paper_equity=float(CFG.get("paper_equity", 100000)))

def fail(reason, code=2):
    print(json.dumps({"ok": False, "mode": MODE, "reason": reason})); sys.exit(code)
def ok(**kw):
    kw.update(ok=True, mode=MODE); print(json.dumps(kw, default=str)); return kw

# ---------------- Alpaca backend ----------------
def alpaca_base():
    if MODE == "alpaca-live": return "https://api.alpaca.markets"
    return "https://paper-api.alpaca.markets"
def alpaca(method, path, body=None, data_api=False):
    key, sec = os.environ.get("ALPACA_KEY_ID"), os.environ.get("ALPACA_SECRET_KEY")
    if not key or not sec: fail("ALPACA_KEY_ID / ALPACA_SECRET_KEY not set in environment secrets")
    url = ("https://data.alpaca.markets" if data_api else alpaca_base()) + path
    req = urllib.request.Request(url, method=method, headers={"APCA-API-KEY-ID": key, "APCA-API-SECRET-KEY": sec, "Content-Type": "application/json", "Accept": "application/json"},
                                 data=json.dumps(body).encode() if body is not None else None)
    try:
        with urllib.request.urlopen(req, timeout=20) as r: return json.loads(r.read() or b"{}")
    except urllib.error.HTTPError as e:
        fail(f"alpaca {method} {path} -> HTTP {e.code}: {e.read().decode()[:300]}")
    except Exception as e:
        fail(f"alpaca {method} {path} unreachable: {e} (is the host allow-listed in the environment network policy?)")

UNATTENDED = ("--unattended" in sys.argv)
if UNATTENDED: sys.argv.remove("--unattended")

def live_armed():
    if MODE != "alpaca-live": return True
    if UNATTENDED and not bool(CFG.get("allow_unattended_live", False)):
        return False  # routines may never trade real money unless the user also sets allow_unattended_live: true
    if CFG.get("confirm_live") != "I understand this is real money": return False
    if os.environ.get("ALPACA_LIVE_ARMED") != "1": return False
    return True

# ---------------- paper-local ledger ----------------
def load_ledger():
    L = json.loads(LEDGER.read_text()) if LEDGER.exists() else {"equity_start": G["paper_equity"], "positions": {}, "closed": [], "day": et_now().strftime("%Y-%m-%d")}
    eq = L["equity_start"] + sum(c["pnl"] for c in L["closed"])
    L["peak_equity"] = max(L.get("peak_equity", L["equity_start"]), eq)
    return L
def save_ledger(L): LEDGER.parent.mkdir(parents=True, exist_ok=True); LEDGER.write_text(json.dumps(L, indent=1))
def day_pnl_pct_local(L):
    eq = L["equity_start"]; today = et_now().strftime("%Y-%m-%d")
    return 100.0 * sum(c["pnl"] for c in L["closed"] if c.get("day") == today) / eq

# ---------------- account state (any mode) ----------------
def account():
    if MODE == "paper-local":
        L = load_ledger(); eq = L["equity_start"] + sum(c["pnl"] for c in L["closed"])
        open_risk = sum(abs(p["entry"] - p["stop"]) * p["qty"] for p in L["positions"].values())
        return dict(equity=round(eq, 2), equity_start=L["equity_start"], profit=round(eq - L["equity_start"], 2), peak_equity=round(L["peak_equity"], 2), floor=round(L["peak_equity"] * G["floor_pct_of_peak"] / 100.0, 2), cash_free=round(eq - sum(p["entry"] * p["qty"] for p in L["positions"].values()), 2), day_pnl_pct=day_pnl_pct_local(L), open_risk_pct=100 * open_risk / eq, positions=L["positions"], source="ledger")
    a = alpaca("GET", "/v2/account"); pos = alpaca("GET", "/v2/positions")
    eq = float(a["equity"]); last_eq = float(a.get("last_equity", eq) or eq)
    P = {p["symbol"]: dict(qty=float(p["qty"]), entry=float(p["avg_entry_price"]), side="long" if float(p["qty"]) > 0 else "short", unrealized=float(p.get("unrealized_pl", 0))) for p in pos}
    L = load_ledger(); L["peak_equity"] = max(L.get("peak_equity", eq), eq); save_ledger(L)
    return dict(equity=eq, day_pnl_pct=100 * (eq - last_eq) / last_eq if last_eq else 0.0, open_risk_pct=None, positions=P, buying_power=float(a.get("buying_power", 0)), peak_equity=L["peak_equity"], floor=round(L["peak_equity"] * G["floor_pct_of_peak"] / 100.0, 2), source=alpaca_base())

def guard_common(acct, new_risk_pct=0.0, entering=False):
    now = et_now().strftime("%H:%M")
    floor = acct.get("floor") or 0.0
    if floor and acct["equity"] <= floor: fail(f"FLOOR: equity {acct['equity']:.2f} <= floor {floor:.2f} (50% of peak {acct.get('peak_equity')}) — no new entries; flatten")
    if entering and floor and acct["equity"] * new_risk_pct / 100.0 > (acct["equity"] - floor): fail(f"FLOOR: risking {acct['equity']*new_risk_pct/100:.2f} would breach the floor {floor:.2f} (room {acct['equity']-floor:.2f})")
    if acct["day_pnl_pct"] <= -G["daily_stop_pct"]: fail(f"daily stop hit: day P&L {acct['day_pnl_pct']:.2f}% <= -{G['daily_stop_pct']}% — flatten only")
    if entering:
        if now >= G["no_entry_after_et"]: fail(f"no entries after {G['no_entry_after_et']} ET (now {now})")
        if len(acct["positions"]) >= G["max_concurrent"]: fail(f"max concurrent {G['max_concurrent']} reached")
        if new_risk_pct > G["max_risk_pct_per_trade"] + 1e-9: fail(f"risk {new_risk_pct}% > max {G['max_risk_pct_per_trade']}% per trade")
        if acct["open_risk_pct"] is not None and acct["open_risk_pct"] + new_risk_pct > G["max_open_risk_pct"] + 0.02:  # 0.02-pt tolerance for fill slippage on tiny accounts
            fail(f"open risk {acct['open_risk_pct']:.2f}% + {new_risk_pct}% > cap {G['max_open_risk_pct']}%")

# ---------------- commands ----------------
def cmd_preflight(a):
    out = dict(mode=MODE, config=G, live_note=str(LIVE_NOTE), live_note_present=LIVE_NOTE.exists(), et_now=et_now().isoformat(), armed=live_armed())
    if MODE != "paper-local":
        out["keys_present"] = bool(os.environ.get("ALPACA_KEY_ID") and os.environ.get("ALPACA_SECRET_KEY"))
        if out["keys_present"]:
            clock = alpaca("GET", "/v2/clock"); acct = account()
            out.update(market_open=clock.get("is_open"), next_open=clock.get("next_open"), next_close=clock.get("next_close"),
                       equity=acct["equity"], day_pnl_pct=round(acct["day_pnl_pct"], 3), positions=list(acct["positions"].keys()), buying_power=acct.get("buying_power"))
    else:
        acct = account(); out.update(equity=acct["equity"], peak_equity=acct.get("peak_equity"), floor=acct.get("floor"), day_pnl_pct=round(acct["day_pnl_pct"], 3), positions=list(acct["positions"].keys()))
    ok(**out)

def cmd_enter(a):
    if not live_armed(): fail("alpaca-live not armed: needs Desk/Live.md confirm_live sentence, env ALPACA_LIVE_ARMED=1, and (for scheduled runs) allow_unattended_live: true")
    acct = account()
    dist = abs(a.entry - a.stop)
    if dist <= 0: fail("stop must differ from entry")
    raw = acct["equity"] * (a.risk_pct / 100.0) / dist
    frac = bool(CFG.get("fractional_shares", False)) and MODE != "alpaca-live"
    qty = math.floor(raw * 100) / 100.0 if frac else math.floor(raw)
    if qty < (float(CFG.get("min_qty", 0.01)) if frac else 1): fail(f"computed qty {raw:.4f} below minimum ({'0.01 fractional' if frac else '1 whole share'}) — risk {a.risk_pct}% of ${acct['equity']:.2f} is ${acct['equity']*a.risk_pct/100:.2f} against a ${dist:.2f} stop")
    # CASH ACCOUNT: an order can never exceed the notional cap or the cash not already in open positions — clip, don't refuse
    cap_notional = acct["equity"] * G["max_notional_pct"] / 100.0
    cash_free = acct["equity"] - sum((p.get("entry", 0) * p.get("qty", 0)) for p in acct["positions"].values())
    max_notional = min(cap_notional, cash_free)
    if max_notional < acct["equity"] * 0.05: fail(f"no cash: {cash_free:.2f} free of {acct['equity']:.2f} (open positions use the rest)")
    clipped = None
    if qty * a.entry > max_notional:
        q2 = (math.floor(max_notional / a.entry * 100) / 100.0) if frac else math.floor(max_notional / a.entry)
        if q2 < (float(CFG.get("min_qty", 0.01)) if frac else 1): fail(f"cash {max_notional:.2f} buys less than the minimum quantity of {a.symbol} at {a.entry}")
        clipped = f"clipped from {qty} to {q2} by {'cash' if max_notional < cap_notional else 'notional cap'} ({max_notional:.2f})"; qty = q2
    notional = qty * a.entry
    eff_risk = 100.0 * qty * dist / acct["equity"]
    guard_common(acct, new_risk_pct=eff_risk, entering=True)
    if a.symbol in acct["positions"]: fail(f"already in {a.symbol}")
    limit = a.limit_cap if a.limit_cap else a.entry
    if MODE == "paper-local":
        fill = a.fill if a.fill else a.entry
        if (a.side == "buy" and fill > limit) or (a.side == "sell" and fill < limit): fail(f"fill {fill} worse than limit cap {limit} — cancelled")
        L = load_ledger(); L["positions"][a.symbol] = dict(side="long" if a.side == "buy" else "short", qty=qty, entry=fill, stop=a.stop, t1=a.t1, t2=a.t2, risk_pct=a.risk_pct, opened=et_now().isoformat(), scaled=False)
        save_ledger(L); return ok(action="enter", symbol=a.symbol, qty=qty, fill=fill, stop=a.stop, t1=a.t1, t2=a.t2, notional=round(qty * fill, 2), risk_pct_requested=a.risk_pct, risk_pct_effective=round(eff_risk, 2), clipped=clipped, cash_free_after=round(cash_free - qty * fill, 2), indicative=False)
    body = dict(symbol=a.symbol, qty=str(qty), side=a.side, type="limit", limit_price=str(round(limit, 2)), time_in_force="day", order_class="bracket",
                take_profit=dict(limit_price=str(round(a.t1, 2))), stop_loss=dict(stop_price=str(round(a.stop, 2))))
    o = alpaca("POST", "/v2/orders", body)
    ok(action="enter", symbol=a.symbol, qty=qty, order_id=o.get("id"), status=o.get("status"), limit=limit, stop=a.stop, t1=a.t1, notional=round(notional, 2), risk_pct_requested=a.risk_pct, risk_pct_effective=round(eff_risk, 2), clipped=clipped, bracket=True)

def cmd_scale(a):
    acct = account()
    if a.symbol not in acct["positions"]: fail(f"no position in {a.symbol}")
    if MODE == "paper-local":
        L = load_ledger(); p = L["positions"][a.symbol]; q = round(p["qty"] * a.fraction, 2) if isinstance(p["qty"], float) and p["qty"] != int(p["qty"]) else math.floor(p["qty"] * a.fraction); px = a.fill if a.fill else p["t1"]
        pnl = (px - p["entry"]) * q * (1 if p["side"] == "long" else -1)
        L["closed"].append(dict(symbol=a.symbol, qty=q, entry=p["entry"], exit=px, pnl=pnl, reason="scale at T1", day=et_now().strftime("%Y-%m-%d"), at=et_now().isoformat()))
        p["qty"] -= q; p["scaled"] = True; save_ledger(L); return ok(action="scale", symbol=a.symbol, qty=q, fill=px, pnl=round(pnl, 2), remaining=p["qty"])
    p = acct["positions"][a.symbol]; q = math.floor(abs(p["qty"]) * a.fraction)
    o = alpaca("POST", "/v2/orders", dict(symbol=a.symbol, qty=str(q), side="sell" if p["side"] == "long" else "buy", type="market", time_in_force="day"))
    ok(action="scale", symbol=a.symbol, qty=q, order_id=o.get("id"), status=o.get("status"))

def cmd_breakeven(a):
    acct = account()
    if a.symbol not in acct["positions"]: fail(f"no position in {a.symbol}")
    if MODE == "paper-local":
        L = load_ledger(); L["positions"][a.symbol]["stop"] = L["positions"][a.symbol]["entry"]; save_ledger(L); return ok(action="stop-to-breakeven", symbol=a.symbol, stop=L["positions"][a.symbol]["entry"])
    # Alpaca: replace the open stop leg with a stop at avg entry
    orders = alpaca("GET", f"/v2/orders?status=open&symbols={a.symbol}&nested=true")
    p = acct["positions"][a.symbol]; replaced = []
    for o in orders:
        for leg in [o] + o.get("legs", []):
            if leg.get("type") in ("stop", "stop_limit") and leg.get("status") in ("new", "accepted", "held"):
                r = alpaca("PATCH", f"/v2/orders/{leg['id']}", dict(stop_price=str(round(p["entry"], 2)))); replaced.append(r.get("id"))
    ok(action="stop-to-breakeven", symbol=a.symbol, stop=p["entry"], replaced=replaced)

def cmd_exit(a):
    acct = account()
    if a.symbol not in acct["positions"]: fail(f"no position in {a.symbol}")
    if MODE == "paper-local":
        L = load_ledger(); p = L["positions"].pop(a.symbol); px = a.fill if a.fill else p["stop"]
        pnl = (px - p["entry"]) * p["qty"] * (1 if p["side"] == "long" else -1)
        L["closed"].append(dict(symbol=a.symbol, qty=p["qty"], entry=p["entry"], exit=px, pnl=pnl, reason=a.reason, day=et_now().strftime("%Y-%m-%d"), at=et_now().isoformat()))
        save_ledger(L); return ok(action="exit", symbol=a.symbol, qty=p["qty"], fill=px, pnl=round(pnl, 2), reason=a.reason)
    alpaca("DELETE", f"/v2/orders?symbols={a.symbol}")  # cancel bracket legs first
    r = alpaca("DELETE", f"/v2/positions/{a.symbol}")
    ok(action="exit", symbol=a.symbol, order_id=r.get("id"), status=r.get("status"), reason=a.reason)

def cmd_flatten(a):
    if MODE == "paper-local":
        L = load_ledger(); out = []
        for sym in list(L["positions"].keys()):
            p = L["positions"].pop(sym); px = a.fill if a.fill else p["entry"]
            pnl = (px - p["entry"]) * p["qty"] * (1 if p["side"] == "long" else -1)
            L["closed"].append(dict(symbol=sym, qty=p["qty"], entry=p["entry"], exit=px, pnl=pnl, reason=a.reason, day=et_now().strftime("%Y-%m-%d"), at=et_now().isoformat())); out.append(sym)
        save_ledger(L); return ok(action="flatten", closed=out, reason=a.reason)
    alpaca("DELETE", "/v2/orders"); r = alpaca("DELETE", "/v2/positions?cancel_orders=true")
    ok(action="flatten", result=r, reason=a.reason)

def cmd_positions(a): ok(**account())
def cmd_ledger(a):
    if MODE != "paper-local": fail("ledger is paper-local only; use positions")
    L = load_ledger(); ok(day_pnl_pct=round(day_pnl_pct_local(L), 3), **L)

if __name__ == "__main__":
    ap = argparse.ArgumentParser(); sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("preflight"); sub.add_parser("positions"); sub.add_parser("ledger")
    e = sub.add_parser("enter"); e.add_argument("--symbol", required=True); e.add_argument("--side", choices=["buy","sell"], required=True)
    e.add_argument("--entry", type=float, required=True); e.add_argument("--stop", type=float, required=True); e.add_argument("--t1", type=float, required=True)
    e.add_argument("--t2", type=float); e.add_argument("--risk-pct", dest="risk_pct", type=float, default=0.5); e.add_argument("--limit-cap", dest="limit_cap", type=float); e.add_argument("--fill", type=float)
    s = sub.add_parser("scale"); s.add_argument("--symbol", required=True); s.add_argument("--fraction", type=float, default=0.5); s.add_argument("--fill", type=float)
    b = sub.add_parser("stop-to-breakeven"); b.add_argument("--symbol", required=True)
    x = sub.add_parser("exit"); x.add_argument("--symbol", required=True); x.add_argument("--reason", default="rule"); x.add_argument("--fill", type=float)
    f = sub.add_parser("flatten"); f.add_argument("--reason", default="flat rule"); f.add_argument("--fill", type=float)
    a = ap.parse_args()
    {"preflight": cmd_preflight, "enter": cmd_enter, "scale": cmd_scale, "stop-to-breakeven": cmd_breakeven, "exit": cmd_exit, "flatten": cmd_flatten, "positions": cmd_positions, "ledger": cmd_ledger}[a.cmd](a)
