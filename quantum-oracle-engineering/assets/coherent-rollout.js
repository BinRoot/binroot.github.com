// coherent-rollout.js -- slide 6: a coherent rollout keeps every branch.
//
// Slide 5's picture again: the same stone, the same game tree, the same
// horizon wall.  This time nothing is drawn one future at a time.  The
// whole tree is lit, level by level from the root, as one state: each edge
// is tinted by the share of leaves beneath it that pay 1 (blue) rather than
// 0 (grey), the amplitude spread over the tree.  No branch is readable; the
// notes say so, because "every branch at once" is the parallelism cartoon.  At the horizon the leaves pour into a
// single payoff qubit whose two wedges are the amplitudes.  No coin drops;
// nothing is measured.  Then the whole tree goes dark from the leaves back to
// the root: that is A-dagger, the same operation reversed, which is what the
// access contract will demand.  The dice on the axis are the randomness,
// held in registers rather than rolled and thrown away.
(function () {
  const svg = document.getElementById('coherent-rollout-fig');
  if (!svg) return;
  const L = window.L2;
  const root = L.el('g', {}, svg);
  const H = 5, X0 = 70, X1 = 520, AXY = 250, YTOP = 42, YBOT = 238;
  const dx = (X1 - X0) / H;

  // axis, horizon, tree, stone: as on slide 5
  L.el('line', { x1: X0 - 10, y1: AXY, x2: X1 + 18, y2: AXY, stroke: L.RULE, 'stroke-width': 1.5 }, root);
  for (let h = 0; h <= H; h++) L.el('line', { x1: X0 + h * dx, y1: AXY - 5, x2: X0 + h * dx, y2: AXY + 5, stroke: L.RULE, 'stroke-width': 1.5 }, root);
  L.el('line', { x1: X1, y1: 30, x2: X1, y2: AXY, stroke: L.RULE, 'stroke-width': 1.5, 'stroke-dasharray': '6 5' }, root);
  L.text(root, 'H', X1, 16, { size: 17, mono: true, fill: L.DIM });
  // the randomness lives in registers: one coherent die per step, on the axis
  for (let h = 0; h < H; h++) {
    const g = L.die(root, X0 + (h + 0.5) * dx, AXY + 22, 10, null, { fill: '#f3e8ff', stroke: L.PURPLE });
    g.firstChild.setAttribute('stroke-dasharray', '3 2');
  }
  const T = L.gameTree(root, { H, X0, X1, YTOP, YBOT });
  const YMID = T.YMID;

  // every branch at once: one lit edge per tree edge, tinted by amplitude
  const edges = [];
  for (let h = 1; h <= H; h++) for (let i = 0; i < Math.pow(2, h); i++) {
    const x1 = T.nodeX(h - 1), y1 = T.nodeY(h - 1, i >> 1), x2 = T.nodeX(h), y2 = T.nodeY(h, i);
    const el = L.el('line', { x1, y1, x2: x1, y2: y1, stroke: L.mix(L.GRAY, L.BLUE, T.frac[h][i]),
      'stroke-width': h === H ? 2 : 2.6, 'stroke-linecap': 'round', opacity: 0 }, root);
    edges.push({ h, x1, y1, x2, y2, el });
  }
  L.el('circle', { cx: X0, cy: YMID, r: 20, fill: 'none', stroke: L.ORANGE, 'stroke-width': 2.5, opacity: 0.85 }, root);
  L.stone(root, X0, YMID, 13, 1);

  // the payoff qubit at the horizon: two wedges, the amplitudes
  const a = T.a;
  const QX = X1 + 92, QY = YMID, QR = 34;
  const qubit = L.el('g', { opacity: 0 }, root);
  L.el('circle', { cx: QX, cy: QY, r: QR, fill: '#fff', stroke: L.INK, 'stroke-width': 2 }, qubit);
  const ang = 2 * Math.PI * a;
  const arc = (from, to, color) => {
    const x1 = QX + QR * Math.cos(from), y1 = QY + QR * Math.sin(from);
    const x2 = QX + QR * Math.cos(to), y2 = QY + QR * Math.sin(to);
    const large = to - from > Math.PI ? 1 : 0;
    L.el('path', { d: `M ${QX} ${QY} L ${x1} ${y1} A ${QR} ${QR} 0 ${large} 1 ${x2} ${y2} Z`, fill: color, opacity: 0.85 }, qubit);
  };
  arc(-Math.PI / 2, -Math.PI / 2 + ang, L.BLUE);
  arc(-Math.PI / 2 + ang, 3 * Math.PI / 2, L.GRAY);
  L.el('circle', { cx: QX, cy: QY, r: QR, fill: 'none', stroke: L.INK, 'stroke-width': 2 }, qubit);
  // every leaf converging on it
  const conv = T.leafBit.map((b, i) => L.el('line', { x1: X1, y1: T.nodeY(H, i), x2: QX - QR, y2: QY + (b ? -10 : 10),
    stroke: b ? L.BLUE : L.GRAY, 'stroke-width': 1, opacity: 0 }, root));
  const glow = L.el('circle', { cx: QX, cy: QY, r: QR, fill: 'none', stroke: L.GOLD, 'stroke-width': 6, opacity: 0 }, root);

  // the operator label: A forward, A-dagger backward
  const opLab = L.text(root, 'A', 380, 24, { size: 30, mono: true, weight: 700 });

  const draw = (prog) => {
    edges.forEach((e) => {
      const f = L.clamp01(prog - (e.h - 1));
      e.el.setAttribute('opacity', f > 0 ? 0.9 : 0);
      e.el.setAttribute('x2', L.lerp(e.x1, e.x2, f)); e.el.setAttribute('y2', L.lerp(e.y1, e.y2, f));
    });
  };
  // 0-2.4 unfold · 2.4-3.6 hold, qubit lit · 3.6-6.0 retract (A-dagger) · 6.0-7.0 rest
  const T7 = 7;
  const setState = (t) => {
    let prog, back = false;
    if (t < 2.4) prog = H * L.ease(t / 2.4);
    else if (t < 3.6) prog = H;
    else if (t < 6.0) { prog = H * (1 - L.ease((t - 3.6) / 2.4)); back = true; }
    else { prog = 0; back = true; }
    draw(prog);
    const arrived = prog >= H - 1e-6 ? 1 : 0;
    const q = t < 3.6 ? L.win(t, 2.3, 0.5) : 1 - L.win(t, 3.6, 0.5);
    qubit.setAttribute('opacity', q);
    conv.forEach((c) => c.setAttribute('opacity', 0.5 * q));
    glow.setAttribute('opacity', arrived ? 0.7 * (0.6 + 0.4 * Math.sin(t * 5)) : 0);
    opLab.textContent = back ? 'A†' : 'A';
    opLab.setAttribute('fill', back ? L.BLUE : L.INK);
    opLab.setAttribute('opacity', t >= 6.0 && t < 7 ? 1 - L.win(t, 6.4, 0.5) : 1);
  };
  L.timeline(svg, { T: T7, setState, loop: true, still: 3.0 });
})();
