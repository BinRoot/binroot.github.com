// worksheet.js -- unused since the exercise slide was cut; formerly: your turn.
//
// The three questions as empty evidence boxes beside the curated board, a
// fourth box for the committed verdict, and a ninety-second timer.  The
// clock starts on the slide's first `.step` reveal, so the instructor's
// ordinary "next" gesture begins the exercise; leaving and re-entering the
// slide resets it.
(function () {
  const svg = document.getElementById('worksheet-fig');
  if (!svg) return;
  const L = window.L2;
  const D = window.SWAY_DATA;
  const root = L.el('g', {}, svg);
  const B = L.board(root, { N: D.N, size: 200, x: 40, y: 50, board: D.board });
  D.candidates.forEach((c) => {
    const i = c.r * D.N + c.c;
    L.text(root, c.label, B.cx(i) + 40, B.cy(i) + 50, { size: 15, weight: 700, opacity: 0.7 });
  });
  const Q = ['Q1  randomness?', 'Q2  precision?', 'Q3  one coherent query?', 'verdict'];
  Q.forEach((q, i) => {
    const y = 40 + i * 62;
    L.el('rect', { x: 290, y, width: 440, height: 50, rx: 8, fill: '#fff', stroke: i === 3 ? L.GREEN : L.INK, 'stroke-width': i === 3 ? 2 : 1.3, 'stroke-dasharray': i === 3 ? '6 4' : null }, root);
    L.text(root, q, 300, y + 14, { anchor: 'start', size: 12, fill: L.DIM, mono: i < 3 });
  });
  // timer
  const timerG = L.el('g', {}, root);
  L.el('circle', { cx: 140, cy: 286, r: 0 }, timerG);
  const ring = L.el('circle', { cx: 140, cy: 285, r: 14, fill: 'none', stroke: L.GREEN, 'stroke-width': 4, 'stroke-dasharray': '88', 'stroke-dashoffset': 0, transform: 'rotate(-90 140 285)' }, timerG);
  const tl = L.text(root, '1:30', 190, 285, { anchor: 'start', size: 22, mono: true, weight: 700 });
  const trigger = L.el('g', { class: 'step' }, root);   // the reveal that starts the clock
  let start = 0, running = false;
  L.steps(svg, (n) => { if (n >= 1 && !running) { running = true; start = performance.now(); } if (n === 0) { running = false; tl.textContent = '1:30'; ring.setAttribute('stroke-dashoffset', 0); } });
  const tick = () => {
    requestAnimationFrame(tick);
    if (!running) return;
    const left = Math.max(0, 90 - (performance.now() - start) / 1000);
    tl.textContent = `${Math.floor(left / 60)}:${String(Math.floor(left % 60)).padStart(2, '0')}`;
    ring.setAttribute('stroke-dashoffset', 88 * (1 - left / 90));
    ring.setAttribute('stroke', left < 15 ? L.RED : L.GREEN);
  };
  requestAnimationFrame(tick);
})();
