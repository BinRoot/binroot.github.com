// scorecard.js -- slide 24 (the Go card is no longer used): a compact three-gate scorecard for one
// candidate.
//
// Three gate boxes in a row, one per question, with the candidate's tile
// entering from the left and stopping at the gate that says no.  Gates the
// tile never reaches grey out.
//
//   data-candidate="go"      Q1 no  (solver dice, and stronger solvers removed them)
//   data-candidate="bandit"  Q1 yes · Q2 yes on close instances · Q3 no
//                            (wrong access; classical pull is cheap), with a
//                            small green theorem card kept intact beside it
(function () {
  if (window.__scorecardInit) return;
  window.__scorecardInit = true;
  const L = window.L2;
  const Q = ['still sampling?', 'precision?', 'worth building?'];
  const VERDICT = {
    go: { answers: ['no', null, null], reasons: [['solver dice']] },
    bandit: { answers: ['yes', 'close only', 'no'], reasons: [null, null, ['missing A†', 'cheap pulls']], theorem: true }
  };
  const init = (svg) => {
    const who = svg.dataset.candidate;
    const V = VERDICT[who];
    const root = L.el('g', {}, svg);
    const GX = [230, 420, 610], GY = 110, GW = 150, GH = 90;
    const stopAt = V.answers.findIndex((a) => a === 'no');
    const gates = GX.map((x, i) => {
      const g = L.el('g', {}, root);
      L.el('rect', { x: x - GW / 2, y: GY - GH / 2, width: GW, height: GH, rx: 10, fill: '#fff', stroke: L.INK, 'stroke-width': 1.5 }, g);
      L.text(g, `Q${i + 1}`, x, GY - 22, { size: 12, fill: L.DIM, mono: true });
      L.text(g, Q[i], x, GY + 2, { size: 14, weight: 600 });
      const ans = L.text(g, '', x, GY + 28, { size: 15, weight: 700, mono: true, opacity: 0 });
      return { g, ans, x };
    });
    // belt
    L.el('line', { x1: 40, y1: GY + GH / 2 + 22, x2: 720, y2: GY + GH / 2 + 22, stroke: L.FAINT, 'stroke-width': 4 }, root);
    // tile
    const tile = L.el('g', {}, root);
    L.el('rect', { x: -22, y: -22, width: 44, height: 44, rx: 6, fill: '#fff', stroke: L.INK, 'stroke-width': 1.5 }, tile);
    if (who === 'go') {
      for (let i = -1; i <= 1; i++) { L.el('line', { x1: i * 10, y1: -14, x2: i * 10, y2: 14, stroke: L.WOODLINE }, tile); L.el('line', { x1: -14, y1: i * 10, x2: 14, y2: i * 10, stroke: L.WOODLINE }, tile); }
      L.stone(tile, -10, -10, 5, 1); L.stone(tile, 10, 10, 5, 2);
    } else {
      L.el('rect', { x: -14, y: -10, width: 28, height: 20, rx: 3, fill: 'none', stroke: L.INK, 'stroke-width': 1.3 }, tile);
      [-8, -2, 4].forEach((x) => L.el('rect', { x, y: -5, width: 4, height: 10, fill: L.GRAY }, tile));
    }
    // stop sign + reasons
    const stop = L.el('g', { opacity: 0 }, root);
    const oct = [];
    for (let k = 0; k < 8; k++) { const a = Math.PI / 8 + k * Math.PI / 4; oct.push((16 * Math.cos(a)).toFixed(1) + ',' + (16 * Math.sin(a)).toFixed(1)); }
    L.el('polygon', { points: oct.join(' '), fill: L.RED }, stop);
    L.el('rect', { x: -9, y: -2, width: 18, height: 4, rx: 1, fill: '#fff' }, stop);
    const reasons = L.el('g', { opacity: 0 }, root);
    const reasonLines = V.reasons[stopAt] || [];
    reasonLines.forEach((s, i) => L.text(reasons, s, GX[stopAt], GY + GH / 2 + 62 + i * 18, { size: 13, fill: L.RED, weight: i === 0 ? 700 : 400 }));
    if (V.qualifier) L.text(root, V.qualifier, 380, 292, { size: 12, fill: L.DIM, italic: true });
    if (V.theorem) {
      const th = L.el('g', { transform: 'translate(120,225)' }, root);
      L.el('rect', { x: -70, y: -28, width: 140, height: 56, rx: 8, fill: '#eaf4ec', stroke: L.GREEN, 'stroke-width': 1.5 }, th);
      L.text(th, 'coherent bandit', 0, -8, { size: 12, weight: 700, fill: L.GREEN });
      L.text(th, 'theorem intact', 0, 12, { size: 12, fill: L.GREEN });
    }

    const setState = (t) => {
      const endX = GX[stopAt] - GW / 2 - 34;
      const u = L.win(t, 0.3, 1.2 + 0.5 * stopAt, L.outQuart);
      const x = L.lerp(40, endX, u);
      tile.setAttribute('transform', `translate(${x},${GY + GH / 2 + 22 - 26})`);
      gates.forEach((g, i) => {
        const reached = x >= GX[i] - GW / 2 - 40;
        const passed = V.answers[i] && V.answers[i] !== 'no' && i < stopAt;
        g.ans.textContent = V.answers[i] || '—';
        g.ans.setAttribute('fill', V.answers[i] === 'no' ? L.RED : passed ? L.GREEN : L.GRAY);
        g.ans.setAttribute('opacity', i < stopAt ? L.win(t, 0.9 + i * 0.5, 0.3) : i === stopAt ? L.win(t, 1.6 + 0.5 * stopAt, 0.3) : 0);
        g.g.setAttribute('opacity', i > stopAt && t > 1.6 + 0.5 * stopAt ? 0.3 : 1);
        g.ans.setAttribute('font-size', (V.answers[i] || '').length > 6 ? 11 : 15);
      });
      const hit = L.win(t, 1.7 + 0.5 * stopAt, 0.4, L.backOut);
      stop.setAttribute('opacity', hit > 0 ? 1 : 0);
      stop.setAttribute('transform', `translate(${GX[stopAt]},${GY - GH / 2 - 26}) scale(${hit})`);
      reasons.setAttribute('opacity', L.win(t, 2.2 + 0.5 * stopAt, 0.4));
    };
    L.timeline(svg, { T: 3.6 + 0.5 * stopAt, setState });
  };
  document.querySelectorAll('svg.scorecard-fig').forEach(init);
})();
