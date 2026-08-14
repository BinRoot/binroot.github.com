// The page lives inside a cardboard box. Three parts:
//
// 1. A fixed one-point-perspective backdrop: ceiling, floor and side walls
//    drawn as an SVG stretched over the viewport. The back wall opening is
//    sized from the actual text column plus a gutter, so the flat part
//    always contains the prose; the side walls absorb the remaining width
//    and collapse to slivers on narrow screens.
//
// 2. The back wall itself: four cardboard flaps (two full-height panels
//    meeting at a center seam, two half-height panels tucked behind them).
//    Scrolling well past the end of the article swings them outward, big
//    pair first, revealing a dawn sky painted behind the box. The walls
//    paint above the flaps, so the fixed frame occludes them as they open.
//
// 3. A scroll fold with a pixel-level crease. Each block renders as a flat
//    layer clipped to the material still on the back wall, plus clones
//    clipped to the material past the ceiling/floor crease, rotated 90deg
//    about that exact line (the true dihedral of the box).
//
// All 3D is projected through one shared eye at the viewport center, the
// same vanishing point the walls are drawn with, so folded material lies
// exactly on the ceiling and floor planes and the flaps swing believably.
(() => {
  const Y0 = 18, Y1 = 82;  // ceiling/floor creases, percent of viewport height
  const GUTTER = 48;       // back wall extends this far past the column, px
  const D = 1400;          // shared perspective distance (one eye for everything)
  const OPEN_A = 118;      // how far the flaps swing outward, degrees
  // depths of the rib rings, 0 = box opening, 1 = back wall; spacing
  // compresses toward the back like equal steps seen in perspective
  const RING_DEPTHS = [4, 8, 11.5, 14.5, 17, 19, 20.7].map((v) => v / 22);
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Mobile URL bars resize the viewport continuously while the page scrolls;
  // geometry based on live innerHeight makes every crease crawl. All math
  // uses the large-viewport height, measured once through a probe (the fixed
  // layers are 100lvh tall to match), and refreshed only on a real resize:
  // a width change or an orientation-sized height jump.
  const probe = document.createElement('div');
  probe.style.cssText =
    'position:fixed;top:0;width:0;height:100vh;height:100lvh;' +
    'visibility:hidden;pointer-events:none;';
  document.body.appendChild(probe);
  let VW = innerWidth;
  let VH = probe.offsetHeight || innerHeight;
  const remeasure = () => {
    const w = innerWidth, h = probe.offsetHeight || innerHeight;
    if (w === VW && Math.abs(h - VH) < 150) return false;
    VW = w;
    VH = h;
    return true;
  };
  const resizeHooks = [];
  addEventListener('resize', () => {
    if (!remeasure()) return;
    for (const hook of resizeHooks) hook();
  }, { passive: true });

  const px = (v) => v.toFixed(2) + 'px';
  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  const smooth = (t) => t * t * (3 - 2 * t);
  // project through the shared eye at viewport center (local offset ex,ey)
  const proj = (ex, ey) =>
    `translate(${px(ex)}, ${px(ey)}) perspective(${D}px) ` +
    `translate(${px(-ex)}, ${px(-ey)})`;

  // ---- the outside, visible only through the opened back wall ----
  const out = document.createElement('div');
  out.className = 'box-out';
  out.setAttribute('aria-hidden', 'true');
  out.innerHTML = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="bx-sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#5b87b8"/>
      <stop offset="0.42" stop-color="#a7c4e2"/>
      <stop offset="0.68" stop-color="#f6d9a8"/>
      <stop offset="1" stop-color="#f9b96e"/>
    </linearGradient>
    <radialGradient id="bx-sun" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#fff6da" stop-opacity="0.95"/>
      <stop offset="0.35" stop-color="#ffe9b0" stop-opacity="0.5"/>
      <stop offset="1" stop-color="#ffe9b0" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="100" height="100" fill="url(#bx-sky)"/>
  <circle cx="50" cy="63" r="24" fill="url(#bx-sun)"/>
  <circle cx="50" cy="63" r="3.6" fill="#fff8e2"/>
  <path d="M0 70 Q18 64 34 68 T68 67 T100 69 L100 100 L0 100 Z" fill="#8fa3c4" opacity="0.7"/>
  <path d="M0 75 Q22 70 46 73 T100 74 L100 100 L0 100 Z" fill="#7288ad" opacity="0.85"/>
  <g fill="#fff" opacity="0.8">
    <ellipse cx="29" cy="36" rx="9" ry="2.4"/><ellipse cx="35" cy="34" rx="5.5" ry="1.8"/>
  </g>
  <g fill="#fff" opacity="0.65">
    <ellipse cx="72" cy="28" rx="7" ry="2"/><ellipse cx="77" cy="26.5" rx="4" ry="1.4"/>
  </g>
  <g fill="#fff" opacity="0.5">
    <ellipse cx="57" cy="47" rx="5" ry="1.4"/>
  </g>
  <g stroke="#4a5b74" stroke-width="0.22" fill="none" stroke-linecap="round">
    <g class="bx-bird bx-bird1"><g class="bx-bob"><path d="M44 41 q1.4 -1.2 2.8 0 m0 0 q1.4 -1.2 2.8 0">
      <animate attributeName="d" begin="indefinite" end="indefinite" dur="0.42s"
        repeatCount="indefinite" keyTimes="0;0.4;1" calcMode="spline"
        keySplines="0.4 0 0.6 1;0.4 0 0.6 1"
        values="M44 41 q1.4 -1.7 2.8 0 m0 0 q1.4 -1.7 2.8 0;
                M44 41 q1.4 1.3 2.8 0 m0 0 q1.4 1.3 2.8 0;
                M44 41 q1.4 -1.7 2.8 0 m0 0 q1.4 -1.7 2.8 0"/>
    </path></g></g>
    <g class="bx-bird bx-bird2"><g class="bx-bob"><path d="M62 37 q1.1 -1 2.2 0 m0 0 q1.1 -1 2.2 0">
      <animate attributeName="d" begin="indefinite" end="indefinite" dur="0.5s"
        repeatCount="indefinite" keyTimes="0;0.4;1" calcMode="spline"
        keySplines="0.4 0 0.6 1;0.4 0 0.6 1"
        values="M62 37 q1.1 -1.35 2.2 0 m0 0 q1.1 -1.35 2.2 0;
                M62 37 q1.1 1.05 2.2 0 m0 0 q1.1 1.05 2.2 0;
                M62 37 q1.1 -1.35 2.2 0 m0 0 q1.1 -1.35 2.2 0"/>
    </path></g></g>
    <g class="bx-bird bx-bird3"><g class="bx-bob"><path d="M53 33 q0.9 -0.8 1.8 0 m0 0 q0.9 -0.8 1.8 0">
      <animate attributeName="d" begin="indefinite" end="indefinite" dur="0.36s"
        repeatCount="indefinite" keyTimes="0;0.4;1" calcMode="spline"
        keySplines="0.4 0 0.6 1;0.4 0 0.6 1"
        values="M53 33 q0.9 -1.1 1.8 0 m0 0 q0.9 -1.1 1.8 0;
                M53 33 q0.9 0.85 1.8 0 m0 0 q0.9 0.85 1.8 0;
                M53 33 q0.9 -1.1 1.8 0 m0 0 q0.9 -1.1 1.8 0"/>
    </path></g></g>
  </g>
</svg>`;
  document.body.appendChild(out);

  // ---- back wall flaps (small pair first, so the big pair paints above) ----
  const flaps = {};
  for (const k of ['top', 'bottom', 'left', 'right']) {
    const d = document.createElement('div');
    d.className = 'box-flap box-flap-' + k;
    d.setAttribute('aria-hidden', 'true');
    document.body.appendChild(d);
    flaps[k] = d;
  }

  // ---- walls backdrop ----
  const bg = document.createElement('div');
  bg.className = 'box-bg';
  bg.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bg);

  let geo = null;
  const buildBox = () => {
    const W = VW, H = VH;
    const col = document.body.offsetWidth;
    const x0 = Math.max(2, ((W - col) / 2 - GUTTER) / W * 100);
    const x1 = 100 - x0;
    const n = (v) => (+v).toFixed(2);
    // each ring is a rectangle at one depth: its four lines meet exactly on
    // the corner seams, so the walls, ceiling and floor all line up
    let rings = '';
    for (const f of RING_DEPTHS) {
      const xl = n(x0 * f), xr = n(100 - x0 * f);
      const yt = n(Y0 * f), yb = n(100 - Y0 * f);
      rings += `<line x1="${xl}" y1="${yt}" x2="${xl}" y2="${yb}"/>`;
      rings += `<line x1="${xr}" y1="${yt}" x2="${xr}" y2="${yb}"/>`;
      rings += `<line x1="${xl}" y1="${yt}" x2="${xr}" y2="${yt}"/>`;
      rings += `<line x1="${xl}" y1="${yb}" x2="${xr}" y2="${yb}"/>`;
    }
    // opaque bands under the wall trapezoids keep the back wall opening as
    // the only see-through region (and hide antialiasing seams)
    bg.innerHTML = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">
  <g fill="#f6f0e4">
    <rect x="0" y="0" width="100" height="${Y0}"/>
    <rect x="0" y="${Y1}" width="100" height="${100 - Y1}"/>
    <rect x="0" y="0" width="${n(x0)}" height="100"/>
    <rect x="${n(x1)}" y="0" width="${n(100 - x1)}" height="100"/>
  </g>
  <polygon points="0,0 ${n(x0)},${Y0} ${n(x0)},${Y1} 0,100" fill="#c8b59d"/>
  <polygon points="100,0 ${n(x1)},${Y0} ${n(x1)},${Y1} 100,100" fill="#c2af97"/>
  <polygon points="0,0 100,0 ${n(x1)},${Y0} ${n(x0)},${Y0}" fill="#dccdb9"/>
  <polygon points="0,100 100,100 ${n(x1)},${Y1} ${n(x0)},${Y1}" fill="#ab997f"/>
  <g stroke="#6a5a49" stroke-opacity="0.16" stroke-width="1">${rings}</g>
  <g stroke="#6a5a49" stroke-opacity="0.35" stroke-width="1.4" fill="none">
    <line x1="0" y1="0" x2="${n(x0)}" y2="${Y0}"/>
    <line x1="100" y1="0" x2="${n(x1)}" y2="${Y0}"/>
    <line x1="0" y1="100" x2="${n(x0)}" y2="${Y1}"/>
    <line x1="100" y1="100" x2="${n(x1)}" y2="${Y1}"/>
    <rect x="${n(x0)}" y="${Y0}" width="${n(x1 - x0)}" height="${Y1 - Y0}" stroke-opacity="0.25"/>
  </g>
</svg>`;
    const L = x0 / 100 * W, T = Y0 / 100 * H;
    const ww = (x1 - x0) / 100 * W, wh = (Y1 - Y0) / 100 * H;
    const mh = wh * 0.42;  // minor flaps are shorter, like a real box
    geo = { L, T, ww, wh, mh };
    Object.assign(flaps.left.style,
      { left: px(L), top: px(T), width: px(ww / 2 + 1), height: px(wh) });
    Object.assign(flaps.right.style,
      { left: px(L + ww / 2), top: px(T), width: px(ww / 2), height: px(wh) });
    Object.assign(flaps.top.style,
      { left: px(L), top: px(T), width: px(ww), height: px(mh) });
    Object.assign(flaps.bottom.style,
      { left: px(L), top: px(T + wh - mh), width: px(ww), height: px(mh) });
    applyOpen();
  };

  // ---- opening scrub: driven by how far the tail spacer has scrolled up ----
  let tail = null, credit = null, cta = null, flying = false;
  const applyOpen = () => {
    if (!geo) return;
    const W = VW, H = VH;
    let p = 0;
    if (tail) {
      // Hold the box shut until the last of the article has folded away over
      // the ceiling: content ends padding-bottom (0.18H + 16px) above the
      // tail, and reaches the ceiling crease 0.64H of scroll later.
      const u = H - tail.getBoundingClientRect().top;
      p = clamp01((u - 0.55 * H) / (1.05 * H));
    }
    const big = OPEN_A * smooth(clamp01(p / 0.55));
    const small = OPEN_A * smooth(clamp01((p - 0.35) / 0.65));
    const { L, T, ww, wh, mh } = geo;
    flaps.left.style.transform =
      proj(W / 2 - L, H / 2 - T) + ` rotateY(${big.toFixed(2)}deg)`;
    flaps.right.style.transform =
      proj(W / 2 - (L + ww / 2), H / 2 - T) +
      ` translateX(${px(ww / 2)}) rotateY(${(-big).toFixed(2)}deg) translateX(${px(-ww / 2)})`;
    flaps.top.style.transform =
      proj(W / 2 - L, H / 2 - T) + ` rotateX(${(-small).toFixed(2)}deg)`;
    flaps.bottom.style.transform =
      proj(W / 2 - L, H / 2 - (T + wh - mh)) +
      ` translateY(${px(mh)}) rotateX(${small.toFixed(2)}deg) translateY(${px(-mh)})`;
    // the birds startle and fly off once the sky is properly visible; the
    // wingbeat is a SMIL path morph, started and stopped from here
    const fly = p > 0.45;
    if (fly !== flying) {
      flying = fly;
      out.classList.toggle('bx-fly', fly);
      for (const a of out.querySelectorAll('animate')) {
        if (fly) a.beginElement();
        else a.endElement();
      }
    }
    if (credit) {
      const t = clamp01((p - 0.75) / 0.25);
      credit.style.opacity = t.toFixed(3);
      credit.style.transform =
        `translateX(-50%) translateY(${((1 - t) * 14).toFixed(1)}px)`;
      credit.style.pointerEvents = t > 0.5 ? 'auto' : 'none';
    }
    if (cta) {
      const t = smooth(clamp01((p - 0.7) / 0.22));
      cta.style.opacity = t.toFixed(3);
      cta.style.transform =
        `translate(-50%, -50%) scale(${(0.8 + 0.2 * t).toFixed(3)})`;
      cta.style.pointerEvents = t > 0.5 ? 'auto' : 'none';
    }
  };

  if (!RM) {
    tail = document.createElement('div');
    tail.className = 'box-tail';
    tail.setAttribute('aria-hidden', 'true');
    document.body.appendChild(tail);
    // the byline moves from the title block to a signature that fades in
    // over the floor once the box has opened
    document.body.classList.add('box-open-credit');
    credit = document.createElement('div');
    credit.className = 'box-credit';
    for (const sel of ['header p.author', 'header p.date']) {
      const p = document.querySelector(sel);
      if (p) credit.appendChild(p.cloneNode(true));
    }
    document.body.appendChild(credit);
    // the invitation, floating in the sky: outer handles the scroll reveal,
    // inner handles the sticker look and jelly hover physics
    cta = document.createElement('a');
    cta.className = 'box-cta';
    cta.href = '../../quantum-oracle-engineering/';
    const ctaInner = document.createElement('span');
    ctaInner.className = 'box-cta-inner';
    ctaInner.textContent = 'Introduction to Quantum Oracle Engineering';
    cta.appendChild(ctaInner);
    document.body.appendChild(cta);
    let ot = false;
    addEventListener('scroll', () => {
      if (ot) return;
      ot = true;
      requestAnimationFrame(() => { ot = false; applyOpen(); });
    }, { passive: true });
  }

  buildBox();
  let bt;
  resizeHooks.push(() => {
    clearTimeout(bt);
    bt = setTimeout(buildBox, 120);
  });

  // ---- scroll fold ----
  if (RM) return;
  const A = 90;         // dihedral: back wall to ceiling/floor is a right angle
  const SMAX = 520;     // drop folded material once this far along the plane
  const CT = Y0 / 100, CB = Y1 / 100;

  const targets = [];
  const mkClones = (host, orig) => {
    const pair = [orig.cloneNode(true), orig.cloneNode(true)];
    for (const c of pair) {
      c.classList.add('fold-clone');
      c.setAttribute('aria-hidden', 'true');
      c.inert = true;
      c.removeAttribute('id');
      for (const el of c.querySelectorAll('[id]')) el.removeAttribute('id');
      c.style.display = 'none';
      host.appendChild(c);
    }
    targets.push({ host, orig, up: pair[0], down: pair[1] });
  };

  const EXCLUDE = ['box-bg', 'box-out', 'box-flap', 'box-tail', 'box-credit',
                   'box-cta', 'oc-tip', 'oc-lb', 'oracle-collage'];
  for (const el of [...document.body.children]) {
    if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE') continue;
    if (EXCLUDE.some((c) => el.classList.contains(c))) continue;
    const wrap = document.createElement('div');
    wrap.className = 'fold-wrap';
    el.replaceWith(wrap);
    wrap.appendChild(el);
    mkClones(wrap, el);
  }
  // collage scraps fold individually via their inner shadow layer, so the
  // scraps' own transforms (scatter rotation, hover, entrance) keep working
  for (const a of document.querySelectorAll('.oc-scrap')) {
    const sh = a.querySelector('.oc-shadow');
    if (sh) mkClones(a, sh);
  }

  const measure = () => {
    const bodyL = document.body.offsetLeft, bodyT = document.body.offsetTop;
    for (const t of targets) {
      let x = 0, y = 0;
      for (let el = t.host; el && el !== document.body; el = el.offsetParent) {
        x += el.offsetLeft;
        y += el.offsetTop;
      }
      t.absLeft = x + bodyL;
      t.absTop = y + bodyT;
      t.h = t.host.offsetHeight;
    }
  };

  // fold about the crease at local y=c, then project through the shared eye
  const creaseFlap = (ex, ey, c, ang) =>
    proj(ex, ey) + ` translateY(${px(c)}) rotateX(${ang}deg) translateY(${px(-c)})`;

  const apply = () => {
    const W = VW, H = VH, sy = scrollY;
    const c1 = CT * H, c2 = CB * H;
    for (const t of targets) {
      const vt = t.absTop - sy, h = t.h;
      const ex = W / 2 - t.absLeft;
      const ey = sy + H / 2 - t.absTop;
      const over = c1 - vt;        // material past the ceiling crease
      const under = vt + h - c2;   // material past the floor crease
      const clipT = Math.max(0, Math.min(h, over));
      const clipB = Math.max(0, Math.min(h, under));
      t.orig.style.clipPath =
        clipT || clipB ? `inset(${px(clipT)} 0 ${px(clipB)} 0)` : '';
      if (over > 0 && over - h < SMAX) {
        t.up.style.display = '';
        t.up.style.clipPath = `inset(0 0 ${px(Math.max(0, h - over))} 0)`;
        t.up.style.transformOrigin = '0 0';
        t.up.style.transform = creaseFlap(ex, ey, over, -A);
      } else {
        t.up.style.display = 'none';
      }
      const q = c2 - vt;           // floor crease in local coords (< 0 once fully past)
      if (under > 0 && -q < SMAX) {
        t.down.style.display = '';
        t.down.style.clipPath = `inset(${px(Math.max(0, q))} 0 0 0)`;
        t.down.style.transformOrigin = '0 0';
        t.down.style.transform = creaseFlap(ex, ey, q, A);
      } else {
        t.down.style.display = 'none';
      }
    }
  };

  let tick = false;
  const onScroll = () => {
    if (tick) return;
    tick = true;
    requestAnimationFrame(() => { tick = false; apply(); });
  };
  addEventListener('scroll', onScroll, { passive: true });
  resizeHooks.push(() => { measure(); onScroll(); });
  addEventListener('load', () => { measure(); apply(); });
  measure();
  apply();
})();
