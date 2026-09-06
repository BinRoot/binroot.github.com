// sway-reveal.js -- slide 25: the mystery game is Sway.
//
// The third card turns over and grows into the curated board from
// assets/sway-data.js, with the d20 and the two stone colours as props on
// the left.  The three candidate moves are marked faintly; they carry no
// ranking until slide 33.  The corner race panel (sway-race.js) starts the
// first time this slide is current.
(function () {
  const svg = document.getElementById('sway-reveal-fig');
  if (!svg) return;
  const L = window.L2;
  const D = window.SWAY_DATA;
  const root = L.el('g', {}, svg);
  // props
  const props = L.el('g', { transform: 'translate(100,140)' }, root);
  L.die(props, 0, -70, 34, 20, {});
  L.stone(props, -28, 20, 18, 1); L.stone(props, 28, 20, 18, 2);
  // the card that becomes the board
  const cardG = L.el('g', {}, root);
  const back = L.el('g', {}, cardG);
  L.el('rect', { x: -100, y: -100, width: 200, height: 200, rx: 12, fill: '#e9e6df', stroke: L.RULE, 'stroke-width': 1.5 }, back);
  L.text(back, '?', 0, 0, { size: 64, fill: L.GRAY, weight: 700 });
  const face = L.el('g', { opacity: 0 }, cardG);
  const B = L.board(face, { N: D.N, size: 200, x: -100, y: -100, board: D.board });
  // faint candidate marks
  D.candidates.forEach((c) => {
    const i = c.r * D.N + c.c;
    L.el('circle', { cx: B.cx(i) - 100, cy: B.cy(i) - 100, r: B.r, fill: 'none', stroke: L.INK, 'stroke-width': 1.5, 'stroke-dasharray': '4 3', opacity: 0.55 }, face);
    L.text(face, c.label, B.cx(i) - 100, B.cy(i) - 100, { size: 15, weight: 700, fill: L.INK, opacity: 0.6 });
  });
  const title = L.text(root, 'Sway', 400, 24, { size: 26, weight: 700, opacity: 0 });
  const sub = L.text(root, `${D.N}×${D.N} · Black to move · ${D.H} rounds left`, 400, 268, { size: 13, fill: L.DIM, mono: true, opacity: 0 });

  const setState = (t) => {
    const flip = L.win(t, 0.5, 0.9);
    const sx = Math.abs(Math.cos(flip * Math.PI));
    const grow = L.win(t, 1.3, 0.7, L.backOut);
    cardG.setAttribute('transform', `translate(400,150) scale(${Math.max(0.02, flip < 0.5 ? sx : sx * L.lerp(1, 1.0, grow))},${L.lerp(1, 1.0, grow)})`);
    back.setAttribute('display', flip < 0.5 ? null : 'none');
    face.setAttribute('opacity', flip < 0.5 ? 0 : 1);
    title.setAttribute('opacity', L.win(t, 1.4, 0.4));
    sub.setAttribute('opacity', L.win(t, 1.8, 0.4));
  };
  L.timeline(svg, { T: 2.6, setState });
})();
