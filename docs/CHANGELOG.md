# Changelog

## [Unreleased] — In Progress

### Current State (2026-05-27)

Game is fully playable single-file HTML with Leaflet map, event system, settlement overlays, cart/crew overlays, and end screen. Deployed to GitHub Pages. **Next priority: gameplay balance and event richness.**

### Known Issues (from playtest)

- **100% win rate** — game is too easy. Food too abundant, events too safe, wear never accumulates.
- **Settlement rest is free** — +2 food + crew reset at every stop with no cost
- **Events have no cascading consequences** — each resolves in one choice, no multi-day effects
- **Travel has no wear risk** — carts don't degrade from use
- **No settlement variety** — every node offers the same rest action

See `docs/PLAYTEST.md` for full analysis and design recommendations.

---

## Design Decisions Log

### 2026-05-27 — Playtesting Infrastructure

- **Decision:** Automated playtest harness (`playtest.js`) runs N games with seeded RNG
- **Rationale:** Balance changes need regression testing. Can't eyeball 200 games.
- **Current AI:** Conservative (always picks lowest-DC choice, camps only when starving)
- **Future:** Need Bold, Trader, Sprinter, Prepper, Random agent strategies

### 2026-05-27 — Theme Selection

- **Decision:** Rye (heading) + Alegreya (body) on cream/red/wood palette ("Frontier Post" / late 1800s Western)
- **Rationale:** Wanted-poster feel for headings. Alegreya is a warm, readable serif with period character.
- **Rejected:** MedievalSharp + IM Fell English (too medieval), Space Grotesk + DM Sans (too modern), Pirata One (too decorative), Buenard (too subtle)

### 2026-05-27 — Engine Split

- **Decision:** Engine code embedded in `index.html`, mirror kept in `src/engine.js`
- **Rationale:** Single-file deployment. `src/engine.js` is the canonical copy for headless testing.
- **Note:** Both copies must be kept in sync when engine changes are made.

### 2026-05-27 — Travel System

- **Decision:** 1 turn = 1 day, segments take multiple days (dist field on nodes)
- **Rationale:** More granular than 1 turn = 1 node. Creates tension between pushing on and making camp.
- **Event frequency:** 35% per travel day. Too low — should be 50%+ for excitement.

---

### 2026-05-26 — Core Architecture
- **Decision:** Single HTML file, no build step
- **Rationale:** Deployable on GitHub Pages, fits "micro" scope, easy to iterate
- **Rejected:** Multi-file build with framework (React, Vue) — overkill for this scope

### 2026-05-26 — Cart Management
- **Decision:** Hybrid weight + slots system (Heavy / Medium / General)
- **Rationale:** Full Tetris grid too complex for 5-10 min game. Pure weight too simple. Hybrid keeps spatial decisions without pixel-level placement.
- **Rejected:** Full 8×6 drag-and-drop Tetris — too slow for target play time

### 2026-05-26 — Dice System
- **Decision:** d20 + modifiers (crew condition + cart wear + item bonuses) vs DC
- **Rationale:** Makes preparation matter. Every item in your cart can help or hurt during encounters.
- **Rejected:** Pure d20 (too random), dice pool (too complex)

### 2026-05-26 — Crew System
- **Decision:** Abstract — no named characters. Single condition tracker (Rested/Tired/Exhausted)
- **Rationale:** Characters add scope and slow the pace. The cart IS the character.
- **Rejected:** Full RPG characters with skills/stats/backstories — wrong scope for microgame
- **Rejected:** Simple crew roles (Hunter/Trader/etc.) — interesting but adds complexity; revisit in Phase 4

### 2026-05-26 — Map & UI
- **Decision:** Map-first view (~70% screen) with bottom text panel (~30%). Event overlay dims map.
- **Rationale:** Old-school adventure game feel. Map is always visible. Events are immersive interruptions.
- **Rejected:** Split-screen (map left, text right) — wastes vertical space
- **Rejected:** Full-screen text with mini-map — loses the adventure game feel

### 2026-05-26 — Travel Flow
- **Decision:** Linear trail, one-click "Proceed" to advance. Random events per travel day (~40% chance).
- **Rationale:** Player focus is on preparation and events, not route-finding. The Carlton Trail IS the route.
- **Rejected:** Free navigation between any nodes — adds complexity without adding meaning

### 2026-05-26 — Start Position
- **Decision:** Fixed — Fort Garry, June 15
- **Rationale:** Clean start, teaches the game. Multiple starting positions in Phase 2+.
- **Rejected:** Scenario choice for v1 — scope creep

### 2026-05-26 — Target Length
- **Decision:** 5-10 minutes per playthrough, 11 key nodes
- **Rationale:** "Microgame" scope. Full 30-node route reserved for expanded scenarios.
- **Rejected:** Full 30-node journey — would require 20-30 min, wrong scope

### 2026-05-26 — Event Tone
- **Decision:** First person, immersive, detailed prose
- **Rationale:** Teaches through play. Every event is a window into trail life.
- **Rejected:** Second person ("You are...") — too gamey
- **Rejected:** Mechanical text ("Axle damaged. Choose response.") — not immersive

### 2026-05-26 — Art Direction
- **Decision:** Hand-drawn parchment map style. Placeholder art now, iPad illustrations later.
- **Rationale:** Atmospheric, historically grounded. Art production is a separate phase.
- **Rejected:** Pixel art — wrong vibe for map-first game
- **Rejected:** 3D rendering — overkill

---

*Decision log format: Decision → Rationale → Rejected alternatives*
