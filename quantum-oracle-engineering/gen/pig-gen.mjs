// pig-gen.mjs -- numbers for Lesson 1's running example, the dice game Pig.
//
// Rules: on your turn roll a d6 as often as you like; each roll adds to a
// turn total, except a 1, which wipes the turn total and ends the turn; hold
// to add the turn total to your score; first to 100 wins.
//
// Two exact computations by value iteration over states (i, j, k) = my score,
// opponent's score, my turn total, plus Monte Carlo traces for the figures:
//   1. optimal play (Neller and Presser), for the "solved" slide: a slice of
//      the roll/hold boundary at a fixed opponent score;
//   2. both players following the fixed strategy "hold at 20", for the win
//      rate of "roll" against "hold" from chosen positions; the rollouts on
//      the opening slides estimate exactly these numbers.
// Output: assets/pig-data.js (window.PIG_DATA).
import fs from 'fs';
const GOAL = 100, HOLD = 20;
const idx = (i, j, k) => (i * GOAL + j) * GOAL + k;
// ---- optimal play --------------------------------------------------------
function solveOptimal() {
  const P = new Float64Array(GOAL * GOAL * GOAL).fill(0.5), roll = new Uint8Array(GOAL * GOAL * GOAL);
  for (let sweep = 0; sweep < 400; sweep++) {
    let delta = 0;
    for (let i = 0; i < GOAL; i++) for (let j = 0; j < GOAL; j++) for (let k = 0; k < GOAL - i; k++) {
      const hold = i + k >= GOAL ? 1 : 1 - P[idx(j, i + k, 0)];
      let r = (1 - P[idx(j, i, 0)]) / 6;
      for (let d = 2; d <= 6; d++) r += (i + k + d >= GOAL ? 1 : P[idx(i, j, k + d)]) / 6;
      const v = Math.max(hold, r), o = P[idx(i, j, k)];
      P[idx(i, j, k)] = v; roll[idx(i, j, k)] = r > hold ? 1 : 0;
      delta = Math.max(delta, Math.abs(v - o));
    }
    if (delta < 1e-9) { console.error('optimal converged after', sweep + 1, 'sweeps'); break; }
  }
  return { P, roll };
}
// ---- fixed strategy, hold at 20 --------------------------------------------
function solveFixed() {
  const P = new Float64Array(GOAL * GOAL * GOAL).fill(0.5);
  const value = (i, j, k, act) => {
    if (act === 'hold') return i + k >= GOAL ? 1 : 1 - P[idx(j, i + k, 0)];
    let r = (1 - P[idx(j, i, 0)]) / 6;
    for (let d = 2; d <= 6; d++) r += (i + k + d >= GOAL ? 1 : P[idx(i, j, k + d)]) / 6;
    return r;
  };
  for (let sweep = 0; sweep < 400; sweep++) {
    let delta = 0;
    for (let i = 0; i < GOAL; i++) for (let j = 0; j < GOAL; j++) for (let k = 0; k < GOAL - i; k++) {
      const v = value(i, j, k, k >= HOLD ? 'hold' : 'roll'), o = P[idx(i, j, k)];
      P[idx(i, j, k)] = v; delta = Math.max(delta, Math.abs(v - o));
    }
    if (delta < 1e-10) { console.error('fixed converged after', sweep + 1, 'sweeps'); break; }
  }
  return { P, value };
}
const opt = solveOptimal(), fix = solveFixed();
// ---- Monte Carlo under the fixed strategy, with a seedable PRNG (same as L2.prng)
const prng = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
// one rollout from (i, j, k), first action fixed, then hold-at-20 for both; returns {win, trace}
function rollout(i, j, k, first, rnd) {
  let me = i, op = j, turn = k, mine = true, forced = first; const trace = [];
  while (true) {
    const act = forced || (turn >= HOLD ? 'hold' : 'roll'); forced = null;
    if (act === 'hold') {
      if (mine) me += turn; else op += turn;
      trace.push({ who: mine ? 'me' : 'op', hold: turn });
      if (me >= GOAL) return { win: 1, trace }; if (op >= GOAL) return { win: 0, trace };
      turn = 0; mine = !mine; continue;
    }
    const d = 1 + Math.floor(rnd() * 6);
    trace.push({ who: mine ? 'me' : 'op', die: d });
    if (d === 1) { turn = 0; mine = !mine; continue; }
    turn += d;
    if ((mine ? me : op) + turn >= GOAL) { if (mine) me += turn; else op += turn; trace.push({ who: mine ? 'me' : 'op', hold: turn }); return { win: mine ? 1 : 0, trace }; }
  }
}
const pos = { i: 62, j: 71, k: 12 };                       // the opening position
const exact = (p) => ({ roll: fix.value(p.i, p.j, p.k, 'roll'), hold: fix.value(p.i, p.j, p.k, 'hold') });
console.error('opening', pos, exact(pos));
// a seed whose first ten "roll" rollouts win exactly 7, with the first two having different outcomes
let seed = 1, tenWins = -1;
for (; seed < 5000; seed++) { const r = prng(seed); const w = []; for (let n = 0; n < 10; n++) w.push(rollout(pos.i, pos.j, pos.k, 'roll', r).win); if (w.reduce((a, b) => a + b) === 7 && w[0] !== w[1]) { tenWins = w; break; } }
console.error('seed', seed, 'ten', tenWins);
// running estimates at 10, 100, 1000 rollouts for that seed
const est = {}; { const r = prng(seed); let w = 0; for (let n = 1; n <= 1000; n++) { w += rollout(pos.i, pos.j, pos.k, 'roll', r).win; if (n === 10 || n === 100 || n === 1000) est[n] = w / n; } }
console.error('estimates', est);
// search positions with a wide gap and a near tie between roll and hold (fixed strategy, exact)
// easy: a wide gap between roll and hold; close: a gap near half a point with both near one half
const easy = { i: 81, j: 84, k: 11, ...exact({ i: 81, j: 84, k: 11 }) };
let close = null;
for (let i = 0; i < GOAL; i += 1) for (let j = 0; j < GOAL; j += 1) for (let k = 4; k <= 14 && i + k < GOAL; k += 1) {
  const e = { i, j, k, ...exact({ i, j, k }) }; const g = Math.abs(e.hold - e.roll);
  if (g > 0.004 && g < 0.007 && e.roll > 0.47 && e.roll < 0.53 && (!close || Math.abs(g - 0.0055) < Math.abs(Math.abs(close.hold - close.roll) - 0.0055))) close = e;
}
console.error('easy', easy, 'close', close);
// optimal policy slice at opponent score 30: rows i, bits k (1 = roll)
const J = 30, slice = [];
for (let i = 0; i < GOAL; i++) { let row = ''; for (let k = 0; k < GOAL; k++) row += k < GOAL - i ? String(opt.roll[idx(i, J, k)]) : '.'; slice.push(row); }
const states = (() => { let n = 0; for (let i = 0; i < GOAL; i++) n += GOAL * (GOAL - i); return n; })();
const out = { GOAL, HOLD, pos, exact: exact(pos), seed, ten: tenWins, est, easy, close, optSliceJ: J, optSlice: slice, states, optAtPos: opt.roll[idx(pos.i, pos.j, pos.k)] ? 'roll' : 'hold', optWinAtPos: opt.P[idx(pos.i, pos.j, pos.k)] };
fs.writeFileSync('assets/pig-data.js', '// generated by gen/pig-gen.mjs; do not edit\nwindow.PIG_DATA = ' + JSON.stringify(out) + ';\n');
console.error('states', states, 'optimal at opening:', out.optAtPos, out.optWinAtPos.toFixed(4), 'written assets/pig-data.js', fs.statSync('assets/pig-data.js').size, 'bytes');
