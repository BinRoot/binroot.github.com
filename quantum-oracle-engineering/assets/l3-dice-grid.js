// l3-dice-grid.js -- slide 18: two rounds, nine cells, one five-qubit die
// each.  The dice appear one at a time with their five qubits beneath, and a
// counter climbs to 90.
(function () {
  const svg = document.getElementById('l3-dice-grid-fig');
  if (!svg) return;
  const L = window.L2;
  const root = L.el('g', {}, svg);
  const rnd = L.prng(2026);
  const dice = [];
  for (let r = 0; r < 2; r++) {
    L.text(root, `round ${r + 1}`, 60, 70 + r * 120, { anchor: 'end', size: 13, fill: L.DIM });
    for (let c = 0; c < 9; c++) {
      const g = L.el('g', { opacity: 0 }, root);
      const x = 110 + c * 62, y = 62 + r * 120;
      L.die(g, x, y, 17, Math.floor(rnd() * 20) + 1, { fill: '#fff', stroke: L.INK, ink: L.INK });
      for (let b = 0; b < 5; b++) L.el('rect', { x: x - 22 + b * 9, y: y + 26, width: 7, height: 7, rx: 1.5, fill: '#f3e8ff', stroke: L.PURPLE, 'stroke-width': 1 }, g);
      L.text(g, `cell ${c}`, x, y + 46, { size: 9.5, mono: true, fill: L.DIM });
      dice.push(g);
    }
  }
  const total = L.text(root, '0 qubits', 690, 270, { anchor: 'end', size: 22, mono: true, weight: 700 });
  const eq = L.text(root, '', 690, 292, { anchor: 'end', size: 12.5, fill: L.DIM, opacity: 0 });
  L.timeline(svg, { T: 4.6, setState: (t) => {
    let n = 0;
    dice.forEach((g, i) => { const o = L.win(t, 0.2 + i * 0.18, 0.25); g.setAttribute('opacity', o); if (o > 0.5) n++; });
    total.textContent = `${5 * n} qubits`;
    eq.textContent = '9 cells × 2 rounds × 5 qubits'; eq.setAttribute('opacity', L.win(t, 3.8, 0.4));
  } });
})();
