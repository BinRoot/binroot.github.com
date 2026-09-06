// contract.js -- the access contract, in two states.
//
//   data-state="contract"  slide 12: a contract card with four checked
//                          lines; beside it an ordinary sampling endpoint
//                          fails the last three, one press at a time
//   data-state="missing"   slide 23: the ordinary lever is run backward, a
//                          fresh random bit pops out instead, and the
//                          contract stamps "missing A-dagger"
(function () {
  if (window.__contractInit) return;
  window.__contractInit = true;
  const L = window.L2;
  const LINES = ['bounded payoff', 'coherent  A', 'inverse  A†', 'no measurement, no fresh randomness inside'];

  const check = (g, x, y, ok) => {
    L.el('circle', { cx: x, cy: y, r: 9, fill: ok ? L.GREEN : L.RED }, g);
    if (ok) L.el('path', { d: `M ${x - 4.5} ${y} l 3 3.5 l 6 -7`, fill: 'none', stroke: '#fff', 'stroke-width': 2.2, 'stroke-linecap': 'round' }, g);
    else L.el('path', { d: `M ${x - 4} ${y - 4} l 8 8 M ${x + 4} ${y - 4} l -8 8`, fill: 'none', stroke: '#fff', 'stroke-width': 2.2 }, g);
  };

  const init = (svg) => {
    const state = svg.dataset.state || 'contract';
    const root = L.el('g', {}, svg);
    // ── the contract card ──
    const cx = 40, cy = 30, cw = 330, ch = 240;
    const card = L.el('g', {}, root);
    L.el('rect', { x: cx + 4, y: cy + 6, width: cw, height: ch, rx: 8, fill: '#000', opacity: 0.06 }, card);
    L.el('rect', { x: cx, y: cy, width: cw, height: ch, rx: 8, fill: '#fffdf7', stroke: L.INK, 'stroke-width': 1.5 }, card);
    L.text(card, 'ACCESS CONTRACT', cx + cw / 2, cy + 28, { size: 14, weight: 700, mono: true });
    L.el('line', { x1: cx + 22, y1: cy + 44, x2: cx + cw - 22, y2: cy + 44, stroke: L.RULE }, card);
    LINES.forEach((s, i) => {
      const y = cy + 74 + i * 44;
      check(card, cx + 34, y, true);
      L.text(card, s, cx + 54, y, { anchor: 'start', size: s.length > 24 ? 12 : 15, mono: s.indexOf('A') >= 0 && s.length < 20 });
    });

    // ── the ordinary endpoint ──
    const ex = 430, ew = 300;
    const ep = L.el('g', {}, root);
    L.el('rect', { x: ex, y: cy, width: ew, height: ch, rx: 8, fill: '#f6f6f6', stroke: L.RULE, 'stroke-width': 1.5 }, ep);
    L.text(ep, 'ordinary sampling endpoint', ex + ew / 2, cy + 28, { size: 13, weight: 700, fill: L.DIM });
    L.el('line', { x1: ex + 22, y1: cy + 44, x2: ex + ew - 22, y2: cy + 44, stroke: L.RULE }, ep);
    // a black box with an output wire and a coin
    const bx = ex + 40, by = cy + 64;
    L.el('rect', { x: bx, y: by, width: 70, height: 46, rx: 6, fill: L.INK }, ep);
    L.text(ep, 'sample()', bx + 35, by + 23, { size: 11, fill: '#fff', mono: true });
    L.el('line', { x1: bx + 70, y1: by + 23, x2: bx + 118, y2: by + 23, stroke: L.WIRE, 'stroke-width': 2 }, ep);
    const coin = L.el('circle', { cx: bx + 132, cy: by + 23, r: 10, fill: L.BLUE }, ep);
    const coinLab = L.text(ep, 'X', bx + 132, by + 23, { size: 11, fill: '#fff', weight: 700 });
    const marks = LINES.map((s, i) => {
      const g = L.el('g', { class: state === 'contract' && i > 0 ? 'step' : '' }, ep);
      const y = cy + 130 + i * 30;
      check(g, ex + 34, y, i === 0);
      L.text(g, s.length > 24 ? 'measures, resamples' : s, ex + 54, y, { anchor: 'start', size: 13, fill: i === 0 ? L.INK : L.RED, mono: i > 0 && i < 3 });
      return g;
    });

    if (state === 'contract') return;

    // ── missing: try to run the lever backward ──
    const back = L.el('path', { d: `M ${bx + 118} ${by + 23} C ${bx + 160} ${by - 30}, ${bx + 40} ${by - 40}, ${bx + 20} ${by - 2}`,
      fill: 'none', stroke: L.RED, 'stroke-width': 2.2, 'stroke-dasharray': '6 4', opacity: 0 }, ep);
    L.el('polygon', { points: `${bx + 20},${by - 2} ${bx + 14},${by - 16} ${bx + 30},${by - 12}`, fill: L.RED, opacity: 0 }, ep);
    const backArrow = ep.lastChild;
    const question = L.text(ep, 'A† ?', bx + 90, by - 34, { size: 15, fill: L.RED, mono: true, weight: 700, opacity: 0 });
    const fresh = L.el('g', { opacity: 0 }, ep);
    L.el('circle', { cx: bx + 132, cy: by + 23, r: 10, fill: L.GRAY }, fresh);
    L.text(fresh, 'X′', bx + 132, by + 23, { size: 11, fill: '#fff', weight: 700 });
    L.text(fresh, 'a fresh random bit', bx + 200, by + 23, { size: 12, fill: L.DIM, anchor: 'start' });
    // stamp on the contract
    const stamp = L.el('g', { opacity: 0 }, root);
    L.el('rect', { x: -96, y: -22, width: 192, height: 44, rx: 6, fill: 'none', stroke: L.RED, 'stroke-width': 4 }, stamp);
    L.text(stamp, 'MISSING  A†', 0, 1, { size: 22, weight: 700, fill: L.RED, mono: true });

    const setState = (t) => {
      const o = L.win(t, 0.4, 0.5);
      back.setAttribute('opacity', o); backArrow.setAttribute('opacity', o);
      question.setAttribute('opacity', L.win(t, 1.0, 0.3));
      const f = L.win(t, 1.6, 0.4);
      fresh.setAttribute('opacity', f);
      coin.setAttribute('opacity', 1 - f); coinLab.setAttribute('opacity', 1 - f);
      // stamp slams in with a little overshoot
      const s = L.win(t, 2.4, 0.5, L.backOut);
      stamp.setAttribute('opacity', t > 2.4 ? 1 : 0);
      stamp.setAttribute('transform', `translate(${cx + cw / 2},${cy + 160}) rotate(-12) scale(${L.lerp(1.8, 1, s)})`);
    };
    L.timeline(svg, { T: 3.4, setState });
  };
  document.querySelectorAll('svg.contract-fig').forEach(init);
})();
