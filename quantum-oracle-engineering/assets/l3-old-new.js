// l3-old-new.js -- slide 23: the colours are copied into the next round's
// register; every flip decision reads the old copy and toggles the new one.
// Three beats: copy, decide (flags appear over the old board), toggle (the
// new board changes; the old one never does).
(function () {
  const svg = document.getElementById('l3-old-new-fig');
  if (!svg) return;
  const L = window.L2;
  const root = L.el('g', {}, svg);
  const D = window.L3, N = D.N;
  const OLD = D.event.before;
  const flips = D.event.flips, NEW = D.event.after;
  const A = L.board(root, { N, size: 190, x: 70, y: 50, board: OLD });
  L.text(root, 'old: decides', 165, 34, { size: 14, weight: 700 });
  const Bg = L.el('g', { opacity: 0 }, root);
  const Bb = L.board(Bg, { N, size: 190, x: 500, y: 50, board: OLD });
  L.text(root, 'new: receives', 595, 34, { size: 14, weight: 700, fill: L.BLUE });
  const arrow = L.el('g', { opacity: 0 }, root);
  L.el('line', { x1: 280, y1: 145, x2: 470, y2: 145, stroke: L.INK, 'stroke-width': 2 }, arrow);
  L.el('polygon', { points: '470,145 458,138 458,152', fill: L.INK }, arrow);
  const alab = L.text(arrow, 'CNOT colors into |0⟩', 375, 132, { size: 12, fill: L.DIM });
  const flagMarks = OLD.map((v, i) => L.el('circle', { cx: 70 + A.cx(i), cy: 50 + A.cy(i), r: A.r + 4, fill: 'none', stroke: L.ORANGE, 'stroke-width': 3, opacity: 0 }, root));
  L.text(root, '9 occupancy + 3 × 9 color qubits = 36 state qubits', 380, 292, { size: 12, mono: true, fill: L.DIM });
  const cap = L.text(root, '', 380, 267, { size: 14, weight: 700, opacity: 0 });
  L.timeline(svg, { T: 4.4, setState: (t) => {
    Bg.setAttribute('opacity', L.win(t, 0.4, 0.5)); arrow.setAttribute('opacity', L.win(t, 0.2, 0.4));
    const dec = L.win(t, 1.6, 0.4);
    flagMarks.forEach((m, i) => m.setAttribute('opacity', flips[i] ? dec : 0));
    alab.textContent = t > 1.6 ? 'read old, toggle new' : 'CNOT colors into |0⟩';
    const tog = t > 2.8;
    Bb.redraw(tog ? NEW : OLD);
    cap.textContent = tog ? 'toggled on the new board; the old board is untouched' : t > 1.6 ? `${flips.filter(Boolean).length} stones will flip` : '';
    cap.setAttribute('opacity', t > 1.6 ? 1 : 0);
  } });
})();
