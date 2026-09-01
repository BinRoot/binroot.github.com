// whose-dice.js -- slide 25: whose dice?
//
// Two panels, identical size and framing, because the comparison is about
// where the randomness lives, not about the pictures.
//
//   left, "in the task"   : Jupiter's chaotic clouds (Juno).  They drift the
//                           whole time the slide is up: this randomness does
//                           not stop when you stop computing.  Deliberately
//                           not a hurricane: Katrina and its kin are real
//                           disasters with real casualties, and borrowing one
//                           to decorate a slide about sampling is not on.
//                           Also deliberately not a von Karman vortex
//                           street, which is periodic order rather than
//                           turbulence and would argue the opposite point.
//   right, "in the solver": a dozen dice frozen in mid-air, an instrument
//                           someone chose to throw, and can choose not to.
//
// The frozen-versus-moving contrast is the argument, so the planet's drift is
// continuous while the dice never move.  Label colours follow the deck's
// convention: accent for randomness in the task, grey for randomness in the
// solver.  The reveal runs once on arrival; there is nothing to replay once
// both panels are up.
//
// Photographs: NASA (public domain) and Unsplash licence, both
// attribution-free by choice.  Provenance, and the images that were
// rejected and why, in img/CREDITS.md.
(function () {
  const svg = document.getElementById('whose-dice-fig');
  if (!svg) return;

  const ns = 'http://www.w3.org/2000/svg';
  const XLINK = 'http://www.w3.org/1999/xlink';
  const RULE = '#bbb';
  const GRAY = '#8b9199';
  const ACCENT = '#456AAD';

  const PW = 324, PH = 202, PY = 52;
  const PANELS = [
    { x: 40, id: 'task', img: 'jupiter-chaotic-clouds.webp', drift: true,
      label: 'in the task', colour: ACCENT,
      alt: "Jupiter's turbulent clouds, seen by Juno" },
    { x: 396, id: 'solver', img: 'dice-unsplash-kroll.webp', drift: false,
      label: 'in the solver', colour: GRAY,
      alt: 'A dozen dice tumbling in mid-air' }
  ];

  const el = (name, attrs, parent) => {
    const node = document.createElementNS(ns, name);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    (parent || svg).appendChild(node);
    return node;
  };
  const clamp01 = (u) => Math.max(0, Math.min(1, u));
  const ease = (u) => u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;

  const defs = el('defs', {});
  const built = PANELS.map((p, i) => {
    const clip = el('clipPath', { id: 'wd-' + p.id }, defs);
    el('rect', { x: p.x, y: PY, width: PW, height: PH, rx: 10 }, clip);

    const group = el('g', { opacity: 0 });
    el('rect', { x: p.x + 4, y: PY + 5, width: PW, height: PH, rx: 10,
      fill: '#000', opacity: 0.08 }, group);
    // The photograph covers the panel: slice crops rather than squashes.
    const holder = el('g', { 'clip-path': 'url(#wd-' + p.id + ')' }, group);
    const inner = el('g', {}, holder);
    const img = el('image', {
      x: p.x, y: PY, width: PW, height: PH,
      preserveAspectRatio: 'xMidYMid slice'
    }, inner);
    img.setAttribute('href', '../assets/img/' + p.img);
    img.setAttributeNS(XLINK, 'href', '../assets/img/' + p.img);
    img.setAttribute('role', 'img');
    img.setAttribute('aria-label', p.alt);
    el('rect', { x: p.x, y: PY, width: PW, height: PH, rx: 10, fill: 'none',
      stroke: RULE, 'stroke-width': 1.5 }, group);

    const label = el('text', {
      x: p.x + PW / 2, y: PY + PH + 34, 'text-anchor': 'middle',
      fill: p.colour, 'font-size': 17, 'font-weight': 700,
      'font-family': "'Ubuntu', sans-serif", opacity: 0
    });
    label.textContent = p.label;
    return { p, group, inner, label, t0: 0.3 + i * 0.9 };
  });

  const setState = (t) => {
    built.forEach((b) => {
      const u = ease(clamp01((t - b.t0) / 0.6));
      b.group.setAttribute('opacity', u);
      b.label.setAttribute('opacity', clamp01((t - b.t0 - 0.35) / 0.4));
      if (b.p.drift) {
        // A slow, endless drift: the storm is still happening.
        const cx = b.p.x + PW / 2, cy = PY + PH / 2;
        const s = 1.05 + 0.025 * Math.sin(t * 0.21);
        const dx = 5 * Math.sin(t * 0.16), dy = 3.5 * Math.cos(t * 0.13);
        b.inner.setAttribute('transform',
          'translate(' + (cx + dx) + ',' + (cy + dy) + ') scale(' +
          s.toFixed(4) + ') translate(' + (-cx) + ',' + (-cy) + ')');
      }
    });
  };

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    setState(3);
    return;
  }

  let elapsed = 0, last = performance.now(), live = true;
  const slide = svg.closest('.slide');
  if (slide) {
    setState(0);
    live = slide.classList.contains('current');
    new MutationObserver(() => {
      const now = slide.classList.contains('current');
      if (now && !live) { elapsed = 0; }
      live = now;
      if (!now) setState(0);
    }).observe(slide, { attributes: true, attributeFilter: ['class'] });
  }

  const frame = (now) => {
    requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    if (document.hidden || !live) return;
    elapsed += dt;
    setState(elapsed);
  };
  requestAnimationFrame(frame);
})();
