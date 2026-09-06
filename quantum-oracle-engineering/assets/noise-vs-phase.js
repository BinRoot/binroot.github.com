// noise-vs-phase.js -- slide 10: the two accumulation laws, one slider.
//
// Left: two independent-sample estimates for means 1/2 and 1/2 + eps, drawn
// as confidence bands that narrow like 1/sqrt(M) and only stop overlapping
// near M = 1/eps^2.  Right: two accumulated phases that drift apart linearly
// in M and separate near M = 1/eps.  One slider for M drives both; the
// instructor drags it once and the room watches the right side pull away.
// Reduced motion: the slider still works, nothing animates on its own.
(function () {
  const svg = document.getElementById('noise-vs-phase-fig');
  if (!svg) return;
  const L = window.L2;
  const root = L.el('g', {}, svg);
  const EPS = 0.1;                     // visual epsilon: separation at M = 100 (left) and M = 10 (right)
  const M_MAX = 400;

  // ── left panel: confidence bands ───────────────────────────────────
  const LX = 40, LW = 300, AXY0 = 236, AXY1 = 56;         // value axis 0..1
  const vy = (p) => L.lerp(AXY0, AXY1, p);
  L.text(root, 'independent samples', LX + LW / 2, 30, { size: 14, fill: L.DIM, weight: 600 });
  L.el('line', { x1: LX, y1: AXY0, x2: LX, y2: AXY1, stroke: L.RULE, 'stroke-width': 1.5 }, root);
  [[0, '0'], [0.5, '½'], [1, '1']].forEach(([p, s]) => {
    L.el('line', { x1: LX - 4, y1: vy(p), x2: LX + 4, y2: vy(p), stroke: L.RULE }, root);
    L.text(root, s, LX - 14, vy(p), { size: 11, fill: L.DIM });
  });
  const bandA = L.el('rect', { x: LX + 40, width: 100, rx: 4, fill: L.GRAY, opacity: 0.45 }, root);
  const bandB = L.el('rect', { x: LX + 170, width: 100, rx: 4, fill: L.BLUE, opacity: 0.4 }, root);
  const meanA = L.el('line', { x1: LX + 40, x2: LX + 140, stroke: L.GRAY, 'stroke-width': 2.5 }, root);
  const meanB = L.el('line', { x1: LX + 170, x2: LX + 270, stroke: L.BLUE, 'stroke-width': 2.5 }, root);
  L.text(root, '½', LX + 90, AXY0 + 16, { size: 12, fill: L.GRAY, mono: true });
  L.text(root, '½ + ε', LX + 220, AXY0 + 16, { size: 12, fill: L.BLUE, mono: true });
  const sepL = L.text(root, 'overlapping', LX + LW / 2, AXY0 + 36, { size: 13, fill: L.RED, weight: 600 });

  // ── right panel: accumulated phase ─────────────────────────────────
  const RX = 420, RW = 300;
  L.text(root, 'coherent phase', RX + RW / 2, 30, { size: 14, fill: L.BLUE, weight: 600 });
  L.el('line', { x1: RX, y1: AXY0, x2: RX, y2: AXY1, stroke: L.RULE, 'stroke-width': 1.5 }, root);
  L.text(root, 'phase', RX - 14, (AXY0 + AXY1) / 2, { size: 11, fill: L.DIM });
  const barA = L.el('rect', { x: RX + 40, width: 100, rx: 4, fill: L.GRAY, opacity: 0.7 }, root);
  const barB = L.el('rect', { x: RX + 170, width: 100, rx: 4, fill: L.BLUE, opacity: 0.8 }, root);
  const gapBr = L.el('path', { fill: 'none', stroke: L.ORANGE, 'stroke-width': 2 }, root);
  const gapLab = L.text(root, 'M·ε', RX + 155, 0, { size: 12, fill: L.ORANGE, mono: true });
  L.text(root, 'M·θ', RX + 90, AXY0 + 16, { size: 12, fill: L.GRAY, mono: true });
  L.text(root, 'M·(θ+ε)', RX + 220, AXY0 + 16, { size: 12, fill: L.BLUE, mono: true });
  const sepR = L.text(root, 'overlapping', RX + RW / 2, AXY0 + 36, { size: 13, fill: L.RED, weight: 600 });

  // ── slider ─────────────────────────────────────────────────────────
  const SX0 = 230, SX1 = 530, SY = 296;
  const sl = L.el('g', { class: 'no-nav' }, root);
  L.el('line', { x1: SX0, y1: SY, x2: SX1, y2: SY, stroke: L.RULE, 'stroke-width': 4, 'stroke-linecap': 'round' }, sl);
  const knob = L.el('circle', { cx: SX0, cy: SY, r: 10, fill: '#fff', stroke: L.INK, 'stroke-width': 2, cursor: 'ew-resize' }, sl);
  const mLab = L.text(root, 'M = 1 query', 380, SY - 20, { size: 14, mono: true, weight: 700 });
  L.text(root, '1', SX0 - 16, SY, { size: 11, fill: L.DIM }); L.text(root, String(M_MAX), SX1 + 22, SY, { size: 11, fill: L.DIM });

  const setM = (M) => {
    M = Math.max(1, Math.min(M_MAX, M));
    // left: half-width ~ 1/sqrt(M) scaled so bands touch at M = 1/eps^2
    // one-sigma half-width of a Bernoulli(1/2) mean, 0.5 / sqrt(M): the bands
    // touch when 0.5 / sqrt(M) = eps / 2, i.e. at M = 1 / eps^2
    const half = 0.5 / Math.sqrt(M);
    const hw = Math.min(0.45, half);
    [[bandA, meanA, 0.5], [bandB, meanB, 0.5 + EPS]].forEach(([band, mean, p]) => {
      band.setAttribute('y', vy(Math.min(1, p + hw))); band.setAttribute('height', Math.max(1, vy(p - hw) - vy(p + hw)));
      mean.setAttribute('y1', vy(p)); mean.setAttribute('y2', vy(p));
    });
    const sepLeft = hw <= EPS / 2;
    sepL.textContent = sepLeft ? 'separated' : 'overlapping';
    sepL.setAttribute('fill', sepLeft ? L.GREEN : L.RED);
    // right: heights grow linearly; gap = M*eps; separated when gap >= 1 unit (M >= 1/eps)
    const unit = (AXY0 - AXY1) / (M_MAX * EPS * 1.15);        // px per unit of phase
    const hA = Math.min(AXY0 - AXY1, M * 0.5 * unit * 0.2), hB = Math.min(AXY0 - AXY1, hA + M * EPS * unit);
    barA.setAttribute('y', AXY0 - hA); barA.setAttribute('height', hA);
    barB.setAttribute('y', AXY0 - hB); barB.setAttribute('height', hB);
    gapBr.setAttribute('d', `M ${RX + 145} ${AXY0 - hA} h 12 M ${RX + 145} ${AXY0 - hB} h 12 M ${RX + 151} ${AXY0 - hA} V ${AXY0 - hB}`);
    gapLab.setAttribute('y', AXY0 - (hA + hB) / 2); gapLab.setAttribute('x', RX + 158 - 26);
    gapLab.setAttribute('opacity', hB - hA > 14 ? 1 : 0);
    const sepRight = M * EPS >= 1;
    sepR.textContent = sepRight ? 'separated' : 'overlapping';
    sepR.setAttribute('fill', sepRight ? L.GREEN : L.RED);
    knob.setAttribute('cx', L.lerp(SX0, SX1, Math.log(M) / Math.log(M_MAX)));
    mLab.textContent = `M = ${Math.round(M)} ${M < 1.5 ? 'query' : 'queries'}`;
  };
  setM(1);

  // dragging: log scale
  let dragging = false;
  const toM = (clientX) => {
    const pt = svg.createSVGPoint(); pt.x = clientX; pt.y = SY;
    const p = pt.matrixTransform(svg.getScreenCTM().inverse());
    const u = L.clamp01((p.x - SX0) / (SX1 - SX0));
    return Math.exp(u * Math.log(M_MAX));
  };
  sl.addEventListener('pointerdown', (e) => { dragging = true; setM(toM(e.clientX)); e.stopPropagation(); });
  window.addEventListener('pointermove', (e) => { if (dragging) setM(toM(e.clientX)); });
  window.addEventListener('pointerup', () => { dragging = false; });
  // keyboard nudges while the slide is current: [ and ]
  let M = 1;
  document.addEventListener('keydown', (e) => {
    if (!L.isCurrent(svg)) return;
    if (e.key === ']') { M = Math.min(M_MAX, M * 1.5); setM(M); e.preventDefault(); }
    if (e.key === '[') { M = Math.max(1, M / 1.5); setM(M); e.preventDefault(); }
  });
})();
