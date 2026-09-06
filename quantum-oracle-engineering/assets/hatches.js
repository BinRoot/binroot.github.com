// hatches.js -- slide 19: when sampling stays.
//
// Five games on a log axis of positions: tic-tac-toe (5,478), Pig (505,000),
// checkers (5 x 10^20, solved in 2007), chess (about 10^44), Go (about
// 10^170).  A dashed line at checkers marks the largest game ever solved
// in full.  Below the line a table fits and sampling is unnecessary; above it
// no table fits, and sampling stays.  Bars rise one by one.
(function () {
  if (window.__hatchesInit) return; window.__hatchesInit = true;
  const L = window.L2;
  const G = [['tic-tac-toe', 3.74, '5,478', false], ['Pig', 5.7, '505,000', false], ['checkers', 20.7, '5 × 10²⁰', false], ['chess', 44, '~ 10⁴⁴', true], ['Go', 170.3, '~ 10¹⁷⁰', true]];
  document.querySelectorAll('svg.hatches').forEach((svg) => {
    const root = L.el('g', {}, svg);
    const X0 = 110, BW = 84, GAP = 40, BASE = 232, TOP = 40, hi = 180;
    const yOf = (e) => BASE - (BASE - TOP) * e / hi;
    [0, 50, 100, 150].forEach((e) => { L.el('line', { x1: X0 - 20, y1: yOf(e), x2: 740, y2: yOf(e), stroke: L.FAINT, 'stroke-width': 1 }, root); L.text(root, `10^${e}`, X0 - 26, yOf(e), { anchor: 'end', size: 11, mono: true, fill: L.DIM }); });
    L.text(root, 'positions', 380, 22, { size: 14, weight: 700 });
    const bars = G.map(([name, e, lab, samp], i) => {
      const x = X0 + i * (BW + GAP);
      const r = L.el('rect', { x, y: BASE, width: BW, height: 0, fill: samp ? L.ORANGE : L.BLUE, opacity: 0.85 }, root);
      const t = L.text(root, lab, x + BW / 2, yOf(e) - 12, { size: 12, mono: true, weight: 700, opacity: 0 });
      L.text(root, name, x + BW / 2, BASE + 18, { size: 12.5, weight: 700 });
      return { r, t, h: BASE - yOf(e) };
    });
    const line = L.el('g', { opacity: 0 }, root);
    L.el('line', { x1: X0 - 20, y1: yOf(20.7), x2: 740, y2: yOf(20.7), stroke: L.GREEN, 'stroke-width': 1.5, 'stroke-dasharray': '6 4' }, line);
    L.text(line, 'solved in full, 2007', X0 + 2 * (BW + GAP) + BW / 2, BASE + 34, { size: 11, fill: L.GREEN, weight: 700 });
    L.text(line, 'a table fits', X0 - 20, yOf(20.7) - 10, { anchor: 'start', size: 12, fill: L.BLUE, weight: 700 });
    L.text(line, 'no table fits: sampling stays', X0 - 20, yOf(70), { anchor: 'start', size: 12, fill: L.ORANGE, weight: 700 });
    const setState = (t) => {
      bars.forEach((b, i) => { const u = L.win(t, 0.2 + i * 0.4, 0.6, L.outQuart); b.r.setAttribute('height', b.h * u); b.r.setAttribute('y', BASE - b.h * u); b.t.setAttribute('opacity', u >= 1 ? 1 : 0); });
      line.setAttribute('opacity', L.win(t, 2.6, 0.5));
    };
    L.timeline(svg, { T: 3.4, setState });
  });
})();
