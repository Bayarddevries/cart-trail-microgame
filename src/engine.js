/**
 * Cart Trail — Game Engine
 *
 * Pure game logic. Zero DOM dependencies. Runs in Node.js or browser.
 * Turn-based: each action = 1 day. Segments take multiple days.
 *
 * Usage:
 *   const { Game } = require('./engine');
 *   const g = Game.create(seed);
 *   while (!g.isOver()) {
 *     console.log(g.stateSummary());
 *     g.travelOneDay();  // or g.makeCamp(), g.settlementAction('trade'), etc.
 *   }
 */

// ── Seeded PRNG (Mulberry32) ─────────────────────────────────────
function makeRNG(seed) {
  if (!seed) return null;
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

// Nodes with segment distances (days from previous node)
// dist = 1 for first node (start), then days to reach each subsequent node
const NODES = [
  { name: 'Fort Garry',       lat: 49.89,  lon: -97.14,  type: 'hbc',     terrain: 'river_valley', dist: 0,  desc: 'The Red River Settlement. HBC headquarters. The palisade walls rise from the mud — your journey begins here, where the Assiniboine meets the Red.' },
  { name: 'St. Boniface',     lat: 49.88,  lon: -97.11,  type: 'mission', terrain: 'river_valley', dist: 1,  desc: 'Cathedral spires above the river landing. The Grey Nuns offer healing to all travellers. Free pottage and prayers.' },
  { name: 'St. Norbert',      lat: 49.77,  lon: -97.15,  type: 'metis',   terrain: 'river_valley', dist: 1,  desc: 'A Métis parish straddling the ox-cart trail. Smoke rises from the churchyard. Family welcomes you with bannock and Saskatoon preserve.' },
  { name: 'St. François Xavier', lat: 49.92, lon: -97.55, type: 'metis', terrain: 'plains',     dist: 2,  desc: 'Long lots stretching back from the river. Well-known ford across the Assiniboine. The Métis here remember the Sayer trial — free trade is their pride.' },
  { name: 'Portage la Prairie', lat: 49.97, lon: -98.29, type: 'trading', terrain: 'river_valley', dist: 2, desc: 'Trading post at the old lake crossing. Full barter available. The HBC fort is decaying — the wood is grey, the palisade leaning — but trade continues.' },
  { name: 'Fort Ellice',      lat: 50.40,  lon: -101.30, type: 'hbc',     terrain: 'river_valley', dist: 4,  desc: "Midpoint resupply where the Assiniboine meets the Qu'Appelle. The trail splits here — south to Qu'Appelle, west to the Touchwood Hills." },
  { name: "Fort Qu'Appelle",  lat: 50.55,  lon: -103.85, type: 'nwmp',    terrain: 'river_valley', dist: 3,  desc: 'NWMP post. The red coats scrutinize every cart and cargo. Papers are checked. Duty collected. You keep your gaze steady.' },
  { name: 'Touchwood Hills',  lat: 51.20,  lon: -104.20, type: 'trading', terrain: 'wooded',      dist: 3,  desc: 'The last trees for a hundred miles. A Cree trader speaks Michif and knows the northern route. Elm and poplar break the prairie monotony.' },
  { name: 'Humboldt Mission', lat: 52.20,  lon: -105.12, type: 'mission', terrain: 'plains',       dist: 3,  desc: 'Only reliable healing for a lonely stretch of prairie. The mission garden grows against all odds. A welcome sight.' },
  { name: 'Batoche',          lat: 52.75,  lon: -106.10, type: 'metis',   terrain: 'river_valley', dist: 2,  desc: 'Spiritual centre of the Saskatchewan Métis. The church bell rings across the river valley. Full ceremony, full communion.' },
  { name: "Gabriel's Crossing", lat: 52.70, lon: -105.75, type: 'river', terrain: 'river_valley', dist: 1,  desc: "Gabriel Dumont operates the ferry across the South Saskatchewan. His fee is fair. The current is deceptive — do not try to ford it." },
  { name: 'Fort Carlton',     lat: 52.80,  lon: -106.50, type: 'hbc',     terrain: 'river_valley', dist: 2,  desc: 'Major HBC depot on the North Saskatchewan. Full trade, full repair. The pemmican stores are declining — the Company feels the pressure.' },
  { name: 'Fort Pitt',        lat: 53.65,  lon: -109.75, type: 'hbc',     terrain: 'river_valley', dist: 4,  desc: 'Edge of the boreal forest. Small, isolated. The last HBC post before Edmonton. Pine and spruce replace poplar.' },
  { name: 'Fort Edmonton',    lat: 53.54,  lon: -113.50, type: 'hbc',     terrain: 'river_valley', dist: 5,  desc: 'Western terminus. Gateway to the Athabasca. The palisade walls of Fort Edmonton rise from the riverbank. The end of the Carlton Trail.' }
];

const ITEMS = [
  { name: 'Pemmican Rations', wt: 15, count: 10, type: 'food',    desc: 'Dried meat and fat. Never spoils.' },
  { name: 'Spare Axle',       wt: 40, count: 1, type: 'repair',  desc: 'Hard maple. Heavy but essential.' },
  { name: 'Shaganappi',       wt: 5,  count: 3, type: 'repair',  desc: 'Rawhide strips. Binding and lashing material.' },
  { name: 'Tool Kit',         wt: 10, count: 1, type: 'repair',  desc: 'Axe, auger, drawknife. Required for repairs.' },
  { name: 'Bison Hide',       wt: 8,  count: 2, type: 'trade',   desc: 'Folded. Trade value: 1.25 MB each.' },
  { name: 'Canvas Tarp',      wt: 6,  count: 1, type: 'shelter', desc: 'Waterproof. Shelter and cart-raft conversion.' },
  { name: 'Firewood Bundle',  wt: 10, count: 2, type: 'fuel',    desc: 'Dried poplar. Required for cold nights.' },
  { name: 'Rope (50ft)',      wt: 3,  count: 1, type: 'tool',    desc: 'Hemp. Crossings, repairs, binding.' },
  { name: 'Medicine Pouch',   wt: 2,  count: 1, type: 'medical', desc: 'Herbal remedies and bandages.' },
  { name: 'Blanket',          wt: 3,  count: 1, type: 'shelter', desc: 'Wool. Winter survival.' },
  { name: 'Beaver Pelts',     wt: 5,  count: 1, type: 'trade',   desc: 'Prime bundle. Trade value: 3 MB.' }
];

// ── Event Tables ─────────────────────────────────────────────────
const EVENTS = {
  plains: [
    { id: 'rough_ground', text: "The trail turns rough. Ruts and stones jostle the cart. You feel the axle groan with each bump.\n\nThe ground here is rutted from years of cart traffic — iron-hard channels carved by thousands of wooden wheels.", choices: [
      { text: 'Slow down and pick a careful path (DC 10)', dc: 10, ok: 'You thread between the ruts. Slow, but the cart holds together.', bad: 'You misjudge a rut. The cart jolts hard. The axle cracks.', wear: 1 },
      { text: 'Push through at speed', dc: null, ok: '', bad: '', always: 'You push through. The cart takes the abuse.', alwaysWear: 1 }
    ]},
    { id: 'prairie_fire', text: "Smoke on the horizon. Not campfire smoke — a thick, grey-brown column rising from the prairie to the south.\n\nThe wind is carrying it your way. The grass here is dry. If the fire reaches the trail ahead, you'll have to turn back or find a way around. Either way, you lose time.", choices: [
      { text: 'Push ahead and try to outrun it', dc: 13, ok: 'You beat the fire to a creek bed. You cross and watch the flames sweep past behind you. Close.', bad: 'The fire cuts the trail. You backtrack five miles to find a crossing. You lose a day and the ox is spooked.', time: 1, wear: 1 },
      { text: 'Detour south to find a crossing', dc: null, ok: '', bad: '', always: 'You bushwhack through the grass to find the creek. It costs you half a day but you stay ahead of the smoke.', time: 1 }
    ]},
    { id: 'buffalo_herd', text: "The prairie shakes. Not thunder — hooves. A buffalo herd, maybe a thousand strong, moving east half a mile south of the trail.\n\nThe ground trembles. Your ox plants its eyes wide, refusing to move. The herd is too close to ignore and too large to cross.", choices: [
      { text: 'Wait for them to pass', dc: null, ok: '', bad: '', always: 'You wait. The herd takes three hours to pass. The ox trembles the whole time. When it\'s over, the trail is torn to ribbons. The ox is too shaken to go on — you make camp.', crew: 'tired', time: 2 },
      { text: 'Try to push across before they reach you', dc: 12, ok: 'You whip the ox forward and make it across the herd\'s path just in time. The beasts flow around you like a river around a stone. Heart pounding.', bad: 'The ox panters. A buffalo cow veers toward the cart. You crack your whip, miss, and slam into the herd. Cart scatters. You salvage what you can — but you lost supplies in the chaos.', wear: 1, food: -2 }
    ]},
    { id: 'game_sighted', text: "Movement on the horizon. You shade your eyes — a small herd of pronghorn, maybe two hundred yards south. They haven't seen you yet.\n\nYour rifle is in the cart. Fresh meat would last a few days in this heat.", choices: [
      { text: 'Hunt them (Survival DC 12)', dc: 12, ok: 'You creep close, find your mark. The pronghorn drops. By evening, the meat is cut and packed.', bad: "They spook before you're in range. You walk back to the cart empty-handed.", food: 3 }
    ]},
    { id: 'abandoned_camp', text: "You spot something in the grass — a cart, half-buried by time. The wood is grey and splitting. One wheel is missing.\n\nSomeone left this here. Or lost it. You can see the trail they were trying to follow — west, like you.", choices: [
      { text: 'Search the cart', dc: null, ok: '', bad: '', always: 'You find a coil of rope and some shaganappi strips. Not much, but useful. You also find carved initials: F.R. 1861. Someone else tried this trail and failed.', give: [{ name: 'Rope (50ft)', amt: 1 }, { name: 'Shaganappi', amt: 1 }], time: 1 },
      { text: 'Pay your respects and move on', dc: null, ok: '', bad: '', always: 'You touch the old cart once, then leave. Not everything on the trail deserves disturbing.' }
    ]},
    { id: 'snake_in_cart', text: "You reach into the cart for the water skin and freeze. A rattlesnake is coiled in the corner, warming itself in the sun.\n\nIt hasn't noticed you yet. The cart is full of goods. You can't just tip it.", choices: [
      { text: 'Slowly back away and use a stick to drive it out', dc: 11, ok: 'You find a long willow branch and carefully prod the snake. It rattles, strikes at the stick, then slides out of the cart and into the grass. You breathe again.', bad: 'You move too fast. The snake strikes at your hand. You jerk back, knock over a crate of pemmican, and the snake vanishes under the cart. You spend an hour reloading. And you still don\'t know if it\'s gone.', time: 1, food: -1 },
      { text: 'Grab your rifle and shoot it', dc: null, ok: '', bad: '', always: 'You grab the rifle and put a ball through the snake. Problem solved — but the shot also punches a hole in your canvas tarp. That\'ll leak when it rains.' }
    ]},
    { id: 'good_grazing', text: "The grass here is thick and green. Your ox lows softly, pulling at the tufts as you walk. Good grazing. The animal has been working hard — this stretch is a gift.", choices: [
      { text: 'Let the ox graze for an hour', dc: null, ok: '', bad: '', always: "The ox feeds well. By the time you hitch up again, it's steadier. Crew feels more rested too.", crew: 'rested', time: 1 },
      { text: 'Push on — you\'re making good time', dc: null, ok: '', bad: '', always: 'You keep walking. The ox will graze tonight. Every mile counts.' }
    ]},
    { id: 'trail_marker', text: "A post stands at the trail junction — old poplar, carved with initials and a date: 1867. Someone was here before you.\n\nThe trail splits here. Both paths lead west eventually, but one is shorter and rougher.", choices: [
      { text: 'Take the shorter path (DC 11)', dc: 11, ok: 'You read the terrain well. The shorter path is rough but passable. You save a day.', bad: 'You misjudge the path. A detour costs you time.', time: -1 },
      { text: 'Take the longer, safer route', dc: null, ok: '', bad: '', always: 'You take the long way. It costs a day but the trail is good and the cart holds together.', time: 1 }
    ]},
    { id: 'prairie_wind', text: "The wind picks up from the southwest — a warm, steady push at your back. The grass bends in waves. Your ox walks lighter today.\n\nGood traveling weather. You make better time than expected.", choices: [
      { text: 'Push while the wind holds', dc: null, ok: '', bad: '', always: 'You cover more ground than usual. The wind is a gift.', extraProgress: 1 }
    ]},
    { id: 'thunderhead', text: "A thunderhead builds on the western horizon — anvil-topped, purple-black. The air goes still. Then the wind hits.\n\nYou have maybe an hour before the storm arrives. The cart needs to be secured.", choices: [
      { text: 'Secure the cart and wait it out', dc: null, ok: '', bad: '', always: 'You tie down the tarp, hobble the ox, and hunker down. The storm passes in an hour. You lose the rest of the day but the cart is safe.', time: 0 },
      { text: 'Try to outrun it (DC 10)', dc: 10, ok: 'You push hard and find a low cut in the prairie just as the rain hits. You wait it out dry.', bad: 'The storm catches you on open prairie. Rain soaks the supplies. Some of your pemmican is ruined.', food: -2 }
    ]},
    { id: 'meadowlark', text: "A meadowlark sings from a fence post — a clear, liquid melody that carries across the prairie. The sun is warm. The trail is good.\n\nOne of those rare perfect days on the Carlton Trail.", choices: [
      { text: 'Enjoy the day', dc: null, ok: '', bad: '', always: "You walk in good spirits. The crew feels lighter. Sometimes the trail gives you a perfect day — and that's enough.", crew: 'rested' }
    ]},
    { id: 'dried_waterhole', text: "You reach the waterhole marked on your route — or where it should be. The ground is cracked mud. Nothing.\n\nYour water barrel is half full. The next reliable water is at the next node, two days ahead. You need to decide how to ration.", choices: [
      { text: 'Ration water carefully — you\'ll make it', dc: 10, ok: 'You measure every sip. It\'s uncomfortable but you reach the next water source with a day to spare.', bad: 'The heat is worse than you thought. By the second day, you\'re dizzy and the ox is slowing. You lose a day resting in what shade you can find.', time: 1, crew: 'tired' },
      { text: 'Backtrack to the last creek', dc: null, ok: '', bad: '', always: 'You backtrack half a day to the last creek. Your barrel is full again but you\'ve lost the time.', time: 1 }
    ]},
    { id: 'ox_injury', text: "The ox is limping. You stop and check its front left hoof — a stone is wedged deep, and the hoof is cracked around it.\n\nYou can pry the stone out, but the ox won\'t be able to bear full weight for at least a day. Maybe two.", choices: [
      { text: 'Tend the hoof and rest for a day', dc: null, ok: '', bad: '', always: 'You pry out the stone, wrap the hoof in shaganappi, and rest for a day. The ox is sore but walkable tomorrow.', time: 1, crew: 'rested' },
      { text: 'Push on — the ox can manage', dc: 12, ok: 'The ox grits through it. By evening the limp is barely noticeable. Tough animal.', bad: 'The hoof worsens. By nightfall the ox can barely stand. You have to rest anyway — and now the ox needs two days to recover.', time: 2, crew: 'tired' }
    ]},
    { id: 'other_travelers', text: "You hear it before you see it — the unmistakable squeal of a Red River cart. Another driver, heading east. He waves as you approach.\n\n\"Fort Garry?\" he calls. \"Heard the Factor's paying premium for beaver.\"", choices: [
      { text: 'Exchange news and trade', dc: null, ok: '', bad: '', always: "You share the road for an hour. He tells you about the trail ahead — good grazing near Touchwood, but watch for mud after the hills. You trade a bison hide for a spare belt of ammunition. You part ways feeling less alone.", give: [{ name: 'Ammunition Belt', amt: 1 }] },
      { text: 'Nod and keep moving', dc: null, ok: '', bad: '', always: 'You wave back and keep walking. Every minute counts.' }
    ]}
  ],
  river_valley: [
    { id: 'spring_flooding', text: "The river is high. Not impassable, but the ford is muddy and the current is stronger than you'd like. You can see the trail on the other side — a dark line through the willows.\n\nYour cart is heavy. The ox is steady but not eager.", choices: [
      { text: 'Ford carefully (Survival DC 12)', dc: 12, ok: 'The ox finds its footing. The cart floats slightly but holds. You reach the other side soaked but intact.', bad: 'The current pushes the cart sideways. A wheel catches. You wrestle it free but the axle takes damage.', wear: 1 },
      { text: 'Convert to cart-raft (Survival DC 14)', dc: 14, ok: 'You remove the wheels, lash them underneath, wrap the tarp. The raft floats. You pole across safely.', bad: 'The raft is unstable. Mid-river, it tilts. Supplies get wet. You lose some food to the water.', food: -2, need: 'Canvas Tarp' },
      { text: 'Wait for the water to drop', dc: null, ok: '', bad: '', always: 'You make camp and wait. The water drops enough by the next afternoon. You ford carefully and make it across.', time: 2 }
    ]},
    { id: 'fishing_spot', text: "The river here is slow and deep. You can see fish — silver flashes in the shallows. Your fishing line is in the cart. An hour here could mean fresh food for days.", choices: [
      { text: 'Stop and fish (Survival DC 10)', dc: 10, ok: 'The fish bite. By midday you have three good-sized northern pike. You clean them and pack them in salt.', bad: "The fish aren't biting. You waste an hour and move on empty-handed.", food: 2, time: 1 }
    ]},
    { id: 'willow_shade', text: "The trail dips into a stand of willows along the riverbank. The shade is cool and welcome after days on the open prairie. Your ox drinks deep.\n\nA good place to rest for a few minutes. The river murmurs.", choices: [
      { text: 'Rest in the shade', dc: null, ok: '', bad: '', always: 'You rest for an hour in the cool shade. The ox drinks. The crew feels refreshed.', crew: 'rested', time: 1 }
    ]},
    { id: 'mud_hole', text: "The trail has turned to mud — deep, sucking mud that grabs at the wheels. Your ox strains. The cart sinks to the axles.\n\nThis is the worst kind of trail. Every step is work.", choices: [
      { text: 'Push through (DC 10)', dc: 10, ok: 'You wrestle the cart through. It takes hours but you make it. The cart holds.', bad: 'The cart sinks deeper. You have to unload, carry everything across by hand, then reload. The axle takes a beating.', wear: 1, time: 1 },
      { text: 'Find a way around', dc: null, ok: '', bad: '', always: 'You bushwhack around the worst of the mud. It takes an extra day but the cart stays clean.', time: 1 }
    ]},
    { id: 'riverbank_collapse', text: "The trail along the riverbank gives way. Not all of it — just a section where the current has undercut the bank. The edge is crumbling.\n\nYour cart is too heavy to risk the edge. But the detour through the willows adds hours.", choices: [
      { text: 'Risk the crumbling edge (DC 11)', dc: 11, ok: 'You guide the ox along the very edge. The bank holds. You breathe again on solid ground.', bad: 'The bank gives way under the cart\'s weight. The cart tilts, one wheel over the water. You grab the ox, haul back, and unload half the cargo before you can right it. Everything is muddy. Some goods are ruined.', wear: 1, food: -1 },
      { text: 'Detour through the willows', dc: null, ok: '', bad: '', always: 'You take the long way through the willows. The cart is scratched by branches but intact. It costs you half a day.', time: 1 }
    ]},
    { id: 'mosquito_plague', text: "The mosquitoes are unbearable. Clouds of them rise from the river shallows with every step. Your ox twitches and stamps. You can barely see through the swarm.\n\nYou have a mosquito net in the cart, but it won't cover the ox. And the smoke from a fire only does so much.", choices: [
      { text: 'Push through — they\'ll thin out', dc: null, ok: '', bad: '', always: 'You grit your teeth and walk. The mosquitoes thin after a mile. By evening you\'re covered in bites but through the worst of it.', crew: 'tired' },
      { text: 'Make camp early and build a smudge fire', dc: null, ok: '', bad: '', always: 'You build a smudge fire from green willow branches. The smoke drives the mosquitoes back. You lose the rest of the day but sleep without being eaten alive.', time: 1, crew: 'rested' }
    ]},
    { id: 'broken_ferry', text: "You reach the ferry crossing — and find the ferry on the wrong side of the river. The operator is gone. Maybe he'll be back tomorrow. Maybe not.\n\nThe ford here is deep and the current is strong. But you can see the trail on the other side.", choices: [
      { text: 'Wait for the ferry operator', dc: null, ok: '', bad: '', always: 'You wait. The operator shows up the next morning, apologetic. He poles you across for free. You lose a day.', time: 1 },
      { text: 'Ford it yourself (DC 13)', dc: 13, ok: 'You find the shallow channel and guide the ox across. The water is chest-deep and the current fights you, but you make it.', bad: 'The current is stronger than it looks. The cart tips mid-ford. You right it but lose a crate of supplies to the river. And the axle takes a hit.', wear: 1, food: -2 }
    ]},
    { id: 'friendly_métis', text: "You round a bend and find a Métis family camped by the river. A woman is cooking over a fire. Two children wave at you. The man nods — not unfriendly, but cautious.\n\nThey're heading east. You're heading west. The river is wide enough for both stories.", choices: [
      { text: 'Stop and share a meal', dc: null, ok: '', bad: '', always: 'You share pemmican and tea. The woman tells you the trail ahead is good but warns about mud after the hills. The man offers you a spare shaganappi strip. You part as friends.', food: 1, crew: 'rested', time: 1 },
      { text: 'Trade for supplies', dc: null, ok: '', bad: '', always: 'You trade a bison hide for a bundle of dried fish and a handful of Saskatoon berries. Fair trade. You both move on richer than before.', food: 2 }
    ]},
    { id: 'flash_flood', text: "The sky to the west goes dark. Not a thunderhead — a wall of cloud rolling fast. Then the rain hits. Not a drizzle — a deluge.\n\nWithin minutes the river rises. The trail along the bank floods. You need to get to higher ground now.", choices: [
      { text: 'Abandon the trail and head for high ground (DC 12)', dc: 12, ok: 'You whip the ox up the ridge. Water surges behind you but you make it to high ground. You wait out the flood. The trail is gone when the water recedes — you have to find a new path.', bad: 'The ox balks at the slope. By the time you get moving, the water is ankle-deep and rising. You make it to high ground but the cart takes on water. Supplies ruined.', food: -2, time: 1 },
      { text: 'Try to outrun it along the bank', dc: 14, ok: 'You push hard along the bank. The water rises behind you but you stay ahead of it. You reach the next rise just as the flood crests. Close.', bad: 'The water catches you. The cart floats for a terrifying moment before the ox finds purchase. You lose everything that wasn\'t tied down.', wear: 2, food: -3 }
    ]}
  ],
  wooded: [
    { id: 'fallen_tree', text: "A poplar has fallen across the trail. It's not large — maybe two feet through — but it's enough to block the cart. The ground around it is soft.\n\nYour axe is in the cart. It'll take time, but you can clear it.", choices: [
      { text: 'Chop through it', dc: null, ok: '', bad: '', always: 'You fell the tree and clear the trail. Your shoulders ache but the path is open.', give: [{ name: 'Firewood Bundle', amt: 1 }], time: 1 },
      { text: 'Go around through the bush (DC 10)', dc: 10, ok: 'You find a gap in the undergrowth. The cart scrapes through. Tight, but it works.', bad: 'The cart catches on a stump. You have to back out and try again. The axle takes a hit.', wear: 1 }
    ]},
    { id: 'berries', text: "The trail edges are thick with saskatoon berries. They're ripe — dark purple, almost black. Your mouth waters. The bushes go on for a hundred yards.\n\nYou could stop and gather. They won't last long in this heat, but a day or two of fresh fruit would be welcome.", choices: [
      { text: 'Gather berries', dc: null, ok: '', bad: '', always: "You fill a cloth with berries. They're sweet and warm from the sun.", food: 1, time: 1 }
    ]},
    { id: 'lost_trail', text: "The trail disappears. You've been following a clear path through the poplar forest, but now there's nothing — just undergrowth and trees in every direction.\n\nYou could be fifty yards off the trail. Or five hundred. The sun is behind clouds. No shadows to guide you.", choices: [
      { text: 'Use the sun and your instincts to find west (DC 12)', dc: 12, ok: 'You pick a direction and push through. After an hour of bushwhacking, you find the trail again. You lost time but you\'re back on track.', bad: 'You walk for two hours in the wrong direction. By the time you find the trail, you\'ve lost half a day and the ox is exhausted.', time: 2, crew: 'tired' },
      { text: 'Backtrack to where you last saw the trail', dc: null, ok: '', bad: '', always: 'You retrace your steps. It takes an hour but you find the trail. You lost time but at least you know where you are.', time: 1 }
    ]},
    { id: 'bear_encounter', text: "A black bear is standing in the trail ahead. Maybe forty yards. It sees you. It doesn't run.\n\nYour rifle is in the cart. The bear is between you and the next node. You could wait it out, but you've got a long day ahead.", choices: [
      { text: 'Make noise and scare it off', dc: 10, ok: 'You bang a pot and shout. The bear looks at you, sniffs the air, and ambles off into the trees. Your heart is pounding but the trail is clear.', bad: 'The bear doesn\'t scare. It drops to all fours and charges. You grab the rifle, fire wild, and the ball goes wide. The bear stops at the shot, then turns and runs. You reload with shaking hands and wait ten minutes before moving on.', time: 1, crew: 'tired' },
      { text: 'Give it a wide berth through the bush', dc: null, ok: '', bad: '', always: 'You leave the trail and bushwhack around the bear\'s position. It costs you an hour but you don\'t have to find out if your rifle works on a charging bear.', time: 1 }
    ]},
    { id: 'broken_wheel', text: "A crack — then a snap. The front right wheel breaks. Not the axle — the wheel itself. A spoke has given way and the rim is spreading.\n\nYou can't drive the cart like this. You need to repair it or find a replacement. You have shaganappi in the cart — enough for a temporary fix.", choices: [
      { text: 'Repair with shaganappi (DC 11)', dc: 11, ok: 'You bind the broken spoke with shaganappi strips and lash the rim tight. It\'s not pretty but it holds. You can drive carefully to the next settlement.', bad: 'The repair doesn\'t hold. You have to unload the cart, flip it, and spend two hours on a proper binding. You lose most of the day.', time: 2, wear: 1 },
      { text: 'Use the spare axle as a temporary wheel support', dc: null, ok: '', bad: '', always: 'You lash the spare axle under the broken wheel as a skid. It\'s slow and rough but it works. You\'ll need a real wheel at the next settlement.', wear: 1, time: 1 }
    ]},
    { id: 'deer_crossing', text: "A white-tailed deer bounds across the trail ahead — then another, and another. A small herd, spooked by something.\n\nThe forest is alive around you. You hear birds you can't name. The air smells of pine and earth.", choices: [
      { text: 'Watch them pass', dc: null, ok: '', bad: '', always: 'You pause and watch the deer disappear into the trees. A moment of peace on a long journey.' }
    ]},
    { id: 'firewood_opportunity', text: "A stand of dead poplar — dry, seasoned wood just waiting to be gathered. Your firewood is running low and the nights are getting colder.\n\nAn hour here could mean warm nights for the rest of the week.", choices: [
      { text: 'Gather firewood', dc: null, ok: '', bad: '', always: 'You spend an hour cutting and bundling. Your arms are tired but you have enough firewood for days.', give: [{ name: 'Firewood Bundle', amt: 2 }], time: 1 },
      { text: 'Keep moving — you have enough', dc: null, ok: '', bad: '', always: 'You push on. The wood will be there next time. Maybe.' }
    ]},
    { id: 'old_cabin', text: "A cabin. Not a settlement — just a single cabin, half-collapsed, in a clearing off the trail. The roof is caved in on one side. The door hangs open.\n\nSomeone lived here once. Maybe they left something useful. Or maybe the cabin is just a reminder that not everyone makes it.", choices: [
      { text: 'Search the cabin', dc: null, ok: '', bad: '', always: 'You find a rusted axe head, a coil of wire, and a bottle of something that might have been whiskey once. The axe head is useful. The whiskey is not.', time: 1 },
      { text: 'Leave it alone', dc: null, ok: '', bad: '', always: 'You leave the cabin as you found it. Some places are better left alone.' }
    ]}
  ],
  uplands: [
    { id: 'steep_descent', text: "The trail drops into a coulee — steep, maybe thirty feet down. The path switchbacks, but it's narrow. Your cart is heavy. The ox plants its feet at the top.\n\nYou've seen carts tip on slopes like this. The load shifts, the cart rolls, and everything scatters.", choices: [
      { text: 'Descend carefully, rope the cart (DC 11)', dc: 11, ok: 'You tie the rope to a tree and lower the cart down inch by inch. The ox follows. Slow, but safe.', bad: 'Halfway down, the rope slips. The cart lurches. You catch it, but the wheel hits rock.', wear: 1, need: 'Rope (50ft)' },
      { text: 'Descend without rope (DC 9)', dc: 9, ok: 'You guide the cart down. The ox is sure-footed. You reach the bottom without incident.', bad: "The cart picks up speed. You can't hold it. It hits the bottom hard.", wear: 1 }
    ]},
    { id: 'eagle', text: "An eagle circles high above the coulee — riding the thermals, wings motionless. It watches you with ancient eyes.\n\nThe uplands stretch in every direction. You can see the trail winding west, and beyond it, nothing but prairie and sky.", choices: [
      { text: 'Take in the view', dc: null, ok: '', bad: '', always: 'You stand for a moment, taking in the vastness. The journey ahead feels both impossible and inevitable. The eagle circles once more, then rides the wind west.' }
    ]},
    { id: 'rockslide', text: "Loose rock on the slope above you. A stone the size of your fist bounces down the trail — then another. The slope is unstable.\n\nThe trail runs along the base of the slope for the next quarter mile. You can see the debris field from previous rockslides.", choices: [
      { text: 'Move fast and hope (DC 11)', dc: 11, ok: 'You whip the ox forward and sprint along the slope. Rocks bounce around you but none hit the cart. You make it through breathing hard.', bad: 'A stone hits the cart. Then another. One cracks the canvas. A third hits the ox — not hard enough to stop it, but the animal panics and bolts. You wrestle it under control but the cart has taken damage.', wear: 1, time: 1 },
      { text: 'Find a way around the slope', dc: null, ok: '', bad: '', always: 'You leave the trail and find a longer route around the base of the slope. It costs you half a day but nothing gets broken.', time: 1 }
    ]},
    { id: 'wind_exposure', text: "The wind up here is relentless. No trees, no shelter — just open hillside and wind that never stops.\n\nYour ox leans into it. The cart shudders. You can barely hear yourself think. The wind has been blowing like this for an hour and it shows no sign of stopping.", choices: [
      { text: 'Push through — you need to make distance', dc: null, ok: '', bad: '', always: 'You lean into the wind and walk. The ox struggles but keeps moving. By evening you\'re through the worst of it. But the crew is exhausted.', crew: 'tired' },
      { text: 'Make camp in a hollow and wait for calmer weather', dc: null, ok: '', bad: '', always: 'You find a hollow in the hillside and make camp. The wind howls overhead but you\'re sheltered. You lose half a day but the crew rests.', time: 1, crew: 'rested' }
    ]},
    { id: 'lost_in_fog', text: "Fog rolls in from the west — thick, grey, disorienting. Within minutes you can barely see the ox in front of you.\n\nThe trail is somewhere ahead. Or maybe you've already passed it. In fog like this, every direction looks the same.", choices: [
      { text: 'Keep walking — the trail must be close (DC 12)', dc: 12, ok: 'You pick a direction and walk. After thirty minutes the fog thins and you find the trail. You were closer than you thought.', bad: 'You walk for an hour in the wrong direction. When the fog lifts, you\'re off the trail entirely. You have to backtrack.', time: 2, crew: 'tired' },
      { text: 'Wait for the fog to lift', dc: null, ok: '', bad: '', always: 'You hobble the ox and wait. The fog lifts after two hours. You\'ve lost time but at least you know where you are.', time: 2 }
    ]}
  ],
  river: [
    { id: 'major_crossing', text: "The river stretches wide before you. The current is visible — not fast, but steady. The ford is marked by willow poles on both banks, but the water is higher than usual.\n\nYou're carrying a tarp that could make a raft. But that takes hours. The ford is passable — probably.", choices: [
      { text: 'Ford the river (Survival DC 12)', dc: 12, ok: 'The ox finds the shallow channel. Water laps at the cart bed but nothing shifts. You reach the far bank soaked but whole.', bad: 'Midway across, a wheel drops into a hole. The cart tilts. You wrestle it level but the axle cracks. Some supplies get wet.', wear: 1, food: -1 },
      { text: 'Build a cart-raft (Survival DC 14)', dc: 14, ok: "You dismantle, wrap, and lash. The raft floats. Three hours later, you're across with a dry cart and your patience intact.", bad: 'The raft is clumsy. Mid-river it spins. You get wet and embarrassed but make it across.', food: -1, need: 'Canvas Tarp' }
    ]}
  ]
};

function getEventsForTerrain(t) { return EVENTS[t] || EVENTS.plains; }

// ── Trail flavor text (per terrain, for travel days with no event) ──
const TRAIL_FLAVOR = {
  plains: [
    "The prairie stretches flat in every direction. Grass to the horizon. Your ox plods steady.",
    "A long day under open sky. The cart creaks its familiar song. The ox knows the rhythm.",
    "The sun arcs west. You walk. The trail is good today — flat, dry, unremarkable.",
    "Prairie grass whispers around the cart wheels. The ox plods on. Another day on the Carlton Trail.",
    "The wind is at your back. You make good time. The prairie rolls on forever.",
    "A hawk circles overhead. The grass is waist-high. You are small on this vast land.",
    "The trail is a dark line through golden grass. You follow it west. Always west."
  ],
  river_valley: [
    "The trail descends into a river valley. Trees appear — poplar and willow. The air smells of water.",
    "You follow the riverbank. The ox drinks when you stop. The willows provide welcome shade.",
    "The valley is green and cool. Birds you don't recognize call from the cottonwoods.",
    "The trail winds between river and ridge. The ox picks its way carefully on the slope.",
    "You cross a shallow creek. The water is cold and clear. The cart wheels splash through."
  ],
  wooded: [
    "The trail winds through popple forest. Shafts of light break through the canopy.",
    "The forest closes in around you. The air is cooler here. The ox pushes through undergrowth.",
    "Poplar leaves tremble in the breeze. The trail is soft with fallen leaves. The cart rolls quietly.",
    "You hear a woodpecker somewhere in the trees. The forest smells of earth and green wood."
  ],
  uplands: [
    "You climb into higher ground. The wind picks up. You can see for miles.",
    "The trail switchbacks up the coulee wall. The ox strains. The cart tilts on the slope.",
    "From the ridge top, you can see the trail winding below — a thread through the grass.",
    "The uplands are wind-scoured and open. The ox leans into the gusts."
  ],
  river: [
    "You follow the river west. The water is high but the trail is clear.",
    "The river murmurs beside you. The ox drinks deeply. The day is long but the water keeps you company."
  ]
};

function getTrailFlavor(terrain) {
  const pool = TRAIL_FLAVOR[terrain] || TRAIL_FLAVOR.plains;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ── Game Engine ──────────────────────────────────────────────────
function createGame(seed) {
  const rng = makeRNG(seed);
  function rand() { return rng ? rng() : Math.random(); }
  function d20() { return Math.floor(rand() * 20) + 1; }

  const cart = JSON.parse(JSON.stringify(ITEMS));

  const S = {
    day: 1,
    month: 6,
    season: 'summer',
    crew: 'rested',
    food: 12,
    wear: 0,
    node: 0,           // current node index (0 = Fort Garry)
    segmentDay: 0,     // days traveled on current segment (0 = just arrived)
    over: false,
    won: false,
    pendingEvent: null,
    pendingSettlement: null,
    score: 0,
    camps: 0,
    eventsResolved: 0,
    tradesMade: 0
  };

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

  // ── Scoring ────────────────────────────────────────────────────
  function calcScore() {
    if (!S.won) return 0;
    const tradeGoods = cart.filter(i => i.type === 'trade' && i.count > 0).reduce((s, i) => s + i.count, 0);
    let score = 1000;
    score -= S.day * 10;                     // fewer days = better
    score -= S.wear * 50;                    // less wear = better
    score += tradeGoods * 100;               // more trade goods = better
    score += S.food * 15;                    // food remaining = better
    score -= S.camps * 20;                   // fewer camps = better
    return Math.max(score, 0);
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
      S.food += 2;
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
        S.tradesMade++;
        say(`You trade a ${tg.name} for supplies. +3 Food.`);
      } else {
        say("You browse the goods, but have nothing to trade.");
      }
    }
  }

  function getSettlementActions(n) {
    const actions = [];
    if (n.type === 'hbc') actions.push('trade', 'repair', 'rest');
    else if (n.type === 'metis') actions.push('trade', 'rest');
    else if (n.type === 'trading') actions.push('trade', 'rest');
    else if (n.type === 'mission') actions.push('rest', 'heal');
    else if (n.type === 'nwmp') actions.push('trade', 'rest');
    actions.push('continue');
    return actions;
  }

  // ── Event resolution ───────────────────────────────────────────
  function pickEvent() {
    if (rand() > 0.35) return null; // 65% event chance // 65% nothing happens on a given day
    const terrain = NODES[S.node].terrain;
    const pool = getEventsForTerrain(terrain);
    return pool[Math.floor(rand() * pool.length)];
  }

  function resolveChoice(ev, ci) {
    const ch = ev.choices[ci];
    let result = { roll: null, total: null, dc: null, success: null, text: '', effects: [] };

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

    if (ch.time) {
      // time effects from events are extra days BEYOND the day already spent
      // Only apply positive time penalties (delays), not negative (bonuses that cause rewind)
      if (ch.time > 0) {
        S.day += ch.time;
        result.effects.push(`+${ch.time} day(s)`);
      }
      // negative time (shortcuts) are handled via segment progress, not day counting
    }
    if (ch.food) {
      if (ch.dc !== null) {
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
        if (item) { item.count += g.amt; result.effects.push(`+${g.amt} ${g.name}`); }
      });
    }
    if (ch.extraProgress) {
      S.segmentDay += ch.extraProgress;
      result.effects.push(`+${ch.extraProgress} segment progress`);
    }

    return result;
  }

  // ── Core actions ───────────────────────────────────────────────

  // Travel one day along the current segment
  function travelOneDay() {
    if (S.over) return [];
    if (S.pendingSettlement) return []; // must resolve settlement first

    const currentDist = NODES[S.node + 1]?.dist || 1;
    S.food--;
    S.segmentDay++;
    S.day++;
    advanceMonth();

    const stepLog = [];

    // Check if we've arrived at the next node
    if (S.segmentDay >= currentDist) {
      S.node++;
      S.segmentDay = 0;
      const n = NODES[S.node];

      // Check for win (reached Fort Edmonton)
      if (S.node >= NODES.length - 1) {
        S.over = true;
        const hasTrade = cart.some(i => i.type === 'trade' && i.count > 0);
        S.won = hasTrade && S.wear < 4;
        S.score = calcScore();
        const tgCount = cart.filter(i => i.type === 'trade' && i.count > 0).reduce((s, i) => s + i.count, 0);
        if (S.won) {
          say(`FORT EDMONTON — Day ${S.day}\n\nYou made it.\n\nThe palisade walls of Fort Edmonton rise before you. The cart — battered, worn, but holding — creaks through the gate. You have ${tgCount} trade goods.\n\nThe Factor looks at your cart, at you, and nods. "Long journey?"\n\n— You have completed the Cart Trail —\nDays: ${S.day} | Wear: ${S.wear} | Food: ${S.food} | Score: ${S.score}`);
        } else {
          say(`FORT EDMONTON — Day ${S.day}\n\nYou arrive at Fort Edmonton, but you have no trade goods to sell. The journey was survival, not profit.\n\n— Journey Complete (No Trade Goods) —`);
        }
        return [];
      }

      // Arrived at a settlement
      say(`Day ${S.day} — ${n.name}\n\n${n.desc}`);
      if (n.type !== 'river') {
        S.pendingSettlement = n;
        stepLog.push({ action: 'arrive', node: n.name, nodeType: n.type, actions: getSettlementActions(n) });
      }
    } else {
      // Still on the trail — check for event
      const ev = pickEvent();
      if (ev) {
        S.pendingEvent = ev;
        const progress = `${S.segmentDay}/${currentDist} days to ${NODES[S.node + 1].name}`;
        say(`Day ${S.day} — On the trail (${progress})\n\n${ev.text}`);
        stepLog.push({ action: 'event', event: ev.id, choices: ev.choices.map(c => c.text) });
      } else {
        // No event — show trail flavor
        const terrain = NODES[S.node].terrain;
        const flavor = getTrailFlavor(terrain);
        const progress = `${S.segmentDay}/${currentDist} days to ${NODES[S.node + 1].name}`;
        say(`Day ${S.day} — On the trail (${progress})\n\n${flavor}`);
      }
    }

    checkGameOver();
    return stepLog;
  }

  function chooseEventChoice(choiceIndex) {
    if (!S.pendingEvent) return null;
    const ev = S.pendingEvent;
    S.pendingEvent = null;
    S.eventsResolved++;
    const result = resolveChoice(ev, choiceIndex);
    say(result.text);

    // If the event added extra segment progress, check for arrival
    const currentDist = NODES[S.node + 1]?.dist || 1;
    if (S.segmentDay >= currentDist) {
      S.node++;
      S.segmentDay = 0;
      const n = NODES[S.node];
      if (S.node >= NODES.length - 1) {
        S.over = true;
        const hasTrade = cart.some(i => i.type === 'trade' && i.count > 0);
        S.won = hasTrade && S.wear < 4;
        S.score = calcScore();
      }
      say(`Day ${S.day} — ${n.name}\n\n${n.desc}`);
      if (n.type !== 'river' && S.node < NODES.length - 1) {
        S.pendingSettlement = n;
      }
    }

    checkGameOver();
    return [{ action: 'eventResolved', event: ev.id, choiceIndex, result }];
  }

  function makeCamp() {
    if (S.pendingSettlement) return;
    S.food--;
    S.camps++;
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
    travelOneDay,
    makeCamp,
    chooseEventChoice,
    settlementAction,

    getState() { return JSON.parse(JSON.stringify(S)); },
    getCart() { return JSON.parse(JSON.stringify(cart)); },
    getNarrative() { return [...narrative]; },
    isOver() { return S.over; },
    hasWon() { return S.won; },
    getScore() { return S.score; },
    hasPendingEvent() { return S.pendingEvent !== null; },
    getPendingEvent() { return S.pendingEvent ? { id: S.pendingEvent.id, text: S.pendingEvent.text, choices: S.pendingEvent.choices.map(c => ({ text: c.text, dc: c.dc, need: c.need })) } : null },
    getCurrentNode() { return NODES[S.node]; },
    getNextNode() { return NODES[S.node + 1] || null; },
    getTotalWeight() { return totalWt(); },

    getAvailableActions() {
      if (S.pendingEvent) {
        return { type: 'event', choices: S.pendingEvent.choices.map((c, i) => ({ index: i, text: c.text, dc: c.dc, need: c.need })) };
      }
      if (S.pendingSettlement) {
        return { type: 'settlement', node: S.pendingSettlement.name, nodeType: S.pendingSettlement.type, actions: getSettlementActions(S.pendingSettlement) };
      }
      return { type: 'travel', actions: ['travel', 'camp'] };
    },

    stateSummary() {
      const n = NODES[S.node];
      const next = NODES[S.node + 1];
      const dist = next ? next.dist : 0;
      return {
        day: S.day,
        month: MONTHS[S.month],
        season: S.season,
        location: n.name,
        nodeType: n.type,
        food: S.food,
        wear: S.wear,
        crew: S.crew,
        node: S.node,
        totalNodes: NODES.length,
        segmentDay: S.segmentDay,
        segmentDist: dist,
        nextNode: next ? next.name : null,
        totalWeight: totalWt(),
        over: S.over,
        won: S.won,
        score: S.score,
        pendingEvent: S.pendingEvent ? S.pendingEvent.id : null
      };
    },

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

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Game: { create: createGame }, NODES, ITEMS, EVENTS };
}
