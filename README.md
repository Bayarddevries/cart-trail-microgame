# Cart Trail — Project Overview

## What Is This?

**Cart Trail** is a browser-playable microgame about Métis cart travel on the Carlton Trail (Fort Garry to Fort Edmonton, ~567 miles). Pack your cart, manage wear, navigate rivers, and try to arrive with your haul intact.

**Think:** Resident Evil inventory management on the Canadian prairie.

## Project Structure

```
cart-trail-microgame/
├── docs/
│   ├── DESIGN.md       — Full game design document
│   ├── PLAN.md         — Phased build plan (4 phases)
│   ├── DATA.md         — Game data reference (items, nodes, events, etc.)
│   └── README.md       — This file
├── src/
│   ├── index.html      — Main game file (Phase 1)
│   ├── game.js         — Game state and logic
│   ├── grid.js         — Cart grid drag-and-drop
│   ├── map.js          — Trail map (Leaflet)
│   ├── ui.js           — UI rendering and actions
│   └── data.js         — Game data (nodes, items, events)
├── assets/             — Images, icons (Phase 3)
└── reference/          — Source research files (copies from West and Back)
```

## Current Status

**Phase 1 — Core Loop.** Not yet started. Docs complete.

## Source Research

All game data is derived from the West and Back RPG project:

| Source File | Used For |
|---|---|
| `location_nodes.csv` | 30 trail nodes, distances, coordinates |
| `CART_INVENTORY_SYSTEM.md` | Item definitions, grid rules, wear system |
| `RIVER_CROSSING.md` | River crossing DCs, seasonal tables |
| `TRAVEL_AND_DAY_CYCLE.md` | Day structure, travel events, weather |
| `TRADE_AND_ECONOMY.md` | MB system, settlement trade types |
| `TOWN_MECHANICS.md` | Settlement actions, lodging, events |
| `HISTORICAL_ENCOUNTERS.md` | 20 historical encounter scenarios |
| `NWMP_RESEARCH.md` | Patrol frequency, scrutiny system |
| `cart_trails.kml` | GPS trail coordinates for map rendering |

## Design Goals

1. **Playable in 15-20 minutes** — One complete journey
2. **Single HTML file** — No build step, GitHub Pages deployable
3. **Historically grounded** — Real places, real distances, real consequences
4. **Teaches through play** — Players learn about Métis cart culture naturally
5. **Reusable** — Built for West and Back integration later

## Phases

| Phase | Goal | Status |
|---|---|---|
| 1: Core Loop | Cart grid + travel + events + win/lose | 📋 Planned |
| 2: Depth | Full node data, rivers, settlements, resources | 📋 Planned |
| 3: Polish | Map rendering, UI polish, balance testing | 📋 Planned |
| 4: Integration | Homeland Map link, multiple scenarios | 📋 Planned |

## Key Technical Decisions

- **Single HTML file** — No build tools, maximum portability
- **Leaflet.js** (CDN) — Lightweight map rendering
- **Vanilla JS** — No frameworks, no dependencies
- **CSS Grid** — Layout for cart grid and UI
- **Drag-and-drop API** — Native browser API for item placement

## How to Run

Once built:
1. Open `index.html` in any browser
2. No server needed (except for Leaflet CDN)
3. Deploy to GitHub Pages by pushing to `gh-pages` branch

## License

Research data © West and Back RPG project. Game code MIT.

---
*Project started: May 26, 2026*
