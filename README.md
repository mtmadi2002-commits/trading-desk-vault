# Trading Desk — 7 seats, 4 modes, paper account, learns nightly

A seven-seat day-trading desk that runs as Claude Code workflows on a schedule,
keeps its memory in an Obsidian vault, paper-trades its own plan, and rewrites
its rules every evening from what actually happened.

**Live pages (private to you)**
- Vault (notes + live paper journal): https://claude.ai/artifact/JSScJUS6LxVYYfr98XfUVL
- Playbook for the next session: https://claude.ai/artifact/3p1oPXKJcVnqULQmMMEgFr

## Seats
| # | Seat | Job |
|---|------|-----|
| 1 | Screener | watchlist from finviz screens; price ≥ $5, avg vol ≥ 1M |
| 2 | Macro / Regime | index levels, calendar (verified against official sources), no-trade windows |
| 3 | Technical | intraday structure, structure stops 0.7–1.5× ATR, long + short setup, A–F grade |
| 4 | Catalyst / News | what moved each name, fresh vs stale, tomorrow's earnings |
| 5 | Head Trader | ranked playbook under the living rules; premarket re-level; intraday paper execution |
| 6 | Risk Manager | adversarial; vetoes are binding |
| 7 | Smart Money & Power | Form 4 insiders, Congress, 13F, Trump / Vance / Musk statements, DOJ·SEC·OFAC, Gulf — each with its true latency |
| — | Coach | nightly replay vs 5-min bars, seat grades, lessons, rule changes under a change policy |

## Daily loop (America/New_York, weekdays)
| Time | Mode | What happens |
|---|---|---|
| 20:55 (Sun–Thu) | plan | seats 1–7 → `Plans/<date> Plan.md`, playbook page, journal note |
| 08:50 | premarket | re-level vs pre-market; live / halved / scrapped per the plan's own rules |
| 09:40 … 15:40 hourly | monitor | paper execution on delayed quotes (indicative) + Seat 7 real-time watch → journal rows, alerts |
| 16:24 | coach | exact replay, grades, `Reviews/`, `Lessons/`, `Desk/Rules.md` v+1 if a change is justified |

Routines are bound to the originating Claude Code session (it holds the Alpha Vantage and Firecrawl connectors). The runbook every run follows is `vault/Scripts/RUNBOOK.md`.

## The learning rule (in `vault/Desk/Rules.md`)
The Coach may tighten any risk rule on one piece of evidence, may loosen only with ≥ 10 journaled trades, and never touches the −1.5% daily stop or the no-overnight rule. Every change is a changelog row linking the review note that justified it.

## Honest limits
- **Paper only.** No broker is connected; nothing is executed for real. Connect a broker (e.g. an Alpaca MCP) and the execution seat swaps in.
- Quotes are 15–20 min delayed (finviz) and the monitor runs hourly, so intraday fills are indicative; the Coach's replay against 5-minute bars is the number that counts.
- Alpha Vantage free key: 25 calls/day desk-wide; Firecrawl ~10 req/min.
- Obsidian sync: the vault is the GitHub repo `mtmadi2002-commits/trading-desk-vault`; every run pulls, commits and pushes `main`, and the Obsidian Git plugin (pre-configured in `.obsidian/`) pulls it every 5 minutes.

## Layout
```
trading-desk/
  vault/                 the Obsidian vault (open this folder in Obsidian)
    Desk/Rules.md        living rules (v1) · Rules Changelog.md · Seats.md
    Plans/  Journal/  Reviews/  Lessons/  Tickers/  Templates/
    Scripts/desk.workflow.js   the 4-mode workflow
    Scripts/render_plan.py     plan JSON → Obsidian note
    Scripts/RUNBOOK.md         what each scheduled run does
  plans/                 rendered playbooks (md + html + raw json)
  trading-desk-vault.zip
```
