// l3-rules.js -- slide 4: the access contract as four rules, each drawn with
// the classical habit it forbids struck through.  Cards fade in one by one.
(function () {
  const svg = document.getElementById('l3-rules-fig');
  if (!svg) return;
  const L = window.L2;
  const root = L.el('g', {}, svg);
  const RULES = [
    { t: 'No measuring inside', h: 'peeking at the board', draw: (g) => {
        L.el('path', { d: 'M -22 12 A 22 22 0 0 1 22 12', fill: 'none', stroke: L.INK, 'stroke-width': 2.5 }, g);
        L.el('line', { x1: 0, y1: 12, x2: 14, y2: -10, stroke: L.INK, 'stroke-width': 2.5 }, g); } },
    { t: 'No fresh randomness', h: 'rolling as you go', draw: (g) => {
        L.die(g, -14, 0, 16, 7, { fill: '#fff', stroke: L.INK, ink: L.INK });
        L.el('path', { d: 'M 6 -14 A 16 16 0 1 1 6 14', fill: 'none', stroke: L.INK, 'stroke-width': 2 }, g);
        L.el('polygon', { points: '6,14 -1,8 9,6', fill: L.INK }, g); } },
    { t: 'Every step reversible', h: 'overwriting the board', draw: (g) => {
        L.el('rect', { x: -20, y: -16, width: 40, height: 32, rx: 4, fill: '#fff', stroke: L.INK, 'stroke-width': 1.6 }, g);
        L.text(g, 'x =', -6, 0, { size: 13, mono: true });
        L.el('path', { d: 'M 14 -22 l 10 -8 M 24 -30 l -8 30 l 6 4 z', fill: L.INK, stroke: L.INK, 'stroke-width': 1 }, g); } },
    { t: 'One payoff qubit', h: 'leaving notes behind', draw: (g) => {
        [-24, -8, 8, 24].forEach((x, i) => L.el('circle', { cx: x, cy: 0, r: 7, fill: i === 3 ? L.BLUE : '#fff', stroke: i === 3 ? L.BLUE : L.RULE, 'stroke-width': 1.5 }, g));
        L.text(g, 'payoff', 24, 18, { size: 9, fill: L.BLUE }); } }
  ];
  const cards = RULES.map((r, i) => {
    const x = 40 + i * 175;
    const g = L.el('g', { opacity: 0 }, root);
    L.el('rect', { x, y: 40, width: 160, height: 220, rx: 12, fill: '#fff', stroke: L.INK, 'stroke-width': 1.5 }, g);
    L.text(g, String(i + 1), x + 20, 62, { size: 13, mono: true, fill: L.DIM });
    r.t.split(' ').reduce((acc, w) => { const last = acc[acc.length - 1]; if (last && (last + ' ' + w).length <= 14) acc[acc.length - 1] = last + ' ' + w; else acc.push(w); return acc; }, [])
      .forEach((line, k) => L.text(g, line, x + 80, 90 + k * 20, { size: 16, weight: 700 }));
    const icon = L.el('g', { transform: `translate(${x + 80},170)` }, g);
    r.draw(icon);
    // the habit, struck through
    const strike = L.el('g', { opacity: 0 }, g);
    L.el('line', { x1: x + 50, y1: 200, x2: x + 110, y2: 140, stroke: L.RED, 'stroke-width': 3.5, 'stroke-linecap': 'round' }, strike);
    L.text(g, r.h, x + 80, 236, { size: 12, fill: L.DIM, italic: true });
    return { g, strike, forbidden: i < 3 };
  });
  L.timeline(svg, { T: 3.2, setState: (t) => cards.forEach((c, i) => {
    c.g.setAttribute('opacity', L.win(t, 0.2 + i * 0.5, 0.4));
    c.strike.setAttribute('opacity', c.forbidden ? L.win(t, 0.8 + i * 0.5, 0.3) : 0);
  }) });
})();
