# Cart Trail — Plan of Attack

> Phased build plan. Each phase is a complete, playable increment.

---

## Phase 1: Core Loop — "The Trail Works"

**Goal:** A playable game where you can pack a cart, travel node-to-node, and win/lose.

### Task 1.1: Project Scaffolding
- [ ] Create `index.html` with game layout (map panel, cart grid, event log, actions)
- [ ] Create `src/game.js` — game state object, main loop
- [ ] Create `src/data.js` — hardcoded starter data (5 nodes, 10 items, basic events)
- [ ] Set up Leaflet map with simplified trail line
- [ ] Basic CSS layout (grid-based, responsive)

### Task 1.2: Cart Grid System
- [ ] Render 8×6 grid in the UI
- [ ] Implement drag-and-drop item placement
- [ ] Validation: bounds check, overlap check, rotation
- [ ] Item definitions: size, stackable, category, name
- [ ] Quick-sort button (auto-arrange items)
- [ ] Visual feedback: green highlight (valid), red (invalid)

### Task 1.3: Trail Movement
- [ ] Render nodes on map (simplified — circles on a line)
- [ ] Click node to travel (if adjacent)
- [ ] Travel consumes 1 day
- [ ] Day counter and season tracker
- [ ] Basic event trigger on travel (random from small table)

### Task 1.4: Cart Wear
- [ ] Wear level tracking (0-3)
- [ ] Grid shrinks as wear increases (lose bottom rows)
- [ ] Items in lost rows must be relocated or abandoned
- [ ] Wear increases from rough terrain events
- [ ] Basic repair action (costs materials)

### Task 1.5: Win/Lose
- [ ] Win: Reach Fort Edmonton with ≥1 trade good, Wear < 4
- [ ] Lose: Wear = 4 (cart destroyed)
- [ ] Lose: Food = 0 for 3 days (starvation)
- [ ] Game over screen with summary

### Task 1.6: Event System
- [ ] d20 event table (10 events to start)
- [ ] Events modify: food, wear, materials, time
- [ ] Event log in UI (last 5 events visible)
- [ ] Terrain-modified events (plains vs river valley)

**Deliverable:** Playable prototype. Pack cart → travel → events → win/lose.

---

## Phase 2: Depth — "The Trail Bites Back"

**Goal:** All core systems working. The game is challenging and historically grounded.

### Task 2.1: Full Node Data
- [ ] Process `location_nodes.csv` → `nodes.json` (all 30 nodes)
- [ ] Add terrain type per segment (estimated from geography)
- [ ] Add water availability per segment
- [ ] Add foraging quality per segment
- [ ] Render full trail map with real coordinates

### Task 2.2: River Crossings
- [ ] Identify which nodes are river crossings
- [ ] Implement crossing check (d20 vs seasonal DC)
- [ ] Ford vs cart-raft choice
- [ ] Failure consequences (supply loss, wear, time delay)
- [ ] Seasonal DC variation (summer easy, spring break-up deadly)

### Task 2.3: Settlement System
- [ ] Settlement types: HBC Fort, Métis Community, Trading Post, NWMP Post, Mission
- [ ] Trade action: buy/sell with settlement-specific inventory and prices
- [ ] Repair action: settlement repair (better than field repair)
- [ ] Rest action: recover at settlement (better than trail rest)
- [ ] Intel action: learn about next segment
- [ ] Lodging costs by settlement type

### Task 2.4: Resource Management
- [ ] Food consumption (1/day automatic)
- [ ] Foraging system (Survival check, terrain-dependent)
- [ ] Water tracking (only on dry segments)
- [ ] Material tracking (shaganappi, spare axles, tool kits)
- [ ] Trade goods (acquired through trade or hunting events)

### Task 2.5: Season Clock
- [ ] Calendar display (month + day)
- [ ] Season effects on travel speed
- [ ] Season effects on foraging
- [ ] Season effects on river crossings
- [ ] Winter = game over if not at destination

### Task 2.6: Full Event Tables
- [ ] 20+ events per terrain type
- [ ] Positive and negative events
- [ ] Events that add/remove items from cart
- [ ] Events that force decisions (abandoned cart — take supplies or leave them?)
- [ ] Historical event flavor text

### Task 2.7: NWMP System
- [ ] Scrutiny tracking (increases at NWMP posts, decreases over time)
- [ ] Scrutiny effects: higher trade prices, cargo inspection, delays
- [ ] Document system (travel papers reduce scrutiny)
- [ ] Escalation: high scrutiny = forced to leave settlement

**Deliverable:** Full game loop. All systems working. Playable start to finish.

---

## Phase 3: Polish — "The Trail Feels Real"

**Goal:** The game looks good, feels good, and teaches you something.

### Task 3.1: Map Polish
- [ ] Render trail from real GPS coordinates (cart_trails.kml)
- [ ] Node icons by settlement type
- [ ] River rendering (blue lines)
- [ ] Player position indicator
- [ ] Trail "fading" behind player (committed to the journey)
- [ ] Zoom and pan

### Task 3.2: UI Polish
- [ ] Cart grid: item icons with labels and colors by category
- [ ] Tooltips on items (name, size, description)
- [ ] Action buttons with icons
- [ ] Event log with icons and color coding
- [ ] Responsive layout (works on mobile)
- [ ] Loading screen with historical flavor text

### Task 3.3: Tutorial
- [ ] First-time help overlay (explain the grid, the trail, the goal)
- [ ] Context-sensitive tips ("Your cart is getting worn. Find a settlement to repair.")
- [ ] Historical notes on each node (click to learn about the real place)

### Task 3.4: Balance Testing
- [ ] Playtest 10+ complete games
- [ ] Adjust event frequencies
- [ ] Adjust item quantities and prices
- [ ] Adjust travel times
- [ ] Ensure the game is challenging but fair

### Task 3.5: Michif Integration
- [ ] Key terms in Michif throughout UI
- [ ] Flavor text in Michif (with English translation)
- [ ] Historical notes reference Michif language and culture

**Deliverable:** Polished, shareable game. Ready for GitHub Pages.

---

## Phase 4: Integration — "The Trail Connects"

**Goal:** Link with existing projects. Expand scope.

### Task 4.1: Homeland Map Link
- [ ] "Play Cart Trail" button on Homeland Map trail nodes
- [ ] Pass starting position from map to game
- [ ] Share results back to map ("I traveled this trail!")

### Task 4.2: Multiple Scenarios
- [ ] Summer start (easier, default)
- [ ] Autumn start (harder, less time)
- [ ] Spring start (risky, rivers are high)
- [ ] Southern branch route (Pembina → Wood Mountain → Fort Walsh)

### Task 4.3: Multi-Cart Caravan
- [ ] 2-3 carts (multiple grids)
- [ ] Speed = slowest cart
- [ ] More capacity but more complexity

### Task 4.4: Share Results
- [ ] End-of-game summary card
- [ ] Share to social media ("I made it to Fort Edmonton with 3 bison hides and a broken axle!")
- [ ] Leaderboard (fastest time, most goods delivered)

---

## Immediate Next Steps

1. **Create the project files** (index.html, src/, basic layout)
2. **Build the cart grid** (the core mechanic — everything else supports this)
3. **Build the trail map** (simplified first, real coordinates later)
4. **Wire up travel + events** (the game loop)
5. **Playtest and iterate**

---

*Plan v0.1 — May 26, 2026*
