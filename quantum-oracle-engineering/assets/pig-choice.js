// pig-choice.js -- slide 2: which move should we choose?
//
// The running example, introduced in pictures.  A four-word header names the
// game.  The scoreboard gives the position (me 62, opponent 71, 12 on the
// table).  A strip of three icons carries the rules with one word each: a
// roll adds to the turn total, a 1 wipes it, a hold keeps it.  Then the two
// options, roll again or hold, with the question mark between them.  The
// note has the rules in sentences.
(function () {
  if (window.__pigChoiceInit) return; window.__pigChoiceInit = true;
  const L = window.L2, D = window.PIG_DATA;
  document.querySelectorAll('svg.pig-choice').forEach((svg) => {
    const root = L.el('g', {}, svg);
    L.text(root, 'Pig, a dice game', 380, 24, { size: 15, weight: 700 });
    const score = (x, label, val, col) => {
      L.text(root, label, x, 56, { size: 12, fill: L.DIM });
      L.text(root, String(val), x, 92, { size: 36, weight: 700, mono: true, fill: col });
    };
    score(190, 'you', D.pos.i, L.BLUE); score(380, 'opponent', D.pos.j, L.INK); score(570, 'this turn', D.pos.k, L.ORANGE);
    // the rules, as three icons
    const rules = L.el('g', {}, root);
    const rule = (x, draw, label, col) => { const g = L.el('g', {}, rules); draw(g, x); L.text(g, label, x, 172, { size: 12, fill: col || L.DIM, weight: 700 }); };
    rule(230, (g, x) => { L.die(g, x - 18, 140, 15, 4, { fill: '#fff', stroke: L.INK }); L.text(g, '+4', x + 16, 140, { size: 14, mono: true, weight: 700, fill: L.GREEN }); }, 'a roll adds');
    rule(380, (g, x) => { L.die(g, x - 18, 140, 15, 1, { fill: L.RED, stroke: L.INK, ink: '#fff' }); L.text(g, '×', x + 14, 140, { size: 18, weight: 700, fill: L.RED }); }, 'a 1 wipes', L.RED);
    rule(530, (g, x) => { L.el('rect', { x: x - 30, y: 128, width: 60, height: 24, rx: 5, fill: '#fff', stroke: L.INK, 'stroke-width': 1.5 }, g); L.text(g, '+12', x, 140, { size: 13, mono: true, weight: 700, fill: L.ORANGE }); }, 'a hold keeps it');
    L.el('line', { x1: 150, y1: 196, x2: 610, y2: 196, stroke: L.FAINT, 'stroke-width': 1 }, root);
    // the two options
    const card = (x, title, glyph) => {
      const g = L.el('g', { opacity: 0 }, root);
      L.el('rect', { x: x - 100, y: 210, width: 200, height: 76, rx: 10, fill: '#fff', stroke: L.INK, 'stroke-width': 1.6 }, g);
      L.text(g, title, x - 24, 248, { size: 18, weight: 700 });
      glyph(g, x + 56, 248);
      return g;
    };
    const A = card(250, 'roll again', (g, x, y) => L.die(g, x, y, 17, 6, { fill: '#fff', stroke: L.INK }));
    const B = card(510, 'hold', (g, x, y) => { L.el('rect', { x: x - 24, y: y - 12, width: 48, height: 24, rx: 5, fill: '#fff', stroke: L.INK, 'stroke-width': 1.5 }, g); L.text(g, '+12', x, y, { size: 13, mono: true, weight: 700, fill: L.ORANGE }); });
    const qm = L.text(root, '?', 380, 252, { size: 40, weight: 700, fill: L.ORANGE, opacity: 0 });
    L.timeline(svg, { T: 2.4, setState: (t) => { A.setAttribute('opacity', L.win(t, 0.4, 0.5)); B.setAttribute('opacity', L.win(t, 0.8, 0.5)); qm.setAttribute('opacity', L.win(t, 1.6, 0.5)); } });
  });
})();
