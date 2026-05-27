#!/usr/bin/env node
/**
 * Cart Trail — Headless Playtest Runner
 *
 * Usage:
 *   node playtest.js --seeds 100
 *   node playtest.js --seed 42 --verbose
 */

const { Game } = require('./src/engine');
const fs = require('fs');

const args = process.argv.slice(2);
const get = (flag, def) => { const i = args.indexOf(flag); return i >= 0 && args[i + 1] ? args[i + 1] : def; };
const has = (flag) => args.includes(flag);

const NUM_SEEDS = parseInt(get('--seeds', '100')) || 100;
const SINGLE_SEED = get('--seed', null);
const VERBOSE = has('--verbose') || has('-v');
const REPORT_FILE = get('--report', '/tmp/cart-trail-report.json');
const MAX_STEPS = 500;

function pickAction(game) {
  const actions = game.getAvailableActions();
  const s = game.stateSummary();

  if (actions.type === 'event') {
    let bestIdx = 0, bestScore = -Infinity;
    actions.choices.forEach((ch, i) => {
      let score = 0;
      if (ch.dc === null) score += 10;
      else if (ch.dc <= 10) score += 4;
      else if (ch.dc <= 13) score += 1;
      else score -= 2;
      if (ch.need) score -= 5;
      if (score > bestScore) { bestScore = score; bestIdx = i; }
    });
    return { type: 'choose', index: bestIdx };
  }

  if (actions.type === 'settlement') {
    // Always rest at settlements to resupply food
    if (actions.actions.includes('rest')) {
      return { type: 'settlement', action: 'rest' };
    }
    return { type: 'settlement', action: 'continue' };
  }

  // Travel
  if (s.food <= 2) return { type: 'camp' };
  return { type: 'travel' };
}

function runGame(seed, verbose = false) {
  const game = Game.create(seed);
  const log = [];
  let steps = 0;

  log.push({ step: 0, ...game.fullSnapshot() });

  while (!game.isOver() && steps < MAX_STEPS) {
    steps++;
    const action = pickAction(game);

    if (VERBOSE || verbose) {
      const s = game.stateSummary();
      const aStr = action.type === 'choose' ? `choose[${action.index}]` :
                   action.type === 'settlement' ? `settlement.${action.action}` : action.type;
      process.stderr.write(`  [${seed}] Step ${steps}: ${aStr} | Day ${s.day} ${s.location} | F${s.food} W${s.wear} C:${s.crew}\n`);
    }

    if (action.type === 'travel') game.travelOneDay();
    else if (action.type === 'camp') game.makeCamp();
    else if (action.type === 'choose') game.chooseEventChoice(action.index);
    else if (action.type === 'settlement') game.settlementAction(action.action);

    log.push({ step: steps, action, ...game.fullSnapshot() });

    if (steps > 20) {
      const recent = log.slice(-8).map(l => JSON.stringify(l.summary));
      if (recent.every(s2 => s2 === recent[0])) {
        return { seed, steps, won: false, looped: true, error: 'Infinite loop', log };
      }
    }
  }

  if (steps >= MAX_STEPS) return { seed, steps, won: false, error: 'Max steps', log };
  return { seed, steps, won: game.hasWon(), score: game.getScore(), looped: false, log };
}

async function main() {
  console.log(`🎮 Cart Trail Playtest Runner\n`);
  const seeds = SINGLE_SEED ? [parseInt(SINGLE_SEED)] : Array.from({ length: NUM_SEEDS }, (_, i) => i + 1);
  const results = [];

  console.log(`🎲 Running ${seeds.length} games...\n`);

  for (const seed of seeds) {
    const result = runGame(seed, SINGLE_SEED);
    results.push(result);
    if (!SINGLE_SEED) {
      process.stdout.write(`\r  ${results.length}/${seeds.length} | Wins: ${results.filter(r => r.won).length}   `);
    }
  }
  if (!SINGLE_SEED) process.stdout.write('\n');

  const wins = results.filter(r => r.won);
  const errors = results.filter(r => r.error);
  const stepCounts = wins.map(r => r.steps);
  const avgSteps = stepCounts.length ? (stepCounts.reduce((a, b) => a + b, 0) / stepCounts.length).toFixed(1) : 'N/A';
  const scores = wins.map(r => r.score).filter(s => s > 0);
  const avgScore = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(0) : 'N/A';

  const failureReasons = {};
  results.filter(r => !r.won && !r.error && !r.looped).forEach(r => {
    const last = r.log[r.log.length - 1]?.summary;
    if (!last) { failureReasons['unknown'] = (failureReasons['unknown'] || 0) + 1; return; }
    if (last.food <= 0) failureReasons['starvation'] = (failureReasons['starvation'] || 0) + 1;
    else if (last.wear >= 4) failureReasons['cart_broken'] = (failureReasons['cart_broken'] || 0) + 1;
    else if (last.month >= 11) failureReasons['winter'] = (failureReasons['winter'] || 0) + 1;
    else failureReasons['no_trade_goods'] = (failureReasons['no_trade_goods'] || 0) + 1;
  });

  console.log('\n═══ RESULTS ═══');
  console.log(`  Win rate:    ${(wins.length / seeds.length * 100).toFixed(1)}% (${wins.length}/${seeds.length})`);
  console.log(`  Avg steps:   ${avgSteps}`);
  console.log(`  Avg score:   ${avgScore}`);
  console.log(`  Errors:      ${errors.length}`);

  if (Object.keys(failureReasons).length) {
    console.log('\n  Failures:');
    Object.entries(failureReasons).sort((a, b) => b[1] - a[1]).forEach(([r, c]) => console.log(`    ${r}: ${c}`));
  }

  const report = {
    meta: { totalGames: seeds.length },
    winRate: `${(wins.length / seeds.length * 100).toFixed(1)}%`,
    wins: wins.length, errors: errors.length,
    avgSteps, avgScore, failureReasons,
    details: results.map(r => ({ seed: r.seed, steps: r.steps, won: r.won, score: r.score, error: r.error || null }))
  };
  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));
  console.log(`\n📄 ${REPORT_FILE}`);
}

main().catch(e => { console.error(e.stack); process.exit(1); });
