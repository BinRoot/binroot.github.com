// l4-games.mjs -- exact win rates for three versions of the 3x3, two-round
// Sway rollout from the empty board: the game as defined (synchronous event,
// selector scratch unwound before the stone lands), the in-place event that
// updates cells one at a time, and the placement that unwinds its counter
// after the board changed, so the counter starts each later placement dirty.
// Every quantity is enumerated exactly: 9*8*7*6 rank sequences, and for each
// event every flip pattern of the occupied cells with its probability.
//   node gen/l4-games.mjs [N] [H]
const N = +(process.argv[2] || 3), H = +(process.argv[3] || 2), CELLS = N * N;
const nb = [];
for (let i = 0; i < CELLS; i++) {
  const r = Math.floor(i / N), c = i % N, a = [];
  if (r > 0) a.push(i - N); if (r < N - 1) a.push(i + N); if (c > 0) a.push(i - 1); if (c < N - 1) a.push(i + 1);
  nb.push(a);
}
// board: 0 empty, 1 black, 2 white
const friendly = (b, i) => nb[i].reduce((s, j) => s + (b[j] === b[i] ? 1 : 0), 0);
const pflip = (b, i) => b[i] ? (4 - friendly(b, i)) / 20 : 0;
// synchronous event: distribution over resulting boards
function eventSync(b) {
  const occ = []; for (let i = 0; i < CELLS; i++) if (b[i]) occ.push(i);
  const ps = occ.map((i) => pflip(b, i));
  const out = new Map();
  for (let m = 0; m < (1 << occ.length); m++) {
    let p = 1; const nbd = b.slice();
    occ.forEach((i, k) => { const f = (m >> k) & 1; p *= f ? ps[k] : 1 - ps[k]; if (f) nbd[i] = 3 - b[i]; });
    if (p > 0) add(out, nbd, p);
  }
  return out;
}
// in-place event: cells in row-major order, each reading the board as already changed
function eventSeq(b) {
  const out = new Map();
  const rec = (bd, i, p) => {
    while (i < CELLS && !bd[i]) i++;
    if (i >= CELLS) { add(out, bd, p); return; }
    const q = pflip(bd, i);
    if (q < 1) rec(bd, i + 1, p * (1 - q));
    if (q > 0) { const nbd = bd.slice(); nbd[i] = 3 - bd[i]; rec(nbd, i + 1, p * q); }
  };
  rec(b.slice(), 0, 1);
  return out;
}
const key = (b) => b.join('');
function add(map, b, p) { const k = key(b); const e = map.get(k); if (e) e.p += p; else map.set(k, { b, p }); }
// placement: rank r uniform over m; the r-th empty cell (row-major); a dirty
// counter shifts the effective rank by d, and a negative rank places nothing
function place(b, r, color, d) {
  const eff = r - d; if (eff < 0) return b;
  let seen = 0; const nbd = b.slice();
  for (let i = 0; i < CELLS; i++) if (!b[i]) { if (seen === eff) { nbd[i] = color; return nbd; } seen++; }
  return nbd; // sentinel: no cell matched
}
function winRate(mode) {
  // mode: 'sync' | 'seq' | 'dirty'
  let dist = new Map([[key(new Array(CELLS).fill(0)), { b: new Array(CELLS).fill(0), p: 1, d: 0, stones: 0 }]]);
  for (let h = 0; h < H; h++) {
    for (const color of [1, 2]) {
      const m = CELLS - 2 * h - (color === 2 ? 1 : 0);      // legal count, fixed horizon
      const next = new Map();
      for (const { b, p, d } of dist.values()) {
        for (let r = 0; r < m; r++) {
          const shift = mode === 'dirty' ? d : 0;
          const nbd = place(b, r, color, shift);
          const placed = nbd !== b && key(nbd) !== key(b);
          const k = key(nbd) + '|' + (mode === 'dirty' ? d + (placed ? 1 : 0) : 0);
          const e = next.get(k);
          if (e) e.p += p / m; else next.set(k, { b: nbd, p: p / m, d: d + (placed ? 1 : 0) });
        }
      }
      dist = next;
    }
    const after = new Map();
    for (const { b, p, d } of dist.values()) {
      const ev = mode === 'seq' ? eventSeq(b) : eventSync(b);
      for (const { b: nb2, p: q } of ev.values()) {
        const k = key(nb2) + '|' + d; const e = after.get(k);
        if (e) e.p += p * q; else after.set(k, { b: nb2, p: p * q, d });
      }
    }
    dist = after;
  }
  let win = 0, draw = 0, tot = 0;
  for (const { b, p } of dist.values()) {
    const bl = b.filter((x) => x === 1).length, wh = b.filter((x) => x === 2).length;
    tot += p; if (bl > wh) win += p; else if (bl === wh) draw += p;
  }
  return { win, draw, tot };
}
for (const mode of ['sync', 'seq', 'dirty']) {
  const { win, draw, tot } = winRate(mode);
  console.log(`${N}x${N} H=${H} ${mode.padEnd(5)} black wins ${win.toFixed(6)}  draws ${draw.toFixed(6)}  mass ${tot.toFixed(6)}`);
}
