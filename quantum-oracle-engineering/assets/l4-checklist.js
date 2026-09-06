// l4-checklist.js -- slides 3 and 21: the five-point checklist from the end of
// Lesson 3.  data-mode="three" shows items 1, 2 and 4 checked with 3 and 5
// open; data-mode="five" checks the last two, one after the other.
(function () {
  if (window.__l4ChecklistInit) return; window.__l4ChecklistInit = true;
  const L = window.L2;
  const ITEMS = ['round semantics defined', 'old and new state kept apart', 'selection scratch erased before the board changes',
    'every branch from read-only randomness', 'runs backward after the payoff is marked'];
  const DONE3 = [1, 1, 0, 1, 0];
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
    const cap = L.text(root, five ? 'five of five' : 'three of five', 380, 282, { size: 15, weight: 700, mono: true, fill: five ? L.GREEN : L.DIM });
    const setState = (t) => {
      rows.forEach((r) => {
        let u;
        if (DONE3[r.i]) u = 1;
        else if (five) u = L.win(t, r.i === 2 ? 0.8 : 1.8, 0.4);
        else u = 0;
        r.check.setAttribute('opacity', u);
        r.label.setAttribute('fill', u > 0 || five ? L.INK : L.DIM);
        r.today.setAttribute('opacity', !DONE3[r.i] && !five ? L.win(t, 0.6 + (r.i === 2 ? 0 : 0.3), 0.4) : 0);
      });
    };
    L.timeline(svg, { T: five ? 2.6 : 1.4, setState });
  });
})();
