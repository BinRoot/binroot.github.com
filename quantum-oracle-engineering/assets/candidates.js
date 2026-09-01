// candidates.js -- slides 26 and 27: two candidate actions, one question.
//
// Two states of one figure, driven by data-state:
//
//   apart (29) two well separated distributions; the gap is obvious and a
//              rough estimate would settle it
//   close (30) the same two distributions slide together until they almost
//              coincide; the bracket beneath the axis shrinks to a sliver
//
// Slides 31 and 32 continue the argument in assets/precision.js, on a figure
// that can show the samples themselves.  An earlier version handled those
// two states here by zooming the axis, which pushed the samples off frame
// and left a slide titled "one hundred samples" with no samples on it.
(function () {
  if (window.__candInit) return;
  window.__candInit = true;

  const ns = 'http://www.w3.org/2000/svg';
  const INK = '#2d3140';
  const RULE = '#bbb';
  const FAINT = '#c9ced6';
  const A_C = '#456AAD';           // candidate A
  const B_C = '#9F4668';           // candidate B
  const WARN = '#D95032';

  const AXIS_Y = 232, X0 = 60, X1 = 700;
  const SIG = 78;                  // bell width
  const APART = [250, 510], CLOSE = [366, 394];

  const el = (name, attrs, parent) => {
    const node = document.createElementNS(ns, name);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    parent.appendChild(node);
    return node;
  };
  const clamp01 = (u) => Math.max(0, Math.min(1, u));
  const lerp = (a, b, u) => a + (b - a) * u;
  const outQuart = (u) => 1 - Math.pow(1 - u, 4);
  const backOut = (u) => {
    const p = u - 1, k = 2.2;
    return 1 + (k + 1) * p * p * p + k * p * p;
  };

  const bellPath = (mu, sig, h) => {
    let d = '';
    for (let x = X0; x <= X1; x += 6) {
      const y = AXIS_Y - h * Math.exp(-0.5 * Math.pow((x - mu) / sig, 2));
      d += (d ? ' L ' : 'M ') + x.toFixed(1) + ' ' + y.toFixed(1);
    }
    return d + ` L ${X1} ${AXIS_Y} L ${X0} ${AXIS_Y} Z`;
  };

  const init = (svg) => {
    const state = svg.dataset.state || 'apart';
    const T_END = 3.6;

    const root = el('g', {}, svg);
    el('line', { x1: X0 - 8, y1: AXIS_Y, x2: X1 + 8, y2: AXIS_Y,
      stroke: RULE, 'stroke-width': 2 }, root);

    const bells = [A_C, B_C].map((c) => el('path', {
      d: '', fill: c, 'fill-opacity': 0.16, stroke: c,
      'stroke-width': 2.2 }, root));
    const ticks = [A_C, B_C].map((c) => el('line', {
      x1: 0, y1: AXIS_Y + 8, x2: 0, y2: AXIS_Y - 96, stroke: c,
      'stroke-width': 2, 'stroke-dasharray': '4,4', opacity: 0 }, root));
    const bracket = el('path', { d: '', fill: 'none', stroke: INK,
      'stroke-width': 2, opacity: 0 }, root);

    const setState = (t) => {
      const slide = state === 'close'
        ? outQuart(clamp01((t - 0.75) / 1.1)) : 0;
      const mus = [lerp(APART[0], CLOSE[0], slide),
                   lerp(APART[1], CLOSE[1], slide)];
      const rise = clamp01(t / 0.55);
      bells.forEach((p, i) => {
        const h = 118 * backOut(Math.max(0.001, rise));
        p.setAttribute('d', bellPath(mus[i], SIG, h));
        p.setAttribute('opacity', rise);
      });
      ticks.forEach((tk, i) => {
        tk.setAttribute('x1', mus[i]);
        tk.setAttribute('x2', mus[i]);
        tk.setAttribute('opacity', clamp01((t - 0.5) / 0.3) * 0.85);
      });
      // The bracket is the gap: wide in one state, a sliver in the other.
      const bu = clamp01((t - (state === 'close' ? 1.9 : 0.9)) / 0.35);
      const y = AXIS_Y + 30;
      bracket.setAttribute('d',
        `M ${mus[0]} ${y - 7} L ${mus[0]} ${y} L ${mus[1]} ${y} ` +
        `L ${mus[1]} ${y - 7}`);
      bracket.setAttribute('opacity', bu);
      bracket.setAttribute('stroke-width', 2 + 1.5 * Math.sin(
        Math.PI * clamp01((t - 2.2) / 0.6)) * (state === 'close' ? 1 : 0));
    };

    // ── Replay control ──
    const RB = { x: 722, y: 274, r: 14 };
    const replay = el('g', { class: 'no-nav', cursor: 'pointer',
      role: 'button', 'aria-label': 'replay' }, svg);
    el('circle', { cx: RB.x, cy: RB.y, r: RB.r, fill: '#fff', stroke: RULE,
      'stroke-width': 1.5 }, replay);
    el('path', { d: 'M 4 -6.93 A 8 8 0 1 1 -6.93 -4', fill: 'none',
      stroke: INK, 'stroke-width': 2, 'stroke-linecap': 'round',
      transform: 'translate(' + RB.x + ',' + RB.y + ')' }, replay);
    el('polygon', { points: '6.6,-5.4 5.25,-9.1 2.75,-4.8', fill: INK,
      transform: 'translate(' + RB.x + ',' + RB.y + ')' }, replay);

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setState(T_END);
      replay.setAttribute('display', 'none');
      return;
    }

    let playing = false, elapsed = 0, last = performance.now();
    const play = () => { elapsed = 0; playing = true; };
    replay.addEventListener('click', play);

    const slide = svg.closest('.slide');
    if (slide) {
      setState(0);
      if (slide.classList.contains('current')) play();
      new MutationObserver(() => {
        if (slide.classList.contains('current')) {
          if (!playing && elapsed === 0) play();
        } else { playing = false; elapsed = 0; setState(0); }
      }).observe(slide, { attributes: true, attributeFilter: ['class'] });
    } else { play(); }

    const frame = (now) => {
      requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      replay.setAttribute('opacity', playing ? 0.4 : 1);
      if (document.hidden || !playing) return;
      elapsed += dt;
      if (elapsed >= T_END) { elapsed = T_END; playing = false; }
      setState(elapsed);
    };
    requestAnimationFrame(frame);
  };

  document.querySelectorAll('svg.candidates-fig').forEach(init);
})();
