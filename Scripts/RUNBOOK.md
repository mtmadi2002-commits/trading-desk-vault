# Desk Runbook — how a scheduled session runs one mode

Vault artifact: https://claude.ai/artifact/JSScJUS6LxVYYfr98XfUVL  (files = notes + scripts; database = state/journal/alerts)
Playbook page (human view of the latest plan): https://claude.ai/artifact/3p1oPXKJcVnqULQmMMEgFr

The routines fire INTO the desk's own Claude Code session (it holds the Alpha Vantage and Firecrawl connectors); the container may have been recycled, so always re-fetch the vault from the artifact. Follow these steps exactly; each mode section says what to read, run and write.

## 0. Bootstrap (all modes)
1. `TZ=America/New_York date "+%Y-%m-%d %H:%M %A"` → NOW_ET, TODAY, DAY. Session date = TODAY for premarket/monitor/coach; for plan mode it is the NEXT US trading day (skip Sat/Sun; if TODAY is Friday the plan is for Monday).
2. Artifact `read` url=<vault> with `paths` = ["Scripts/RUNBOOK.md","Scripts/desk.workflow.js","Scripts/render_plan.py","Desk/Rules.md","Dashboard.md","Desk/Rules Changelog.md"] plus the mode's files below, `out_dir` = your scratchpad `/vault`. (Reading a file is also what lets you republish it later.)
3. Load ArtifactData via ToolSearch `select:ArtifactData`. `get` collection `state` doc_id `desk` → remember its `version`.
4. Use a workflow: `Workflow({ scriptPath: "<scratchpad>/vault/Scripts/desk.workflow.js", args: {...} })`. args always include: mode, date (session date), day, now_et, vault_dir (the scratchpad vault path), vault_url, rules (the full text of Desk/Rules.md), av_calls_remaining (from state.desk.av_calls_used_today: 25 − used; reset at midnight ET).
5. After the workflow returns, write results as the mode section says, then republish the vault: Artifact `publish` with `url`=<vault>, `file_path`=<scratchpad>/vault/index.html (read it first via paths too), and `files` mapping ONLY the notes you changed or created (path → local file). Finally `update` state/desk (pin `if_version`) with av_calls_used_today += the calls the seats reported, and `last_run: {mode, at}`.
6. Never trade live: this is a PAPER desk. Never invent a price. If a data source is down, say so in the note and in the alert, and stop.

## plan (evening, ~20:55 ET Sun–Thu; session date = next trading day)
Read additionally: the most recent `Reviews/*.md` and `Lessons/*.md` if any (list files with Artifact `list` scope `files`), and yesterday's plan for context.
args.prior_notes: 3–8 lines you verify yourself first with Firecrawl (7 s apart): SPY close/prev close/day range from https://stockanalysis.com/etf/spy/ ; the top 3 finviz screener themes (https://finviz.com/screener.ashx?v=111&s=ta_topgainers&f=sh_avgvol_o1000,sh_price_o5 and ta_mostactive); any headline that dominated the day.
Write: `Plans/<date> Plan.md` via `python3 -I Scripts/render_plan.py run.json <date> out.md` (save the workflow result JSON first; add `rules_version` and `run_id` keys to the JSON before rendering); `Journal/<date> Journal.md` from Templates/Journal.md; update Dashboard.md "Latest" links and add a scorecard row with planned trade count. Database: `set` state/desk fields session_date, plan (the `final` object), rules_version, premarket_status "pending", plus `delete` any `journal`/`alerts` docs from a previous date (list first). Push summary: regime, the ranked trades with entry/stop/T1/size, the vetoes, the two numbers to watch at the open.

## premarket (08:50 ET weekdays; session date = today)
Read additionally: `Plans/<today> Plan.md`, `Journal/<today> Journal.md`. args.plan = state/desk.plan.
Write: append a "## Premarket update (HH:MM ET)" section to the Plan note with the trade_status table, checklist answers, kill switches tripped and the alert text; `update` state/desk premarket (the whole object) and premarket_status (e.g. "2 live, 1 scrapped"). Push: the alert_text.

## monitor (hourly at :40, 09:40–15:40 ET weekdays — the platform minimum is 1 h; session date = today)
If NOW_ET < 09:30 or > 16:05, stop (say why). Read additionally: the Plan and Journal notes. args.plan = state.plan, args.premarket = state.premarket, args.journal = `list` collection `journal` ordered by ts (today's rows only).
Write: for each paper_action with action ≠ 'none', `set` journal doc_id `<HHMM>-<TICKER>-<action>` {ts (ISO), time_et, date, ticker, direction, action, price, size_pct, rule, evidence, indicative:true}; for each alert `set` alerts doc_id `<HHMM>-<n>` {ts, time_et, date, severity, text, source}; append one line per action/alert to the Journal note's tables; `update` state/desk open_positions, day_pnl_pct_indicative, kill_switches_tripped. Push ONLY if there is a critical alert or a paper action (otherwise end quietly with one line).

## coach (16:24 ET weekdays; session date = today)
Read additionally: Plan, Journal, Dashboard, `Rules Changelog`, all `Lessons/*.md` titles (file list). args.plan, args.premarket, args.journal as above.
Write: `Reviews/<today> Review.md` = coach.review_md; one `Lessons/Lesson - <title>.md` per lesson (Templates/Lesson.md shape, status "proposed" or "applied in Rules v<N>"); if any rule change applied: overwrite `Desk/Rules.md` with coach.new_rules_md (frontmatter version +1, updated date, updated_by Coach) and append rows to `Desk/Rules Changelog.md`; replace the day's indicative journal docs with exact ones from coach.replay (`set` doc_id `<HHMM>-<TICKER>-<action>` with indicative:false; delete the indicative docs you replaced); update Dashboard.md scorecard row (triggered, wins, losses, day R, day P&L %, rules v) and Latest links; `update` state/desk scorecard (array), rules_version, day_pnl_pct. Also update the ticker notes: create/append `Tickers/<TICKER>.md` with one line per trade (date, plan link, result R). Push: day R and P&L, seat grades in one line each, lessons titles, rule changes applied.

## Budgets (per day, desk-wide)
Alpha Vantage free key: 25 calls/day. plan ≤ 11, coach ≤ 5, premarket 0, monitor 0. Firecrawl ≈ 10 req/min: one request at a time, `sleep 7` between.
