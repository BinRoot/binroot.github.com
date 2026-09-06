// evidence-meter.js -- slides 18 and 19: the change-of-measure argument as
// evidence meters.
//
//   data-mode="one"  slide 18: two nearly identical coins feed one meter;
//                    each pull adds a Theta(eps^2) sliver of KL information,
//                    and the meter reaches its decision threshold only after
//                    order 1/eps^2 pulls.  The paper's constants sit beneath
//                    as three separate presses (kl-1/2/3.svg in the fragment).
//   data-mode="all"  slide 19: k-1 meters, one per contender; every one must
//                    cross, and the counter sums to Omega(k/eps^2).
(function () {
  if (window.__meterInit) return;
  window.__meterInit = true;
  const L = window.L2;

  const coin = (g, x, y, r, label, fill) => {
    L.el('circle', { cx: x, cy: y, r, fill: fill || '#fff', stroke: L.INK, 'stroke-width': 1.4 }, g);
    L.text(g, label, x, y, { size: r * 0.7, mono: true, weight: 700, fill: fill ? '#fff' : L.INK });
  };
  const meter = (parent, x, y, w, h) => {
    const g = L.el('g', {}, parent);
    L.el('rect', { x, y, width: w, height: h, rx: 6, fill: '#fff', stroke: L.INK, 'stroke-width': 1.4 }, g);
    const fill = L.el('rect', { x: x + 3, y: y + h - 3, width: w - 6, height: 0, rx: 4, fill: L.BLUE, opacity: 0.85 }, g);
    const thr = y + h * 0.18;
    L.el('line', { x1: x - 8, y1: thr, x2: x + w + 8, y2: thr, stroke: L.RED, 'stroke-width': 2, 'stroke-dasharray': '5 3' }, g);
    return { g, set: (u) => { const hh = (h - 6) * L.clamp01(u); fill.setAttribute('y', y + h - 3 - hh); fill.setAttribute('height', hh); }, thr, x, y, w, h };
  };

  const init = (svg) => {
    const mode = svg.dataset.mode || 'one';
    const root = L.el('g', {}, svg);
    const PULLS = 24;                       // pulls shown before the threshold

    if (mode === 'one') {
      coin(root, 120, 90, 40, '½', null);
      coin(root, 250, 90, 40, '½+6ε', L.BLUE);
      const m = meter(root, 470, 40, 90, 220);
      L.text(root, 'decision threshold', 470 + 45, m.thr - 12, { size: 11, fill: L.RED });
      L.text(root, 'kl(⅓, ⅔)', 590, m.thr, { anchor: 'start', size: 12, fill: L.RED, mono: true });
      const sliver = L.text(root, '+ Θ(ε²) per pull', 515, 292, { size: 13, mono: true, fill: L.BLUE });
      const counter = L.text(root, 'pulls: 0', 185, 200, { size: 20, mono: true, weight: 700 });
      const scale = L.text(root, '', 185, 232, { size: 13, mono: true, fill: L.DIM });
      const flying = L.el('circle', { r: 5, fill: L.BLUE, opacity: 0 }, root);
      const setState = (t) => {
        const n = Math.min(PULLS, Math.floor(t / 0.22));
        m.set(0.82 * n / PULLS);
        counter.textContent = `pulls: ${n}`;
        scale.textContent = n >= PULLS ? '≈ 1/ε² of them' : '';
        const f = (t / 0.22) % 1;
        flying.setAttribute('opacity', n < PULLS ? 1 : 0);
        flying.setAttribute('cx', L.lerp(290, 470, f)); flying.setAttribute('cy', L.lerp(90, 250 - 0.82 * 214 * n / PULLS, f) - 40 * Math.sin(Math.PI * f));
      };
      L.timeline(svg, { T: PULLS * 0.22 + 0.8, setState });
      return;
    }

    // all: k-1 meters
    const K = 7, W = 48, GAP = 26, X0 = 380 - ((K - 1) * (W + GAP) - GAP) / 2;
    const meters = [];
    for (let j = 1; j < K; j++) {
      const x = X0 + (j - 1) * (W + GAP);
      const mm = meter(root, x, 60, W, 170);
      L.text(root, `arm ${j}`, x + W / 2, 250, { size: 12, mono: true, fill: L.DIM });
      meters.push(mm);
    }
    const total = L.text(root, '', 380, 290, { size: 20, mono: true, weight: 700 });
    const setState = (t) => {
      let sum = 0;
      meters.forEach((mm, i) => {
        const u = L.win(t, 0.3 + i * 0.35, 1.6, L.outQuart);
        mm.set(0.82 * u);
        sum += Math.round(u * PULLS);
      });
      total.textContent = t > 3.2 ? `(k−1) · Ω(1/ε²)  =  Ω(k/ε²)` : `pulls so far: ${sum}`;
    };
    L.timeline(svg, { T: 4.4, setState });
  };
  document.querySelectorAll('svg.meter-fig').forEach(init);
})();
