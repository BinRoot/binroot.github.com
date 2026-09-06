// pig-rollout.js -- slide 3: play one possible future.
//
// From the position, choose "roll", then let both players follow hold-at-20
// to the end.  Two score tracks fill toward 100, a die shows every roll, the
// turn total grows and is wiped by a 1.  The game ends in a loss, stamped 0.
// Then the same position and the same first move play again with the next
// dice, and end in a win, stamped 1.  The two rollouts are the first two of
// the seeded sequence the generated numbers use.
(function () {
  if (window.__pigRolloutInit) return; window.__pigRolloutInit = true;
  const L = window.L2, D = window.PIG_DATA, P = window.PIG;
  const rnd = P.prng(D.seed);
  const R = [P.rollout(D.pos.i, D.pos.j, D.pos.k, 'roll', rnd), P.rollout(D.pos.i, D.pos.j, D.pos.k, 'roll', rnd)];
  document.querySelectorAll('svg.pig-rollout').forEach((svg) => {
    const root = L.el('g', {}, svg);
    const X0 = 150, X1 = 640, sx = (v) => X0 + (X1 - X0) * Math.min(v, 100) / 100;
    const track = (y, label, col) => {
      L.text(root, label, X0 - 16, y, { anchor: 'end', size: 14, weight: 700, fill: col });
      L.el('rect', { x: X0, y: y - 9, width: X1 - X0, height: 18, rx: 9, fill: '#eee' }, root);
      L.el('line', { x1: X1, y1: y - 16, x2: X1, y2: y + 16, stroke: L.INK, 'stroke-width': 1.5 }, root);
      L.text(root, '100', X1 + 16, y, { size: 12, fill: L.DIM, mono: true });
      const bar = L.el('rect', { x: X0, y: y - 9, width: 0, height: 18, rx: 9, fill: col }, root);
      const pend = L.el('rect', { x: X0, y: y - 9, width: 0, height: 18, rx: 9, fill: L.ORANGE, opacity: 0.6 }, root);
      const num = L.text(root, '', X0, y - 22, { size: 12, mono: true, fill: col, weight: 700 });
      return { bar, pend, num, y };
    };
    const me = track(70, 'you', L.BLUE), op = track(130, 'opponent', L.INK);
    const dieG = L.el('g', {}, root);
    const turnT = L.text(root, '', 380, 222, { size: 14, fill: L.DIM });
    const stamp = L.el('g', { opacity: 0 }, root);
    const stampR = L.el('rect', { x: 300, y: 250, width: 160, height: 44, rx: 8, fill: '#fff', stroke: L.GREEN, 'stroke-width': 2 }, stamp);
    const stampT = L.text(stamp, '', 380, 272, { size: 20, weight: 700, mono: true, fill: L.GREEN });
    const which = L.text(root, 'rollout 1', 380, 30, { size: 14, weight: 700, mono: true });
    const STEP = 0.22, GAPT = 1.4;
    const lens = R.map((r) => r.trace.length);
    const T = (lens[0] + lens[1]) * STEP + GAPT + 1.6;
    const paint = (ri, k) => {
      const r = R[ri], ev = k >= 0 ? r.trace[Math.min(k, r.trace.length - 1)] : null;
      const meS = ev ? ev.me : D.pos.i, opS = ev ? ev.op : D.pos.j;
      const turn = ev && ev.die !== undefined ? ev.turn : 0, who = ev ? ev.who : 'me';
      me.bar.setAttribute('width', sx(meS) - X0); op.bar.setAttribute('width', sx(opS) - X0);
      me.num.textContent = String(meS); me.num.setAttribute('x', sx(meS)); op.num.textContent = String(opS); op.num.setAttribute('x', sx(opS));
      const tr = who === 'me' ? me : op, other = who === 'me' ? op : me;
      const base = who === 'me' ? meS : opS;
      tr.pend.setAttribute('x', sx(base)); tr.pend.setAttribute('width', Math.max(0, sx(base + (k < 0 ? D.pos.k : turn)) - sx(base)));
      other.pend.setAttribute('width', 0);
      dieG.textContent = '';
      if (ev && ev.die !== undefined) L.die(dieG, 380, 185, 24, ev.die, { fill: ev.bust ? L.RED : '#fff', stroke: L.INK, ink: ev.bust ? '#fff' : L.INK });
      turnT.textContent = k < 0 ? `your turn total: ${D.pos.k}, you roll` : ev.bust ? (who === 'me' ? 'a 1: your turn total is wiped' : 'a 1: the opponent busts') : ev.hold !== undefined ? (who === 'me' ? `you hold, +${ev.hold}` : `opponent holds, +${ev.hold}`) : (who === 'me' ? `your turn total: ${turn}` : `opponent's turn total: ${turn}`);
      which.textContent = `rollout ${ri + 1}`;
    };
    const setState = (t) => {
      let ri = 0, k = Math.floor(t / STEP) - 1, done = false;
      if (t >= lens[0] * STEP + GAPT) { ri = 1; k = Math.floor((t - lens[0] * STEP - GAPT) / STEP) - 1; }
      const r = R[ri];
      if (k >= r.trace.length - 1) { k = r.trace.length - 1; done = true; }
      paint(ri, k);
      stamp.setAttribute('opacity', done ? 1 : 0);
      stampT.textContent = r.win ? 'win = 1' : 'loss = 0';
      stampT.setAttribute('fill', r.win ? L.GREEN : L.RED); stampR.setAttribute('stroke', r.win ? L.GREEN : L.RED);
    };
    L.timeline(svg, { T, setState });
  });
})();
