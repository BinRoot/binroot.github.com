// l4-mirror.js -- slide 2: one line of code.
//
// A code card with the call, then Lesson 3's rollout as a strip of eleven
// blocks.  The strip reflects across a horizontal mirror: each block slides to
// its mirrored position, the order reverses, and every label gains a dagger.
// Plays once and holds.
(function () {
  if (window.__l4MirrorInit) return; window.__l4MirrorInit = true;
  const L = window.L2;
  document.querySelectorAll('svg.l4-mirror').forEach((svg) => {
    const root = L.el('g', {}, svg);
    // code card
    L.el('rect', { x: 150, y: 14, width: 460, height: 66, rx: 8, fill: '#2d3140' }, root);
    const code = (s, y, fill) => L.text(root, s, 172, y, { anchor: 'start', size: 15, mono: true, fill });
    code('oracle  = rollout(board, rounds=2)', 38, '#e8e6e1');
    const t2 = L.text(root, '', 172, 62, { anchor: 'start', size: 15, mono: true, fill: '#e8e6e1' });
    const a = L.el('tspan', {}, t2); a.textContent = 'inverse = oracle.inverse()';
    const b = L.el('tspan', { fill: '#9aa0a8' }, t2); b.textContent = '   # one line';
    // strips
    const BLOCKS = ['select', 'place', 'select', 'place', 'event', 'select', 'place', 'select', 'place', 'event', 'payoff'];
    const W = 52, GAP = 6, X0 = 380 - (BLOCKS.length * (W + GAP) - GAP) / 2, YF = 132, YB = 232, MID = (YF + YB) / 2 + 14;
    const colour = (s) => s === 'event' ? L.ORANGE : s === 'payoff' ? L.GREEN : s === 'select' ? L.BLUE : L.INK;
    const bx = (i) => X0 + i * (W + GAP);
    L.el('line', { x1: X0, y1: YF + 14, x2: X0 + BLOCKS.length * (W + GAP) - GAP, y2: YF + 14, stroke: L.WIRE, 'stroke-width': 1.5 }, root);
    L.el('line', { x1: X0, y1: YB + 14, x2: X0 + BLOCKS.length * (W + GAP) - GAP, y2: YB + 14, stroke: L.WIRE, 'stroke-width': 1.5 }, root);
    L.text(root, 'forward', X0, YF - 12, { anchor: 'start', size: 13, fill: L.DIM });
    L.text(root, 'backward', X0, YB + 44, { anchor: 'start', size: 13, fill: L.DIM });
    const mirror = L.el('line', { x1: X0 - 20, y1: MID, x2: X0 + BLOCKS.length * (W + GAP) + 14, y2: MID, stroke: L.RULE, 'stroke-width': 1.2, 'stroke-dasharray': '6 5', opacity: 0 }, root);
    const block = (s, x, y, dag) => {
      const g = L.el('g', {}, root);
      L.el('rect', { x, y, width: W, height: 28, rx: 5, fill: '#fff', stroke: colour(s), 'stroke-width': 1.6 }, g);
      const t = L.text(g, s, x + W / 2, y + 14, { size: 11, mono: true, fill: colour(s) });
      if (dag) { const d = L.el('tspan', { 'baseline-shift': 'super', 'font-size': 9 }, t); d.textContent = '†'; }
      return g;
    };
    BLOCKS.forEach((s, i) => block(s, bx(i), YF, false));
    // the travelling copies
    const copies = BLOCKS.map((s, i) => { const g = block(s, bx(i), YF, true); g.setAttribute('opacity', 0); return g; });
    const T = 3.4;
    const setState = (t) => {
      mirror.setAttribute('opacity', L.win(t, 0.2, 0.4));
      copies.forEach((g, i) => {
        const u = L.win(t, 0.7 + i * 0.06, 1.2, L.outQuart);
        const j = BLOCKS.length - 1 - i;                 // mirrored slot
        const x = L.lerp(bx(i), bx(j), u), y = L.lerp(YF, YB, u);
        g.setAttribute('transform', `translate(${x - bx(i)},${y - YF})`);
        g.setAttribute('opacity', u > 0 ? 1 : 0);
      });
    };
    L.timeline(svg, { T, setState });
  });
})();
