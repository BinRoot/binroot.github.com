#!/usr/bin/env node
// sway-gen.mjs -- the seeded data generator behind every Sway number in the
// Lesson 2 deck.  Run from quantum-oracle-engineering/:
//
//   node gen/sway-gen.mjs > assets/sway-data.js
//
// Semantics are the QCE26 paper's, read from the Qiskit artifact
// (qce26/qiskit/sway_rollout_oracle.py, direct_rollout_from_sample):
//   * one round = Black places, White places, one synchronous Sway event
//   * every placement after the fixed first move is a uniformly random legal
//     cell (the artifact prepares the selector uniformly over exactly the
//     legal ranks; under a fixed horizon that count is known in advance)
//   * each occupied cell rolls a die uniform on 0..19 and flips when the die
//     is below 4 - c, c = same-colour orthogonal neighbours on the PRE-event
//     board; all flips apply together
//   * fixed horizon H; payoff 1 iff Black outnumbers White at the end
//
// Before it prints anything the generator reproduces Table II of the paper by
// exact enumeration from the empty board (3x3 H=2 -> .271, 5x5 H=3 -> .325)
// and refuses to emit data if either check fails.  Everything downstream is
// driven by one PRNG seed, printed into the output.

const EMPTY = 0, BLACK = 1, WHITE = 2;

// ── PRNG: mulberry32, small and reproducible in the browser ────────────────
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Board helpers ──────────────────────────────────────────────────────────
function neighborsOf(N) {
  const nb = [];
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const list = [];
    if (r > 0) list.push((r - 1) * N + c);
    if (r < N - 1) list.push((r + 1) * N + c);
    if (c > 0) list.push(r * N + c - 1);
    if (c < N - 1) list.push(r * N + c + 1);
    nb.push(list);
  }
  return nb;
}

function friendly(board, nb, i) {
  const col = board[i];
  if (col === EMPTY) return 0;
  let k = 0;
  for (const j of nb[i]) if (board[j] === col) k++;
  return k;
}

function empties(board) {
  const out = [];
  for (let i = 0; i < board.length; i++) if (board[i] === EMPTY) out.push(i);
  return out;
}

// Synchronous Sway event with explicit dice (0..19 per cell).
function swayWithDice(board, nb, dice) {
  const next = Uint8Array.from(board);
  for (let i = 0; i < board.length; i++) {
    if (board[i] === EMPTY) continue;
    const k = friendly(board, nb, i);
    if (dice[i] < 4 - k) next[i] = board[i] === BLACK ? WHITE : BLACK;
  }
  return next;
}

function payoff(board) {
  let b = 0, w = 0;
  for (const v of board) { if (v === BLACK) b++; else if (v === WHITE) w++; }
  return b > w ? 1 : 0;
}

// One rollout under the paper's policy.  firstMove fixes Black's round-1
// cell (the arm); pass -1 for a uniformly random first move.
function rollout(start, N, nb, H, firstMove, rnd) {
  let board = Uint8Array.from(start);
  const dice = new Uint8Array(N * N);
  for (let h = 0; h < H; h++) {
    let e = empties(board);
    const bcell = (h === 0 && firstMove >= 0) ? firstMove : e[Math.floor(rnd() * e.length)];
    board[bcell] = BLACK;
    e = empties(board);
    const wcell = e[Math.floor(rnd() * e.length)];
    board[wcell] = WHITE;
    for (let i = 0; i < dice.length; i++) dice[i] = Math.floor(rnd() * 20);
    board = swayWithDice(board, nb, dice);
  }
  return payoff(board);
}

// ── Exact enumeration ──────────────────────────────────────────────────────
// Value of a board with h full rounds left, memoised on a symmetry-canonical
// key (the rules are invariant under the square's eight symmetries, so the
// win probability is too).  The last round uses a Poisson-binomial DP over
// the flip indicators instead of enumerating 2^occupied patterns.
function symmetries(N) {
  const maps = [];
  const idx = (r, c) => r * N + c;
  const fns = [
    (r, c) => [r, c], (r, c) => [c, N - 1 - r], (r, c) => [N - 1 - r, N - 1 - c],
    (r, c) => [N - 1 - c, r], (r, c) => [r, N - 1 - c], (r, c) => [N - 1 - r, c],
    (r, c) => [c, r], (r, c) => [N - 1 - c, N - 1 - r]
  ];
  for (const f of fns) {
    const m = new Uint8Array(N * N);
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const [rr, cc] = f(r, c); m[idx(r, c)] = idx(rr, cc);
    }
    maps.push(m);
  }
  return maps;
}

function canonicalKey(board, syms) {
  let best = Infinity;
  for (const m of syms) {
    let key = 0;
    for (let i = 0; i < board.length; i++) key = key * 3 + board[m[i]];
    if (key < best) best = key;
  }
  return best;
}

function exactValue(start, N, H, firstMove) {
  const nb = neighborsOf(N);
  const syms = symmetries(N);
  const memo = new Map();
  const n = N * N;

  // P(Black > White after one Sway event from `board`).
  const lastRound = (board) => {
    let occ = 0;
    // dp[j] = probability that j of the processed stones end up black
    let dp = [1];
    for (let i = 0; i < n; i++) {
      if (board[i] === EMPTY) continue;
      occ++;
      const p = (4 - friendly(board, nb, i)) / 20;
      const pBlack = board[i] === BLACK ? 1 - p : p;
      const next = new Array(dp.length + 1).fill(0);
      for (let j = 0; j < dp.length; j++) {
        next[j] += dp[j] * (1 - pBlack);
        next[j + 1] += dp[j] * pBlack;
      }
      dp = next;
    }
    let win = 0;
    for (let j = 0; j < dp.length; j++) if (j > occ - j) win += dp[j];
    return win;
  };

  const value = (board, h, fixed) => {
    if (h === 0) return payoff(board);
    const key = fixed >= 0 ? null : canonicalKey(board, syms) * 8 + h;
    if (key !== null && memo.has(key)) return memo.get(key);
    const e = empties(board);
    const blackMoves = fixed >= 0 ? [fixed] : e;
    let total = 0;
    for (const b of blackMoves) {
      board[b] = BLACK;
      const e2 = empties(board);
      let sub = 0;
      for (const w of e2) {
        board[w] = WHITE;
        if (h === 1) {
          sub += lastRound(board);
        } else {
          // enumerate flip patterns over occupied cells
          // flip probabilities for THIS board, local to this level: the recursive
          // call below enumerates its own board and must not overwrite them
          const occ = [], flipP = new Float64Array(n);
          for (let i = 0; i < n; i++) if (board[i] !== EMPTY) { occ.push(i); flipP[i] = (4 - friendly(board, nb, i)) / 20; }
          const m = occ.length;
          for (let pat = 0; pat < (1 << m); pat++) {
            let prob = 1;
            const next = Uint8Array.from(board);
            for (let t = 0; t < m; t++) {
              const i = occ[t];
              if (pat & (1 << t)) { prob *= flipP[i]; next[i] = board[i] === BLACK ? WHITE : BLACK; }
              else prob *= 1 - flipP[i];
            }
            if (prob === 0) continue;
            sub += prob * value(next, h - 1, -1);
          }
        }
        board[w] = EMPTY;
      }
      total += sub / e2.length;
      board[b] = EMPTY;
    }
    const v = total / blackMoves.length;
    if (key !== null) memo.set(key, v);
    return v;
  };
  return value(Uint8Array.from(start), H, firstMove);
}

// ── Monte Carlo with a fixed seed ──────────────────────────────────────────
function mc(start, N, nb, H, firstMove, n, seed) {
  const rnd = mulberry32(seed);
  let wins = 0;
  for (let i = 0; i < n; i++) wins += rollout(start, N, nb, H, firstMove, rnd);
  const p = wins / n;
  const half = 1.96 * Math.sqrt(p * (1 - p) / n);
  return { mean: p, lo: p - half, hi: p + half, n };
}

// ── Main ───────────────────────────────────────────────────────────────────
const SEED = 20260913;            // the tutorial date, so it is memorable
const t0 = Date.now();
const log = (s) => process.stderr.write(s + '\n');

// 1. Reproduce Table II from the empty board.
const empty = (N) => new Uint8Array(N * N);
const exact33 = exactValue(empty(3), 3, 2, -1);
log(`check 3x3 H=2 exact = ${exact33.toFixed(6)} (paper: .271)`);
if (Math.abs(exact33 - 0.271) > 0.0005) throw new Error('3x3 H=2 does not reproduce Table II');
const exact55 = exactValue(empty(5), 5, 3, -1);
log(`check 5x5 H=3 exact = ${exact55.toFixed(6)} (paper: .325)  [${((Date.now() - t0) / 1000).toFixed(1)}s]`);
if (Math.abs(exact55 - 0.325) > 0.0005) throw new Error('5x5 H=3 does not reproduce Table II');
const mc33 = mc(empty(3), 3, neighborsOf(3), 2, -1, 20000, SEED);
const mc55 = mc(empty(5), 5, neighborsOf(5), 3, -1, 20000, SEED + 1);
log(`mc 3x3 = ${mc33.mean.toFixed(4)} ± ${(mc33.hi - mc33.mean).toFixed(4)}; mc 5x5 = ${mc55.mean.toFixed(4)} ± ${(mc55.hi - mc55.mean).toFixed(4)}`);

// 2. The curated board: 5x5, six stones, Black to move, three rounds left.
//    Candidate boards are tried in order; the first whose two best moves sit
//    within 0.6 * CLOSE of each other, with a third move clearly apart, is used.
//    TOL is the tolerance the lesson then chooses; slide 14's rule says it
//    has to sit below the observed gap, and the generator refuses otherwise.
const N = 5, H = 3;
const nb = neighborsOf(N);
const CLOSE = 0.01;   // screening threshold for a close pair
const TOL = 0.003;    // the lesson's epsilon, below the gap it has to resolve
const boards = [
  [ // A: a black pair, a white pair, two loose stones
    0, 0, 0, 0, 0,
    0, 1, 1, 0, 0,
    0, 0, 2, 2, 0,
    0, 1, 0, 0, 0,
    0, 0, 0, 2, 0 ],
  [ // B
    0, 0, 2, 0, 0,
    0, 1, 1, 0, 0,
    0, 0, 2, 0, 0,
    0, 2, 1, 0, 0,
    0, 0, 0, 0, 0 ],
  [ // C
    0, 0, 0, 0, 0,
    0, 2, 1, 0, 0,
    0, 1, 1, 2, 0,
    0, 0, 2, 0, 0,
    0, 0, 0, 0, 0 ],
];

let chosen = null;
for (let bi = 0; bi < boards.length && !chosen; bi++) {
  const board = Uint8Array.from(boards[bi]);
  const e = empties(board);
  const screen = e.map((cell, i) => ({ cell, ...mc(board, N, nb, H, cell, 40000, SEED + 100 + bi * 50 + i) }));
  screen.sort((a, b) => b.mean - a.mean);
  const [m1, m2] = screen;
  const gap = m1.mean - m2.mean;
  // third candidate: the best move at least 0.04 below the leader
  const m3 = screen.find((m) => m1.mean - m.mean > 0.04);
  log(`board ${bi}: top ${m1.mean.toFixed(4)} @${m1.cell}, next ${m2.mean.toFixed(4)} @${m2.cell}, gap ${gap.toFixed(4)}, third ${m3 ? m3.mean.toFixed(4) + ' @' + m3.cell : 'none'}`);
  if (gap < CLOSE * 0.6 && m3) chosen = { bi, board, screen, m1, m2, m3 };
}
if (!chosen) throw new Error('no board produced a close pair; add candidates');

// 3. Heavy Monte Carlo on the three displayed moves.
const HEAVY = 400000;
const cands = [chosen.m1, chosen.m2, chosen.m3].map((m, i) => {
  const est = mc(chosen.board, N, nb, H, m.cell, HEAVY, SEED + 1000 + i);
  const r = Math.floor(m.cell / N), c = m.cell % N;
  const after = Uint8Array.from(chosen.board); after[m.cell] = BLACK;
  return { cell: m.cell, r, c, support: friendly(after, nb, m.cell), ...est };
});
// Label A, B, C in board reading order so the labels carry no ranking hint.
cands.sort((a, b) => a.cell - b.cell);
cands.forEach((k, i) => { k.label = 'ABC'[i]; });
const sorted = [...cands].sort((a, b) => b.mean - a.mean);
const closePair = [sorted[0].label, sorted[1].label];
const gap = sorted[0].mean - sorted[1].mean;
if (TOL >= gap) throw new Error(`tolerance ${TOL} is not below the observed gap ${gap.toFixed(5)}`);
log(`heavy: ${cands.map((k) => `${k.label}@(${k.r},${k.c}) ${k.mean.toFixed(4)} ±${(k.hi - k.mean).toFixed(4)}`).join('  ')}; close pair ${closePair.join('')} gap ${gap.toFixed(4)}  [${((Date.now() - t0) / 1000).toFixed(1)}s]`);

const out = {
  generated: new Date().toISOString().slice(0, 10),
  seed: SEED,
  semantics: 'QCE26 Sway: Black, White, synchronous event; later moves uniform over legal cells; die uniform 0..19, flip if die < 4 - c; fixed H; payoff Black > White',
  checks: {
    '3x3,H=2': { exact: +exact33.toFixed(6), paper: 0.271, mc: +mc33.mean.toFixed(4), mcHalf: +(mc33.hi - mc33.mean).toFixed(4), n: mc33.n },
    '5x5,H=3': { exact: +exact55.toFixed(6), paper: 0.325, mc: +mc55.mean.toFixed(4), mcHalf: +(mc55.hi - mc55.mean).toFixed(4), n: mc55.n }
  },
  N, H, eps: TOL, close: CLOSE,
  board: Array.from(chosen.board),
  toMove: 'black',
  candidates: cands.map((k) => ({ label: k.label, r: k.r, c: k.c, support: k.support, mean: +k.mean.toFixed(5), lo: +k.lo.toFixed(5), hi: +k.hi.toFixed(5), n: k.n })),
  closePair, gap: +gap.toFixed(5),
  allMoves: chosen.screen.map((m) => ({ cell: m.cell, mean: +m.mean.toFixed(4), n: m.n }))
};
process.stdout.write('// Generated by gen/sway-gen.mjs; do not edit.  Seed ' + SEED + '.\n' +
  'window.SWAY_DATA = ' + JSON.stringify(out, null, 1) + ';\n');
log(`done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
