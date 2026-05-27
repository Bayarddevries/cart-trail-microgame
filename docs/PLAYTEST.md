# Cart Trail — Playtest Report & Design Notes

> Auto-generated from playtest harness runs + manual analysis.
> Last updated: 2026-05-27

---

## 1. Automated Playtest Baseline (200 games, seed 1–200)

**Command:** `node playtest.js --seeds 200`

| Metric | Value | Target | Status |
|---|---|---|---|
| Win rate | **100%** (200/200) | 60–75% | 🔴 Way too easy |
| Avg steps | 50.9 | 45–60 | 🟡 Acceptable |
| Avg score | 1354 | Wide spread | 🔷 Too tight (1295–1400) |
| Errors | 0 | 0 | 🟢 Clean |
| Avg food remaining | ~10 | 0–3 | 🔴 Way too much |
| Avg wear | **0** | 1–2 | 🔴 Never takes damage |
| Crew at end | Always rested | Mixed | 🔴 Never degraded |

## 2. AI Playtest Harness Behavior

**Location:** `playtest.js`

The AI (pickAction function) plays conservatively:
- **Events:** Always picks the choice with the lowest DC (prefers dc≤10, avoids dc>13)
- **Settlements:** Always picks `rest` (restores crew +1 food), never trades
- **Travel:** Camps only when food ≤ 2

This means the AI never takes risks and still wins 100% of the time. A human player making suboptimal choices should still be able to win ~60-75% of games.

### AI Strategy Gaps (for future multi-agent testing)

The current AI only tests one playstyle (ultra-safe). To properly balance, we need agents that test:

| Agent | Strategy | What it tests |
|---|---|---|
| **Safe** (current) | Always pick lowest-DC choice, always rest | Baseline win rate |
| **Bold** | Pick highest-risk choice, never camp unless starving | Upper bound on difficulty |
| **Trader** | Prioritize trade actions at settlements, buy low sell late | Trade route value balance |
| **Sprinter** | Never camp, push through exhausted | Speedrun / min-days strategy |
| **Prepper** | Camp every 3 days, hoard food | Conservative resource strategy |
| **Random** | Random valid choice each turn | Chaos / floor win rate |

**Target metrics by agent:**

| Agent | Expected Win Rate |
|---|---|
| Safe | 85–95% |
| Bold | 40–60% |
| Trader | 60–80% |
| Sprinter | 30–50% |
| Prepper | 70–90% |
| Random | 40–70% |

If Safe wins <85%, the game is too hard even for perfect play. If Random wins >70%, the game is too easy regardless of strategy.

---

## 3. Root Cause Analysis — Why the Game is Too Easy

### 3.1 Food Economy is Broken

**Current flow:**
- Start: 20 food
- Settlement `rest`: +2 food (14 nodes × potential rest = +28)
- Travel: -1 food per day (~50 days = -50)
- **Net: 20 + 28 - 50 = -2** (theoretically tight)

**Why it doesn't settle at -2:**
- The AI rests at every settlement (gaining +2 each time)
- Many events give free food (+1 to +3) with no cost
- Camps cost 1 food but the AI only camps when at 2 food (too late to matter)
- The player never needs to make hard food choices

### 3.2 Settlement Rest is Free

`settlementAction('rest')` at line ~806 of index.html:
```javascript
if (action === 'rest') { S.crew = 'rested'; S.food += 2; }
```
No cost, no trade-off. Full crew reset + food refill at every stop.

### 3.3 Wear Never Accumulates

- Events only add wear on **failed** rolls
- The AI always picks safe choices (low DC) → rarely fails
- Travel has **no wear check** — carts don't degrade from use
- Cart condition (S.wear) stays at 0 the entire game

### 3.4 Events Are Too Safe

Current event structure (line 827-853):
- 35% chance of event per travel day (`rand() > 0.35` → null)
- When events fire, most have a "safe" choice (alwaysWear: 1, or no DC)
- Failure consequences are mild: wear +1, food -1, lose a day
- No cascading consequences — each event resolves in one choice
- Events don't affect future events (no state carryover between segments)

### 3.5 Crew System is Underutilized

- Crew only degrades from events (not from travel)
- Tired → Exhausted progression requires multiple bad events
- AI always rests at settlements, so crew never degrades
- Exhausted crew (-2 to rolls) is almost impossible to reach in practice

---

## 4. Design Recommendations (Priority Order)

### P0 — Food Economy Rebalance (CRITICAL)

1. **Reduce starting food from 20 → 12**
2. **Settlement rest gives +1 food (not +2)**
3. **Add travel wear check:** 20% base chance of +1 wear per travel day (terrain-modified)
4. **Event food gains should be rarer and cost something** (time, risk, or resources)

### P1 — Settlement Variety & Trade-offs

1. **Not every settlement offers rest.** Some offer trade only, some offer repairs, some offer healing.
2. **Rest costs 1 food** (you eat while resting). Net effect: crew reset, food neutral.
3. **Add meaningful trade actions:** Buy/sell goods, repair cart, hire help.
4. **Settlement actions should be a real choice, not automatic.**

### P2 — Event System Overhaul

1. **Increase event frequency:** 50% chance per travel day (from 35%)
2. **Every event should have real consequences on failure** (not just +1 wear):
   - Lose a trade good
   - Lose a day stuck
   - Crew injured (skip next settlement)
   - Axle breaks (need spare or lose cart)
   - Goods ruined by water
   - Ox goes lame (travel at half speed for 2 days)
3. **Add multi-stage events** that span multiple days
4. **Weather events should persist** (rain lasts 2-3 days, not one choice)
5. **Add events that fire between nodes** (nighttime events, dawn events)

### P3 — Crew Degradation

1. **Travel degrades crew:** Every 2 travel days without rest → tired. Every 3 → exhausted.
2. **Exhausted = disaster:** Can't travel until rested. Must camp 2 days minimum.
3. **Crew state visible in UI.** Show the ox condition too.

### P4 — Cart Condition Matters More

1. **Wear 3 = slowed travel** (costs 2 days to cross 1 segment day)
2. **Wear 4 = game over** (cart breaks irreparably)
3. **Repair requires tools + materials** (not automatic at settlements)

### P5 — Scoring & Leaderboard

Current scoring doesn't create interesting differentiation. Add bonuses/penalties for:
- Days under par (speed bonus)
- Wear at end (condition bonus)
- Trade goods delivered (profit bonus)
- Events resolved (experience bonus)
- Food remaining converted to score
- Death/ failure should still give a partial score

---

## 5. Event Design — Historical Carlton Trail Incidents

Drawing from DATA.md / HISTORICAL_ENCOUNTERS.md research. These are real types of things that happened on the trail:

### Terrain-Specific Events

**Plains:**
- Prairie fire (smoke for days, forced detour, lose 2 days)
- Buffalo herd blocks trail (wait or push through — push risks ox panic)
- Stampede (lose cart supplies if not secured)
- Dried riverbed crossing (lose a day finding water)
- Rattlesnake in cart (cargo damage, crew injury)
- Other travellers — meet a westbound cart (trade info or goods)

**River Valley:**
- Spring flooding (fording DC increases by +4)
- Mosquito plague (lose sleep, crew tired next day)
- Ferry breakdown at crossing (wait 2 days or attempt ford)
- Riverbank collapse (cart slides, +2 wear)
- Fishing opportunity (free food but costs a day)

**Wooded Hills:**
- Broken wheel on roots (repair or limp to settlement — both cost time)
- Bear encounter (lose food stores if not defended)
- Lost trail (Navigation DC — failure = +2 days)
- Firewood foraging (fuel for cold nights ahead)

**Universal / Any Terrain:**
- Ox injury (lame for 3 days, or abandon cart)
- Broken axle (need Spare Axle item or stuck)
- Illness (crew member out for days — roll to recover)
- Lost cargo (roll — lose random trade item)
- Storm damage (canvas tarp gets torn — shelter compromised)
- Thief at night (lose food or goods)
- Supplies ruined (water damage, wildlife)
- Good weather (bonus day of travel)
- Bad weather (lose 1-2 days)
- Friendly encounter (Métis family heading east — free food + info)
- Unfriendly encounter (rival trader — price gouging or intimidation)

---

## 6. Playtest Regression Process

After any significant change to game balance:

1. **Run 200-game automated test:** `node playtest.js --seeds 200`
2. **Check win rate:** Should be 60–75% for Safe agent
3. **Check spread:** Scores should range from ~800 (barely won) to ~1600 (clean run)
4. **Check failure reasons:** Most failures should be food starvation or wear breakdown
5. **Run verbose single game:** `node playtest.js --seed 42 --verbose`
6. **Read the narrative for excitement factor:** Are there real choices? Real tension?
7. **Repeat** until win rate is in target range AND narrative reads as exciting

---

## 7. Current File Map

| File | Purpose | Lines |
|---|---|---|
| `index.html` | Game engine (embedded JS) + UI + CSS + HTML. ~1236 lines total. Engine starts at line ~571. | ~1236 |
| `src/engine.js` | Headless engine copy (for Node.js testing) | ~same |
| `playtest.js` | Automated playtest harness. `pickAction()` at line 23 defines AI strategy | ~146 |
| `docs/DATA.md` | Source data for nodes, items, events, terrain | ~234 |
| `docs/DESIGN.md` | Original design document | — |
| `docs/IMPLEMENTATION.md` | Task breakdown | — |
| `docs/CHANGELOG.md` | Design decisions log | — |

---

*This file should be updated after every major playtest run and every balance change. Every agent working on game balance should read this first.*
