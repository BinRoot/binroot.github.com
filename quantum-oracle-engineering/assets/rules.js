// rules.js -- slides 34 and 35: rules that compile, rules that tangle.
//
// Each slide is ONE composed figure in two halves: the board on the left says
// what the rule READS, the circuit on the right says what that costs.  The
// board is the cause and the circuit is the consequence, and the pair only
// argues anything when both are present.
//
// Why this exists.  Both slides used to carry the circuit alone, which is the
// consequence with the cause missing.  A reader saw five wires named up, down,
// left, right, flip and two Toffolis, with nothing on screen to say where
// those names came from or why there were only four of them.  The wire names
// ARE the locality claim, but bare labels do not draw a board, and on the
// tangle side the names degrade to c1..c7, which say nothing at all.  So the
// slide could not be read without the narration carrying the whole load.  The
// outline lists a grid cell with four short wires to its orthogonal
// neighbours, and the same grid with wires reaching across the board and back
// into history, as the planned graphic for the pair; this is that.
//
// Colour is the link between the halves, and it is the only key: the cell
// being updated is INK and so is its wire label, the cells being READ are
// ACCENT and so are theirs.  Match the colours and the correspondence needs
// no legend and no arrows between the halves.
//
// The circuit geometry deliberately mirrors assets/qcircuit.js exactly -- same
// ROW, COL, radii, stroke widths, mono label size -- because lesson 3 renders
// the full circuits through that file and the two must not look like different
// notations.  If qcircuit.js changes, change these constants with it.
(function () {
  const ns = 'http://www.w3.org/2000/svg';
  const INK = '#2d3140';
  const WIRE = '#8a90a0';
  const ACCENT = '#456AAD';
  const DIM = '#888';
  const CELL_RULE = '#d8dbe1';

  // Straight from qcircuit.js.  Keep in sync.
  const ROW = 44, COL = 72, R_CTRL = 4.5, R_TARG = 10;
  const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

  const el = (name, attrs, parent) => {
    const node = document.createElementNS(ns, name);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
    if (parent) parent.appendChild(node);
    return node;
  };
  const caption = (s, x, y, parent, fill) => {
    const t = el('text', {
      x, y, 'text-anchor': 'middle', fill: fill || DIM, 'font-size': 14,
      'font-weight': 600, 'font-family': "'Ubuntu', sans-serif"
    }, parent);
    t.textContent = s;
    return t;
  };

  // ── The board ───────────────────────────────────────────────────────
  // n x n cells of `cell` px at (x0, y0).  `read` are the cells the rule
  // looks at, `self` is the cell being updated.
  const board = (parent, x0, y0, n, cell, read, self) => {
    const key = (r, c) => r + ',' + c;
    const reads = new Set(read.map(([r, c]) => key(r, c)));
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const isSelf = self[0] === r && self[1] === c;
        const isRead = reads.has(key(r, c));
        el('rect', {
          x: x0 + c * cell, y: y0 + r * cell, width: cell, height: cell,
          fill: isSelf ? INK : (isRead ? ACCENT : '#fff'),
          'fill-opacity': isSelf ? 0.14 : (isRead ? 0.3 : 1),
          stroke: isSelf ? INK : CELL_RULE,
          'stroke-width': isSelf ? 1.8 : 1
        }, parent);
      }
    }
    const centreOf = ([r, c]) =>
      [x0 + c * cell + cell / 2, y0 + r * cell + cell / 2];
    return { centreOf };
  };

  // ── The circuit, drawn exactly as qcircuit.js would draw it ─────────
  const circuit = (parent, ox, oy, wires, gates) => {
    const rowOf = {};
    wires.forEach((w, i) => { rowOf[w.name] = i; });
    const wireY = (i) => oy + i * ROW;
    const end = ox + gates.length * COL;

    wires.forEach((w, i) => {
      el('line', { x1: ox, y1: wireY(i), x2: end, y2: wireY(i),
        stroke: WIRE, 'stroke-width': 1.5 }, parent);
      const t = el('text', {
        x: ox - 14, y: wireY(i), 'text-anchor': 'end',
        'dominant-baseline': 'central', fill: w.colour || INK,
        'font-family': MONO, 'font-size': 15
      }, parent);
      t.textContent = w.label;
    });

    gates.forEach((g, j) => {
      const gx = ox + (j + 0.5) * COL;
      const ys = g.concat().map((w) => wireY(rowOf[w]));
      const ty = wireY(rowOf[g[g.length - 1]]);
      const top = Math.min(...ys) - (ty <= Math.min(...ys) ? R_TARG : 0);
      const bot = Math.max(...ys) + (ty >= Math.max(...ys) ? R_TARG : 0);
      el('line', { x1: gx, y1: top, x2: gx, y2: bot, stroke: INK,
        'stroke-width': 1.8 }, parent);
      g.slice(0, -1).forEach((w) => el('circle', {
        cx: gx, cy: wireY(rowOf[w]), r: R_CTRL, fill: INK }, parent));
      el('circle', { cx: gx, cy: ty, r: R_TARG, fill: 'none', stroke: INK,
        'stroke-width': 1.8 }, parent);
      el('line', { x1: gx - R_TARG, y1: ty, x2: gx + R_TARG, y2: ty,
        stroke: INK, 'stroke-width': 1.8 }, parent);
    });
  };

  // ── Slide 34: local reads, shallow circuit ──────────────────────────
  const compile = (svg) => {
    const g = el('g', {}, svg);
    const X0 = 159, Y0 = 75, CELL = 30;
    const b = board(g, X0, Y0, 5, CELL,
      [[1, 2], [3, 2], [2, 1], [2, 3]], [2, 2]);

    // Four short wires, neighbour into cell.  Short is the whole point.
    [[1, 2], [3, 2], [2, 1], [2, 3]].forEach((n) => {
      const [nx, ny] = b.centreOf(n);
      const [cx, cy] = b.centreOf([2, 2]);
      const dx = cx - nx, dy = cy - ny;
      const len = Math.hypot(dx, dy);
      const ux = dx / len, uy = dy / len;
      el('line', {
        x1: nx + ux * 9, y1: ny + uy * 9,
        x2: cx - ux * 12, y2: cy - uy * 12,
        stroke: ACCENT, 'stroke-width': 2, 'stroke-linecap': 'round'
      }, g);
      el('polygon', { points: '0,0 -6,-3.4 -6,3.4', fill: ACCENT,
        transform: 'translate(' + (cx - ux * 11) + ',' + (cy - uy * 11) +
          ') rotate(' + (Math.atan2(uy, ux) * 180 / Math.PI) + ')' }, g);
    });
    caption('reads four neighbours', X0 + 75, Y0 + 176, g);

    const OX = 458, OY = 62;
    circuit(g, OX, OY, [
      { name: 'up', label: 'up', colour: ACCENT },
      { name: 'down', label: 'down', colour: ACCENT },
      { name: 'left', label: 'left', colour: ACCENT },
      { name: 'right', label: 'right', colour: ACCENT },
      { name: 'flip', label: 'flip = 0', colour: INK }
    ], [
      ['up', 'down', 'flip'],
      ['left', 'right', 'flip']
    ]);
    caption('shallow', OX + 72, OY + 4 * ROW + 44, g);
  };

  // ── Slide 35: the whole board and its history, deep circuit ─────────
  const tangle = (svg) => {
    const g = el('g', {}, svg);
    const X0 = 64, Y0 = 100, CELL = 30;

    // Earlier positions, stacked behind: history is a place the rule reads.
    [2, 1].forEach((k) => el('rect', {
      x: X0 - k * 16, y: Y0 - k * 16, width: 5 * CELL, height: 5 * CELL,
      fill: '#fff', stroke: CELL_RULE, 'stroke-width': 1,
      opacity: 0.55 / k
    }, g));

    const FAR = [[0, 1], [0, 4], [1, 0], [3, 4], [4, 0], [4, 2], [4, 4]];
    const b = board(g, X0, Y0, 5, CELL, FAR, [2, 2]);
    const [cx, cy] = b.centreOf([2, 2]);

    // Long reads, crossing each other.  The mess is the argument.
    FAR.forEach((n) => {
      const [nx, ny] = b.centreOf(n);
      const dx = cx - nx, dy = cy - ny;
      const len = Math.hypot(dx, dy);
      const ux = dx / len, uy = dy / len;
      el('line', {
        x1: nx + ux * 8, y1: ny + uy * 8,
        x2: cx - ux * 13, y2: cy - uy * 13,
        stroke: ACCENT, 'stroke-width': 1.5, opacity: 0.65,
        'stroke-linecap': 'round'
      }, g);
      el('polygon', { points: '0,0 -6,-3.4 -6,3.4', fill: ACCENT,
        opacity: 0.8,
        transform: 'translate(' + (cx - ux * 12) + ',' + (cy - uy * 12) +
          ') rotate(' + (Math.atan2(uy, ux) * 180 / Math.PI) + ')' }, g);
    });

    // And one read that leaves the present altogether.
    el('path', {
      d: 'M ' + (cx - 12) + ' ' + (cy - 12) + ' Q ' + (X0 - 40) + ' ' +
         (Y0 + 20) + ' ' + (X0 - 26) + ' ' + (Y0 - 24),
      fill: 'none', stroke: ACCENT, 'stroke-width': 1.5, opacity: 0.65,
      'stroke-dasharray': '5,4', 'stroke-linecap': 'round'
    }, g);
    caption('the whole board, and history', X0 + 75, Y0 + 176, g);

    const OX = 296, OY = 21;
    const wires = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7'].map((n) => ({
      name: n, label: n, colour: ACCENT
    })).concat([{ name: 't', label: 't = 0', colour: INK }]);
    circuit(g, OX, OY, wires, [
      ['c1', 'c7', 't'], ['c2', 'c6', 't'], ['c3', 'c5', 't'],
      ['c1', 'c4', 't'], ['c2', 'c7', 't'], ['c3', 'c6', 't']
    ]);
    caption('deep', OX + 3 * COL, OY + 7 * ROW + 44, g);
  };

  const a = document.getElementById('rules-compile-fig');
  if (a) compile(a);
  const b = document.getElementById('rules-tangle-fig');
  if (b) tangle(b);
})();
