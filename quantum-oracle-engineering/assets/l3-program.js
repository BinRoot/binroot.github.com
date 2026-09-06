// l3-program.js -- the classical rollout in ten lines, the spine of Lesson 3.
//
// Drawn as a code card with a gutter and syntax colour: keywords purple,
// numbers blue, the two random ingredients orange (a random cell, a d20),
// the two players in ink.  The same card appears on the opening slide with
// nothing lit and at the head of each translation segment with that
// segment's lines on a gold bar and a "today" bracket; unlit lines dim.
(function () {
  if (window.__l3ProgramInit) return;
  window.__l3ProgramInit = true;
  const L = window.L2;
  // tokens: [text, kind]  kinds: kw, num, rnd, id, op, pl (player)
  const LINES = [
    [['board', 'id'], [' = ', 'op'], ['start', 'id']],
    [['for', 'kw'], [' h ', 'id'], ['in', 'kw'], [' 1..H', 'num'], [':', 'op']],
    [['    ', 'id'], ['black', 'pl'], [' places on a ', 'id'], ['random', 'rnd'], [' empty cell', 'id']],
    [['    ', 'id'], ['white', 'pl'], [' places on a ', 'id'], ['random', 'rnd'], [' empty cell', 'id']],
    [['    ', 'id'], ['for', 'kw'], [' every stone', 'id'], [':', 'op']],
    [['        ', 'id'], ['roll', 'rnd'], [' a ', 'id'], ['d20', 'rnd']],
    [['        ', 'id'], ['count', 'id'], [' its friendly neighbors', 'id']],
    [['        ', 'id'], ['if', 'kw'], [' die ', 'id'], ['<', 'op'], [' 4 ', 'num'], ['-', 'op'], [' friends', 'id'], [':', 'op'], [' mark it', 'id']],
    [['    ', 'id'], ['flip', 'id'], [' every marked stone', 'id']],
    [['return', 'kw'], [' black ', 'pl'], ['>', 'op'], [' white', 'pl']]
  ];
  const COLOR = { kw: L.PURPLE, num: L.BLUE, rnd: L.ORANGE, id: L.INK, op: L.DIM, pl: L.INK };
  const WEIGHT = { kw: 700, num: 600, rnd: 700, id: 400, op: 400, pl: 700 };
  const queue = window.__l3ProgramQueue || [];
  document.querySelectorAll('svg.l3-program').forEach((svg, k) => {
    const lit = new Set(String(queue[k] || '0').split(',').map((s) => +s).filter((n) => n > 0));
    const any = lit.size > 0;
    const root = L.el('g', {}, svg);
    const CX = 118, CY = 14, CWID = 540, CH = 274, GUT = 44, X = CX + GUT + 16, Y0 = CY + 30, DY = 25.4;
    // the card and its gutter
    L.el('rect', { x: CX, y: CY, width: CWID, height: CH, rx: 10, fill: '#fffdf8', stroke: L.RULE, 'stroke-width': 1.2 }, root);
    L.el('rect', { x: CX, y: CY, width: GUT, height: CH, rx: 10, fill: '#f1eee6' }, root);
    L.el('rect', { x: CX + GUT - 10, y: CY, width: 10, height: CH, fill: '#f1eee6' }, root);
    L.el('line', { x1: CX + GUT, y1: CY + 1, x2: CX + GUT, y2: CY + CH - 1, stroke: '#e3dfd4' }, root);
    LINES.forEach((toks, i) => {
      const y = Y0 + i * DY, on = lit.has(i + 1);
      if (on) L.el('rect', { x: CX + GUT + 1, y: y - 12, width: CWID - GUT - 2, height: 24, fill: L.GOLD, opacity: 0.32 }, root);
      L.text(root, String(i + 1), CX + GUT - 14, y, { anchor: 'end', size: 12, mono: true, fill: on ? L.INK : '#a8a49b' });
      // one text element per line, coloured spans inside it, spaces kept as
      // non-breaking spaces so the monospace advance is the font's own
      const line = L.el('text', { x: X, y, 'text-anchor': 'start', 'dominant-baseline': 'middle', 'font-family': L.MONO, 'font-size': 16 }, root);
      toks.forEach(([s, kind]) => {
        const sp = L.el('tspan', { fill: any && !on ? '#b3afa6' : COLOR[kind], 'font-weight': WEIGHT[kind] }, line);
        sp.textContent = s.replace(/ /g, '\u00a0');
      });
    });
    if (any) {
      const first = Math.min(...lit), last = Math.max(...lit);
      const y0 = Y0 + (first - 1) * DY, y1 = Y0 + (last - 1) * DY;
      L.el('path', { d: `M ${CX + CWID + 12} ${y0 - 12} h 10 V ${y1 + 12} h -10`, fill: 'none', stroke: L.ORANGE, 'stroke-width': 2 }, root);
      L.text(root, 'today', CX + CWID + 32, (y0 + y1) / 2, { anchor: 'start', size: 13, weight: 700, fill: L.ORANGE });
    }
  });
})();
