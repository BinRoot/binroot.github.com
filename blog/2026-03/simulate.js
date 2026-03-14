import {
  playGame,
  strategyRandom,
  strategyClustery,
  strategyAntiCluster,
  strategyFortress,
  strategyDestabilizer,
  strategyMinimax,
  strategyForkBuilder
} from './engine.js';

// ─── Configuration ───────────────────────────────────────────────────
const N = 8;
const GAMES = 1000;

const strategies = {
  Random: strategyRandom,
  Clusterer: strategyClustery,
  'Anti-cluster': strategyAntiCluster,
  Fortress: strategyFortress,
  Destabilizer: strategyDestabilizer,
  Minimax: strategyMinimax,
  'Fork Builder': strategyForkBuilder,
};

const matchups = [
  ['Fork Builder', 'Clusterer'],
  ['Fork Builder', 'Random'],
  ['Fork Builder', 'Destabilizer'],
  ['Fork Builder', 'Fortress'],
  ['Fork Builder', 'Minimax'],
  ['Minimax', 'Clusterer'],
  ['Clusterer', 'Random'],
  ['Clusterer', 'Fortress'],
  ['Clusterer', 'Destabilizer'],
  ['Fortress', 'Destabilizer'],
];

// ─── Run ─────────────────────────────────────────────────────────────
console.log(`Sway Simulation: N=${N}, ${GAMES} games per matchup\n`);

for (const [blackName, whiteName] of matchups) {
  const blackFn = strategies[blackName];
  const whiteFn = strategies[whiteName];
  let bWins = 0, wWins = 0, ties = 0;

  for (let i = 0; i < GAMES; i++) {
    const result = playGame(N, blackFn, whiteFn);
    if (result.winner === 'black') bWins++;
    else if (result.winner === 'white') wWins++;
    else ties++;
  }

  const bPct = ((bWins / GAMES) * 100).toFixed(1);
  const wPct = ((wWins / GAMES) * 100).toFixed(1);
  const tPct = ((ties / GAMES) * 100).toFixed(1);

  console.log(`${blackName} (black) vs ${whiteName} (white):`);
  console.log(`  Black wins: ${bWins} (${bPct}%)  White wins: ${wWins} (${wPct}%)  Ties: ${ties} (${tPct}%)`);
  console.log();
}
