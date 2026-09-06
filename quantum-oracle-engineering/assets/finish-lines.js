// finish-lines.js -- slide 4: what counts as winning today.
//
// A track with two lines, the two halves of Question 3.  The near one,
// "Q3: buildable", is the only one a candidate has to reach in this lesson;
// the far one, "Q3: wins the clock", is the break-even with numbers in it and
// sits in the distance with Lesson 12's name on it.  The tile
// that runs is the mystery grid-with-die, since the room already knows the
// other two do not get this far.
(function () {
  const svg = document.getElementById('finish-lines-fig');
  if (!svg) return;
  const L = window.L2;
  const root = L.el('g', {}, svg);
  const TRACK_Y = 190, X0 = 60, X_NEAR = 430, X_FAR = 640;

  // track
  L.el('rect', { x: X0 - 20, y: TRACK_Y - 26, width: 720, height: 52, rx: 8, fill: '#eceef2' }, root);
  L.el('line', { x1: X0 - 20, y1: TRACK_Y, x2: 740, y2: TRACK_Y, stroke: '#fff', 'stroke-width': 2, 'stroke-dasharray': '18 14' }, root);

  const lineAt = (x, color, label, sub, faded) => {
    const g = L.el('g', { opacity: faded ? 0.45 : 1 }, root);
    for (let i = 0; i < 6; i++) {
      L.el('rect', { x: x - 6, y: TRACK_Y - 26 + i * 8.7, width: 12, height: 8.7,
        fill: i % 2 ? '#fff' : L.INK }, g);
    }
    L.el('line', { x1: x, y1: TRACK_Y - 26, x2: x, y2: TRACK_Y - 92, stroke: color, 'stroke-width': 3 }, g);
    L.el('path', { d: `M ${x} ${TRACK_Y - 92} h 88 l -12 12 l 12 12 h -88 z`, fill: color }, g);
    L.text(g, label, x + 40, TRACK_Y - 80, { size: 12, weight: 700, fill: '#fff', anchor: 'middle' });
    if (sub) L.text(g, sub, x, TRACK_Y + 48, { size: 13, fill: L.DIM });
    return g;
  };
  lineAt(X_NEAR, L.GREEN, 'today', 'Q3: buildable', false);
  lineAt(X_FAR, L.GRAY, 'Lesson 12', 'Q3: wins the clock', true);

  // the runner: mystery tile
  const tile = L.el('g', {}, root);
  L.el('rect', { x: -22, y: -22, width: 44, height: 44, rx: 6, fill: '#fff', stroke: L.INK, 'stroke-width': 1.5 }, tile);
  for (let i = -1; i <= 1; i++) {
    L.el('line', { x1: i * 10, y1: -16, x2: i * 10, y2: 16, stroke: L.WOODLINE }, tile);
    L.el('line', { x1: -16, y1: i * 10, x2: 16, y2: i * 10, stroke: L.WOODLINE }, tile);
  }
  L.die(tile, 10, 10, 9, null, { fill: L.BLUE, stroke: '#2f4a7a' });
  const dust = [0, 1, 2].map(() => L.el('circle', { r: 3, fill: '#cfd3d9', opacity: 0 }, root));
  const ring = L.el('circle', { cx: X_NEAR, cy: TRACK_Y, r: 20, fill: 'none', stroke: L.GREEN, 'stroke-width': 3, opacity: 0 }, root);

  const T_ARRIVE = 1.9;
  const setState = (t) => {
    const u = L.win(t, 0.3, T_ARRIVE - 0.3, L.outQuart);
    const x = L.lerp(X0, X_NEAR - 34, u);
    const bob = u < 1 ? Math.sin(t * 22) * 2 : 0;
    tile.setAttribute('transform', `translate(${x},${TRACK_Y + bob}) rotate(${(1 - u) * 4})`);
    const since = t - T_ARRIVE;
    dust.forEach((d, k) => {
      if (since > 0 && since < 0.6) {
        const v = L.clamp01((since - k * 0.05) / 0.5);
        d.setAttribute('cx', x + 20 + k * 8); d.setAttribute('cy', TRACK_Y + 14 - v * 14);
        d.setAttribute('r', 3 + v * 9); d.setAttribute('opacity', 0.5 * (1 - v));
      } else d.setAttribute('opacity', 0);
    });
    const a = L.clamp01(since / 0.7);
    ring.setAttribute('r', 20 + 30 * a);
    ring.setAttribute('opacity', since > 0 ? 0.8 * (1 - a) : 0);
  };
  L.timeline(svg, { T: 3.2, setState });
})();
