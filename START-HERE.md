# Trading Desk — START HERE

Saved 2026-10-06 ~01:45 ET. Everything the desk is, in one folder.

## Live pages (private to your Claude account)
- **Desk Floor (3D robots, live feed, ledger, plan, scorecard):** https://claude.ai/artifact/JSScJUS6LxVYYfr98XfUVL
- **Playbook for Tue Oct 6:** https://claude.ai/artifact/3p1oPXKJcVnqULQmMMEgFr
- **Vault repo (source of truth, every run pushes here):** https://github.com/mtmadi2002-commits/trading-desk-vault
- **Claude Code session that runs the routines:** https://claude.ai/code/session_01URQVpT1mE8o8ZHUQRQHzvP

## Schedule (Eastern, weekdays) — fires on its own
| 08:50 | premarket re-level + broker preflight → push alert |
| 09:40 … 15:40 hourly | monitor: demo orders through the guarded execution layer → ledger, alerts, 3D replay |
| 16:24 | coach: replay vs 5-min bars, seat grades, lessons, rule changes |
| 20:55 (Sun–Thu) | next day's plan (7 seats) → playbook page |

## The account (paper)
$200 start, profits compound. Risk profile AGGRESSIVE (your setting): 5% per trade (2.5% low-confidence, 7.5% max), open risk ≤ 10%, daily soft stop −6% / hard stop −10%, **floor at 50% of peak balance** (never trades below it), fractional shares in paper. Set in `vault/Desk/Live.md` (mode) and `vault/Desk/Rules.md` (rules v2).

## What's in this folder
```
vault/                      the Obsidian vault — open this folder in Obsidian (Git plugin pre-configured)
  Dashboard.md              start page inside Obsidian
  Desk/Rules.md             living rules v2 · Rules Changelog.md · Live.md (execution mode + guards) · Seats.md
  Plans/2026-10-06 Plan.md  tonight's plan + the rehearsal premarket section · .desk.json / .premarket.json
  Journal/                  today's journal note (+ ledger.json once trades happen)
  Reviews/ Lessons/ Tickers/ Templates/
  Scripts/desk.workflow.js  the 7-seat, 4-mode workflow
  Scripts/broker/exec.py    execution layer (paper-local / alpaca-paper / alpaca-live) with the guards
  Scripts/RUNBOOK.md        exactly what each scheduled run does
  Scripts/render_plan.py · render_premarket.py · inject_files.py
  index.html + floor3d.js   the Desk Floor page (2D cards + 3D room)
  .claude/settings.json     the permission rule the routines use
playbooks/                  tonight's playbook as Markdown, HTML and raw JSON
README.md                   the long-form description
```

## To look things up later
- Why a trade was taken: `Plans/<date> Plan.md` (the thesis, trigger, sources) and the ticket/ledger on the Desk Floor.
- What happened: `Journal/<date> Journal.md` and `Journal/ledger.json`.
- What the desk learned: `Reviews/<date> Review.md`, `Lessons/`, and the `Rules Changelog`.
- Who did what, when: the Live feed on the Desk Floor, or the `activity` rows in the page's database.

## Honest notes
Demo money until you change `mode:` in `Desk/Live.md` and add Alpaca keys as environment secrets. Quotes are 15–20 min delayed on the free feed; the Coach's 16:24 replay against real 5-minute bars is the number that counts. No profile loses nothing — the stops, daily stop and floor are what limit the damage.
