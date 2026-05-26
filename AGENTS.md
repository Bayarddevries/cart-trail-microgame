# AGENTS.md — Cart Trail Microgame

> Behavioral guidelines for AI agents working on this project.
> Merged from Karpathy-style coding rules + project-specific instructions.

---

## 1. Think Before Coding

Don't assume. Don't hide confusion. Surface tradeoffs.

- **State assumptions explicitly.** If uncertain about game behavior, ask.
- **If multiple design interpretations exist, present them** — don't pick silently.
- **If a simpler approach exists, say so.** Push back when warranted.
- **If something is unclear, stop.** Name what's confusing. Ask before writing code.
- **This is a microgame, not an MMO.** Every feature should justify its complexity. If it doesn't fit in a 5-10 minute play loop, it's probably out of scope — say so.

---

## 2. Simplicity First

Minimum code that solves the problem. Nothing speculative.

- **No features beyond what the DESIGN.md specifies.** Phase gates exist for a reason. Don't build Phase 3 features in Phase 1.
- **No abstractions for single-use code.** This is a single HTML file. Don't create a module system unless the file exceeds 1000 lines.
- **No "flexibility" or "configurability" wasn't requested.** Don't add settings, options screens, or JSON config files unless explicitly planned.
- **No error handling for impossible scenarios.** The player can't type free-form input. Validate only what can actually break.
- **If you write 200 lines and it could be 50, rewrite it.**
- Ask yourself: *"Would a senior engineer say this is overcomplicated?"* If yes, simplify.

### This Project Specifically
- **Leaflet.js is the only external dependency.** Install nothing else.
- **Vanilla JS only.** No frameworks, no build tools, no npm.
- **Single `index.html`** for v1. If you think you need a separate JS file, justify it.
- **Inline CSS.** No SASS, no PostCSS, no CSS files unless the inline styles exceed 500 lines.

---

## 3. Surgical Changes

Touch only what you must. Clean up only your own mess.

- **Don't "improve" adjacent code, comments, or formatting** that you didn't write.
- **Don't refactor things that aren't broken.** The existing code style is fine. Match it.
- **Match existing style, even if you'd do it differently.** Consistency > personal preference.
- **If you notice unrelated dead code, mention it — don't delete it.** Let the human decide.
- **Every changed line should trace directly to the task at hand.** If a line change doesn't serve the current task, revert it.

### This Project Specifically
- **Don't reorganize the game state object** unless the task explicitly requires it.
- **Don't rename variables** to be "more descriptive" unless they're genuinely confusing.
- **Don't add JSDoc comments** to every function. Comment only non-obvious logic.
- **Don't convert inline scripts to ES modules** unless the file is unmaintainable.

---

## 4. Goal-Driven Execution

Define success criteria. Loop until verified.

- **Transform tasks into verifiable goals:**
  - "Add event system" → "Travel triggers event overlay with text + 2+ choices. d20 roll resolves. Outcome modifies game state."
  - "Fix inventory bug" → "Weight calculation matches sum of item weights × counts. Overload highlights red."
  - "Add river crossing" → "River node triggers crossing event. d20 vs DC. Success/failure have different consequences."
- **For multi-step tasks, state a brief plan:**
  1. [Step] → verify: [check]
  2. [Step] → verify: [check]
  3. [Step] → verify: [check]
- **Strong success criteria let you loop independently.** Weak criteria ("make it work") require constant clarification.

### This Project Specifically
- **After every task, open `index.html` in a browser and click through the game.** If it doesn't load or a button doesn't work, the task isn't done.
- **After every task, check the console for JS errors.** Zero errors = done. Any errors = fix before moving on.
- **After every task, verify the game state updates correctly.** Click Proceed → day counter increments. Click Cart → inventory shows. Click Camp → food decreases.

---

## 5. Project-Specific Rules

### File Structure
```
cart-trail-microgame/
├── index.html          ← THE game file. Everything lives here for v1.
├── docs/
│   ├── DESIGN.md       ← Read this before implementing anything
│   ├── DATA.md         ← Source data for nodes, items, events
│   ├── IMPLEMENTATION.md ← Task breakdown
│   ├── CHANGELOG.md    ← Design decisions log
│   └── ...
├── src/                ← Empty for now. Use only if index.html exceeds 1000 lines.
├── assets/             ← Empty. Art goes here when ready.
└── reference/          ← Empty. Source research copies.
```

### Data Sources
All game data is derived from the West and Back RPG project at `~/projects/west-and-back/`:
- `Game Data/mechanics/travel/location_nodes.csv` — Node positions, distances
- `Game Data/mechanics/core/CART_INVENTORY_SYSTEM.md` — Item definitions
- `Game Data/mechanics/travel/RIVER_CROSSING.md` — River crossing DCs
- `Game Data/mechanics/travel/TRAVEL_AND_DAY_CYCLE.md` — Events, weather
- `Game Data/mechanics/economy/TRADE_AND_ECONOMY.md` — Prices, trade types
- `Game Data/mechanics/encounters/HISTORICAL_ENCOUNTERS.md` — Event scenarios
- `Game Data/reference/data/cart_trails.kml` — GPS trail coordinates

### Art
- **Placeholder art only.** Use colored `<div>` with `TODO: ART` label.
- **Art slots are clearly marked.** Don't try to create art. That's Bayard's job on iPad.
- **Style reference:** Hand-drawn parchment map, warm prairie tones, 19th-century explorer aesthetic.

### Game Design Non-Negotiable
- **Single HTML file.** No build step. Opens in any browser.
- **5-10 minute playthrough.** If your change makes the game longer without adding meaning, reconsider.
- **First-person immersive text.** Every event is a story moment. Never mechanical ("You lose 1 food").
- **d20 + modifiers vs DC.** This is the core resolution mechanic. Don't add dice pools, card systems, etc.
- **Weight-based inventory.** Not Tetris grid. Not slot-based. Weight (kg) with a capacity limit.
- **Linear trail.** Player clicks Proceed. No route-finding. The Carlton Trail IS the route.

### Git
- **Commit after every task.** Small, atomic commits.
- **Commit message format:** `feat: what you did` or `fix: what you fixed`
- **Don't commit broken code.** If it doesn't load in a browser, don't commit.

---

## 6. When to Stop and Ask

**Ask before:**
- Adding any new system not in DESIGN.md
- Changing the game state structure
- Adding external dependencies
- Creating new files (src/, assets/, etc.)
- Changing the UI layout
- Modifying event text tone or style

**Don't ask before:**
- Fixing a bug in existing code
- Adding events to existing event tables
- Adjusting numbers (DCs, weights, prices) for balance
- Improving existing function clarity without changing behavior
- Adding comments to non-obvious logic

---

*These guidelines are working if: fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.*
