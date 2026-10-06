# Trading Desk Vault — instructions for Claude Code sessions in this repo

This repo is the Obsidian vault and codebase of an automated, seven-seat, PAPER day-trading desk. It is also the live data of a running system — read this before changing anything.

## Who runs the desk
- The **engine is a cloud Claude Code session** (https://claude.ai/code/session_01URQVpT1mE8o8ZHUQRQHzvP). Four routines fire into it on weekdays (ET): 08:50 premarket, 09:40–15:40 hourly monitor (demo execution), 16:24 coach, 20:55 next-day plan. Each run pulls `main`, writes notes, commits and pushes, and mirrors to the Desk Floor page.
- A **local session (this one, probably)** is for reading, analysing and editing. Do NOT create routines here, do NOT run the monitor/coach modes against the live ledger from here, and do NOT run `Scripts/broker/exec.py` in a non-paper mode. Pull before editing; push after; keep commits small — a run may push at any minute.

## Map
- `Dashboard.md` — start page. `Desk/Rules.md` — living rules (v2, aggressive profile). `Desk/Rules Changelog.md` — every change with evidence. `Desk/Live.md` — execution mode + guards (**only the user edits this**). `Desk/Seats.md` — the seven seats.
- `Plans/<date> Plan.md` (+ `.desk.json`, `.premarket.json`) — the day's playbook with sources. `Journal/<date> Journal.md` + `Journal/ledger.json` — what was executed. `Reviews/`, `Lessons/`, `Tickers/` — what the Coach learned.
- `Scripts/desk.workflow.js` — the 4-mode workflow (plan / premarket / monitor / coach). `Scripts/RUNBOOK.md` — exactly what each scheduled run does. `Scripts/broker/exec.py` — execution layer with the guards. `Scripts/render_plan.py`, `render_premarket.py`, `inject_files.py` — renderers.
- `index.html` + `floor3d.js` — the Desk Floor page (https://claude.ai/artifact/JSScJUS6LxVYYfr98XfUVL): 2D seat cards + 3D robots, fed by that artifact's database (`state/desk`, `activity`, `journal`, `alerts`).

## Hard rules
- Never invent a price, level or fill. Every number cites a source.
- Risk numbers live in `Desk/Live.md` (guards) and `Desk/Rules.md` (policy). The Coach may tighten, never loosen; the user may do either. Floor = 50% of peak equity; daily hard stop −10%; no overnight holds.
- `alpaca-live` is refused for scheduled runs unless `allow_unattended_live: true` is in `Desk/Live.md`. Do not change that from a local session.
- Track people only by name, role, fund or office — never by ethnicity, religion or nationality.

## Useful local commands
- `python3 -I Scripts/broker/exec.py preflight` — shows mode, equity, floor, guards (safe; read-only in paper-local when no order is given).
- `python3 -I Scripts/broker/exec.py ledger` — the paper ledger.
- `python3 -I Scripts/render_plan.py Plans/<date>.desk.json <date> out.md` — re-render a plan note.
- Data budgets if you call the tools yourself: Alpha Vantage free key 25 calls/day desk-wide (the cloud runs need ~15); Firecrawl ~10 req/min.
