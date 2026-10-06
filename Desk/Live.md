---
type: live-switch
mode: paper-local
confirm_live: ""
allow_unattended_live: false
max_risk_pct_per_trade: 0.5
max_open_risk_pct: 1.0
daily_stop_pct: 1.5
max_notional_pct: 25
max_concurrent: 2
no_entry_after_et: "15:00"
flat_by_et: "15:55"
paper_equity: 100000
---
# Live switch

This note is the ONLY place the desk's execution mode is set. The Coach never edits it; only you do.

| `mode` | What happens | Needs |
|---|---|---|
| `paper-local` (now) | fills simulated locally, ledger in `Journal/ledger.json` | nothing |
| `alpaca-paper` | real orders on Alpaca's **paper** account, real-time fills, no money | Alpaca paper keys as environment secrets `ALPACA_KEY_ID` / `ALPACA_SECRET_KEY`; network allow-list `paper-api.alpaca.markets`, `data.alpaca.markets` |
| `alpaca-live` | **real money** | live keys; allow-list `api.alpaca.markets`; `confirm_live: "I understand this is real money"` here; env `ALPACA_LIVE_ARMED=1`; `allow_unattended_live: true` here before any SCHEDULED run may place a live order; and the guards above all passing on every order |

Guards above apply to every mode. `Scripts/broker/exec.py preflight` shows the resolved state. Every order the desk sends is a **bracket** (entry limit + stop + take-profit) so the stop exists at the broker the moment the fill does.

Promotion path: paper-local → alpaca-paper (≥10 sessions, Coach reviews positive, replay-vs-fill gap understood) → alpaca-live at **half** the risk numbers above for the first 10 sessions.
