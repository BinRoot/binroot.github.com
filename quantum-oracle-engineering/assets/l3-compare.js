// l3-compare.js -- slide 21: "die < threshold" on five qubits is one
// controlled-X toggle per face beneath the threshold.  With c = 1 friend the
// threshold is 3, so faces 0, 1, 2 each get a pattern; the flag fires if the
// die matches any.  The table at the right gives all five thresholds.
(function () {
  const svg = document.getElementById('l3-compare-fig');
  if (!svg) return;
  const L = window.L2;
  const root = L.el('g', {}, svg);
  const DIE = 2, THR = 3;
  L.text(root, 'die register', 150, 36, { size: 13, fill: L.DIM });
  const bits = [4, 3, 2, 1, 0].map((b, k) => { L.el('rect', { x: 60 + k * 38, y: 50, width: 32, height: 32, rx: 5, fill: '#f3e8ff', stroke: L.PURPLE, 'stroke-width': 1.4 }, root);
    return L.text(root, String((DIE >> b) & 1), 60 + k * 38 + 16, 66, { size: 16, mono: true, weight: 700, fill: L.PURPLE }); });
  L.text(root, `= ${DIE}`, 260, 66, { anchor: 'start', size: 15, mono: true, fill: L.DIM });
  L.text(root, 'c = 1 friend, threshold 4 − 1 = 3', 150, 106, { size: 13 });
  // patterns
  const pats = [0, 1, 2].map((v, i) => {
    const y = 140 + i * 40;
    const g = L.el('g', { opacity: 0 }, root);
    L.text(g, `face ${v}`, 52, y, { anchor: 'end', size: 12, mono: true, fill: L.DIM });
    [4, 3, 2, 1, 0].forEach((b, k) => L.el('rect', { x: 60 + k * 38, y: y - 12, width: 32, height: 24, rx: 4, fill: ((v >> b) & 1) ? L.INK : '#fff', stroke: L.INK, 'stroke-width': 1.2 }, g));
    L.el('line', { x1: 252, y1: y, x2: 300, y2: y, stroke: L.INK, 'stroke-width': 1.5 }, g);
    L.text(g, 'toggle flag', 306, y, { anchor: 'start', size: 12, fill: L.DIM });
    return { g, v };
  });
  const flag = L.el('g', {}, root);
  L.el('rect', { x: 118, y: 258, width: 64, height: 30, rx: 8, fill: '#fff', stroke: L.INK, 'stroke-width': 1.5 }, flag);
  const flagTx = L.text(flag, 'flag 0', 150, 273, { size: 13, mono: true, weight: 700 });
  // table
  const TX = 470, TY = 60;
  L.text(root, 'friends', TX, TY, { size: 12, fill: L.DIM }); L.text(root, 'threshold', TX + 90, TY, { size: 12, fill: L.DIM }); L.text(root, 'patterns', TX + 190, TY, { size: 12, fill: L.DIM });
  [0, 1, 2, 3, 4].forEach((c, i) => { const y = TY + 30 + i * 30, thr = 4 - c;
    L.text(root, String(c), TX, y, { size: 14, mono: true, weight: c === 1 ? 700 : 400 });
    L.text(root, String(thr), TX + 90, y, { size: 14, mono: true, weight: c === 1 ? 700 : 400 });
    L.text(root, thr ? String(thr) : 'none', TX + 190, y, { size: 14, mono: true, weight: c === 1 ? 700 : 400, fill: thr ? L.INK : L.DIM }); });
  L.el('rect', { x: TX - 30, y: TY + 30 * 2 - 14, width: 260, height: 28, rx: 6, fill: L.GOLD, opacity: 0.3 }, root);
  L.timeline(svg, { T: 3.6, setState: (t) => {
    let hit = false;
    pats.forEach((p, i) => { const o = L.win(t, 0.4 + i * 0.7, 0.4); p.g.setAttribute('opacity', o); if (o >= 1 && p.v === DIE) hit = true; });
    flagTx.textContent = hit ? 'flag 1' : 'flag 0';
    flag.firstChild.setAttribute('fill', hit ? '#eaf4ec' : '#fff');
    flag.firstChild.setAttribute('stroke', hit ? L.GREEN : L.INK);
  } });
})();
