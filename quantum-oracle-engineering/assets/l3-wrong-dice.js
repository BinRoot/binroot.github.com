// l3-wrong-dice.js -- slide 17: the two tempting fixes for a d20 on five
// qubits, each struck through.  Left: reroll bad faces, which is a measurement
// inside the circuit.  Right: use all 32 faces, which turns a 4-in-20 flip
// into 4-in-32 and changes the game.
(function () {
  const svg = document.getElementById('l3-wrong-dice-fig');
  if (!svg) return;
  const L = window.L2;
  const root = L.el('g', {}, svg);
  const panel = (x, title) => { const g = L.el('g', { opacity: 0 }, root);
    L.el('rect', { x, y: 30, width: 320, height: 240, rx: 12, fill: '#fff', stroke: L.RULE, 'stroke-width': 1.5 }, g);
    L.text(g, title, x + 160, 56, { size: 16, weight: 700 }); return g; };
  // left: reroll
  const A = panel(50, 'reroll the bad faces');
  L.die(A, 130, 130, 26, 23, { fill: '#fff', stroke: L.INK, ink: L.RED });
  L.el('path', { d: 'M 165 110 A 40 40 0 1 1 165 150', fill: 'none', stroke: L.INK, 'stroke-width': 2 }, A);
  L.el('polygon', { points: '165,150 157,141 169,139', fill: L.INK }, A);
  const meter = L.el('g', { transform: 'translate(270,130)' }, A);
  L.el('path', { d: 'M -22 12 A 22 22 0 0 1 22 12', fill: 'none', stroke: L.INK, 'stroke-width': 2.5 }, meter);
  L.el('line', { x1: 0, y1: 12, x2: 14, y2: -10, stroke: L.INK, 'stroke-width': 2.5 }, meter);
  L.text(A, 'face 23? measure, roll again', 210, 200, { size: 13, fill: L.DIM });
  L.text(A, 'a measurement inside the circuit', 210, 240, { size: 13, weight: 700, fill: L.RED });
  // right: 32 faces
  const Bp = panel(390, 'use all thirty-two faces');
  L.die(Bp, 470, 130, 26, 20, { fill: '#fff', stroke: L.INK, ink: L.INK });
  L.text(Bp, '4 / 20 = 1 in 5', 470, 178, { size: 13, mono: true });
  L.die(Bp, 630, 130, 26, 32, { fill: '#fff', stroke: L.INK, ink: L.RED });
  L.text(Bp, '4 / 32 = 1 in 8', 630, 178, { size: 13, mono: true, fill: L.RED });
  L.text(Bp, 'every flip probability drops by 20/32', 550, 210, { size: 12.5, fill: L.DIM });
  L.text(Bp, 'a different game', 550, 240, { size: 13, weight: 700, fill: L.RED });
  const strikes = [50, 390].map((x) => L.el('line', { x1: x + 40, y1: 250, x2: x + 280, y2: 50, stroke: L.RED, 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0 }, root));
  L.timeline(svg, { T: 3.6, setState: (t) => {
    A.setAttribute('opacity', L.win(t, 0.2, 0.4)); strikes[0].setAttribute('opacity', L.win(t, 1.3, 0.3));
    Bp.setAttribute('opacity', L.win(t, 1.8, 0.4)); strikes[1].setAttribute('opacity', L.win(t, 2.9, 0.3));
  } });
})();
