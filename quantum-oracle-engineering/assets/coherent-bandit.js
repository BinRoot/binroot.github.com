// coherent-bandit.js -- slide 22: the coherent bandit is a real theorem.
//
// The sampled lever morphs into a reversible reward circuit A_i, with its
// inverse beside it, and the two query bounds from slide 20 return beneath
// (composition-eq.svg in the fragment).  The apparent contradiction is
// deliberate: under coherent reward access this is exactly the theorem
// engine the lesson just used.
(function () {
  const svg = document.getElementById('coherent-bandit-fig');
  if (!svg) return;
  const L = window.L2;
  const root = L.el('g', {}, svg);
  const Y = 120;
  // lever
  const lever = L.el('g', { transform: 'translate(160,0)' }, root);
  L.el('rect', { x: -60, y: Y - 60, width: 120, height: 150, rx: 8, fill: '#fff', stroke: L.INK, 'stroke-width': 1.5 }, lever);
  L.el('rect', { x: -36, y: Y - 30, width: 72, height: 44, rx: 4, fill: '#eceef2', stroke: L.RULE }, lever);
  L.el('line', { x1: 74, y1: Y - 10, x2: 74, y2: Y - 110, stroke: L.INK, 'stroke-width': 4, 'stroke-linecap': 'round' }, lever);
  L.el('circle', { cx: 74, cy: Y - 120, r: 12, fill: L.RED }, lever);
  // arrow
  const arrow = L.el('g', { opacity: 0 }, root);
  L.el('line', { x1: 260, y1: Y, x2: 330, y2: Y, stroke: L.INK, 'stroke-width': 2.5 }, arrow);
  L.el('polygon', { points: `330,${Y} 318,${Y - 7} 318,${Y + 7}`, fill: L.INK }, arrow);
  // circuit
  const circ = L.circuit(root, {
    x: 360, y: Y - 40, colW: 70, rowH: 40, labelW: 60, fontSize: 13,
    wires: ['|i⟩', '|ω⟩', '|0⟩'],
    ops: [
      { t: 'box', w: [0, 2], label: ['A', 'reward'], bw: 58, fill: '#eef2fb', stroke: L.BLUE, ink: L.BLUE },
      { t: 'gap', k: 0.4 },
      { t: 'box', w: [0, 2], label: ['A†'], bw: 58, stroke: L.BLUE, ink: L.BLUE, dash: true }
    ]
  });
  circ.g.setAttribute('opacity', 0);
  const green = L.el('g', { opacity: 0, transform: 'translate(660,60)' }, root);
  L.el('rect', { x: -48, y: -20, width: 96, height: 40, rx: 8, fill: '#eaf4ec', stroke: L.GREEN, 'stroke-width': 1.5 }, green);
  L.text(green, 'theorem', 0, 0, { size: 13, weight: 700, fill: L.GREEN });

  const setState = (t) => {
    const u = L.win(t, 0.4, 0.9, L.ease);
    lever.setAttribute('transform', `translate(160,0) scale(${L.lerp(1, 0.85, u)},1)`);
    lever.setAttribute('opacity', L.lerp(1, 0.4, u));
    arrow.setAttribute('opacity', L.win(t, 0.6, 0.4));
    circ.g.setAttribute('opacity', L.win(t, 1.0, 0.6));
    green.setAttribute('opacity', L.win(t, 2.2, 0.4));
  };
  L.timeline(svg, { T: 3, setState });
})();
