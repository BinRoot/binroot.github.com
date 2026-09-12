// Lesson 3 implemented four forward choices. Lesson 4 exercises the inverse
// and explains why those choices matter. The legacy "three" mode is the opener.
(function () {
  if (window.__l4ChecklistInit) return; window.__l4ChecklistInit = true;
  const L = window.L2;
  const ITEMS = ['round semantics defined', 'old and new state kept apart', 'selection scratch erased before the board changes',
    'every branch from read-only randomness', 'runs backward after the payoff is marked'];
  const FORWARD_DONE = [1, 1, 1, 1, 0];
  document.querySelectorAll('svg.l4-checklist').forEach((svg) => {
    const five = (svg.dataset.mode || 'three') === 'five';
    const root = L.el('g', {}, svg);
    const rows = ITEMS.map((s, i) => {
      const y = 48 + i * 44, x = 150;
      const g = L.el('g', {}, root);
      const ring = L.el('circle', { cx: x, cy: y, r: 12, fill: '#fff', stroke: L.RULE, 'stroke-width': 1.6 }, g);
      const check = L.el('g', { opacity: 0 }, g);
      L.el('circle', { cx: x, cy: y, r: 12, fill: L.GREEN }, check);
      L.el('path', { d: `M ${x - 6} ${y} l 4.5 4.5 l 8 -9`, fill: 'none', stroke: '#fff', 'stroke-width': 2.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, check);
      const label = L.text(g, s, x + 26, y, { anchor: 'start', size: 16, fill: L.INK });
      const today = L.text(g, 'today', 700, y, { anchor: 'end', size: 12, fill: L.ORANGE, weight: 700, opacity: 0 });
      return { ring, check, label, today, i };
    });
    const cap = L.text(root, five ? 'five of five' : 'four forward choices implemented', 380, 282, { size: 15, weight: 700, mono: true, fill: five ? L.GREEN : L.DIM });
    const setState = (t) => {
      rows.forEach((r) => {
        let u;
        if (FORWARD_DONE[r.i]) u = 1;
        else if (five) u = L.win(t, r.i === 2 ? 0.8 : 1.8, 0.4);
        else u = 0;
        r.check.setAttribute('opacity', u);
        r.label.setAttribute('fill', u > 0 || five ? L.INK : L.DIM);
        r.today.setAttribute('opacity', !FORWARD_DONE[r.i] && !five ? L.win(t, 0.6 + (r.i === 2 ? 0 : 0.3), 0.4) : 0);
      });
    };
    L.timeline(svg, { T: five ? 2.6 : 1.4, setState });
  });
})();
