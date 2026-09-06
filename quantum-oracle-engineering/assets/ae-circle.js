// ae-circle.js -- slides 7 to 11: the amplitude-estimation mechanism on one
// shared coordinate system.
//
// The quarter-circle (|bad> horizontal, |good> vertical) sits at the same
// place on all four slides, so the state vector visibly persists while the
// right-hand panel changes:
//
//   data-stage="1"  a probability becomes an angle: the vector settles at
//                   theta and a = sin^2(theta) is read off the vertical drop
//   data-stage="2"  two reflections make a rotation: reflect about |bad>,
//                   then about the prepared state, land at 3 theta; beside
//                   it the same thing as gates, Q = -A S0 A-dagger S_good,
//                   with the worked case a = 1/4 one press away
//   data-stage="3"  Q, Q^2, Q^4 as longer and longer arcs, each from a fresh
//                   preparation, followed by a payoff measurement
//   data-stage="4"  the register continues into an inverse QFT and meters;
//                   interference piles the phase into one peak on a ruler
//
// Worked angle throughout: theta = pi/6, so a = 1/4, and one Q lands on pi/2.
(function () {
  if (window.__aeInit) return;
  window.__aeInit = true;
  const L = window.L2;
  const TH = Math.PI / 6;
  // Slides 10 and 12 shrink to a small angle first: at 30 degrees every turn
  // adds 60 and the arcs wrap the circle, which is the opposite of the point.
  // At 10 degrees (a about 0.03) one, two and four turns land on 30, 50 and 90.
  const TH3 = Math.PI / 18;
  const C = { cx: 190, cy: 166, R: 118 };   // a full circle fits (slide 11), and so does a reflection below the axis (slide 9)

  const init = (svg) => {
    const stage = +svg.dataset.stage || 1;
    const root = L.el('g', {}, svg);
    const q = L.quarter(root, C);
    const stateVec = q.vector(TH);
    const thetaArc = q.arc(0, TH, 40, { color: L.INK, width: 2 });
    const thetaLab = L.text(root, 'θ', C.cx + 54, C.cy - 13, { size: 18, italic: true, serif: true });

    if (stage === 1) return stage1(svg, root, q, stateVec, thetaArc, thetaLab);
    if (stage === 2) return stage2(svg, root, q, stateVec);
    if (stage === 3) return stage3(svg, root, q, stateVec, thetaArc, thetaLab);
    return stage4(svg, root, q, stateVec, thetaArc, thetaLab);
  };

  // ── 8. A probability becomes an angle ───────────────────────────────
  // Left: the state vector settles at theta on the shared quarter-circle; its
  // two components light up with their values.  Right: the payoff qubit from
  // slide 7, one quarter blue.  Same blue on both sides says the rest: the
  // pie's blue share is a, the vector's height is root a.  Words on screen
  // are kept to axis names and three numbers; the notes carry the argument.
  const stage1 = (svg, root, q, vec, arc, lab) => {
    const tipX = () => C.cx + C.R * Math.cos(TH), tipY = () => C.cy - C.R * Math.sin(TH);
    // the whole unit circle, faint and dashed as on slide 9: every state sits
    // on it, and it fills the lower half of the shared canvas
    const unit = L.el('circle', { cx: C.cx, cy: C.cy, r: C.R, fill: 'none', stroke: L.FAINT, 'stroke-width': 1.2, 'stroke-dasharray': '3 4', opacity: 0 }, root);
    root.insertBefore(unit, q.g);
    // the axes, in words
    L.text(root, 'winning branches', C.cx + 10, C.cy - C.R - 12, { anchor: 'start', size: 13, fill: L.DIM });
    L.text(root, 'losing branches', C.cx + C.R + 26, C.cy + 20, { anchor: 'start', size: 13, fill: L.DIM });
    // the two components of the state
    const drop = L.el('line', { x1: tipX(), y1: tipY(), x2: tipX(), y2: C.cy, stroke: L.BLUE, 'stroke-width': 1.5, 'stroke-dasharray': '4 3', opacity: 0 }, root);
    const proj = L.el('line', { x1: C.cx, y1: tipY(), x2: tipX(), y2: tipY(), stroke: L.BLUE, 'stroke-width': 1.5, 'stroke-dasharray': '4 3', opacity: 0 }, root);
    const amp = L.el('line', { x1: C.cx, y1: C.cy, x2: C.cx, y2: tipY(), stroke: L.BLUE, 'stroke-width': 7, 'stroke-linecap': 'round', opacity: 0 }, root);
    const ampLab = L.text(root, '√a = ½', C.cx - 16, (C.cy + tipY()) / 2, { anchor: 'end', size: 17, fill: L.BLUE, mono: true, weight: 700, opacity: 0 });
    const base = L.el('line', { x1: C.cx, y1: C.cy, x2: tipX(), y2: C.cy, stroke: L.GRAY, 'stroke-width': 7, 'stroke-linecap': 'round', opacity: 0 }, root);
    const baseLab = L.text(root, '√(1−a)', (C.cx + tipX()) / 2, C.cy + 22, { size: 14, fill: L.GRAY, mono: true, opacity: 0 });

    // Right: the payoff qubit from slide 7, a quarter blue.  Its diameter is
    // the quarter-circle's radius and it hangs between the arc's top and the
    // axis, so the two figures share their top and bottom edges; its captions
    // sit on the same rows as the |good> label above and the root(1-a) label
    // below.
    const PR = C.R / 2, PX = 590, PY = C.cy - PR, A = Math.sin(TH) * Math.sin(TH);
    const pie = L.el('g', { opacity: 0 }, root);
    L.text(pie, 'the payoff qubit', PX, C.cy - C.R - 30, { size: 14, fill: L.DIM });
    L.el('circle', { cx: PX, cy: PY, r: PR, fill: L.GRAY, opacity: 0.85 }, pie);
    const a0 = -Math.PI / 2, a1 = a0 + 2 * Math.PI * A;
    L.el('path', { d: `M ${PX} ${PY} L ${PX + PR * Math.cos(a0)} ${PY + PR * Math.sin(a0)} A ${PR} ${PR} 0 0 1 ${PX + PR * Math.cos(a1)} ${PY + PR * Math.sin(a1)} Z`, fill: L.BLUE }, pie);
    L.el('circle', { cx: PX, cy: PY, r: PR, fill: 'none', stroke: L.INK, 'stroke-width': 2 }, pie);
    L.text(pie, 'P(win) = a = ¼', PX, C.cy + 22, { size: 18, mono: true, weight: 700 });

    const setState = (t) => {
      pie.setAttribute('opacity', L.win(t, 0.1, 0.5));
      unit.setAttribute('opacity', L.win(t, 2.0, 0.6));
      const u = L.win(t, 0.6, 1.4, L.outQuart);
      const th = TH * u;
      vec.setTheta(th);
      arc.setArc(0, th);
      lab.setAttribute('opacity', L.win(t, 1.7, 0.3));
      const o = L.win(t, 2.1, 0.4);
      drop.setAttribute('opacity', o); proj.setAttribute('opacity', o);
      const b = L.win(t, 2.5, 0.4);
      base.setAttribute('opacity', 0.7 * b); baseLab.setAttribute('opacity', b);
      const g = L.win(t, 2.9, 0.4);
      amp.setAttribute('opacity', g); ampLab.setAttribute('opacity', g);
    };
    L.timeline(svg, { T: 3.8, setState });
  };

  // ── 9. Two reflections make a rotation ──────────────────────────────
  // The circle carries the whole argument: the state at theta; its mirror
  // image below the axis after the first reflection (the axis itself flashes
  // as the mirror); then the second reflection about the prepared state
  // carries it to three theta, which for the worked angle is the good axis
  // exactly.  A gold arc marks the net rotation, two theta.  The gate strip
  // on the right is set in the same serif as the equation, with A-dagger in
  // blue, because that inverse is the operation the access contract needs.
  const stage2 = (svg, root, q, vec) => {
    // the mirror image lives below the axis, so draw the lower half faintly
    const lower = L.el('path', { d: `M ${C.cx + C.R} ${C.cy} A ${C.R} ${C.R} 0 0 1 ${C.cx + C.R * Math.cos(-2 * TH)} ${C.cy - C.R * Math.sin(-2 * TH)}`,
      fill: 'none', stroke: L.FAINT, 'stroke-width': 1.2, 'stroke-dasharray': '3 4' }, root);
    root.insertBefore(lower, q.g);
    const psiLine = L.el('line', { x1: C.cx - 26 * Math.cos(TH), y1: C.cy + 26 * Math.sin(TH), x2: C.cx + (C.R + 30) * Math.cos(TH), y2: C.cy - (C.R + 30) * Math.sin(TH),
      stroke: L.RULE, 'stroke-width': 1.5, 'stroke-dasharray': '5 4', opacity: 0 }, root);
    root.insertBefore(psiLine, q.g);   // under the quarter-circle group, so the vector stays a clean line
    const mirrorAxis = L.el('line', { x1: C.cx - 24, y1: C.cy, x2: C.cx + C.R + 30, y2: C.cy, stroke: L.GOLD, 'stroke-width': 6, opacity: 0, 'stroke-linecap': 'round' }, root);
    const mirrorPsi = L.el('line', { x1: C.cx, y1: C.cy, x2: C.cx + (C.R + 30) * Math.cos(TH), y2: C.cy - (C.R + 30) * Math.sin(TH), stroke: L.GOLD, 'stroke-width': 6, opacity: 0, 'stroke-linecap': 'round' }, root);
    const ghost = q.vector(TH, { color: L.GRAY, width: 2.5, dot: 4.5, opacity: 0 });
    const result = q.vector(TH, { color: L.BLUE, width: 3.5, dot: 6, opacity: 0 });
    const rot = q.arc(TH, TH, 86, { color: L.GOLD, width: 7, opacity: 0.95 });
    const rotLab = L.text(root, '2θ', C.cx + 62, C.cy - 98, { size: 19, italic: true, serif: true, fill: L.ORANGE, opacity: 0 });

    // the gate strip, typeset like the equation
    const GX = 392, GY = 78, BW = 48, GAP = 12;
    const gates = [
      { base: 'A' },
      { gap: true },
      { base: 'S', sub: 'good' },
      { base: 'A', sup: '†', blue: true },
      { base: 'S', sub: '0' },
      { base: 'A' }
    ];
    let x = GX;
    const boxes = [];
    L.el('line', { x1: GX - 26, y1: GY, x2: GX + 5 * BW + 4 * GAP + 26 + 18, y2: GY, stroke: L.WIRE, 'stroke-width': 1.5 }, root);
    L.text(root, '|0⟩', GX - 32, GY, { anchor: 'end', size: 14, mono: true, fill: L.DIM });
    gates.forEach((g) => {
      if (g.gap) { x += 18; return; }
      const node = L.el('g', {}, root);
      L.el('rect', { x, y: GY - 19, width: BW, height: 38, rx: 6, fill: '#fff', stroke: g.blue ? L.BLUE : L.INK, 'stroke-width': g.blue ? 2 : 1.5 }, node);
      const t = L.el('text', { x: x + BW / 2, y: GY, 'text-anchor': 'middle', 'dominant-baseline': 'middle', fill: g.blue ? L.BLUE : L.INK,
        'font-family': 'Georgia, "Times New Roman", serif', 'font-size': 20, 'font-style': 'italic' }, node);
      const b = L.el('tspan', {}, t); b.textContent = g.base;
      if (g.sub) { const sb = L.el('tspan', { 'baseline-shift': 'sub', 'font-size': 12, 'font-style': 'normal' }, t); sb.textContent = g.sub; }
      if (g.sup) { const sp = L.el('tspan', { 'baseline-shift': 'super', 'font-size': 13, 'font-style': 'normal' }, t); sp.textContent = g.sup; }
      boxes.push({ node, x, g });
      x += BW + GAP;
    });
    // bracket under the four gates that make one iterate
    const bx0 = boxes[1].x - 4, bx1 = boxes[4].x + BW + 4;
    L.el('path', { d: `M ${bx0} ${GY + 30} v 8 H ${bx1} v -8`, fill: 'none', stroke: L.INK, 'stroke-width': 1.4 }, root);
    L.text(root, 'Q', (bx0 + bx1) / 2, GY + 56, { size: 20, italic: true, serif: true });
    const glow = L.el('rect', { x: boxes[2].x - 5, y: GY - 24, width: BW + 10, height: 48, rx: 9, fill: L.BLUE, opacity: 0 }, root);
    root.insertBefore(glow, boxes[2].node);

    // the worked case, one press away: the angle drawn IS the worked case
    const worked = L.el('g', { class: 'step' }, root);
    L.el('rect', { x: 430, y: 176, width: 290, height: 82, rx: 12, fill: '#fff', stroke: L.RULE, 'stroke-width': 1.3 }, worked);
    L.text(worked, 'a = ¼ ,  θ = 30°', 575, 204, { size: 19, italic: true, serif: true });
    L.text(worked, 'one Q lands on |good⟩', 575, 236, { size: 16, serif: true, fill: L.BLUE });

    const setState = (t) => {
      // beat 1 (0.4-1.4): the axis is the mirror; the ghost swings to -theta
      const u1 = L.win(t, 0.4, 1.0);
      mirrorAxis.setAttribute('opacity', t > 0.3 && t < 1.6 ? 0.55 : 0);
      ghost.setAttribute('opacity', t > 0.4 && t < 3.1 ? 1 : 0);
      ghost.setTheta(L.lerp(TH, -TH, u1));
      // beat 2 (1.9-3.0): the prepared state is the mirror; -theta swings to 3 theta
      psiLine.setAttribute('opacity', t > 1.7 ? 1 : 0);
      mirrorPsi.setAttribute('opacity', t > 1.8 && t < 3.2 ? 0.55 : 0);
      const u2 = L.win(t, 1.9, 1.1);
      if (t > 1.9) ghost.setTheta(L.lerp(-TH, 3 * TH, u2));
      result.setAttribute('opacity', t > 3.1 ? 1 : 0);
      result.setTheta(3 * TH);
      // the net rotation
      const u3 = L.win(t, 3.2, 0.8);
      rot.setArc(TH, TH + 2 * TH * u3);
      rotLab.setAttribute('opacity', L.win(t, 3.8, 0.3));
      glow.setAttribute('opacity', t > 1.9 && t < 3.2 ? 0.16 : 0);
    };
    L.timeline(svg, { T: 4.4, setState, still: 4.4 });
  };

  // ── 9. Let the phase accumulate ─────────────────────────────────────
  const stage3 = (svg, root, q, vec, arc, lab) => {
    const POW = [1, 2, 4];
    const small = L.text(root, 'a small angle now: θ = 10°, a ≈ 0.03', C.cx + 6, C.cy + 24, { anchor: 'start', size: 13, fill: L.DIM, opacity: 0 });
    const full = L.el('circle', { cx: C.cx, cy: C.cy, r: C.R, fill: 'none', stroke: L.FAINT, 'stroke-width': 1.2, 'stroke-dasharray': '3 4' }, root);
    root.insertBefore(full, q.g);
    const arcs = POW.map((p, i) => q.arc(TH, TH, 66 + i * 18, { color: [L.GOLD, L.ORANGE, L.BLUE][i], width: 7, opacity: 0.85 }));
    const COLS = [L.GOLD, L.ORANGE, L.BLUE];
    const labs = POW.map((p, i) => L.mathText(root, 0, 0, { base: 'Q', sup: i === 0 ? '' : String(p) }, { size: 18, fill: [L.ORANGE, L.ORANGE, L.BLUE][i] }));
    labs.forEach((t) => t.setAttribute('opacity', 0));
    const lands = POW.map((p, i) => L.el('circle', { r: 5, fill: COLS[i], stroke: '#fff', 'stroke-width': 1.5, opacity: 0 }, root));
    // odometer
    const odo = L.text(root, '0', 600, 250, { size: 40, serif: true, weight: 700 });
    L.text(root, 'turns of Q, one A and one A† each', 600, 282, { size: 12.5, fill: L.DIM, serif: true, italic: true });
    const odoSub = L.text(root, '', 600, 216, { size: 14, serif: true, fill: L.DIM });
    // Independent circuits prepare the same state, apply Q repeatedly, and
    // measure the payoff. The Fourier readout's controlled register is stage 4.
    L.text(root, 'fresh preparation for each circuit', 580, 22, { size: 13, fill: L.DIM });
    const qops = POW.map((p, i) => {
      const row = L.el('g', {}, root);
      L.circuit(row, {
        x: 396, y: 62 + i * 48, colW: 64, rowH: 36, labelW: 46, fontSize: 13, serif: true,
        wires: [{ label: '|0⟩', bundle: true }],
        ops: [
          { t: 'box', w: [0], math: { base: 'A' }, bw: 38 },
          { t: 'box', w: [0], math: { base: 'Q', sup: p === 1 ? '' : String(p) }, bw: 38 },
          { t: 'meas', w: 0 }
        ]
      });
      return row;
    });
    qops.forEach((n) => n.setAttribute('opacity', 0.25));

    const setState = (t) => {
      // first beat: the worked angle shrinks from 30 to 10 degrees
      const sh = L.win(t, 0.1, 0.8, L.ease);
      const th = L.lerp(TH, TH3, sh);
      vec.setTheta(th); arc.setArc(0, th);
      lab.setAttribute('opacity', 1 - sh);
      small.setAttribute('opacity', L.win(t, 0.5, 0.5));
      let total = 0;
      POW.forEach((p, i) => {
        const t0 = 1.2 + i * 1.1;
        const u = L.win(t, t0, 0.9, L.outQuart);
        const b = TH3 + 2 * TH3 * p * u;
        arcs[i].setArc(TH3, b);
        const r = 66 + i * 18, mid = (TH + b) / 2 + 0.12;
        labs[i].setAttribute('x', C.cx + (r - 16) * Math.cos(mid));
        labs[i].setAttribute('y', C.cy - (r - 16) * Math.sin(mid));
        labs[i].setAttribute('opacity', t > t0 + 0.3 ? 1 : 0);
        lands[i].setAttribute('cx', C.cx + r * Math.cos(b)); lands[i].setAttribute('cy', C.cy - r * Math.sin(b));
        lands[i].setAttribute('opacity', u >= 1 ? 1 : 0);
        qops[i].setAttribute('opacity', t > t0 ? 1 : 0.25);
        total += Math.round(p * u);
      });
      odo.textContent = String(total);
      odoSub.textContent = total === 7 ? '1 + 2 + 4' : '';
    };
    L.timeline(svg, { T: 5.0, setState });
  };

  // ── 10. Interference turns phase into bits ──────────────────────────
  const stage4 = (svg, root, q, vec, arc, lab) => {
    vec.setTheta(TH3); arc.setArc(0, TH3); lab.setAttribute('opacity', 0);
    L.text(root, 'θ = 10°, a ≈ 0.03', C.cx + 6, C.cy + 24, { anchor: 'start', size: 13, fill: L.DIM });
    const circ = L.circuit(root, {
      x: 366, y: 40, colW: 35, rowH: 36, labelW: 40, fontSize: 12, serif: true,
      wires: ['|0⟩', '|0⟩', '|0⟩', { label: 'A|0⟩', bundle: true }],
      ops: [
        { t: 'h', w: 0 }, { t: 'h', w: 1 }, { t: 'h', w: 2 },
        { t: 'cbox', c: 0, w: [3], math: { base: 'Q' }, bw: 30, size: 15 },
        { t: 'cbox', c: 1, w: [3], math: { base: 'Q', sup: '2' }, bw: 30, size: 15 },
        { t: 'cbox', c: 2, w: [3], math: { base: 'Q', sup: '4' }, bw: 30, size: 15 },
        { t: 'box', w: [0, 2], math: { base: 'QFT', sup: '†', upright: true }, bw: 34, size: 12, fill: '#eef2fb', stroke: L.BLUE, ink: L.BLUE, cls: 'qft' },
        { t: 'meas', w: 0 }, { t: 'meas', w: 1 }, { t: 'meas', w: 2 }
      ]
    });
    circ.ops[6].node.setAttribute('opacity', 0.25);
    [7, 8, 9].forEach((k) => circ.ops[k].node.setAttribute('opacity', 0.25));
    // the ruler: 8 bins for 3 bits, peak at the bin nearest 2*theta/(2 pi) * 8 = 8/18 ~ 0.44
    const RX = 400, RY = 236, RW = 320, BINS = 8;
    L.el('line', { x1: RX, y1: RY, x2: RX + RW, y2: RY, stroke: L.INK, 'stroke-width': 1.5 }, root);
    for (let b = 0; b <= BINS; b++) {
      L.el('line', { x1: RX + b * RW / BINS, y1: RY, x2: RX + b * RW / BINS, y2: RY + 6, stroke: L.INK }, root);
    }
    L.text(root, '0', RX, RY + 20, { size: 11, fill: L.DIM }); L.text(root, 'phase', RX + RW / 2, RY + 22, { size: 11, fill: L.DIM });
    L.text(root, '1', RX + RW, RY + 20, { size: 11, fill: L.DIM });
    const target = TH3 / Math.PI;                // 2 theta / 2 pi
    const bars = [];
    for (let b = 0; b < BINS; b++) {
      const center = (b + 0.5) / BINS;
      const d = Math.abs(center - target) * BINS;
      const amp = d < 1e-6 ? 1 : Math.pow(Math.sin(Math.PI * d) / (BINS * Math.sin(Math.PI * d / BINS)), 2);
      bars.push({ node: L.el('rect', { x: RX + b * RW / BINS + 4, y: RY, width: RW / BINS - 8, height: 0, fill: L.BLUE, opacity: 0.85 }, root), h: amp * 62 });
    }
    const readout = L.text(root, 'read θ, then a = sin²θ', RX + RW / 2, 286, { size: 17, italic: true, serif: true, opacity: 0 });
    const flat = 62 / BINS;

    const setState = (t) => {
      const before = L.win(t, 0.2, 0.6), after = L.win(t, 1.4, 1.2, L.outQuart);
      bars.forEach((b) => {
        const h = L.lerp(flat * before, b.h, after);
        b.node.setAttribute('y', RY - h); b.node.setAttribute('height', h);
      });
      circ.ops[6].node.setAttribute('opacity', t > 1.2 ? 1 : 0.25);
      [7, 8, 9].forEach((k) => circ.ops[k].node.setAttribute('opacity', t > 2.4 ? 1 : 0.25));
      readout.setAttribute('opacity', L.win(t, 2.6, 0.4));
    };
    L.timeline(svg, { T: 3.4, setState });
  };

  document.querySelectorAll('svg.ae-fig').forEach(init);
})();
