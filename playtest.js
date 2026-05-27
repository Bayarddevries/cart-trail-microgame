#!/usr/bin/env node
/**
 * Cart Trail — Headless Playtest Runner
 *
 * Runs the game engine in pure Node.js. No browser needed.
 * Plays through games with different seeds to find bugs, balance issues.
 *
 * Usage:
 *   node playtest.js --seed 1              # run single seed verbosely
 *   node playtest.js --seeds 100           # run batch of 100
 *   node playtest.js --seeds 1000 --strategy greedy
 *   node playtest.js --find-breaks         # find crashing seeds
 */

const { Game } = require('./src/engine');
const fs = require('fs');

const args = process.argv.slice(2);
const get = (flag, def) => { const i = args.indexOf(flag); return i >= 0 && args[i + 1] ? args[i + 1] : def; };
const has = (flag) => args.includes(flag);

const NUM_SEEDS = parseInt(get('--seeds', '100')) || 100;
const SINGLE_SEED = get('--seed', null);
const STRATEGY = get('--strategy', 'greedy');
const VERBOSE = has('--verbose') || has('-v');
const REPORT_FILE = get('--report', '/tmp/cart-trail-report.json');
const FIND_BREAKS = has('--find-breaks');
const MAX_STEPS = 500;

// ── Strategy: pick the next action ───────────────────────────────
function pickAction(game) {
  const actions = game.getAvailableActions();
  const s = game.stateSummary();

  if (actions.type === 'event') {
    // Pick the "best" choice heuristically
    if (STRATEGY === 'random') {
      const idx = Math.floor(Math.random() * actions.choices.length);
      return { type: 'choose', index: idx };
    }
    // Greedy: prefer safe (no DC), then easy DC, avoid need-item, prefer food
    let bestIdx = 0;
    let bestScore = -Infinity;
    actions.choices.forEach((ch, i) => {
      let score = 0;
      if (ch.dc === null) score += 10;       // safe choice
      else if (ch.dc <= 10) score += 4;      // easy
      else if (ch.dc <= 13) score += 1;      // medium
      else score -= 2;                        // hard
      if (ch.need) score -= 5;                // requires item
      if (score > bestScore) { bestScore = score; bestIdx = i; }
    });
    return { type: 'choose', index: bestIdx };
  }

  if (actions.type === 'settlement') {
    // Camp if critical food
    if (s.food <= 2) return { type: 'camp' };
    // Rest if exhausted/tired and can afford it
    if (s.crew === 'exhausted' && s.food > 3 && actions.actions.includes('rest')) {
      return { type: 'settlement', action: 'rest' };
    }
    if (STRATEGY === 'cautious') {
      if (s.crew !== 'rested' && s.food > 5 && actions.actions.includes('rest')) {
        return { type: 'settlement', action: 'rest' };
      }
      if (s.wear > 0 && actions.actions.includes('repair')) {
        return { type: 'settlement', action: 'repair' };
      }
    }
    // Default: continue west
    return { type: 'settlement', action: 'continue' };
  }

  // Travel phase
  if (s.food <= 2) return { type: 'camp' };
  if (s.wear >= 3 && s.food > 4) return { type: 'camp' };
  return { type: 'proceed' };
}

// ── Run one game ─────────────────────────────────────────────────
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
                   action.type === 'settlement' ? `settlement.${action.action}` :
                   action.type;
      process.stderr.write(`  [${seed}] Step ${steps}: ${aStr} | Day ${s.day} ${s.location} | F${s.food} W${s.wear} C:${s.crew}\n`);
    }

    // Execute action
    if (action.type === 'proceed') game.proceed();
    else if (action.type === 'camp') game.makeCamp();
    else if (action.type === 'choose') game.chooseEventChoice(action.index);
    else if (action.type === 'settlement') game.settlementAction(action.action);

    log.push({ step: steps, action, ...game.fullSnapshot() });

    // Loop detection: same state 10 steps in a row
    if (steps > 20) {
      const recent = log.slice(-8);
      const states = recent.map(l => JSON.stringify(l.summary));
      if (states.every(s => s === states[0])) {
        return { seed, steps, won: false, looped: true, error: 'Infinite loop detected', log };
      }
    }
  }

  if (steps >= MAX_STEPS) {
    return { seed, steps, won: false, error: 'Max steps exceeded', log };
  }

  return { seed, steps, won: game.hasWon(), looped: false, log };
}

// ── Main ──────────────────────────────────────────────────────────
async function main() {
  console.log(`🎮 Cart Trail Playtest Runner`);
  console.log(`   Strategy: ${STRATEGY}\n`);

  if (FIND_BREAKS) {
    console.log('🔍 Finding breaking seeds...\n');
    let seed = 1;
    let found = 0;
    while (found < 10) {
      const result = runGame(seed);
      if (result.error) {
        found++;
        console.log(`  #${found} Seed ${seed}: ${result.error} (${result.steps} steps)`);
        fs.writeFileSync(`/tmp/cart-trail-break-${seed}.json`, JSON.stringify(result, null, 2));
      }
      seed++;
      if (seed > 50000) { console.log('  Stopped at 50000'); break; }
    }
    return;
  }

  const seeds = SINGLE_SEED ? [parseInt(SINGLE_SEED)] : Array.from({ length: NUM_SEEDS }, (_, i) => i + 1);
  const results = [];

  console.log(`🎲 Running ${seeds.length} games...\n`);

  for (const seed of seeds) {
    const result = runGame(seed, SINGLE_SEED);
    results.push(result);

    if (!SINGLE_SEED) {
      process.stdout.write(`\r  Progress: ${results.length}/${seeds.length} | Wins: ${results.filter(r => r.won).length} | Errors: ${results.filter(r => r.error).length}   `);
    }
  }

  if (!SINGLE_SEED) process.stdout.write('\n');

// ── Analysis ───────────────────────────────────────────────────
  const wins = results.filter(r => r.won);
  const errors = results.filter(r => r.error && !r.looped);
  const looped = results.filter(r => r.looped);

  const stepCounts = wins.map(r => r.steps);
  const avgSteps = stepCounts.length ? (stepCounts.reduce((a, b) => a + b, 0) / stepCounts.length).toFixed(1) : 'N/A';
  const minSteps = stepCounts.length ? Math.min(...stepCounts) : 'N/A';
  const maxSteps = stepCounts.length ? Math.max(...stepCounts) : 'N/A';

  // Categorize losses
  const failureReasons = {};
  results.filter(r => !r.won && !r.error && !r.looped).forEach(r => {
    const last = r.log[r.log.length - 1]?.summary;
    if (!last) { failureReasons['unknown'] = (failureReasons['unknown'] || 0) + 1; return; }
    if (last.food <= 0) failureReasons['starvation'] = (failureReasons['starvation'] || 0) + 1;
    else if (last.wear >= 4) failureReasons['cart_broken'] = (failureReasons['cart_broken'] || 0) + 1;
    else if (last.month >= 11) failureReasons['winter'] = (failureReasons['winter'] || 0) + 1;
    else failureReasons['no_trade_goods'] = (failureReasons['no_trade_goods'] || 0) + 1;
  });

  const report = {
    meta: { strategy: STRATEGY, totalGames: seeds.length },
    winRate: `${(wins.length / seeds.length * 100).toFixed(1)}%`,
    wins: wins.length,
    losses: seeds.length - wins.length - errors.length - looped.length,
    errors: errors.length,
    looped: looped.length,
    avgSteps: avgSteps,
    minSteps,
    maxSteps,
    failureReasons,
    summary: results.map(r => ({ seed: r.seed, steps: r.steps, won: r.won, error: r.error || null, looped: r.looped }))
  };

  // ── Print report ───────────────────────────────────────────────
  console.log('\n═══ RESULTS ═══');
  console.log(`  Win rate:  ${report.winRate} (${wins.length}/${seeds.length})`);
  console.log(`  Steps (win): avg ${avgSteps} | min ${minSteps} | max ${maxSteps}`);
  console.log(`  Errors:     ${errors.length}`);
  console.log(`  Looped:     ${looped.length}`);

  if (Object.keys(failureReasons).length) {
    console.log('\n  Failure breakdown:');
    Object.entries(failureReasons).sort((a, b) => b[1] - a[1]).forEach(([reason, count]) => {
      console.log(`    ${reason}: ${count}`);
    });
  }

  if (errors.length > 0) {
    console.log('\n  Errors:');
    errors.slice(0, 5).forEach(e => console.log(`    Seed ${e.seed}: ${e.error}`));
  }

  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));
  console.log(`\n📄 Full report: ${REPORT_FILE}`);
}

main().catch(e => { console.error(`Fatal: ${e.stack}`); process.exit(1); });
