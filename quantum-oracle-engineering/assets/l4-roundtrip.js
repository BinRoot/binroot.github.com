// l4-roundtrip.js -- slide 18: backward cannot catch a forward bug.
//
// Six register bars.  Forward, they fill as the shortcut circuit writes them;
// backward, the mirrored circuit empties every one, because the inverse of a
// unitary is exact.  A green check for the round trip, then the answer the
// forward pass computed, in red, beside the one the game has.
(function () {
  if (window.__l4RoundtripInit) return; window.__l4RoundtripInit = true;
  const L = window.L2;
  const REGS = [['dice', 0.9, L.PURPLE], ['boards', 0.7, L.WOOD], ['moves', 0.8, L.GOLD], ['ranks', 0.6, L.BLUE], ['scratch', 0.5, L.ORANGE], ['payoff', 1, L.GREEN]];
  document.querySelectorAll('svg.l4-roundtrip').forEach((svg) => {
    const root = L.el('g', {}, svg);
    const X0 = 90, BW = 62, GAP = 22, BASE = 190, HMAX = 120;
    L.el('line', { x1: X0 - 20, y1: BASE, x2: X0 + 6 * (BW + GAP), y2: BASE, stroke: L.INK, 'stroke-width': 1.4 }, root);
    L.text(root, 'zero', X0 - 30, BASE, { anchor: 'end', size: 12, fill: L.DIM });
    const bars = REGS.map(([n, h, col], i) => {
      const x = X0 + i * (BW + GAP);
      L.text(root, n, x + BW / 2, BASE + 18, { size: 12, fill: L.DIM });
      return { r: L.el('rect', { x, y: BASE, width: BW, height: 0, fill: col, opacity: 0.85 }, root), h: h * HMAX };
    });
    const phase = L.text(root, 'forward', 380, 30, { size: 16, weight: 700, mono: true });
    const check = L.el('g', { opacity: 0 }, root);
    L.el('circle', { cx: 276, cy: 226, r: 11, fill: L.GREEN }, check);
    L.el('path', { d: 'M 270 226 l 4.5 4.5 l 8 -9', fill: 'none', stroke: '#fff', 'stroke-width': 2.2, 'stroke-linecap': 'round' }, check);
    L.text(check, 'round trip: every register back to zero', 296, 226, { anchor: 'start', size: 14, weight: 700, fill: L.GREEN });
    const ans = L.el('g', { opacity: 0 }, root);
    L.el('polygon', { points: '276,246 287,258 276,270 265,258', fill: L.RED }, ans);
    L.text(ans, 'the forward pass answered .275; the game says .271', 296, 258, { anchor: 'start', size: 14, weight: 700, fill: L.RED });
    L.text(ans, 'the inverse checked nothing, and could not have', 380, 286, { size: 12, fill: L.DIM, italic: true });
    const FWD = 2.2, BWD = 2.2, T = FWD + BWD + 2.2;
    const setState = (t) => {
      let f;
      if (t < FWD) f = L.outQuart(t / FWD); else if (t < FWD + BWD) f = 1 - L.outQuart((t - FWD) / BWD); else f = 0;
      bars.forEach((b) => { b.r.setAttribute('height', b.h * f); b.r.setAttribute('y', BASE - b.h * f); });
      phase.textContent = t < FWD ? 'forward' : t < FWD + BWD ? 'backward' : 'back at zero';
      phase.setAttribute('fill', t < FWD ? L.INK : L.BLUE);
      check.setAttribute('opacity', L.win(t, FWD + BWD + 0.2, 0.4));
      ans.setAttribute('opacity', L.win(t, FWD + BWD + 1.2, 0.5));
    };
    L.timeline(svg, { T, setState });
  });
})();
