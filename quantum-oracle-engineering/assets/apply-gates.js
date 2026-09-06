// apply-gates.js -- slide 34: apply the three questions.
//
// The screening line as three labelled gates and a bay.  Two problem tiles
// travel it.  "a chess engine's move" is deterministic with solver dice and
// drops out at gate one.  "an epidemic on a network" has task dice and no
// table, two interventions a hair apart, and a local contagion rule, so it
// passes all three and reaches the bay marked "worth costing out".
(function () {
  if (window.__applyGatesInit) return; window.__applyGatesInit = true;
  const L = window.L2;
  document.querySelectorAll('svg.apply-gates').forEach((svg) => {
    const root = L.el('g', {}, svg);
    const Y = 150, GX = [200, 340, 480], BAY = 660;
    L.el('line', { x1: 40, y1: Y, x2: BAY - 30, y2: Y, stroke: L.WIRE, 'stroke-width': 3 }, root);
    const QUESTIONS = ['still sampling?', 'precision?', 'worth building?'];
    GX.forEach((x, i) => {
      L.el('rect', { x: x - 5, y: Y - 60, width: 10, height: 120, rx: 3, fill: L.INK }, root);
      L.text(root, `${i + 1} · ${QUESTIONS[i]}`, x, Y - 76, { size: 12, fill: L.DIM, weight: 700 });
    });
    L.el('rect', { x: BAY - 30, y: Y - 34, width: 70, height: 68, rx: 8, fill: '#fff', stroke: L.GREEN, 'stroke-width': 2 }, root);
    L.text(root, 'worth', BAY + 5, Y - 8, { size: 11, fill: L.GREEN, weight: 700 }); L.text(root, 'costing', BAY + 5, Y + 6, { size: 11, fill: L.GREEN, weight: 700 }); L.text(root, 'out', BAY + 5, Y + 20, { size: 11, fill: L.GREEN, weight: 700 });
    const tile = (label, col) => {
      const g = L.el('g', {}, root);
      L.el('rect', { x: -65, y: -18, width: 130, height: 36, rx: 8, fill: '#fff', stroke: col, 'stroke-width': 1.8 }, g);
      L.text(g, label, 0, 0, { size: 11.5, weight: 700, fill: col });
      return g;
    };
    const chess = tile("a chess engine's move", L.GRAY), epi = tile('epidemic on a network', L.ORANGE);
    const stop = L.el('g', { opacity: 0 }, root);
    L.el('polygon', { points: '0,-13 9,-9 13,0 9,9 0,13 -9,9 -13,0 -9,-9', fill: L.RED, transform: `translate(${110},${Y + 86})` }, stop);
    L.text(stop, 'deterministic: a tree walk wins', 110, Y + 110, { size: 11, fill: L.RED, weight: 700 });
    const why = ['task dice, no table fits', 'two interventions, a hair apart', 'a local contagion rule'].map((s, i) => L.text(root, s, GX[i], Y + 84, { size: 11, fill: L.ORANGE, weight: 700, opacity: 0 }));
    const T = 6.2;
    const setState = (t) => {
      const uc = L.win(t, 0.2, 1.6, L.outQuart);
      const cx = L.lerp(60, 110, uc), cy = Y - 34 + (uc >= 1 ? L.win(t, 1.9, 0.5) * 64 : 0);
      chess.setAttribute('transform', `translate(${cx},${cy})`); chess.setAttribute('opacity', uc >= 1 && t > 2.6 ? 0.35 : 1);
      stop.setAttribute('opacity', L.win(t, 2.0, 0.4));
      const ue = L.win(t, 2.6, 3.0, L.outQuart);
      const ex = L.lerp(60, BAY - 102, ue);
      epi.setAttribute('transform', `translate(${ex},${Y - 34})`);
      why.forEach((w, i) => w.setAttribute('opacity', ex > GX[i] ? 1 : 0));
    };
    L.timeline(svg, { T, setState });
  });
})();
