/**
 * Cart Trail — Game Engine
 * 
 * Pure game logic. Zero DOM dependencies. Runs in Node.js or browser.
 * 
 * Usage:
 *   const { Game } = require('./engine');
 *   const g = Game.create(12345);  // optional seed
 *   while (!g.isOver()) {
 *     console.log(g.stateSummary());
 *     g.proceed();
 *   }
 */

// ── Seeded PRNG (Mulberry32) ─────────────────────────────────────
function makeRNG(seed) {
  if (!seed) return null; // use Math.random
  let s = seed | 0;
  return function prng() {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Data ─────────────────────────────────────────────────────────
const MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

const SEASON_OF = { 6: 'summer', 7: 'summer', 8: 'summer', 9: 'autumn', 10: 'autumn', 11: 'early winter' };

const DAYS_IN_MONTH = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const NODES = [
  { name: 'Fort Garry', type: 'hbc', lat: 49.8975, lon: -97.1388, terrain: 'river_valley', desc: 'The Red River Settlement. HBC headquarters. Your journey begins.' },
  { name: 'St. Boniface', type: 'mission', lat: 49.8881, lon: -97.1258, terrain: 'river_valley', desc: 'Cathedral and Grey Nuns. Free healing.' },
  { name: 'St. Norbert', type: 'metis', lat: 49.7611, lon: -97.1517, terrain: 'river_valley', desc: "Métis parish. Family welcomes you with bannock." },
  { name: 'St. François Xavier', type: 'metis', lat: 49.9333, lon: -97.9833, terrain: 'plains', desc: 'Métis community. Well-known ford across the Assiniboine.' },
  { name: 'Portage la Prairie', type: 'trading', lat: 49.9625, lon: -98.3106, terrain: 'river_valley', desc: 'Trading post. Full barter. Old HBC fort decaying.' },
  { name: 'Fort Ellice', type: 'hbc', lat: 50.4786, lon: -101.2722, terrain: 'river_valley', desc: "Midpoint resupply. Intersection of the Assiniboine and Qu'Appelle." },
  { name: "Fort Qu'Appelle", type: 'nwmp', lat: 50.7833, lon: -101.7500, terrain: 'river_valley', desc: 'NWMP post. Scrutiny checks mandatory.' },
  { name: 'Touchwood Hills', type: 'trading', lat: 51.5500, lon: -103.3000, terrain: 'wooded', desc: 'Cree trader speaks Michif. Knows the northern route.' },
  { name: 'Humboldt Mission', type: 'mission', lat: 52.2167, lon: -105.1167, terrain: 'plains', desc: 'Only reliable healing for a long lonely stretch.' },
  { name: 'Batoche', type: 'metis', lat: 52.7533, lon: -106.1158, terrain: 'river_valley', desc: 'Spiritual centre of the Saskatchewan Métis. Full ceremony.' },
  { name: "Gabriel's Crossing", type: 'river', lat: 52.6667, lon: -106.1000, terrain: 'river_valley', desc: 'Gabriel Dumont operates the ferry. South Saskatchewan crossing.' },
  { name: 'Fort Carlton', type: 'hbc', lat: 52.8000, lon: -106.2167, terrain: 'river_valley', desc: 'Major HBC depot. Full trade, full repair. Pemmican stores declining.' },
  { name: 'Fort Pitt', type: 'hbc', lat: 53.2500, lon: -108.3000, terrain: 'river_valley', desc: 'Edge of the boreal forest. Small, isolated. Lonely Factor knows all.' },
  { name: 'Fort Edmonton', type: 'hbc', lat: 53.5333, lon: -113.5000, terrain: 'river_valley', desc: 'Western terminus. Gateway to the Athabasca. The end of the trail.' }
];

const ITEMS = [
  { name: 'Pemmican Rations', wt: 15, count: 5, type: 'food', desc: 'Dried meat and fat. Never spoils.' },
  { name: 'Spare Axle', wt: 40, count: 1, type: 'repair', desc: 'Hard maple. Heavy but essential.' },
  { name: 'Shaganappi', wt: 5, count: 3, type: 'repair', desc: 'Rawhide strips. Binding and lashing material.' },
  { name: 'Tool Kit', wt: 10, count: 1, type: 'repair', desc: 'Axe, auger, drawknife. Required for repairs.' },
  { name: 'Bison Hide', wt: 8, count: 2, type: 'trade', desc: 'Folded. Trade value: 1.25 MB each.' },
  { name: 'Canvas Tarp', wt: 6, count: 1, type: 'shelter', desc: 'Waterproof. Shelter and cart-raft conversion.' },
  { name: 'Firewood Bundle', wt: 10, count: 2, type: 'fuel', desc: 'Dried poplar. Required for cold nights.' },
  { name: 'Rope (50ft)', wt: 3, count: 1, type: 'tool', desc: 'Hemp. Crossings, repairs, binding.' },
  { name: 'Medicine Pouch', wt: 2, count: 1, type: 'medical', desc: 'Herbal remedies and bandages.' },
  { name: 'Blanket', wt: 3, count: 1, type: 'shelter', desc: 'Wool. Winter survival.' },
  { name: 'Beaver Pelts', wt: 5, count: 1, type: 'trade', desc: 'Prime bundle. Trade value: 3 MB.' }
];

const EVENTS = {
  plains: [
    {
      id: 'rough_ground',
      text: "The trail turns rough. Ruts and stones jostle the cart. You feel the axle groan with each bump.\n\nThe ground here is rutted from years of cart traffic — iron-hard channels carved by thousands of wooden wheels. Your cart bucks and sways.",
      choices: [
        { text: 'Slow down and pick a careful path', dc: 10, mod: 'crew',
          ok: 'You thread between the ruts. Slow, but the cart holds together.',
          bad: 'You misjudge a rut. The cart jolts hard. The axle cracks.', wear: 1, time: 1 },
        { text: 'Push through at speed', dc: null, mod: null,
          ok: '', bad: '', wear: 0, time: 0, always: 'You push through. The cart takes the abuse. +1 Wear.', alwaysWear: 1 }
      ]
    },
    {
      id: 'game_sighted',
      text: "Movement on the horizon. You shade your eyes — a small herd of pronghorn, maybe two hundred yards south. They haven't seen you yet.\n\nYour rifle is in the cart. The ox is tired but could manage a short walk. Fresh meat would last a few days in this heat.",
      choices: [
        { text: 'Hunt them (Survival DC 12)', dc: 12, mod: 'crew',
          ok: 'You creep close, find your mark. The pronghorn drops. By evening, the meat is cut and packed. +3 Food.',
          bad: "They spook before you're in range. You walk back to the cart empty-handed. The day is lost.", wear: 0, time: 1, food: 3 }
      ]
    },
    {
      id: 'abandoned_camp',
      text: "You spot something in the grass — a cart, half-buried by time. The wood is grey and splitting. One wheel is missing. The box has been scavenged, but not thoroughly.\n\nSomeone left this here. Or lost it. You can see the trail they were trying to follow — west, like you.",
      choices: [
        { text: 'Search the cart', dc: null, mod: null,
          ok: '', bad: '', wear: 0, time: 1, always: "You find a coil of rope and some shaganappi strips. Not much, but useful. +1 Rope, +1 Shaganappi.", give: [{ name: 'Rope (50ft)', amt: 1 }, { name: 'Shaganappi', amt: 1 }] }
      ]
    },
    {
      id: 'good_grazing',
      text: "The grass here is thick and green. Your ox lows softly, pulling at the tufts as you walk. Good grazing. The animal has been working hard — this stretch is a gift.\n\nYou could let the ox feed for an hour. It would mean arriving at the next node a little later, but the animal would be stronger for it.",
      choices: [
        { text: 'Let the ox graze', dc: null, mod: null,
          ok: '', bad: '', wear: 0, time: 1, always: "The ox feeds well. By the time you hitch up again, it's steadier. Crew feels more rested too.", crew: 'rested' }
      ]
    },
    {
      id: 'trail_marker',
      text: "A post stands at the trail junction — old poplar, carved with initials and a date: 1867. Someone was here before you. The carving is weathered but clear.\n\nThe trail splits here. Both paths lead west eventually, but one is shorter and rougher. The other is longer but follows the river.",
      choices: [
        { text: 'Take the shorter path', dc: 11, mod: 'crew',
          ok: 'You read the terrain well. The shorter path is rough but passable. You save a day.',
          bad: 'You misjudge the path. A detour costs you time. +1 day.', wear: 0, time: -1 }
      ]
    }
  ],

  river_valley: [
    {
      id: 'spring_flooding',
      text: "The river is high. Not impassable, but the ford is muddy and the current is stronger than you'd like. You can see the trail on the other side — a dark line through the willows.\n\nYour cart is heavy. The ox is steady but not eager. The water comes up to the animal's belly.",
      choices: [
        { text: 'Ford carefully (Survival DC 12)', dc: 12, mod: 'crew',
          ok: 'The ox finds its footing. The cart floats slightly but holds. You reach the other side soaked but intact.',
          bad: 'The current pushes the cart sideways. A wheel catches. You wrestle it free but the axle takes damage.', wear: 1, time: 1 },
        { text: 'Convert to cart-raft (Survival DC 14)', dc: 14, mod: 'crew',
          ok: "You remove the wheels, lash them underneath, wrap the tarp. The raft floats. You pole across safely. It takes hours but the cart is dry.",
          bad: 'The raft is unstable. Mid-river, it tilts. Supplies get wet. You lose some food to the water.', food: -2, time: 2, need: 'Canvas Tarp' }
      ]
    },
    {
      id: 'fishing_spot',
      text: "The river here is slow and deep. You can see fish — silver flashes in the shallows. Your fishing line is in the cart. An hour here could mean fresh food for days.\n\nThe trail is good. You could also just keep moving.",
      choices: [
        { text: 'Stop and fish (Survival DC 10)', dc: 10, mod: 'crew',
          ok: 'The fish bite. By midday you have three good-sized northern pike. You clean them and pack them in salt. +2 Food.',
          bad: "The fish aren't biting. You waste an hour and move on empty-handed.", wear: 0, time: 1, food: 2 }
      ]
    },
    {
      id: 'other_travelers',
      text: "You hear it before you see it — the unmistakable squeal of a Red River cart. Another driver, heading east. He waves as you approach.\n\n\"Fort Garry?\" he calls. \"Heard the Factor's paying premium for beaver. And the Assiniboine's running high — took me half a day to cross.\"",
      choices: [
        { text: 'Exchange news', dc: null, mod: null,
          ok: '', bad: '', wear: 0, time: 0, always: "You share the road for an hour. He tells you about the trail ahead — good grazing near Touchwood, but watch for mud after the hills. You part ways feeling less alone." }
      ]
    }
  ],

  wooded: [
    {
      id: 'fallen_tree',
      text: "A poplar has fallen across the trail. It's not large — maybe two feet through — but it's enough to block the cart. The ground around it is soft. You could try to go around, but the undergrowth is thick.\n\nYour axe is in the cart. It'll take time, but you can clear it.",
      choices: [
        { text: 'Chop through it', dc: null, mod: null,
          ok: '', bad: '', wear: 0, time: 1, always: 'You fell the tree and clear the trail. Your shoulders ache but the path is open. +1 Firewood.', give: [{ name: 'Firewood Bundle', amt: 1 }] },
        { text: 'Go around through the bush', dc: 10, mod: 'crew',
          ok: 'You find a gap in the undergrowth. The cart scrapes through. Tight, but it works.',
          bad: 'The cart catches on a stump. You have to back out and try again. The axle takes a hit.', wear: 1, time: 1 }
      ]
    },
    {
      id: 'berries',
      text: "The trail edges are thick with saskatoon berries. They're ripe — dark purple, almost black. Your mouth waters. The bushes go on for a hundred yards.\n\nYou could stop and gather. They won't last long in this heat, but a day or two of fresh fruit would be welcome.",
      choices: [
        { text: 'Gather berries', dc: null, mod: null,
          ok: '', bad: '', wear: 0, time: 1, always: "You fill a cloth with berries. They're sweet and warm from the sun. +1 Food (perishable).", food: 1 }
      ]
    }
  ],

  uplands: [
    {
      id: 'steep_descent',
      text: "The trail drops into a coulee — steep, maybe thirty feet down. The path switchbacks, but it's narrow. Your cart is heavy. The ox plants its feet at the top.\n\nYou've seen carts tip on slopes like this. The load shifts, the cart rolls, and everything scatters.",
      choices: [
        { text: 'Descend carefully, rope the cart', dc: 11, mod: 'crew',
          ok: 'You tie the rope to a tree and lower the cart down inch by inch. The ox follows. Slow, but safe.',
          bad: 'Halfway down, the rope slips. The cart lurches. You catch it, but the wheel hits rock. +1 Wear.', wear: 1, time: 1, need: 'Rope (50ft)' },
        { text: 'Descend without rope', dc: 9, mod: 'crew',
          ok: 'You guide the cart down. The ox is sure-footed. You reach the bottom without incident.',
          bad: "The cart picks up speed. You can't hold it. It hits the bottom hard. +1 Wear.", wear: 1, time: 0 }
      ]
    }
  ],

  river: [
    {
      id: 'major_crossing',
      text: "The river stretches wide before you. The current is visible — not fast, but steady. The ford is marked by willow poles on both banks, but the water is higher than usual.\n\nYou're carrying a tarp that could make a raft. But that takes hours. The ford is passable — probably.",
      choices: [
        { text: 'Ford the river (Survival DC 12)', dc: 12, mod: 'crew',
          ok: 'The ox finds the shallow channel. Water laps at the cart bed but nothing shifts. You reach the far bank soaked but whole.',
          bad: 'Midway across, a wheel drops into a hole. The cart tilts. You wrestle it level but the axle cracks. +1 Wear. Some supplies get wet.', wear: 1, food: -1, time: 1 },
        { text: 'Build a cart-raft (Survival DC 14)', dc: 14, mod: 'crew',
          ok: "You dismantle, wrap, and lash. The raft floats. Three hours later, you're across with a dry cart and your patience intact.",
          bad: 'The raft is clumsy. Mid-river it spins. You get wet and embarrassed but make it across.', food: -1, time: 3, need: 'Canvas Tarp' }
      ]
    }
  ]
};

function getEventsForTerrain(t) { return EVENTS[t] || EVENTS.plains; }

// ── Game Engine ──────────────────────────────────────────────────
function createGame(seed) {
  const rng = makeRNG(seed);

  function rand() { return rng ? rng() : Math.random(); }
  function d20() { return Math.floor(rand() * 20) + 1; }

  // Deep clone items for cart
  const cart = JSON.parse(JSON.stringify(ITEMS));

  // State
  const S = {
    day: 1,
    month: 6,
    season: 'summer',
    crew: 'rested',
    food: 10,
    wear: 0,
    node: 0,
    over: false,
    won: false,
    pendingEvent: null,
    pendingSettlement: null
  };

  // Narrative log
  const narrative = [];
  function say(text) { narrative.push(text); }

  // ── Modifiers ──────────────────────────────────────────────────
  function crewMod() {
    if (S.crew === 'rested') return 1;
    if (S.crew === 'tired') return 0;
    return -2;
  }

  function wearMod() {
    if (S.wear <= 1) return 0;
    if (S.wear === 2) return -1;
    return -3;
  }

  function totalMod() { return crewMod() + wearMod(); }

  // ── Helpers ────────────────────────────────────────────────────
  function totalWt() { return cart.reduce((s, i) => s + i.wt * i.count, 0); }

  function advanceMonth() {
    if (S.day > DAYS_IN_MONTH[S.month]) {
      S.day -= DAYS_IN_MONTH[S.month];
      S.month++;
      if (S.month > 11) { S.over = true; S.won = false; }
    }
    S.season = SEASON_OF[S.month] || 'deep winter';
  }

  function terrainDesc(t) {
    return t === 'river_valley' ? 'The trail descends into a river valley. Trees appear — poplar and willow. The air smells of water.'
      : t === 'wooded' ? 'The trail winds through popple forest. Shafts of light break through the canopy.'
      : t === 'uplands' ? 'You climb into higher ground. The wind picks up. You can see for miles.'
      : 'The prairie stretches flat in every direction. Grass to the horizon. Your ox plods steady.';
  }

  function checkGameOver() {
    if (S.over) return;
    if (S.food <= 0) {
      S.over = true;
      say("You have run out of food.\n\nThe trail stretches ahead, but your crew cannot go on. Weak, you make camp and fire smoke signals. Whether anyone comes in time is another story.\n\n— Game Over —");
    }
    if (S.wear >= 4) {
      S.over = true;
      say("The cart breaks down completely.\n\nThe axle snaps. The wheel collapses. You stand on the prairie with your supplies scattered. Fort Edmonton is still days away.\n\n— Game Over —");
    }
    if (S.month >= 11 && S.node < NODES.length - 1) {
      S.over = true;
      say(`Winter has come.\n\nThe first snow falls on the prairie. The trail disappears under white. You are ${NODES.length - 1 - S.node} nodes from Fort Edmonton. The journey will have to wait until spring.\n\n— Game Over —`);
    }
  }

  // ── Settlement actions ─────────────────────────────────────────
  function settlementAction(action) {
    S.pendingSettlement = null;
    if (action === 'continue') {
      say("You pack up and head west. The trail awaits.");
      return;
    }
    if (action === 'rest') {
      S.crew = 'rested';
      if (S.food < 20) S.food += 2;
      say("You rest. The crew recovers. Food resupplied.");
    }
    if (action === 'repair' && S.wear > 0) {
      S.wear = Math.max(0, S.wear - 2);
      say(`The workshop repairs your cart. Wear reduced to ${S.wear}.`);
    }
    if (action === 'heal') {
      S.crew = 'rested';
      say("The nuns tend to your crew. Hot soup, clean bandages. You feel renewed.");
    }
    if (action === 'trade') {
      const tg = cart.find(i => i.type === 'trade' && i.count > 0);
      if (tg) {
        tg.count--;
        S.food += 3;
        say(`You trade a ${tg.name} for supplies. +3 Food.`);
      } else {
        say("You browse the goods, but have nothing to trade.");
      }
    }
  }

  // ── Event resolution ───────────────────────────────────────────
  function pickEvent() {
    if (rand() > 0.4) return null; // 60% nothing happens
    const terrain = NODES[S.node].terrain;
    const pool = getEventsForTerrain(terrain);
    return pool[Math.floor(rand() * pool.length)];
  }

  function resolveChoice(ev, ci) {
    const ch = ev.choices[ci];
    let result = { roll: null, total: null, dc: null, success: null, text: '', effects: [] };

    // Check for required item
    if (ch.need && !cart.some(i => i.name === ch.need && i.count > 0)) {
      result.text = `You don't have a ${ch.need}. You can't do that.`;
      result.success = false;
      return result;
    }

    if (ch.dc !== null) {
      const roll = d20();
      const total = roll + totalMod();
      const ok = total >= ch.dc;
      result.roll = roll;
      result.total = total;
      result.dc = ch.dc;
      result.success = ok;
      if (ok) {
        result.text = `Success. ${ch.ok}`;
      } else {
        result.text = `Failure. ${ch.bad}`;
        S.wear += ch.wear || 0;
        result.effects.push(`+${ch.wear || 0} Wear`);
      }
    } else if (ch.always) {
      result.text = ch.always;
      result.success = true;
      if (ch.alwaysWear) {
        S.wear += ch.alwaysWear;
        result.effects.push(`+${ch.alwaysWear} Wear`);
      }
    }

    // Apply effects
    if (ch.time) {
      S.day += ch.time;
      result.effects.push(`${ch.time > 0 ? '+' : ''}${ch.time} day(s)`);
    }
    if (ch.food) {
      if (ch.dc !== null) {
        // Food only on success — already rolled above
        if (result.success) {
          S.food += ch.food;
          result.effects.push(`${ch.food > 0 ? '+' : ''}${ch.food} Food`);
        }
      } else {
        S.food += ch.food;
        result.effects.push(`${ch.food > 0 ? '+' : ''}${ch.food} Food`);
      }
    }
    if (ch.crew) {
      S.crew = ch.crew;
      result.effects.push(`Crew: ${ch.crew}`);
    }
    if (ch.give) {
      ch.give.forEach(g => {
        const item = cart.find(i => i.name === g.name);
        if (item) {
          item.count += g.amt;
          result.effects.push(`+${g.amt} ${g.name}`);
        }
      });
    }

    return result;
  }

  // ── Core actions ───────────────────────────────────────────────
  function proceed() {
    if (S.over) return [];

    // Reached end?
    if (S.node >= NODES.length - 1) {
      S.over = true;
      const hasTrade = cart.some(i => i.type === 'trade' && i.count > 0);
      S.won = hasTrade && S.wear < 4;
      if (S.won) {
        const tgCount = cart.filter(i => i.type === 'trade' && i.count > 0).reduce((s, i) => s + i.count, 0);
        say(`FORT EDMONTON — Day ${S.day}\n\nYou made it.\n\nThe palisade walls of Fort Edmonton rise before you. The cart — battered, worn, but holding — creaks through the gate. You have ${tgCount} trade goods.\n\nThe Factor looks at your cart, at you, and nods. "Long journey?"\n\n— You have completed the Cart Trail —\nDays: ${S.day} | Wear: ${S.wear} | Food: ${S.food}`);
      } else {
        say(`FORT EDMONTON — Day ${S.day}\n\nYou arrive at Fort Edmonton, but you have no trade goods to sell. The journey was survival, not profit.\n\n— Journey Complete (No Trade Goods) —`);
      }
      return [];
    }

    S.food--;
    const ev = pickEvent();
    const stepLog = [];

    if (ev) {
      S.pendingEvent = ev;
      say(`Day ${S.day} — On the trail\n\nYou head west toward ${NODES[S.node + 1].name}. The trail stretches ahead...`);
      stepLog.push({ action: 'travel', event: ev.id, eventText: ev.text, choices: ev.choices.map(c => c.text) });
    } else {
      // No event — just travel
      S.node++;
      const n = NODES[S.node];
      S.day++;
      advanceMonth();

      say(`Day ${S.day} — ${n.name}\n\n${terrainDesc(n.terrain)}\n\n${n.desc}`);

      // Mark that we're at a settlement waiting for action
      if (n.type !== 'river') {
        S.pendingSettlement = n;
      }

      // Settlement actions available
      if (n.type !== 'river') {
        const actions = getSettlementActions(n);
        stepLog.push({ action: 'arrive', node: n.name, nodeType: n.type, actions });
      } else {
        stepLog.push({ action: 'arrive', node: n.name, nodeType: n.type, actions: ['continue'] });
      }
    }

    checkGameOver();
    return stepLog;
  }

  function getSettlementActions(n) {
    const actions = [];
    if (n.type === 'hbc') {
      actions.push('trade', 'repair', 'rest');
    } else if (n.type === 'metis') {
      actions.push('trade', 'rest');
    } else if (n.type === 'trading') {
      actions.push('trade', 'rest');
    } else if (n.type === 'mission') {
      actions.push('rest', 'heal');
    } else if (n.type === 'nwmp') {
      actions.push('trade', 'rest');
    }
    actions.push('continue');
    return actions;
  }

  function chooseEventChoice(choiceIndex) {
    if (!S.pendingEvent) return null;
    const ev = S.pendingEvent;
    S.pendingEvent = null;
    const result = resolveChoice(ev, choiceIndex);

    // After resolving event, advance
    S.node++;
    S.day++;
    advanceMonth();

    const n = NODES[S.node];
    say(`Day ${S.day} — ${n.name}\n\n${terrainDesc(n.terrain)}\n\n${n.desc}`);

    // Mark that we're at a settlement waiting for action
    if (n.type !== 'river') {
      S.pendingSettlement = n;
    }

    const stepLog = [{
      action: 'eventResolved',
      event: ev.id,
      choiceIndex,
      result,
      node: n.name,
      nodeType: n.type,
      actions: n.type !== 'river' ? getSettlementActions(n) : ['continue']
    }];

    checkGameOver();
    return stepLog;
  }

  function makeCamp() {
    S.food--;
    if (S.crew === 'exhausted') S.crew = 'tired';
    else if (S.crew === 'tired') S.crew = 'rested';

    const hasTools = cart.some(i => i.name === 'Tool Kit' && i.count > 0);
    const hasShag = cart.some(i => i.name === 'Shaganappi' && i.count > 0);

    if (hasTools && hasShag && S.wear > 0) {
      const sh = cart.find(i => i.name === 'Shaganappi');
      sh.count--;
      S.wear--;
      say(`Camp — Day ${S.day}\n\nYou make camp and repair the cart. Shaganappi strips tighten the joints. Wear reduced to ${S.wear}.`);
    } else {
      say(`Camp — Day ${S.day}\n\nYou make camp as the sun sets. The ox grazes. Crew: ${S.crew}. Food: ${S.food}.`);
    }

    S.day++;
    advanceMonth();
    checkGameOver();
  }

  // ── Public API ─────────────────────────────────────────────────
  return {
    // Actions
    proceed,
    makeCamp,
    chooseEventChoice,
    settlementAction,

    // State
    getState() { return JSON.parse(JSON.stringify(S)); },
    getCart() { return JSON.parse(JSON.stringify(cart)); },
    getNarrative() { return [...narrative]; },
    isOver() { return S.over; },
    hasWon() { return S.won; },
    hasPendingEvent() { return S.pendingEvent !== null; },
    getPendingEvent() { return S.pendingEvent ? { id: S.pendingEvent.id, text: S.pendingEvent.text, choices: S.pendingEvent.choices.map(c => ({ text: c.text, dc: c.dc, need: c.need })) } : null },
    getCurrentNode() { return NODES[S.node]; },
    getTotalWeight() { return totalWt(); },

    // Summary
    stateSummary() {
      const n = NODES[S.node];
      return {
        day: S.day,
        month: MONTHS[S.month],
        location: n.name,
        nodeType: n.type,
        food: S.food,
        wear: S.wear,
        crew: S.crew,
        node: S.node,
        totalNodes: NODES.length,
        totalWeight: totalWt(),
        over: S.over,
        won: S.won,
        pendingEvent: S.pendingEvent ? S.pendingEvent.id : null
      };
    },

    // Available actions for the current state
    getAvailableActions() {
      if (S.pendingEvent) {
        return { type: 'event', choices: S.pendingEvent.choices.map((c, i) => ({ index: i, text: c.text, dc: c.dc, need: c.need })) };
      }
      if (S.pendingSettlement) {
        return { type: 'settlement', node: S.pendingSettlement.name, nodeType: S.pendingSettlement.type, actions: getSettlementActions(S.pendingSettlement) };
      }
      return { type: 'travel', actions: ['proceed', 'camp'] };
    },

    // Full snapshot for logging
    fullSnapshot() {
      return {
        state: this.getState(),
        cart: this.getCart(),
        narrative: this.getNarrative(),
        summary: this.stateSummary(),
        pendingEvent: this.getPendingEvent()
      };
    }
  };
}

// ── Export ───────────────────────────────────────────────────────
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Game: { create: createGame }, NODES, ITEMS, EVENTS };
}
