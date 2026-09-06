// composition.js -- slide 20: the quantum composition.
//
// Two factor blocks slide in and lock together.  Amplitude estimation turns
// the evidence cost from 1/eps^2 into 1/eps; maximum finding turns the action
// search from k into sqrt(k).  The blocks meet with a click and the product
// reads O-tilde(sqrt(k)/eps); the equation beneath keeps the classical bound
// beside it for the comparison.
(function () {
  const svg = document.getElementById('composition-fig');
  if (!svg) return;
  const L = window.L2;
  const root = L.el('g', {}, svg);
  const Y = 120;
  const block = (label, from, to, color) => {
    const g = L.el('g', {}, root);
    L.el('rect', { x: -120, y: -50, width: 240, height: 100, rx: 10, fill: '#fff', stroke: color, 'stroke-width': 2 }, g);
    L.text(g, label, 0, -26, { size: 13, weight: 700, fill: color });
    const f = L.text(g, from, -40, 14, { size: 22, mono: true, fill: L.GRAY });
    L.text(g, '→', 0, 14, { size: 20, fill: L.DIM });
    const t = L.text(g, to, 44, 14, { size: 22, mono: true, weight: 700, fill: color });
    L.el('line', { x1: -62, y1: 14, x2: -18, y2: 14, stroke: L.GRAY, 'stroke-width': 2 }, g);   // strike
    return g;
  };
  const left = block('maximum finding', 'k', '√k', L.INK);
  const right = block('amplitude estimation', '1/ε²', '1/ε', L.BLUE);
  const seam = L.el('line', { x1: 380, y1: Y - 40, x2: 380, y2: Y + 40, stroke: L.GOLD, 'stroke-width': 6, opacity: 0 }, root);
  const prod = L.text(root, 'Õ(√k / ε)', 380, 222, { size: 30, mono: true, weight: 700, opacity: 0 });

  const setState = (t) => {
    const u = L.win(t, 0.3, 1.1, L.backOut);
    left.setAttribute('transform', `translate(${L.lerp(-140, 258, u)},${Y})`);
    right.setAttribute('transform', `translate(${L.lerp(900, 502, u)},${Y})`);
    const hit = t - 1.35;
    seam.setAttribute('opacity', hit > 0 && hit < 0.5 ? 0.9 * (1 - hit / 0.5) : 0);
    prod.setAttribute('opacity', L.win(t, 1.5, 0.5));
    prod.setAttribute('transform', `translate(0,${(1 - L.win(t, 1.5, 0.5, L.backOut)) * 12})`);
  };
  L.timeline(svg, { T: 3, setState });
})();
