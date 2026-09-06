// good-enough.js -- slide 6: do we need the better move?
//
// Left: one game tonight, two moves half a point apart; either is fine, and
// the cost of picking the worse one is half a point of win rate, once.
// Right: the same half point across a thousand games, which is what ranking
// two strategies, tuning a player, or a tournament amounts to: 505 wins
// against 495 is a result, and to see it you must resolve the gap.  A single
// board grows into a wall of a thousand.
(function () {
  if (window.__goodEnoughInit) return; window.__goodEnoughInit = true;
  const L = window.L2;
  document.querySelectorAll('svg.good-enough').forEach((svg) => {
    const root = L.el('g', {}, svg);
    L.text(root, 'one decision', 200, 30, { size: 15, weight: 700 });
    L.text(root, 'a thousand decisions', 560, 30, { size: 15, weight: 700 });
    // left: two bars nearly equal
    const bar = (x, y, w, col, label, val) => { L.el('rect', { x, y: y - 12, width: w, height: 24, rx: 5, fill: col, opacity: 0.85 }, root); L.text(root, label, x - 10, y, { anchor: 'end', size: 12, weight: 700, fill: col }); L.text(root, val, x + w + 8, y, { anchor: 'start', size: 12, mono: true, fill: L.DIM }); };
    bar(110, 100, 150.5, L.BLUE, 'A', '50.5%'); bar(110, 140, 150, L.GRAY, 'B', '50.0%');
    const okL = L.text(root, 'either move is fine', 200, 200, { size: 14, weight: 700, fill: L.GREEN, opacity: 0 });
    L.text(root, 'the worse pick costs half a point, once', 200, 224, { size: 12, fill: L.DIM });
    // right: a wall of tiny boards
    const wall = L.el('g', {}, root);
    const cells = [];
    for (let r = 0; r < 10; r++) for (let c = 0; c < 25; c++) cells.push(L.el('rect', { x: 440 + c * 10, y: 60 + r * 10, width: 8, height: 8, rx: 1.5, fill: '#eee' }, wall));
    const tallyR = L.text(root, '', 560, 190, { size: 14, weight: 700, mono: true, opacity: 0 });
    const okR = L.text(root, 'the gap is the result', 560, 216, { size: 14, weight: 700, fill: L.ORANGE, opacity: 0 });
    L.text(root, 'ranking two strategies, tuning a player, a tournament', 560, 240, { size: 12, fill: L.DIM });
    const rnd = L.prng(11);
    const winsA = cells.map(() => rnd() < 0.505);
    const setState = (t) => {
      okL.setAttribute('opacity', L.win(t, 0.6, 0.4));
      const n = Math.floor(L.win(t, 1.2, 1.6, L.outQuart) * cells.length);
      cells.forEach((c, i) => c.setAttribute('fill', i < n ? (winsA[i] ? L.BLUE : L.GRAY) : '#eee'));
      tallyR.textContent = '505 to 495, over a thousand games'; tallyR.setAttribute('opacity', L.win(t, 3.0, 0.4));
      okR.setAttribute('opacity', L.win(t, 3.5, 0.4));
    };
    L.timeline(svg, { T: 4.2, setState });
  });
})();
