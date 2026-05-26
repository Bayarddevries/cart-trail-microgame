# Task 1.1: HTML Shell — Reference Notes

## Layout Structure
```
#status-bar        — Day, season, crew, food (fixed height, dark background)
#map-panel         — flex:1, contains Leaflet map + overlays
  #map             — Leaflet container
  #event-overlay    — fullscreen, hidden by default
    #event-panel   — centered card with art + text + choices
  #inventory-overlay — fullscreen, hidden by default
    #inventory-panel — centered card with weight bar + item list
#bottom-panel      — height:30vh, flex column
  #narrative       — flex:1, scrollable text area
  #controls        — fixed height, button row
```

## Color Palette
- Background: #f4e8d1 (parchment)
- Dark: #3d2b1f (dark brown text)
- Accent: #8b6914 (brass/gold)
- Highlight: #c0392b (red for current node)
- Muted: #d4c4a0 (faded elements)

## Key CSS Techniques
- Body: overflow:hidden, height:100vh — no page scroll
- Map panel: flex:1 — fills remaining space
- Bottom panel: height:30vh, min-height:200px
- Overlays: position:absolute, z-index:100, display:none/flex
- Dice animation: keyframe scale+rotate

## Game State Object
```javascript
const state = {
  day: 1, month: 6, season: 'summer',
  crewCondition: 'rested',  // rested/tired/exhausted
  food: 10, water: 5,
  cart: [],                 // {name, weight, count, type, desc}[]
  cartCapacity: 450,        // kg
  cartWear: 0,              // 0-3
  currentNode: 0,
  gameOver: false, won: false
};
```

## Key Functions
- `proceed()` — travel to next node, trigger events
- `makeCamp()` — rest, consume food, improve crew, auto-repair
- `showInventory()` / `closeInventory()` — toggle overlay
- `presentEvent(event)` — show event overlay with choices
- `resolveEvent(event, choiceIndex)` — roll dice, apply outcome
- `checkEvent()` — 40% random chance, returns event or null
- `rollD20()` — returns 1-20
- `getTotalModifiers()` — crew condition + cart wear
- `totalWeight()` — sum of all cart items
- `updateStatusBar()` — refresh all status displays
- `checkGameOver()` — food=0 or wear>=4 or deep winter

## Event Structure
```javascript
{
  id: 'plains_rough_ground',
  text: "First person narrative...",
  choices: [
    {
      text: 'Choice description (Skill DC X)',
      skill: 'navigate',     // or null for no check
      dc: 10,                // or null
      success: 'What happens on success',
      fail: 'What happens on fail',
      wearOnFail: 1,         // wear added on failure
      timeCost: 1            // extra days
    }
  ]
}
```

## Node Types & Settlement Actions
| Type | Trade | Rest | Repair | Notes |
|---|---|---|---|---|
| hbc | Full MB | 2 MB | Workshop, -2 Wear | Best prices |
| metis | Barter | Free | Limited | Social debt |
| trading | Mixed | 1 MB | Basic | Variable stock |
| mission | Minimal | Free | None | Free healing |
| nwmp | Canteen | 1 MB | Farrier only | Scrutiny |
