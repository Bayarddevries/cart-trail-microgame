# Cart Trail — Data Reference

> Processed game data sourced from the West and Back RPG research files.
> All data derived from: `location_nodes.csv`, `CART_INVENTORY_SYSTEM.md`,
> `RIVER_CROSSING.md`, `TRAVEL_AND_DAY_CYCLE.md`, `TRADE_AND_ECONOMY.md`,
> `HISTORICAL_ENCOUNTERS.md`, and `TOWN_MECHANICS.md`.

---

## Trail Node Processing

### Source: location_nodes.csv (30 nodes + 8 river crossings)

Terrain types estimated from node names, geographical position, and historical sources:

| Node | Terrain | Water | Foraging | Notes |
|---|---|---|---|---|
| Fort Garry | river_valley | reliable | good | Start. HBC Fort. Full trade. |
| St. Boniface | river_valley | reliable | good | Mission. Free healing. |
| St. Norbert | river_valley | reliable | good | Métis Community. Free lodging. |
| St. François Xavier | river_valley | reliable | good | Métis Community. River crossing. |
| Portage la Prairie | river_valley | reliable | good | Trading Post. Full barter. |
| High Bluff | plains | seasonal | poor | Trading Post. Basic. |
| Minnedosa | river_valley | reliable | moderate | Trading Post. Ferry crossing. |
| Riding Mountain Pass | uplands | seasonal | moderate | Landmark. Navigation challenge. |
| Fort Ellice | river_valley | reliable | good | HBC Fort. Midpoint resupply. |
| Ste. Madeleine | river_valley | reliable | good | Métis Community. |
| Fort Qu'Appelle | river_valley | reliable | good | NWMP Post. Scrutiny. |
| Touchwood Hills | wooded | seasonal | good | Trading Post. Cree trader. |
| Humboldt/St. Peter's Mission | plains | scarce | poor | Mission. Only reliable healing for stretch. |
| Batoche | river_valley | reliable | good | Métis Community. Emotional centre. |
| Gabriel's Crossing | river_valley | reliable | moderate | River crossing. Dumont's ferry. |
| Fish Creek | river_valley | reliable | moderate | Landmark. Tactical site. |
| Fort Carlton | river_valley | reliable | good | HBC Fort. Major depot. |
| Duck Lake | river_valley | reliable | moderate | Trading Post. Tense. |
| Fort Pitt | river_valley | reliable | good | HBC Fort. Isolated. |
| Green Lake | wooded | reliable | good | Métis Community. No Company oversight. |
| Prince Albert | river_valley | reliable | good | Mission/Trading Post. Junction. |
| Fort Edmonton | river_valley | reliable | good | End. HBC Fort. Full trade. |

### Southern Branch Nodes
| Node | Terrain | Water | Foraging | Notes |
|---|---|---|---|---|
| Wood Mountain | plains | scarce | poor | Métis Community. Border intel. |
| Fort Walsh | plains | scarce | poor | NWMP HQ. Maximum scrutiny. |
| Cypress Hills | uplands | seasonal | moderate | Landmark. Encounter-rich. |
| Whoop-Up | plains | scarce | poor | Trading Post. Anything goes. |
| Fort Macleod | river_valley | reliable | moderate | NWMP Post. Whiskey trade intel. |

---

## Segment Distances (Trail Days)

Derived from `location_nodes.csv` trail_days_from_previous_node:

```
Fort Garry → St. Boniface:     1 day (2 miles)
St. Boniface → St. Norbert:    1 day
St. Norbert → St. François Xavier: 1-2 days
St. François Xavier → Portage la Prairie: 1-2 days
Portage la Prairie → High Bluff: 1-2 days
High Bluff → Minnedosa:        1-2 days
Minnedosa → Fort Ellice:       4-5 days (long stretch)
Fort Ellice → Fort Qu'Appelle:  2-3 days (southern branch)
Fort Ellice → Touchwood Hills:  3 days
Touchwood Hills → Humboldt:    2-3 days
Humboldt → Batoche:            2-3 days
Batoche → Gabriel's Crossing:  1 day
Gabriel's Crossing → Fort Carlton: 2-3 days
Fort Carlton → Fort Pitt:      4 days
Fort Pitt → Fort Edmonton:     5 days

Total main route: ~38-45 trail days
```

---

## Cart Wear by Terrain

Wear accumulates per travel segment based on terrain:

| Terrain | Wear Chance | Notes |
|---|---|---|
| plains | 20% (1-in-5) | Flat but rough ground, ruts, stones |
| river_valley | 30% (3-in-10) | Mud, slopes, water damage |
| wooded | 40% (2-in-5) | Roots, tight paths, fallen trees |
| marsh | 50% (1-in-2) | Boggy ground, cart sinks |
| uplands | 35% (3-in-10) | Steep descents, rocky |

River crossings: additional wear check based on crossing DC failure.

---

## River Crossing DCs

Source: `RIVER_CROSSING.md`. DCs for fording (not ice crossing):

| River | Summer | Autumn | Spring Thaw | Early Winter |
|---|---|---|---|---|
| Red River | 8 | 9 | 20 | 14 |
| Assiniboine | 10 | 11 | 18 | 15 |
| Qu'Appelle | 8 | 9 | 15 | 13 |
| South Saskatchewan | 12 | 13 | 20 | 18 |
| North Saskatchewan | 13 | 14 | 20 | 18 |
| Souris | 7 | 8 | 14 | 12 |
| Battle | 7 | 8 | 14 | 11 |

Ice crossing DCs (Deep Winter only): reduce by 2-4 from fording DC.

---

## Event Tables

### Plains Events (d20)
| d20 | Event | Effect |
|---|---|---|
| 1 | Wheel stress | +1 Wear (50% chance) |
| 2 | Broken harness | Lose 1 hour, repair cost |
| 3 | Sudden storm | -20% speed today, 1 rination wet |
| 4 | Game sighted | Hunting opportunity (+2 rations, Survival check) |
| 5 | Good grazing | Animals recover (no feed cost tomorrow) |
| 6 | Abandoned camp | Salvage 1-4 items or materials |
| 7 | Fresh spring | Fill water skins, rest 30 min |
| 8 | Buzzing insects | -1 to next check |
| 9 | Trail marker | Navigation +2 remainder of segment |
| 10 | Herds visible | Atmosphere, morale +1 |
| 11 | Other travelers | Exchange news, possible trade |
| 12 | Meadow of berries | Forage +1 ration |
| 13 | Rough ground | +1 hour travel, wear check |
| 14 | Meadowlark song | Spirit +1 |
| 15 | Old cart graveyard | Morale -1, salvage 1-4 parts |
| 16 | Thunderhead building | Storm risk tonight |
| 17 | Wildfire smoke | Navigation -2 |
| 18 | Eagle circles | Good omen, Spirit +1 |
| 19 | Perfect conditions | +1 hour daylight |
| 20 | The Trail Is Kind | +1 day progress |

### River Valley Events (d20)
| d20 | Event | Effect |
|---|---|---|
| 1 | Swift creek ford | Minor crossing, no check |
| 2 | Fallen tree | 30 min to clear or detour |
| 3 | Good fishing | +2 rations, Survival DC 10 |
| 4 | Métis camp | Free lodging, ceremony available |
| 5 | River crossing (ford) | Survival check vs DC |
| 6 | Missionary passing | Diplomacy/Spirit interaction |
| 7 | Beaver dam | Flooded trail, +1 hour |
| 8 | Quicksand/bog | Survival DC 14 or lose cart |
| 9 | Claim-jumpers | Diplomacy or confrontation |
| 10 | Cart swept away | Major Survival + Athletics check |

---

## Item Inventory

Source: `CART_INVENTORY_SYSTEM.md` (condensed for microgame)

### Consumables
| Item | Size | Stack | Category | Notes |
|---|---|---|---|---|
| Pemmican Rations | 1×2 | 5 | food | Never spoils |
| Fresh Meat | 1×1 | 5 | food | Spoils in 3 days (summer) |
| Berries | 1×1 | 5 | food | Spoils in 2 days |
| Water Skin | 1×1 | 1 | water | Refillable |
| Firewood Bundle | 1×2 | 3 | fuel | Required cold nights |
| Horse Feed | 1×2 | 3 | feed | Winter only |
| Ammunition | 1×1 | 20 | ammo | Hunting + defense |
| Medicine Pouch | 1×1 | 10 | medical | Treat wounds |
| Bandages | 1×1 | 5 | medical | Single use |
| Tobacco | 1×1 | 1 | morale | Diplomacy bonus |

### Equipment
| Item | Size | Stack | Category | Notes |
|---|---|---|---|---|
| Spare Axle | 2×4 | 1 | repair | Essential, heavy |
| Shaganappi | 1×2 | 3 | repair | Field repair material |
| Tool Kit | 1×2 | 1 | repair | Required for all repairs |
| Bison Hide Tarp | 2×3 | 1 | shelter | Waterproof, cart-raft |
| Canvas Tarp | 2×2 | 1 | shelter | Basic shelter |
| Spare Wheel | 3×3 | 1 | repair | Heavy, bulky |
| Blanket | 1×1 | 1 | shelter | Winter survival |
| Tent (rolled) | 2×2 | 1 | shelter | Better rest |
| Rope (50ft) | 1×1 | 1 | tool | Crossings, repairs |
| Iron Pot | 1×1 | 1 | tool | Cooking |
| Axe (felling) | 1×2 | 1 | tool | Wood gathering |
| Snowshoes | 1×2 | 1 | tool | Winter travel |

### Trade Goods
| Item | Size | Stack | Value (MB) | Notes |
|---|---|---|---|---|
| Bison Hide | 2×2 | 2 | 1.25 | Core trade good |
| Beaver Pelt Bundle | 2×1 | 3 | 3.0 | High value |
| Fox Pelt Bundle | 1×2 | 3 | 2.0 | Medium value |
| Wolf Pelt | 1×1 | 1 | 1.5 | Low bulk |
| Wool Blanket | 1×1 | 3 | 2.0 | Barter-friendly |
| Dried Meat Bundle | 2×1 | 2 | 0.5 | Spoils in 90 days |
| Ammunition Box | 1×2 | 1 | 0.5 | Always in demand |

---

## Settlement Trade Prices

Source: `TRADE_AND_ECONOMY.md`. Prices in Made Beaver (MB).

| Item | HBC Fort (buy/sell) | Métis Community | Trading Post | NWMP Post | Mission |
|---|---|---|---|---|---|
| Pemmican | 0.25 / 0.15 | barter only | 0.30 / 0.20 | — | — |
| Spare Axle | 3.0 / — | barter (iron scarce) | 4.0 / — | — | — |
| Shaganappi | 0.5 / — | barter (freely available) | 0.75 / — | — | — |
| Bison Hide | — / 1.25 | barter | — / 1.50 | — | — |
| Beaver Pelt | — / 3.0 | barter | — / 3.50 | — | — |
| Tool Kit | 5.0 / — | barter (limited) | 6.0 / — | — | — |
| Firewood | 0.10 / 0 | free (gather) | 0.15 / 0 | — | 0 |

---

## NWMP Scrutiny

Source: `NWMP_RESEARCH.md`. Simplified for microgame.

| Scrutiny Level | Trigger | Effect |
|---|---|---|
| 0 | Default | Normal trade |
| 1 | Visit NWMP post | Prices +10%, casual questions |
| 2 | Stay 2+ days at NWMP post | Mandatory inspection, cargo check |
| 3 | Carrying contraband | Curfew, reduced actions |
| 4 | Refuse inspection | Detained 1-2 days, possible arrest |

Scrutiny decreases by 1 for every 2 segments traveled away from NWMP post.

---

*Data v0.1 — May 26, 2026*
*All values subject to balance testing*
