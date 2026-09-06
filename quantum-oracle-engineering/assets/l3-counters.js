// l3-counters.js -- slide 27: a pointer walks the final board; occupied and
// black increments one four-qubit counter, occupied and white the other.
(function () {
  const svg = document.getElementById('l3-counters-fig');
  if (!svg) return;
  const L = window.L2;
  const root = L.el('g', {}, svg);
  const N = 3, X = 60, Y = 45, SIZE = 210;
  const BOARD = [1, 2, 1, 2, 1, 1, 0, 2, 1];
  const B = L.board(root, { N, size: SIZE, x: X, y: Y, board: BOARD });
  const ptr = L.el('rect', { width: SIZE / N - 6, height: SIZE / N - 6, rx: 6, fill: 'none', stroke: L.ORANGE, 'stroke-width': 3 }, root);
  const counter = (x, y, name, col) => { L.text(root, name, x + 86, y - 18, { size: 13, fill: col, weight: 700 });
    const bits = [3, 2, 1, 0].map((b, k) => { L.el('rect', { x: x + k * 44, y, width: 38, height: 38, rx: 6, fill: '#fff', stroke: col, 'stroke-width': 1.5 }, root); return L.text(root, '0', x + k * 44 + 19, y + 19, { size: 17, mono: true, weight: 700 }); });
    const dec = L.text(root, '= 0', x + 190, y + 19, { anchor: 'start', size: 15, mono: true, fill: L.DIM });
    return (v) => { bits.forEach((t, k) => t.textContent = String((v >> (3 - k)) & 1)); dec.textContent = `= ${v}`; }; };
  const setB = counter(400, 70, 'black', L.INK), setW = counter(400, 180, 'white', L.GRAY);
  const STEP = 0.5;
  L.timeline(svg, { T: STEP * 9 + 0.6, setState: (t) => {
    const k = Math.min(8, Math.floor(t / STEP));
    ptr.setAttribute('x', X + B.cx(k) - (SIZE / N - 6) / 2); ptr.setAttribute('y', Y + B.cy(k) - (SIZE / N - 6) / 2);
    let b = 0, w = 0; for (let i = 0; i <= k; i++) { if (BOARD[i] === 1) b++; if (BOARD[i] === 2) w++; }
    setB(b); setW(w);
  } });
})();
