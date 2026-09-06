// sway-q.js -- slides 35, 36, 37: Sway through the three questions.
//
//   data-q="1"  the d20 tape moves from the physical board into explicit
//               per-cell random registers; the classical checks box shows the
//               paper's own exact-versus-Monte-Carlo pair on the 3x3 board
//   data-q="2"  two measured comparisons on the lesson's board: the best move
//               against the clearly worse one (easy) and against the runner-up
//               (close); only the close card passes; epsilon (the tolerance)
//               and g (the observed gap) are labelled separately
//   data-q="3"  the three-phase oracle silhouette above the compiled-count
//               table in two bands: validated rows, then scaling-only rows,
//               with the enumerate-versus-project caption
(function () {
  if (window.__swayqInit) return;
  window.__swayqInit = true;
  const L = window.L2;
  const D = window.SWAY_DATA;

  const q1 = (svg, root) => {
    const N = D.N, nb = L.sway.neighbors(N);
    const B = L.board(root, { N, size: 190, x: 40, y: 30, board: D.board });
    const occ = [];
    for (let i = 0; i < N * N; i++) if (D.board[i]) occ.push(i);
    // registers on the right: one row of 5 qubits per stone
    const RX = 330, RY = 34;
    L.text(root, 'random registers', RX + 110, 18, { size: 12, fill: L.DIM });
    const regs = occ.map((i, k) => {
      const g = L.el('g', { opacity: 0 }, root);
      const y = RY + k * 28;
      L.text(g, `cell ${i}`, RX - 6, y, { anchor: 'end', size: 11, mono: true, fill: L.DIM });
      for (let b = 0; b < 5; b++) L.el('rect', { x: RX + b * 22, y: y - 9, width: 18, height: 18, rx: 3, fill: '#f3e8ff', stroke: '#a855f7', 'stroke-width': 1.2, 'stroke-dasharray': '3 2' }, g);
      L.text(g, 'Uniform(20)', RX + 5 * 22 + 8, y, { anchor: 'start', size: 11, fill: '#6b21a8', mono: true });
      return { g, from: i };
    });
    const dice = occ.map((i) => L.die(root, B.cx(i) + 40, B.cy(i) + 30, 9, null, { fill: '#fff' }));
    // classical checks box with the paper's pair
    const bx = 40, by = 236;
    L.el('rect', { x: bx, y: by, width: 690, height: 66, rx: 8, fill: '#fff', stroke: L.RULE }, root);
    L.text(root, 'exact enumeration', bx + 12, by + 16, { anchor: 'start', size: 12, fill: L.DIM });
    const c = D.checks['3x3,H=2'];
    L.text(root, `3×3, H=2:  exact ${c.paper.toFixed(3)}   Monte Carlo .281 ± .028`, bx + 12, by + 42, { anchor: 'start', size: 15, mono: true });
    const setState = (t) => {
      occ.forEach((i, k) => {
        const u = L.win(t, 0.4 + k * 0.18, 0.7, L.ease);
        const y = RY + k * 28;
        dice[k].setAttribute('transform', `translate(${L.lerp(B.cx(i) + 40, RX + 50, u)},${L.lerp(B.cy(i) + 30, y, u)}) scale(${1 - 0.9 * u})`);
        regs[k].g.setAttribute('opacity', u > 0.6 ? 1 : 0);
      });
    };
    L.timeline(svg, { T: 0.4 + occ.length * 0.18 + 1.2, setState });
  };

  const q2 = (svg, root) => {
    // Both cards show the lesson's board and two of its measured candidates.
    // Easy: the best move against the clearly worse one.  Close: the best
    // against the runner-up.  Every number is from sway-data.js.
    const N = D.N;
    const by = Object.fromEntries(D.candidates.map((c) => [c.label, c]));
    const sorted = [...D.candidates].sort((a, b) => b.mean - a.mean);
    const best = sorted[0], runner = sorted[1], worst = sorted[sorted.length - 1];
    const COL = { A: L.BLUE, B: L.ORANGE, C: L.PURPLE };
    const card = (x, title, pair, pass) => {
      const g = L.el('g', {}, root);
      L.el('rect', { x, y: 20, width: 300, height: 262, rx: 12, fill: '#fff', stroke: pass ? L.GREEN : L.RULE, 'stroke-width': pass ? 2.5 : 1.5 }, g);
      L.text(g, title, x + 150, 42, { size: 15, weight: 700, fill: pass ? L.GREEN : L.DIM });
      const B = L.board(g, { N, size: 150, x: x + 75, y: 56, board: D.board });
      pair.forEach((c) => {
        const i = c.r * N + c.c;
        L.el('circle', { cx: x + 75 + B.cx(i), cy: 56 + B.cy(i), r: B.r, fill: '#fff', stroke: COL[c.label], 'stroke-width': 2.5 }, g);
        L.text(g, c.label, x + 75 + B.cx(i), 56 + B.cy(i), { size: 13, weight: 700, fill: COL[c.label] });
      });
      // the two means on one axis, with the gap bracketed
      const AX0 = x + 40, AX1 = x + 260, AY = 232;
      const lo = 0.40, hi = 0.47;
      const vx = (v) => L.lerp(AX0, AX1, (v - lo) / (hi - lo));
      L.el('line', { x1: AX0, y1: AY, x2: AX1, y2: AY, stroke: L.INK, 'stroke-width': 1.2 }, g);
      pair.forEach((c) => {
        L.el('rect', { x: vx(c.lo), y: AY - 7, width: Math.max(2, vx(c.hi) - vx(c.lo)), height: 14, rx: 3, fill: COL[c.label], opacity: 0.35 }, g);
        L.el('line', { x1: vx(c.mean), y1: AY - 10, x2: vx(c.mean), y2: AY + 10, stroke: COL[c.label], 'stroke-width': 3 }, g);
      });
      const a = Math.min(pair[0].mean, pair[1].mean), b = Math.max(pair[0].mean, pair[1].mean);
      L.el('path', { d: `M ${vx(a)} ${AY + 16} v 6 M ${vx(b)} ${AY + 16} v 6 M ${vx(a)} ${AY + 19} H ${vx(b)}`, fill: 'none', stroke: L.ORANGE, 'stroke-width': 2 }, g);
      L.text(g, `g ≈ ${(b - a).toFixed(3)}`, (vx(a) + vx(b)) / 2, AY + 36, { size: 12, fill: L.ORANGE, mono: true });
      return g;
    };
    card(60, 'easy', [best, worst], false);
    card(400, 'close', [best, runner], true);
    const eps = L.el('g', { class: 'step' }, root);
    L.el('rect', { x: 440, y: 292, width: 220, height: 22, rx: 11, fill: '#eaf4ec', stroke: L.GREEN }, eps);
    L.text(eps, `ε = ${D.eps}  (chosen, below g)`, 550, 303, { size: 11, fill: L.GREEN, mono: true });
    L.el('rect', { x: 130, y: 292, width: 160, height: 22, rx: 11, fill: '#fdf1ec', stroke: L.ORANGE }, root);
    L.text(root, 'g  (observed)', 210, 303, { size: 11, fill: L.ORANGE, mono: true });
  };

  const q3 = (svg, root) => {
    // silhouette
    const ph = [['rank-select', '#dbeafe', '#7db8f0', '#1e3a5f'], ['stochastic transition', '#fff0e0', '#e8a860', '#6b3010'], ['terminal evaluation', '#d8f5e0', '#6cc88a', '#14532d']];
    let x = 80;
    ph.forEach(([s, f, st, ink], i) => {
      const w = [190, 230, 190][i];
      L.el('rect', { x, y: 22, width: w, height: 44, rx: 8, fill: f, stroke: st, 'stroke-width': 1.5 }, root);
      L.text(root, s, x + w / 2, 44, { size: 13, weight: 700, fill: ink });
      if (i < 2) L.el('polygon', { points: `${x + w + 8},${44} ${x + w + 2},${39} ${x + w + 2},${49}`, fill: L.WIRE }, root);
      x += w + 10;
    });
    // table: two bands, each with its own small header row; Sway beside the
    // paper's main instantiation, the SIR epidemic model, compiled through
    // the same three-phase template
    const rows = [
      ['3×3, H=2', '169', '9,768', '146', '6,472', true],
      ['5×5, H=3', '667', '55,597', '—', '—', true],
      ['5×5, H=5', '916', '76,720', '767', '56,602', false],
      ['10×10, H=5', '3,363', '481,201', '2,893', '280,230', false],
      ['10×10, H=10', '6,503', '793,901', '5,463', '558,995', false],
      ['20×20, H=10', '25,189', '6,072,641', '21,409', '2,592,183', false]
    ];
    const TY = 118, RH = 22, XI = 150, XSQ = 340, XSG = 450, XEQ = 585, XEG = 705;
    L.text(root, 'Sway', (XSQ + XSG) / 2 - 20, TY - 16, { size: 12, weight: 700 });
    L.text(root, 'epidemic (SIR)', (XEQ + XEG) / 2 - 20, TY - 16, { size: 12, weight: 700, fill: '#a93226' });
    L.text(root, 'instance', XI, TY, { size: 11, fill: L.DIM, anchor: 'start' });
    [[XSQ, 'qubits'], [XSG, 'gates'], [XEQ, 'qubits'], [XEG, 'gates']].forEach(([x, s]) => L.text(root, s, x, TY, { size: 11, fill: L.DIM, anchor: 'end' }));
    let y = TY + 20;
    rows.forEach((r, i) => {
      const g = L.el('g', { class: i >= 2 ? 'step' : '' }, root);
      if (i === 0 || i === 2) {
        const nrows = i === 0 ? 2 : 4;
        L.el('rect', { x: 130, y: y - 12, width: 590, height: RH * (nrows + 0.8) + 4, rx: 6, fill: i === 0 ? '#eaf4ec' : '#f4f4f4' }, g);
        L.text(g, i === 0 ? 'validated' : 'compiled only', XI, y, { anchor: 'start', size: 10.5, fill: i === 0 ? L.GREEN : L.DIM, weight: 600 });
        y += RH * 0.8;
      }
      L.text(g, r[0], XI, y, { size: 12.5, mono: true, anchor: 'start', weight: r[5] ? 700 : 400 });
      [[XSQ, r[1]], [XSG, r[2]], [XEQ, r[3]], [XEG, r[4]]].forEach(([x, v]) => L.text(g, v, x, y, { size: 12.5, mono: true, anchor: 'end', fill: v === '—' ? L.GRAY : L.INK }));
      y += RH;
    });
    L.text(root, 'pre-decomposition, before FT overhead', 425, y + 2, { size: 10, fill: L.DIM, anchor: 'middle', italic: true });
    const cap = L.el('g', { class: 'step' }, root);
    L.text(cap, 'Small cases checked against enumeration; larger cases compiled for resource counts', 380, y + 26, { size: 13, weight: 700, fill: L.ORANGE });
  };

  document.querySelectorAll('svg.swayq-fig').forEach((svg) => {
    const root = L.el('g', {}, svg);
    const q = svg.dataset.q;
    if (q === '1') q1(svg, root); else if (q === '2') q2(svg, root); else q3(svg, root);
  });
})();
