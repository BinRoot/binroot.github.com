// rings.js -- the paper's nested query anatomy, in two modes.
//
//   data-mode="bills"  slide 16: three nested rings.  Outer, maximum finding,
//                      sqrt(k); middle, amplitude estimation, 1/eps; inner,
//                      one complete rollout oracle.  Each ring lights as its
//                      factor is spoken (one press each); the product waits
//                      for slide 20, beside the classical floor.
//   data-mode="zoom"   slide 40: the same rings, then the two outer ones fade
//                      and the view dives through the inner box until its
//                      register architecture fills the frame; the first
//                      block, rank-select indexing, pulses once.
//
// Adapted from qce26/paper/figures/system/system_diagram.js and
// oracle/rollout_oracle_diagram.js, redrawn in the deck's palette.
(function () {
  if (window.__ringsInit) return;
  window.__ringsInit = true;
  const L = window.L2;

  const init = (svg) => {
    const mode = svg.dataset.mode || 'bills';
    const root = L.el('g', {}, svg);
    const scene = L.el('g', {}, root);        // zoomed as a whole

    // k moves in
    const gridIn = L.el('g', { transform: 'translate(30,110)' }, scene);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
      L.el('rect', { x: c * 14, y: r * 14, width: 12, height: 12, rx: 2, fill: [[0, 2], [1, 0], [1, 3], [2, 1], [3, 3]].some(([rr, cc]) => rr === r && cc === c) ? L.INK : '#eceef2' }, gridIn);
    }
    L.text(scene, 'k first moves', 58, 96, { size: 12, weight: 700 });
    L.el('line', { x1: 92, y1: 138, x2: 118, y2: 138, stroke: L.INK, 'stroke-width': 1.8 }, scene);

    const R1 = { x: 124, y: 26, w: 440, h: 228 }, R2 = { x: 146, y: 62, w: 396, h: 156 }, R3 = { x: 172, y: 100, w: 344, h: 84 };
    const ring = (R, label, cost, stroke, fill, sw) => {
      const g = L.el('g', {}, scene);
      L.el('rect', { x: R.x, y: R.y, width: R.w, height: R.h, rx: 10, fill, stroke, 'stroke-width': sw }, g);
      L.text(g, label, R.x + 14, R.y + 18, { anchor: 'start', size: 13, weight: 700 });
      const c = L.text(g, cost, R.x + R.w - 14, R.y + 18, { anchor: 'end', size: 14, weight: 700, fill: L.DIM, mono: true });
      return { g, cost: c, R };
    };
    const outer = ring(R1, 'maximum finding', '√k comparisons', L.INK, '#fff', 1.4);
    const middle = ring(R2, 'amplitude estimation', '1/ε calls', L.DIM, '#fafafa', 1.6);
    const inner = ring(R3, 'rollout oracle', '', L.INK, '#fff', 2.2);
    // |0> -> U -> payoff inside the inner box
    const wy = R3.y + 56;
    L.el('line', { x1: R3.x + 90, y1: wy, x2: R3.x + R3.w - 90, y2: wy, stroke: L.WIRE, 'stroke-width': 1.4 }, inner.g);
    L.el('rect', { x: R3.x + R3.w / 2 - 24, y: wy - 15, width: 48, height: 30, rx: 4, fill: '#eef2fb', stroke: L.INK, 'stroke-width': 1.5 }, inner.g);
    L.text(inner.g, 'U', R3.x + R3.w / 2, wy, { size: 14, weight: 700, mono: true });
    L.text(inner.g, '|0⟩', R3.x + 78, wy, { anchor: 'end', size: 13, mono: true });
    L.text(inner.g, 'payoff', R3.x + R3.w - 84, wy, { anchor: 'start', size: 12, fill: L.DIM });
    // out: eps-optimal move
    L.el('line', { x1: R1.x + R1.w + 6, y1: 138, x2: R1.x + R1.w + 32, y2: 138, stroke: L.INK, 'stroke-width': 1.8 }, scene);
    const gridOut = L.el('g', { transform: `translate(${R1.x + R1.w + 40},110)` }, scene);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
      L.el('rect', { x: c * 14, y: r * 14, width: 12, height: 12, rx: 2, fill: r === 2 && c === 1 ? L.GREEN : '#eceef2' }, gridOut);
    }
    L.text(scene, 'ε-optimal move', R1.x + R1.w + 68, 96, { size: 12, weight: 700 });

    if (mode === 'bills') {
      // the product is withheld here: slide 20 delivers it beside the classical floor
      // highlights driven by steps 1..3
      const hl = [outer, middle, inner].map((r) => L.el('rect', { x: r.R.x - 4, y: r.R.y - 4, width: r.R.w + 8, height: r.R.h + 8, rx: 13,
        fill: 'none', stroke: L.GOLD, 'stroke-width': 6, opacity: 0 }, scene));
      [0, 1, 2].forEach((i) => { const s = L.el('g', { class: 'step' }, root); s.setAttribute('opacity', 0); });
      L.steps(svg, (n) => {
        hl.forEach((h, i) => h.setAttribute('opacity', n === i + 1 ? 0.9 : 0));
        [outer, middle, inner].forEach((r, i) => r.cost.setAttribute('fill', n >= i + 1 ? L.BLUE : L.DIM));
      });
      return;
    }

    // ── zoom mode ──
    // the register architecture, drawn faint inside the inner box's footprint, then scaled up
    const arch = L.el('g', { opacity: 0 }, root);
    const AX = 60, AY = 40, AW = 640, AH = 240;
    const phases = [
      { k: 'A', label: 'rank-select indexing', w: 0.34, fill: '#dbeafe', stroke: '#7db8f0', ink: '#1e3a5f' },
      { k: 'B', label: 'stochastic transition', w: 0.40, fill: '#fff0e0', stroke: '#e8a860', ink: '#6b3010' },
      { k: 'C', label: 'terminal evaluation', w: 0.26, fill: '#d8f5e0', stroke: '#6cc88a', ink: '#14532d' }
    ];
    const LABW = 150;
    let px = AX + LABW;
    const bands = phases.map((p) => {
      const w = (AW - LABW) * p.w - 6;
      const g = L.el('g', {}, arch);
      L.el('rect', { x: px, y: AY + 26, width: w, height: AH - 26, rx: 6, fill: p.fill, stroke: p.stroke, 'stroke-width': 1.2 }, g);
      L.text(g, p.label, px + w / 2, AY + 12, { size: 13, weight: 700, fill: p.ink });
      const b = { g, x: px, w };
      px += w + 6;
      return b;
    });
    const rows = ['configuration copies', 'selectors', 'dice', 'ancilla', 'payoff flag'];
    rows.forEach((s, i) => {
      const y = AY + 50 + i * 44;
      L.text(arch, s, AX + LABW - 12, y, { anchor: 'end', size: 13, weight: 600 });
      L.el('line', { x1: AX + LABW + 4, y1: y, x2: AX + AW - 4, y2: y, stroke: '#aab0c0', 'stroke-width': 1.4 }, arch);
    });
    // a few blocks, unlabelled beyond a hint
    const blk = (band, row, xf, wf, txt, dashed) => {
      const b = bands[band], y = AY + 50 + row * 44;
      const g = L.el('g', {}, arch);
      L.el('rect', { x: b.x + b.w * xf, y: y - 14, width: b.w * wf, height: 28, rx: 4, fill: dashed ? '#f3e8ff' : '#fff',
        stroke: dashed ? '#a855f7' : phases[band].stroke, 'stroke-width': 1.3, 'stroke-dasharray': dashed ? '5 3' : null }, g);
      L.text(g, txt, b.x + b.w * (xf + wf / 2), y, { size: 10.5, fill: dashed ? '#6b21a8' : phases[band].ink });
      return g;
    };
    const rs = blk(0, 1, 0.06, 0.4, 'select move', true); blk(0, 1, 0.54, 0.4, 'select move', true);
    blk(0, 0, 0.06, 0.4, 'place'); blk(0, 0, 0.54, 0.4, 'place');
    blk(0, 3, 0.06, 0.88, 'prefix count → reset');
    blk(1, 2, 0.04, 0.42, 'Uniform(20)', true); blk(1, 2, 0.54, 0.42, 'Uniform(20)', true);
    blk(1, 0, 0.04, 0.42, 'conditional flip'); blk(1, 0, 0.54, 0.42, 'conditional flip');
    blk(1, 3, 0.04, 0.92, 'neighbour count → threshold → reset');
    blk(2, 0, 0.06, 0.88, 'read final board'); blk(2, 4, 0.06, 0.88, 'B > W → payoff bit');
    const pulse = L.el('rect', { x: bands[0].x - 6, y: AY + 20, width: bands[0].w + 12, height: AH - 14, rx: 9, fill: 'none', stroke: '#7db8f0', 'stroke-width': 5, opacity: 0 }, arch);

    const cx = R3.x + R3.w / 2, cy = R3.y + R3.h / 2;
    const setState = (t) => {
      const fade = L.win(t, 0.6, 0.8);
      outer.g.setAttribute('opacity', 1 - fade); middle.g.setAttribute('opacity', 1 - fade);
      gridIn.setAttribute('opacity', 1 - fade); gridOut.setAttribute('opacity', 1 - fade);
      scene.querySelectorAll('text, line').forEach((n) => { if (n.parentNode === scene) n.setAttribute('opacity', 1 - fade); });
      const z = L.win(t, 1.4, 1.6, L.ease);
      const k = L.lerp(1, 6, z);
      scene.setAttribute('transform', `translate(${380 - k * cx},${160 - k * cy}) scale(${k})`);
      scene.setAttribute('opacity', 1 - L.win(t, 2.4, 0.6));
      arch.setAttribute('opacity', L.win(t, 2.5, 0.6));
      const p = t - 3.3;
      pulse.setAttribute('opacity', p > 0 && p < 1.2 ? 0.9 * Math.sin(Math.PI * p / 1.2) : 0);
    };
    L.timeline(svg, { T: 4.8, setState });
  };
  document.querySelectorAll('svg.rings-fig').forEach(init);
})();
