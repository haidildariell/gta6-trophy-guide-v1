# Leonida Legend — GTA VI Trophy Guide & Tracker

An offline, open-source guide and tracker for all 55 official **Grand Theft Auto VI**
trophies on PlayStation 5: 1 Platinum, 2 Gold, 6 Silver, 46 Bronze (28 hidden,
1,000 Gamerscore on Xbox). No network requests, no account, no ads.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Or open `app/index.html` directly — it is plain static files (one ES module, CSS,
a JSON data file, no build step).

## What it does

- **Checklist** — all 55 trophies with their exact official names, descriptions and
  grades. Tick one when it pops; progress is saved in localStorage, with export to
  file and import back.
- **Search & filters** — by text, by kind (story, missable, side strands,
  collectibles, activities, robbery, exploration, money, combat, partner, secret),
  by grade, earned-only / hide-earned. There are no online trophies — all 55 are
  single-player.
- **Spoiler setting** — hides hidden trophies' names and descriptions until earned.
- **Guide for every trophy** — written in this guide's own words, with its sources
  cited beside it (Exophase for the official list; GTABase, Output Lag and
  KeenGamer for methods). Five trophies have no confirmed unlock method at launch;
  their guides say so plainly instead of inventing steps.
- **Progress counters** — countable trophies (250 stunts, 100 WAiNK locations,
  18 meditation spots, …) have a counter against their target.
- **Notes** — a free-text note per trophy, saved with your progress.
- **Roadmap to the Platinum** — nine phases with live progress, plus the save
  habits that protect a one-playthrough Platinum (no mission replay).
- **Missables** — the one possibly missable trophy (Positive Mental Attitude) and
  the one time-sensitive strand mission, with the full story behind each.
- **Next Up** — a planner that sorts what to chase next: missable first, then
  time-sensitive, then roadmap order.
- **Two themes** — Vice Nights (dark) and Leonida Day (light).
- **Demo mode** — open with `?demo=1` to preview the tracker with 13 of 55
  trophies already earned. Demo progress is only seeded when you have no saved
  progress.

## Sources

- Names, descriptions and grades: the official list as carried by Exophase
  (reported by Push Square, 18 Nov 2026).
- Hidden / visible split and Gamerscore values: Output Lag,
  <https://outputlag.com/guides/gta-6-trophy-list/>.
- Method details: Output Lag, GTABase
  (<https://www.gtabase.com/articles/gta-6/gta-6-achievements-trophies-list-ps5-xbox-series>)
  and KeenGamer
  (<https://www.keengamer.com/articles/guides/gta-6-trophy-guide-platinum-roadmap-all-55-trophies/>).
- Platinum estimate (~200 hours, 4/10): PowerPyx via GTABase / KeenGamer.
- Rarity data is not published yet — PSNProfiles and TrueTrophies had no GTA VI
  page at launch — so no rarity figures are shown.

No Rockstar artwork or logos are used. This is an unofficial fan-made guide.
