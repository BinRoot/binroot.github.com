// Compare two first moves from the same board. Sampling starts in the
// background when Sway is introduced; results appear only on the later
// evidence slide. The browser rate is illustrative, not a benchmark.
// Reduced motion shows precomputed estimates; R restarts the live samples.
(function () {
  if (window.__raceInit) return;
  window.__raceInit = true;
  const L = window.L2;
  const D = window.SWAY_DATA;
  if (!D) return;
  const N = D.N, H = D.H, nb = L.sway.neighbors(N);
  const board = Uint8Array.from(D.board);
  const byLabel = Object.fromEntries(D.candidates.map((c) => [c.label, c]));
  const pair = D.closePair.map((l) => byLabel[l]);       // [leader, runner-up] by heavy MC
  const RATE = 60;                                        // rollouts per second per arm
  const stats = pair.map(() => ({ n: 0, wins: 0 }));
  const rnd = [L.prng(D.seed + 7), L.prng(D.seed + 8)];
  const state = { running: false, started: false, budget: 0, t0: 0 };

  const est = (s) => {
    if (s.n === 0) return null;
    const p = s.wins / s.n, hw = 1.96 * Math.sqrt(p * (1 - p) / s.n);
    return { p, lo: p - hw, hi: p + hw };
  };
  const step = (dt) => {
    state.budget += dt * RATE;
    const k = Math.floor(state.budget);
    if (k <= 0) return;
    state.budget -= k;
    for (let j = 0; j < k; j++) {
      pair.forEach((c, i) => {
        stats[i].n++;
        stats[i].wins += L.sway.rollout(board, N, nb, H, c.r * N + c.c, rnd[i]);
      });
    }
  };

  // Full-size estimates on the evidence slide.
  const draw = (svg) => {
    svg.textContent = '';
    const W = 760, Hh = 300;
    svg.setAttribute('viewBox', `0 0 ${W} ${Hh}`);
    const root = L.el('g', {}, svg);
    const f = 1;
    const AX0 = 90, AX1 = 670, AY = 168;
    const lo = 0.40, hi = 0.50;
    const vx = (v) => L.lerp(AX0, AX1, (v - lo) / (hi - lo));
    L.el('line', { x1: AX0, y1: AY, x2: AX1, y2: AY, stroke: L.INK, 'stroke-width': 1.5 * f }, root);
    for (let v = lo; v <= hi + 1e-9; v += 0.02) {
      L.el('line', { x1: vx(v), y1: AY - 5 * f, x2: vx(v), y2: AY + 5 * f, stroke: L.INK, 'stroke-width': f }, root);
      L.text(root, v.toFixed(2), vx(v), AY + 20 * f, { size: 12 * f, fill: L.DIM, mono: true });
    }
    L.text(root, 'P(Black wins)', (AX0 + AX1) / 2, AY + 44, { size: 13, fill: L.DIM });
    const colors = [L.BLUE, L.ORANGE];
    pair.forEach((c, i) => {
      const e = est(stats[i]);
      const y = AY - 56 - i * 42;
      L.text(root, `move ${c.label}`, AX0 - 14 * f, y, { anchor: 'end', size: 16 * f, weight: 700, fill: colors[i] });
      if (!e) return;
      const x0 = Math.max(AX0, vx(e.lo)), x1 = Math.min(AX1, vx(e.hi));
      const bh = 24;
      L.el('rect', { x: x0, y: y - bh / 2, width: Math.max(2, x1 - x0), height: bh, rx: 5, fill: colors[i], opacity: 0.35 }, root);
      L.el('line', { x1: vx(e.p), y1: y - bh / 2 - 4, x2: vx(e.p), y2: y + bh / 2 + 4, stroke: colors[i], 'stroke-width': 3 }, root);
      L.text(root, e.p.toFixed(3), Math.min(AX1 - 20, vx(e.hi) + 26), y, { anchor: 'start', size: 13, mono: true, fill: colors[i] });
    });
    const n = stats[0].n;
    const e0 = est(stats[0]), e1 = est(stats[1]);
    const overlap = e0 && e1 && e0.lo < e1.hi && e1.lo < e0.hi;
    L.text(root, `${n.toLocaleString()} rollouts per move`, 160, 30, { size: 18, mono: true, weight: 700, anchor: 'start' });
    if (e0 && e1) L.text(root, overlap ? 'intervals still overlap' : 'intervals separated', 600, 30, { size: 15, weight: 700, fill: overlap ? L.RED : L.GREEN, anchor: 'end' });
    // epsilon bracket, state-specific tag, and the heavy-MC reference marks
    const eps = D.eps;
    const bx = vx(pair[0].mean);
    L.el('path', { d: `M ${vx(pair[0].mean - eps)} ${AY + 62} v 8 M ${bx} ${AY + 62} v 8 M ${vx(pair[0].mean - eps)} ${AY + 66} H ${bx}`, fill: 'none', stroke: L.GREEN, 'stroke-width': 2 }, root);
    L.text(root, `ε = ${eps}`, (vx(pair[0].mean - eps) + bx) / 2, AY + 84, { size: 12, fill: L.GREEN, mono: true });
    pair.forEach((c, i) => {
      L.el('line', { x1: vx(c.mean), y1: AY - 8, x2: vx(c.mean), y2: AY + 8, stroke: colors[i], 'stroke-width': 1.5, 'stroke-dasharray': '3 2' }, root);
    });
    L.el('rect', { x: 600, y: Hh - 26, width: 110, height: 22, rx: 11, fill: '#fff', stroke: L.RULE }, root);
    L.text(root, 'state-specific', 655, Hh - 15, { size: 11, fill: L.DIM });
  };

  const fulls = [].slice.call(document.querySelectorAll('svg.race-full'));

  const paint = () => {
    fulls.forEach((f) => draw(f));
  };

  if (L.reduced()) {
    // Static: show the heavy estimate as the final frame.
    pair.forEach((c, i) => { stats[i].n = c.n; stats[i].wins = Math.round(c.mean * c.n); });
    paint();
  } else {
    let last = performance.now();
    const frame = (now) => {
      requestAnimationFrame(frame);
      if (!Number.isFinite(now)) now = performance.now();
      const dt = Math.max(0, Math.min((now - last) / 1000, 0.25));
      last = now;
      if (document.hidden || !state.running) return;
      step(dt);
      paint();
    };
    requestAnimationFrame(frame);
    paint();
  }

  // Start once, keeping the introduction free of sampling charts.
  const visible = () => {
    const cur = document.querySelector('.slide.current');
    if (cur && cur.dataset.segmentId === 'seg-sway' && !state.started && !L.reduced()) {
      state.started = true; state.running = true;
    }
  };
  const deck = document.getElementById('deck');
  if (deck) new MutationObserver(visible).observe(deck, { attributes: true, subtree: true, attributeFilter: ['class'] });
  document.addEventListener('DOMContentLoaded', visible);
  visible();
  document.addEventListener('keydown', (e) => {
    const cur = document.querySelector('.slide.current');
    if (e.key === 'r' && cur && cur.dataset.segmentId === 'seg-sway') {
      stats.forEach((s) => { s.n = 0; s.wins = 0; });
      rnd[0] = L.prng(D.seed + 7); rnd[1] = L.prng(D.seed + 8);
      state.running = true; state.started = true;
      paint(); visible(); e.preventDefault();
    }
  });
})();
