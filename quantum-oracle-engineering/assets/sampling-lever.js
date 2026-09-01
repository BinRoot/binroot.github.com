// sampling-lever.js -- slide 9's lever board, staged in depth.
//
// Three levers.  The two believed-exponential ones (molecule: simulation,
// padlock: factoring) stand in the BACKGROUND: proportionally taller levers,
// but far away, so they render small and slightly faded.  The precision lever
// (die) stands in the FOREGROUND, big because it is near, near because it is
// the one a practitioner can reach today.  It pulls itself; the sample cloud
// above collapses into one glowing estimate; everything resets.  Fixed
// timeline, no randomness; reduced motion renders the pulled-and-collapsed
// frame.
(function () {
  const svg = document.getElementById('sampling-lever');
  if (!svg) return;

  const ns = 'http://www.w3.org/2000/svg';
  const INK = '#2d3140';
  const RULE = '#bbb';
  const ACCENT = '#456AAD';
  const GLOW_FILL = '#F2BF80';
  const GLOW_EDGE = '#D95032';

  const CLOUD = { x: 380, y: 88 };
  const PULL_DEG = 52;

  // Depth staging: far levers are proportionally taller (len) yet render
  // smaller (s); the near lever is shorter in its own units and largest on
  // screen.
  const LEVERS = [
    { x: 225, y: 148, s: 0.62, live: false, len: 84, tag: 'molecule' },
    { x: 535, y: 148, s: 0.62, live: false, len: 84, tag: 'padlock' },
    { x: 380, y: 240, s: 1.25, live: true, len: 60, tag: 'die' }
  ];

  const el = (name, attrs, parent) => {
    const node = document.createElementNS(ns, name);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    (parent || svg).appendChild(node);
    return node;
  };
  const lerp = (a, b, u) => a + (b - a) * u;
  const clamp01 = (u) => Math.max(0, Math.min(1, u));
  const ease = (u) => u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;

  // ── Gradients: sphere knobs, metal arms ─────────────────────────────
  const defs = el('defs', {});
  const knobGrad = (id, hi, lo) => {
    const g = el('radialGradient', { id, cx: '35%', cy: '30%', r: '75%' }, defs);
    el('stop', { offset: '0%', 'stop-color': hi }, g);
    el('stop', { offset: '100%', 'stop-color': lo }, g);
  };
  knobGrad('slv-knob-live', '#8aa8dd', '#2c4573');
  knobGrad('slv-knob-gray', '#dcdfe4', '#8f949c');
  const armGrad = (id, hi, lo) => {
    const g = el('linearGradient', { id, x1: 0, y1: 0, x2: 1, y2: 0 }, defs);
    el('stop', { offset: '0%', 'stop-color': hi }, g);
    el('stop', { offset: '55%', 'stop-color': lo }, g);
    el('stop', { offset: '100%', 'stop-color': hi }, g);
  };
  armGrad('slv-arm-live', '#5a6172', '#262a34');
  armGrad('slv-arm-gray', '#cdd0d6', '#989ea7');

  // ── One lever, drawn in local coordinates (pivot at the origin) ────
  const drawLever = (cfg) => {
    const outer = el('g', {
      transform: 'translate(' + cfg.x + ',' + cfg.y + ') scale(' + cfg.s + ')',
      opacity: cfg.live ? 1 : 0.78
    });
    el('ellipse', { cx: 0, cy: 20, rx: 36, ry: 5,
      fill: '#000', opacity: 0.07 }, outer);
    el('rect', { x: -30, y: 4, width: 60, height: 14, rx: 3,
      fill: '#e2e4e8', stroke: RULE, 'stroke-width': 1 }, outer);
    el('polygon', { points: '-30,4 30,4 23,-4 -23,-4',
      fill: '#f3f4f6', stroke: RULE, 'stroke-width': 1 }, outer);
    el('ellipse', { cx: 0, cy: 0, rx: 12, ry: 3.5, fill: '#3a3d45' }, outer);

    const arm = el('g', {}, outer);
    el('polygon', { points:
      '-3.5,0 3.5,0 2,' + (-cfg.len) + ' -2,' + (-cfg.len),
      fill: 'url(#slv-arm-' + (cfg.live ? 'live' : 'gray') + ')' }, arm);
    const kr = cfg.live ? 9 : 10;
    el('circle', { cx: 0, cy: -cfg.len, r: kr,
      fill: 'url(#slv-knob-' + (cfg.live ? 'live' : 'gray') + ')' }, arm);
    el('ellipse', { cx: -kr * 0.3, cy: -cfg.len - kr * 0.35,
      rx: kr * 0.3, ry: kr * 0.2, fill: '#fff', opacity: 0.55 }, arm);

    // Icon tag on the pedestal's apron.
    const t = el('g', { opacity: cfg.live ? 1 : 0.4 }, outer);
    const c = '#4a4a4a';
    if (cfg.tag === 'molecule') {
      const pts = [];
      for (let k = 0; k < 6; k++) {
        const a = Math.PI / 2 + k * Math.PI / 3;
        pts.push((10 * Math.cos(a)).toFixed(1) + ',' +
                 (40 - 10 * Math.sin(a)).toFixed(1));
      }
      el('polygon', { points: pts.join(' '),
        fill: 'none', stroke: c, 'stroke-width': 1.6 }, t);
      el('circle', { cx: 0, cy: 40, r: 4.5,
        fill: 'none', stroke: c, 'stroke-width': 1.4 }, t);
    } else if (cfg.tag === 'padlock') {
      el('rect', { x: -8, y: 36, width: 16, height: 12, rx: 2.5,
        fill: 'none', stroke: c, 'stroke-width': 1.6 }, t);
      el('path', { d: 'M -4 36 v -4 a 4 4 0 0 1 8 0 v 4',
        fill: 'none', stroke: c, 'stroke-width': 1.6 }, t);
    } else {
      el('rect', { x: -9, y: 31, width: 18, height: 18, rx: 4,
        fill: ACCENT }, t);
      [[-4, -4], [4, 4], [-4, 4], [4, -4], [0, 0]].forEach(([dx, dy]) =>
        el('circle', { cx: dx, cy: 40 + dy, r: 1.5, fill: '#fff' }, t));
    }
    return arm;
  };

  // Background levers first, cloud in the middle plane, live lever last.
  drawLever(LEVERS[0]);
  drawLever(LEVERS[1]);

  const SCATTER = [
    [-96, -30], [78, -42], [-52, 28], [112, 12], [-120, -4], [34, 40],
    [-18, -46], [96, -14], [-76, -44], [56, 24], [-34, 44], [130, -34],
    [8, -26], [-108, 32]
  ];
  const halo = el('circle', { cx: CLOUD.x, cy: CLOUD.y, r: 13,
    fill: GLOW_FILL, opacity: 0 });
  const estimate = el('circle', { cx: CLOUD.x, cy: CLOUD.y, r: 4,
    fill: INK });
  const dots = SCATTER.map(() => el('circle', {
    cx: CLOUD.x, cy: CLOUD.y, r: 3, fill: ACCENT, opacity: 0.65 }));

  const liveArm = drawLever(LEVERS[2]);

  // Labels stay in screen space at a uniform, readable size: captions are
  // for reading, the levers carry the depth.
  const label = (cfg, name) => {
    const t = el('text', {
      x: cfg.x, y: cfg.live ? 318 : 198, 'text-anchor': 'middle',
      fill: '#888', 'font-size': 13, 'font-weight': 600,
      'font-family': "'Ubuntu', sans-serif", opacity: cfg.live ? 1 : 0.75
    });
    t.textContent = name;
    return t;
  };
  label(LEVERS[0], 'simulation');
  label(LEVERS[1], 'factoring');
  label(LEVERS[2], 'precision');

  const setState = (t) => {
    // Lever angle: pulls at 1.2-2.0, springs back at 4.2-5.0.
    let pull;
    if (t < 1.2) pull = 0;
    else if (t < 2.0) pull = ease((t - 1.2) / 0.8);
    else if (t < 4.2) pull = 1;
    else if (t < 5.0) pull = 1 - ease((t - 4.2) / 0.8);
    else pull = 0;
    liveArm.setAttribute('transform',
      'rotate(' + (pull * PULL_DEG) + ' 0 0)');

    // The cloud converges as the lever lands, staggered per dot, and
    // rescatters as it releases.
    dots.forEach((d, i) => {
      let conv;
      if (t < 4.2) conv = ease(clamp01((t - 1.6 - i * 0.05) / 1.0));
      else conv = 1 - ease(clamp01((t - 4.2) / 0.8));
      const [dx, dy] = SCATTER[i];
      d.setAttribute('transform',
        'translate(' + (dx * (1 - conv)) + ',' + (dy * (1 - conv)) + ')');
      d.setAttribute('opacity', lerp(0.65, 0, conv * 0.9));
    });

    // The estimate glows while the cloud is gathered.
    const lit = clamp01((t - 3.0) / 0.4) * clamp01((4.4 - t) / 0.4);
    const pulse = 0.5 + 0.5 * Math.sin(t * 5);
    halo.setAttribute('opacity', lit * (0.3 + 0.4 * pulse));
    halo.setAttribute('r', 12 + 3 * pulse);
    estimate.setAttribute('fill', lit > 0.4 ? GLOW_EDGE : INK);
  };

  // ── Static frame for reduced motion (also the print fallback) ──────
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    setState(3.4);
    return;
  }

  const start = performance.now();
  const T = 6.0;
  const frame = (now) => {
    requestAnimationFrame(frame);
    if (document.hidden) return;
    setState(((now - start) / 1000) % T);
  };
  requestAnimationFrame(frame);
})();
