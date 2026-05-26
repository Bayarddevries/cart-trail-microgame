# Cart Trail — Implementation Plan

> **Goal:** Build a playable microgame in a single HTML file. Map-first UI with first-person event text, d20 dice mechanics, weight-based inventory, and immersive trail narration.

**Architecture:** Single `index.html` with inline CSS and `<script>` modules. Leaflet.js (CDN) for map rendering. Event-driven game loop. No build step.

**Tech Stack:** HTML5, CSS3, vanilla JavaScript, Leaflet.js (CDN)

**Art:** Placeholder art only. Art slots marked `TODO: ART` for final illustrations.

---

## Phase 1: Shell & Map

### Task 1.1: HTML Shell
- Create `index.html` with full layout: map panel (70%), bottom text panel (30%), status bar, controls
- CSS: parchment theme, event overlay, inventory overlay, dice animation
- Inline Leaflet map with simplified trail line and node markers
- JavaScript: game state object, map init, UI update functions, button wiring

### Task 1.2: Basic Travel Loop
- `proceed()` function: consume food, check for random event, advance node, update UI
- Month/season tracking
- Simple event trigger (40% chance per travel day)

### Task 1.3: Inventory Screen
- Weight calculation from cart items
- Weight bar with overload highlighting
- Close button returns to map

### Task 1.4: Camp Action
- Consume 1 food, improve crew condition
- Auto-repair if tools + shaganappi available

---

## Phase 2: Data & Events

### Task 2.1: Node Data
- 13 key nodes with coordinates, type, terrain, water, foraging
- Segment data: days, terrain, water availability

### Task 2.2: Event Engine
- Event tables by terrain type (plains, river_valley, wooded, uplands)
- `presentEvent()` — show overlay with art slot + text + choices
- `resolveEvent()` — d20 + modifiers vs DC, apply consequences
- 6-8 events per terrain (30+ total)

### Task 2.3: Item System
- Full item definitions: weight, type, count, descriptions
- Starting loadout balanced for ~40-day journey
- Items referenced by events (spare axle helps with axle events, etc.)

---

## Phase 3: Depth

### Task 3.1: River Crossings
- River nodes trigger crossing event
- d20 vs seasonal DC (summer easy, autumn moderate, spring dangerous)
- Ford vs cart-raft choice
- Failure: supply loss, wear increase, time delay

### Task 3.2: Settlement Trading
- Settlement types with different inventory/prices
- Buy/sell/barter mechanics
- Métis communities: barter only, free lodging, best intel
- HBC Forts: full MB trade, workshop repairs
- Missions: free rest + healing

### Task 3.3: Season System
- Calendar display (month + day)
- Season modifiers on travel, foraging, crossings
- Early winter warning
- Deep winter = game over if not at destination

### Task 3.4: Balance Pass
- 5+ full playthroughs
- Tune event frequency, item weights, DCs
- Ensure challenging but fair

---

## Phase 4: Polish

### Task 4.1: Real Map Data
- Parse `cart_trails.kml` for actual trail coordinates
- Render real trail line on Leaflet map

### Task 4.2: Art Integration
- Replace `TODO: ART` placeholders with illustrations
- Event-specific art panels

---

*Plan v0.1 — May 26, 2026*
*Based on design decisions in DESIGN.md and CHANGELOG.md*
