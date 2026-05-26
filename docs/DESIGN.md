# Cart Trail — Design Document

> A single-screen, browser-playable microgame about Métis cart travel on the Carlton Trail.
> Built as a companion piece to the West and Back RPG and Métis Homeland Map projects.

---

## 1. Core Concept

You're a Métis cart driver on the Carlton Trail. You have limited time to travel from **Fort Garry to Fort Edmonton** (~567 miles). Your cart has limited space, wears down over time, and the trail throws problems at you. **Pack smart, maintain your cart, and don't lose your haul.**

### Design Pillars

1. **One screen, no clicks to start** — The game loads and you're playing
2. **Spatial puzzle is the core** — The cart grid *is* the game
3. **Every decision costs something** — Space, time, materials, or morale
4. **Historical grounding** — Real places, real distances, real consequences
5. **Playable in 15-20 minutes** — One complete journey

### Win Condition
Reach Fort Edmonton with ≥1 trade good in your cart and cart Wear below Critical.

### Lose Conditions
- Cart hits Wear 4 (catastrophic failure — stranded on the prairie)
- Run out of food (starvation — game over)
- Run out of time (season turns to winter — game over)

---

## 2. Game Structure

### The Map

The game map shows the Carlton Trail as a branching path of **30 nodes** (settlements, river crossings, landmarks) connected by trail segments. The player moves eastward to westward:

```
Fort Garry → ... → Fort Ellice → ... → Batoche → ... → Fort Edmonton
                                      ↕
                               Fort Qu'Appelle (southern branch)
```

Each segment has:
- **Distance** (in trail days, 1-5 days per segment)
- **Terrain type** (plains, river_valley, wooded, marsh, uplands)
- **Water availability** (reliable, seasonal, scarce)
- **Foraging quality** (good, moderate, poor, none)

### The Day Loop

Each game turn = one trail day. The player has **2 actions per day**:

| Action | Effect |
|---|---|
| **Travel** | Move to next node (consumes 1 day, triggers event check) |
| **Rest** | Recover crew, forage, repair cart (no movement) |
| **Repair** | Reduce cart Wear by 1 (costs materials) |
| **Forage** | Attempt to find food (Survival check, terrain-dependent) |
| **Trade** | Only at nodes — buy/sell/barter |
| **Organize** | Rearrange up to 4 items in cart grid (free action at camp) |

### The Season Clock

The game starts in **early summer** (June). Each trail day advances the calendar. The season affects:

| Season | Months | Effect |
|---|---|---|
| Summer | June-August | Normal travel, good foraging |
| Autumn | September-October | Slower travel, reduced foraging, cold nights |
| Early Winter | November | River crossings become dangerous, foraging stops |
| Deep Winter | December | Game over if not at destination |

The player has approximately **40-50 trail days** to complete the journey before winter.

---

## 3. Core Systems

### 3.1 Cart Grid (The Heart of the Game)

**8×6 grid** (48 cells), Resident Evil Tetris-style.

Items have dimensions (width × height), can be rotated 90°, and stackable items share cells.

**Item Categories:**

| Category | Examples | Notes |
|---|---|---|
| Food | Pemmican (1×2, stack 5), fresh meat (1×1, stack 5, spoils 3 days) | Consumed 1/day |
| Repair | Spare axle (2×4), shaganappi (1×2, stack 3), tool kit (1×2) | Required for field repairs |
| Trade Goods | Bison hides (2×2), beaver pelts (2×1), dried meat (2×1) | Win condition requires ≥1 |
| Shelter | Tarp (2×3), tent (2×2), blankets (1×1) | Required for rest actions |
| Tools | Rope (1×1), iron pot (1×1), axe (1×2) | Used in various checks |
| Fuel | Firewood (1×2, stack 3) | Required for cold nights |
| Medicine | Medicine pouch (1×1, stack 10), bandages (1×1, stack 5) | Treat injuries |

### 3.2 Cart Wear

| Level | Name | Grid Effect | Description |
|---|---|---|---|
| 0 | Sound | Full 8×6 | Fresh cart |
| 1 | Worn | Lose row 6 (8×5) | Axle cracking, side board loose |
| 2 | Broken | Lose rows 5-6 (8×4) | Frame cracked, wheel wobbling |
| 3 | Critical | Lose rows 4-6 (8×3) | Barely holds together |
| 4 | Destroyed | Game over | Cart collapses |

**Wear triggers:**
- Rough terrain segment: +1 Wear (50% chance)
- Failed river crossing: +1 to +3 Wear
- Overloading: immediate +1
- No repair after reaching level 2+: +1 per 3 days

**Repair:**
- Field repair: -1 Wear, costs 1 shaganappi + 1 tool kit, takes 1 action
- Settlement repair: -2 Wear, costs 2 MB or equivalent barter
- Full repair at HBC Fort: reset to 0, costs 5 MB

### 3.3 Events

Each travel day triggers an event check (d20). Events are modified by terrain, season, and cart condition.

**Event Categories:**
- **Terrain events** (rough ground, broken harness, mud)
- **Weather events** (rain, heat, blizzard forming)
- **Wildlife events** (game sighted, wolf pack, buffalo herd)
- **Human events** (other travelers, abandoned camp, NWMP patrol)
- **Mechanical events** (wheel crack, axle stress, harness wear)
- **Positive events** (good grazing, fresh spring, trail marker found)

### 3.4 River Crossings

Major rivers require a **crossing check** (d20 vs seasonal DC). The player can:
- **Ford** (standard, risk of failure)
- **Cart-raft** (safer but costs 2 hours + materials)
- **Wait** (costs 1-3 days, river level may drop)

Failure consequences scale with margin of failure (see RIVER_CROSSING.md reference data).

### 3.5 Resource Management

**Food:** 1 ration per day. Running out = starvation (game over in 3 days without foraging success).

**Water:** Automatic at river crossings and most nodes. Dry segments require water skins to be filled.

**Materials:** Shaganappi, spare axles, tool kits — consumed by repairs. Can be purchased at settlements or salvaged from events.

**Trade Goods:** The win condition. Must have ≥1 trade good at Fort Edmonton. Can be acquired through trading or hunting.

---

## 4. UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│  CART TRAIL                    Day 12 — July 14 — Summer   │
│  ═══════════                   Cart: ████░░░░  Wear: 1/3   │
│                                Food: 8 days  Crew: Rested   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [MAP]  Fort Garry ●──●──●──◆──●──●──●  Fort Edmonton     │
│                    ↑                                        │
│              St. François Xavier                            │
│              [Trade] [Rest] [Repair] [Intel]                │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  [CART GRID - 8×6]          │  [EVENT LOG]                  │
│  ┌──┬──┬──┬──┬──┬──┬──┬──┐  │  Traveled 2 days on open     │
│  │  │  │  │  │  │  │  │  │  │  prairie. Good grazing.      │
│  ├──┼──┼──┼──┼──┼──┼──┼──┤  │  Found a trail marker.       │
│  │  │  │  │  │  │  │  │  │  │  Navigation +2 next segment.  │
│  ├──┼──┼──┼──┼──┼──┼──┼──┤  │                               │
│  │  │  │  │  │  │  │  │  │  │  [ACTIONS]                    │
│  ├──┼──┼──┼──┼──┼──┼──┼──┤  │  [Travel] [Rest] [Repair]    │
│  │  │  │  │  │  │  │  │  │  │  [Forage] [Trade] [Organize]  │
│  ├──┼──┼──┼──┼──┼──┼──┼──┤  │                               │
│  │  │  │  │  │  │  │  │  │  │                               │
│  └──┴──┴──┴──┴──┴──┴──┴──┘  │                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Data Architecture

### Source Data (from West and Back project)
- `location_nodes.csv` → 30 trail nodes with coordinates, distances, amenities
- `cart_trails.kml` → GPS trail data for map rendering
- `CART_INVENTORY_SYSTEM.md` → Item definitions, grid rules, wear system
- `RIVER_CROSSING.md` → River crossing DCs, seasonal tables, failure consequences
- `TRAVEL_AND_DAY_CYCLE.md` → Day structure, travel events, camp actions
- `TRADE_AND_ECONOMY.md` → MB system, settlement trade types, prices
- `TOWN_MECHANICS.md` → Settlement actions, lodging costs, soft pressure
- `HISTORICAL_ENCOUNTERS.md` → 20 historical scenarios with d20 tables
- `NWMP_RESEARCH.md` → Patrol frequency, authority, escalation timeline

### Game Data Files (to create)
- `nodes.json` — Processed node data with terrain types, water, foraging
- `items.json` — Item definitions with grid sizes, stack limits, categories
- `events.json` — Event tables by terrain and season
- `rivers.json` — River crossing data with seasonal DCs
- `settlements.json` — Settlement amenities, trade inventory, lodging

---

## 6. Technical Approach

**Single HTML file.** No build step, no dependencies except Leaflet (CDN).

- `index.html` — Complete game in one file
- `src/game.js` — Game state, logic, event engine
- `src/grid.js` — Cart grid drag-and-drop system
- `src/map.js` — Trail map rendering (Leaflet)
- `src/ui.js` — UI updates, action handling
- `src/data.js` — All game data (nodes, items, events, rivers, settlements)

**Why single-file?**
- Deployable on GitHub Pages (like your other projects)
- No build tools to maintain
- Easy to iterate and test
- Fits the "micro" scope

---

## 7. Art Direction

**Style:** Clean, minimal, historically grounded. Think old maps + modern UI.

**Color palette:** Warm prairie tones — cream background, brown trails, green nodes, blue rivers.

**Map style:** Simplified trail map showing nodes as circles, trails as lines, rivers as blue strokes. Not a satellite map — a diagram.

**Cart grid:** Clean grid with item icons (simple colored rectangles with labels). Drag-and-drop with visual feedback (green = valid, red = invalid).

**No pixel art needed** — this is a UI-driven game, not a sprite game. The cart grid is the visual centerpiece.

---

## 8. Scope & Phasing

### Phase 1: Core Loop (Week 1)
- [ ] Cart grid with drag-and-drop placement
- [ ] Basic trail map with node-to-node movement
- [ ] Travel + event system
- [ ] Cart wear mechanics
- [ ] Win/lose conditions

### Phase 2: Depth (Week 2)
- [ ] River crossing system
- [ ] Settlement interactions (trade, repair, rest)
- [ ] Foraging and resource management
- [ ] Season clock
- [ ] Full event tables by terrain

### Phase 3: Polish (Week 3)
- [ ] Map rendering with real trail coordinates
- [ ] UI polish (animations, tooltips, responsive)
- [ ] Sound effects (optional — cart squeak, river sounds)
- [ ] Tutorial / help text
- [ ] Balance testing

### Phase 4: Integration (Future)
- [ ] Link from Homeland Map (click a trail → play the game)
- [ ] Share results ("I made it to Fort Edmonton with 3 bison hides!")
- [ ] Multiple scenarios (different seasons, different routes)

---

## 9. Open Questions

1. **Single cart or multi-cart?** Starting with 1 cart (8×6 grid). Multi-cart caravan is Phase 4.
2. **Crew size?** Abstracted — no individual crew members in Phase 1. Crew is a single "health" value.
3. **Combat?** No. This is a travel/survival game. Conflict is with the trail, not people.
4. **NWMP encounters?** Yes, but simplified — a scrutiny system that affects trade prices and can delay you.
5. **Michif language?** UI in English, but key terms in Michif (cart = "charette", trail = "li sentier"). Flavor text can include Michif phrases.

---

*Design v0.1 — May 26, 2026*
*Built on research from the West and Back RPG project and Métis Homeland Map*
