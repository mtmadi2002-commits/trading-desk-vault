---
type: live-switch
mode: paper-local
confirm_live: ""
allow_unattended_live: false
risk_profile: aggressive
max_risk_pct_per_trade: 7.5
max_open_risk_pct: 10
daily_stop_pct: 10
max_notional_pct: 100
max_concurrent: 2
no_entry_after_et: "15:00"
flat_by_et: "15:55"
paper_equity: 200
fractional_shares: true
min_qty: 0.01
profits_reinvested: true
floor_pct_of_peak: 50
---
# Live switch

**Account:** starts at **$200** (paper). Every closed trade's P&L is added to equity and the next order is sized from the new equity — profits compound, losses shrink the next size. In `paper-local` and `alpaca-paper` the ledger allows fractional shares (0.01 minimum) so a $1 risk still buys a slice of a $170 stock; `alpaca-live` uses whole shares, so on a $200 account most names above ~$40 are refused by the 25% notional cap until the account grows — that refusal is logged, not worked around.

This note is the ONLY place the desk's execution mode is set. The Coach never edits it; only you do.

| `mode` | What happens | Needs |
|---|---|---|
| `paper-local` (now) | fills simulated locally, ledger in `Journal/ledger.json` | nothing |
| `alpaca-paper` | real orders on Alpaca's **paper** account, real-time fills, no money | Alpaca paper keys as environment secrets `ALPACA_KEY_ID` / `ALPACA_SECRET_KEY`; network allow-list `paper-api.alpaca.markets`, `data.alpaca.markets` |
| `alpaca-live` | **real money** | live keys; allow-list `api.alpaca.markets`; `confirm_live: "I understand this is real money"` here; env `ALPACA_LIVE_ARMED=1`; `allow_unattended_live: true` here before any SCHEDULED run may place a live order; and the guards above all passing on every order |

**Risk profile: AGGRESSIVE** (set by the user 2026-10-06). Default risk 5% of equity per trade, 2.5% for low-confidence, hard max 7.5%; open risk cap 10%; notional up to 100% of equity (fractional shares); daily hard stop −10% (soft stop −6%: no new entries). Math, honestly: at 5% risk a +1.5R winner is +7.5%, a stopped trade is −5%; a 45% win rate at 1.5R averages about +0.6% per trade with swings of ±5–8% a day. Three losers in a row is −14%; there is no profile that loses nothing.

**Floor (user-set):** equity may never trade below **50% of its peak balance** — $100 at the start, ratcheting up as the account grows (peak $300 → floor $150) and never down. At or below the floor: every new entry is refused and open positions are flattened. No single order may risk more than the distance from equity to the floor.

Guards above apply to every mode. `Scripts/broker/exec.py preflight` shows the resolved state. Every order the desk sends is a **bracket** (entry limit + stop + take-profit) so the stop exists at the broker the moment the fill does.

Promotion path: paper-local → alpaca-paper (≥10 sessions, Coach reviews positive, replay-vs-fill gap understood) → alpaca-live at **half** the risk numbers above for the first 10 sessions.
