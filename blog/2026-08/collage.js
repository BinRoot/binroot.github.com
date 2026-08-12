// A collage of real cutouts from quantum computing papers, 2008 to 2025,
// each one granting itself an oracle in a subordinate clause. The crops are
// rendered from the actual arXiv PDFs at 300dpi; the annotation boxes were
// measured from pdftotext word bounding boxes, so the red ink lands on the
// exact sentence. Hovering a scrap shows the source; clicking opens arXiv.
(() => {
  const mount = document.querySelector('div.oracle-collage');
  if (!mount) return;

  // seeded prng so the torn edges and pen wobble are stable across loads
  const hash = (s) => {
    let h = 2166136261;
    for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
    return h >>> 0;
  };
  const mulberry32 = (a) => () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const SCRAPS = [
    {
      key: 'hhl', wide: true, rot: -1.3, annot: 'circle',
      img: 'img/hhl.webp', w: 1400, h: 249,
      rects: [{ x: 14.94, y: 44.76, w: 29.6, h: 10.49 }],
      title: 'Quantum algorithm for solving linear systems of equations',
      authors: 'Harrow, Hassidim, Lloyd', year: 2008, id: '0811.3171',
      quote: 'We also need an efficient procedure to prepare |b⟩.',
    },
    {
      key: 'qsvm', wide: false, rot: 1.8, annot: 'highlight',
      img: 'img/qsvm.webp', w: 900, h: 316,
      rects: [
        { x: 29.77, y: 45.1, w: 66.52, h: 9.79 },
        { x: 3.8, y: 57.99, w: 92.4, h: 9.54 },
        { x: 3.8, y: 70.88, w: 62.17, h: 9.54 },
      ],
      title: 'Quantum support vector machine for big data classification',
      authors: 'Rebentrost, Mohseni, Lloyd', year: 2013, id: '1307.0471',
      quote: 'In the quantum setting, assume that oracles for the training data ... are given.',
    },
    {
      key: 'qrl', wide: false, rot: -2.1, annot: 'underline',
      img: 'img/qrl.webp', w: 900, h: 334,
      rects: [
        { x: 23.82, y: 39.15, w: 72.78, h: 8.95 },
        { x: 10.79, y: 51.9, w: 12.61, h: 8.95 },
      ],
      title: 'Exponential improvements for quantum-accessible reinforcement learning',
      authors: 'Dunjko, Liu, Wu, Taylor', year: 2017, id: '1710.11160',
      quote: 'we consider a special case of reinforcement learning, where the task environment allows quantum access.',
    },
    {
      key: 'montecarlo', wide: true, rot: 0.9, annot: 'underline',
      img: 'img/montecarlo.webp', w: 1400, h: 268,
      rects: [
        { x: 22.22, y: 29.74, w: 75.71, h: 11.03 },
        { x: 2.06, y: 44.87, w: 36.6, h: 10.26 },
      ],
      title: 'Quantum speedup of Monte Carlo methods',
      authors: 'Montanaro', year: 2015, id: '1504.06987',
      quote: 'we also assume that we have the ability to execute the algorithm A⁻¹, which is the inverse of the unitary part of A.',
    },
    {
      key: 'recsys', wide: true, rot: -0.7, annot: 'highlight',
      img: 'img/recsys.webp', w: 1400, h: 311,
      rects: [
        { x: 82.3, y: 38.72, w: 15.63, h: 10.18 },
        { x: 2.06, y: 51.33, w: 95.87, h: 9.96 },
        { x: 2.06, y: 63.72, w: 50.3, h: 10.18 },
      ],
      title: 'Quantum Recommendation Systems',
      authors: 'Kerenidis, Prakash', year: 2016, id: '1603.08675',
      quote: 'We assume that the input is stored in a classical data structure such that an algorithm that has quantum access to the data structure can create the quantum state.',
    },
    {
      key: 'risk', wide: false, rot: 1.5, annot: 'circle',
      img: 'img/risk.webp', w: 900, h: 353,
      rects: [
        { x: 58.91, y: 40.32, w: 37.29, h: 8.29 },
        { x: 3.8, y: 51.38, w: 50, h: 8.29 },
      ],
      title: 'Quantum Risk Analysis',
      authors: 'Woerner, Egger', year: 2018, id: '1806.06893',
      quote: 'we assume a given operator ℛ such that ℛ|0⟩ₙ = |ψ⟩ₙ.',
    },
    {
      key: 'confession', wide: false, rot: -1.8, annot: 'margin',
      img: 'img/confession.webp', w: 900, h: 354,
      rects: [
        { x: 7.51, y: 29.43, w: 88.69, h: 8.28 },
        { x: 3.8, y: 40.23, w: 92.4, h: 8.51 },
        { x: 3.8, y: 51.26, w: 51.31, h: 8.51 },
        { x: 22.17, y: 62.3, w: 33.3, h: 8.28 },
      ],
      title: 'Quantum Risk Analysis',
      authors: 'Woerner, Egger', year: 2018, id: '1806.06893',
      quote: 'Another question that has only briefly been addressed in this paper is the loading of considered random distributions or stochastic processes.',
    },
    {
      key: 'sgo', wide: true, rot: 0.6, annot: 'circle',
      img: 'img/sgo.webp', w: 1400, h: 272,
      rects: [{ x: 21.5, y: 44.3, w: 62.4, h: 11.39 }],
      title: 'Quantum speedups for stochastic optimization',
      authors: 'Sidford, Zhang', year: 2023, id: '2308.01582',
      quote: 'we further assume quantum access to a stochastic gradient oracle ... that upon query returns a quantum superposition over the probability distribution.',
    },
    {
      key: 'qnpg', wide: false, rot: 1.1, annot: 'highlight',
      img: 'img/qnpg.webp', w: 900, h: 369,
      rects: [
        { x: 60.92, y: 40.05, w: 34.49, h: 8.47 },
        { x: 4.03, y: 51.49, w: 92, h: 8.47 },
      ],
      title: 'Accelerating Quantum Reinforcement Learning with a Quantum Natural Policy Gradient Based Approach',
      authors: 'Xu, Aggarwal', year: 2025, id: '2501.16243',
      quote: 'In this work, we assume access to a quantum transition oracle and a quantum initial state oracle.',
    },
  ];

  const style = document.createElement('style');
  style.textContent = `
    .oracle-collage { margin: 2.2em -2.5em; }
    @media (max-width: 56em) { .oracle-collage { margin: 2.2em -0.4em; } }
    .oc-board {
      display: flex; flex-wrap: wrap; justify-content: center; align-items: center;
      gap: 4px 14px; margin: 0; padding: 0.5em 0;
    }
    .oc-scrap {
      display: block; position: relative; text-decoration: none;
      transform: rotate(var(--rot)) translateY(14px); opacity: 0;
      transition: transform 0.45s ease, opacity 0.45s ease;
    }
    .oc-scrap.oc-in { transform: rotate(var(--rot)) translateY(0); opacity: 1; }
    .oc-scrap:hover, .oc-scrap:focus-visible {
      transform: rotate(0deg) scale(1.025); z-index: 6; outline: none;
    }
    .oc-wide { flex: 1 1 100%; max-width: 100%; }
    .oc-half { flex: 1 1 44%; min-width: 15em; max-width: 48%; }
    @media (max-width: 40em) { .oc-half { max-width: 100%; flex-basis: 100%; } }
    .oc-shadow { display: block; filter: drop-shadow(2px 5px 5px rgba(60, 48, 25, 0.38)); }
    .oc-scrap:hover .oc-shadow, .oc-scrap:focus-visible .oc-shadow {
      filter: drop-shadow(3px 9px 10px rgba(60, 48, 25, 0.45));
    }
    .oc-paper {
      display: block; background: #fffdf7; padding: 9px 12px;
      clip-path: polygon(var(--tear));
    }
    .oc-frame { display: block; position: relative; }
    .oc-frame img {
      width: 100%; height: auto; display: block;
      filter: sepia(0.13) contrast(0.97);
    }
    .oc-annot {
      position: absolute; inset: 0; width: 100%; height: 100%;
      pointer-events: none; mix-blend-mode: multiply;
    }
    .oc-annot .oc-ink {
      fill: none; stroke: #c9342c; stroke-linecap: round; stroke-linejoin: round;
      opacity: 0.85;
      stroke-dasharray: var(--len); stroke-dashoffset: var(--len);
      transition: stroke-dashoffset 1.1s ease 0.35s;
    }
    .oc-in .oc-ink { stroke-dashoffset: 0; }
    .oc-annot .oc-mark {
      fill: #ffd83d; opacity: 0.55;
      transform: scaleX(0); transform-box: fill-box; transform-origin: left center;
      transition: transform 0.5s ease;
    }
    .oc-in .oc-mark { transform: scaleX(1); }
    .oc-annot .oc-pen {
      fill: #c9342c; opacity: 0;
      font-family: 'Segoe Print', 'Bradley Hand', 'Comic Sans MS', cursive;
      transition: opacity 0.4s ease 1s;
    }
    .oc-in .oc-pen { opacity: 0.9; }
    .oc-tip {
      position: fixed; z-index: 99; max-width: 21em; padding: 0.6em 0.85em;
      background: #211f1a; color: #f4f0e6; border-radius: 6px;
      font: 0.78em/1.5 system-ui, -apple-system, 'Segoe UI', sans-serif;
      opacity: 0; visibility: hidden; transition: opacity 0.15s ease;
      pointer-events: none;
    }
    .oc-tip.oc-on { opacity: 1; visibility: visible; }
    .oc-tip b { display: block; margin-bottom: 0.1em; }
    .oc-tip .oc-meta { display: block; color: #cfc8b8; }
    .oc-tip .oc-hint { display: block; color: #9a927e; margin-top: 0.25em; }
    .oc-lb {
      position: fixed; inset: 0; z-index: 200; display: none;
      align-items: center; justify-content: center;
      background: rgba(26, 22, 13, 0.82); padding: 3vh 3vw;
    }
    .oc-lb.oc-lb-on { display: flex; }
    .oc-lbfig {
      position: relative; margin: 0; max-width: min(1200px, 94vw);
      max-height: 92vh; overflow: auto; background: #fffdf7;
      padding: 16px 18px 12px; border-radius: 3px;
      box-shadow: 0 18px 60px rgba(0, 0, 0, 0.55);
    }
    .oc-lbfig img { width: 100%; height: auto; display: block; }
    .oc-lbx {
      position: absolute; top: 6px; right: 8px; z-index: 2;
      width: 1.7em; height: 1.7em; border: 0; border-radius: 50%;
      background: #211f1a; color: #f4f0e6; font-size: 1em; line-height: 1;
      cursor: pointer;
    }
    .oc-lbcap {
      margin-top: 0.75em;
      font: 0.8em/1.5 system-ui, -apple-system, 'Segoe UI', sans-serif;
      color: #3d3a33;
    }
    .oc-lbcap b { margin-right: 0.5em; }
    .oc-lbmeta { color: #6e675a; margin-right: 0.5em; }
    .oc-lblink { color: #0b5394; white-space: nowrap; }
    @media (prefers-reduced-motion: reduce) {
      .oc-scrap, .oc-ink, .oc-mark, .oc-pen { transition: none !important; }
      .oc-scrap { opacity: 1; transform: rotate(var(--rot)); }
      .oc-ink { stroke-dashoffset: 0 !important; }
      .oc-mark { transform: scaleX(1) !important; }
      .oc-pen { opacity: 0.9 !important; }
    }
  `;
  document.head.appendChild(style);

  // jagged clip-path percent points, walked clockwise from the top-left
  const tear = (rnd) => {
    const pts = [];
    const walk = (x0, y0, x1, y1, n, jx, jy) => {
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        pts.push([
          x0 + (x1 - x0) * t + (rnd() - 0.5) * jx,
          y0 + (y1 - y0) * t + (rnd() - 0.5) * jy,
        ]);
      }
    };
    walk(1, 1, 99, 1, 7, 1.6, 2.6);   // top
    walk(99.3, 3, 99.3, 97, 4, 1.2, 2); // right
    walk(99, 99, 1, 99, 7, 1.6, 2.6);  // bottom
    walk(0.7, 97, 0.7, 3, 4, 1.2, 2);  // left
    return pts.map(([x, y]) => `${x.toFixed(2)}% ${y.toFixed(2)}%`).join(',');
  };

  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  };

  // a hand-drawn ellipse around a box: radius wobbles, the pen overshoots.
  // multi-line boxes get a proportionally tighter ry so the arcs don't
  // strike through the neighboring lines of print.
  const penEllipse = (rnd, bx, by, bw, bh, W, multi) => {
    const cx = bx + bw / 2, cy = by + bh / 2;
    const rx = bw * 0.56 + W * 0.012;
    const ry = (bh / 2) * (multi ? 1.25 : 1.5);
    const phase = rnd() * Math.PI * 2, n = 34;
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const t = -0.5 + (i / n) * (Math.PI * 2 + 0.55);
      const wob = 1 + 0.018 * Math.sin(3 * t + phase) + (rnd() - 0.5) * 0.018;
      pts.push([
        cx + rx * wob * Math.cos(t) + (rnd() - 0.5) * 1.2,
        cy + ry * wob * Math.sin(t) + (rnd() - 0.5) * 1.2,
      ]);
    }
    return 'M' + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L');
  };

  // a wavering underline just beneath one text-line box
  const penLine = (rnd, r, W, H) => {
    const y0 = (r.y + r.h * 1.16) / 100 * H;
    const x0 = (r.x - 0.4) / 100 * W, x1 = (r.x + r.w + 0.4) / 100 * W;
    const n = Math.max(4, Math.round((x1 - x0) / 60));
    const slope = (rnd() - 0.5) * 3;
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      pts.push([
        x0 + (x1 - x0) * t,
        y0 + slope * t + (rnd() - 0.5) * H * 0.014,
      ]);
    }
    return 'M' + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L');
  };

  // the annotation layer is rebuilt for the lightbox too, so it lives in a
  // function; a fixed per-key seed keeps the ink identical in both places
  const buildAnnot = (s) => {
    const rnd = mulberry32(hash(s.key + ':ink'));
    const svg = el('svg', { class: 'oc-annot', viewBox: `0 0 ${s.w} ${s.h}` });
    const stroke = Math.max(3, s.w * 0.004);
    const pct = (r) => ({
      x: r.x / 100 * s.w, y: r.y / 100 * s.h,
      w: r.w / 100 * s.w, h: r.h / 100 * s.h,
    });

    if (s.annot === 'circle') {
      const boxes = s.rects.map(pct);
      const x0 = Math.min(...boxes.map((b) => b.x));
      const y0 = Math.min(...boxes.map((b) => b.y));
      const x1 = Math.max(...boxes.map((b) => b.x + b.w));
      const y1 = Math.max(...boxes.map((b) => b.y + b.h));
      svg.appendChild(el('path', {
        class: 'oc-ink', 'stroke-width': stroke,
        d: penEllipse(rnd, x0, y0, x1 - x0, y1 - y0, s.w, s.rects.length > 1),
      }));
    } else if (s.annot === 'highlight') {
      s.rects.forEach((r) => {
        const b = pct(r);
        const g = el('g', { transform: `rotate(${(rnd() - 0.5) * 0.8} ${b.x} ${b.y})` });
        g.appendChild(el('rect', {
          class: 'oc-mark',
          x: b.x - s.w * 0.004, y: b.y - b.h * 0.14,
          width: b.w + s.w * 0.008, height: b.h * 1.3,
          rx: b.h * 0.18,
        }));
        svg.appendChild(g);
      });
    } else { // underline, optionally with a marginal scribble
      s.rects.forEach((r) => {
        svg.appendChild(el('path', {
          class: 'oc-ink', 'stroke-width': stroke * 0.85,
          d: penLine(rnd, r, s.w, s.h),
        }));
      });
      if (s.annot === 'margin') {
        // scribbled straight over the print, the way a real annotator would
        const last = pct(s.rects[s.rects.length - 1]);
        const tx = last.x + last.w + s.w * 0.06;
        const ty = last.y + last.h * 1.15;
        const t = el('text', {
          class: 'oc-pen',
          x: tx, y: ty,
          'font-size': s.h * 0.2,
          'font-weight': 'bold',
          transform: `rotate(-12 ${tx} ${ty})`,
        });
        t.textContent = '?!';
        svg.appendChild(t);
      }
    }
    return svg;
  };

  const board = document.createElement('figure');
  board.className = 'oc-board';
  board.setAttribute('aria-label',
    'Collage of cutouts from nine quantum computing papers, each assuming oracle access');

  const tip = document.createElement('div');
  tip.className = 'oc-tip';
  tip.setAttribute('aria-hidden', 'true');

  // in-page enlarged view: full-resolution crop, ink redrawn on open,
  // and the link to the actual paper lives in this caption
  const lb = document.createElement('div');
  lb.className = 'oc-lb';
  lb.setAttribute('role', 'dialog');
  lb.setAttribute('aria-modal', 'true');
  lb.setAttribute('aria-label', 'Enlarged paper cutout');
  let lbReturnFocus = null;
  const closeLb = () => {
    lb.classList.remove('oc-lb-on');
    lb.innerHTML = '';
    document.body.style.overflow = '';
    if (location.hash.startsWith('#oc-')) {
      history.replaceState(null, '', location.pathname + location.search);
    }
    if (lbReturnFocus) { lbReturnFocus.focus(); lbReturnFocus = null; }
  };
  const openLb = (s, trigger) => {
    lbReturnFocus = trigger || null;
    lb.innerHTML = '';
    const fig = document.createElement('figure');
    fig.className = 'oc-lbfig';
    const x = document.createElement('button');
    x.className = 'oc-lbx';
    x.setAttribute('aria-label', 'Close enlarged view');
    x.textContent = '×';
    x.addEventListener('click', closeLb);
    const frame = document.createElement('span');
    frame.className = 'oc-frame';
    const img = document.createElement('img');
    img.src = 'img/' + s.key + '-lg.webp';
    img.alt = `Cutout from ${s.authors} ${s.year}: "${s.quote}"`;
    frame.appendChild(img);
    frame.appendChild(buildAnnot(s));
    const cap = document.createElement('figcaption');
    cap.className = 'oc-lbcap';
    const b = document.createElement('b');
    b.textContent = s.title;
    const meta = document.createElement('span');
    meta.className = 'oc-lbmeta';
    meta.textContent = `${s.authors} · ${s.year}`;
    const link = document.createElement('a');
    link.className = 'oc-lblink';
    link.href = 'https://arxiv.org/abs/' + s.id;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = `Read the paper: arXiv:${s.id} ↗`;
    cap.append(b, meta, link);
    fig.append(x, frame, cap);
    lb.appendChild(fig);
    lb.classList.add('oc-lb-on');
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => {
      fig.querySelectorAll('.oc-ink').forEach((p) =>
        p.style.setProperty('--len', Math.ceil(p.getTotalLength())));
      requestAnimationFrame(() => fig.classList.add('oc-in'));
    });
    history.replaceState(null, '', '#oc-' + s.key);
    x.focus();
  };
  lb.addEventListener('click', (e) => { if (e.target === lb) closeLb(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lb.classList.contains('oc-lb-on')) closeLb();
  });

  SCRAPS.forEach((s) => {
    const rnd = mulberry32(hash(s.key));
    const a = document.createElement('a');
    a.className = 'oc-scrap ' + (s.wide ? 'oc-wide' : 'oc-half');
    a.style.setProperty('--rot', s.rot + 'deg');
    a.href = 'img/' + s.key + '-lg.webp'; // no-JS fallback: the full-res crop
    a.setAttribute('aria-label',
      `${s.title}, by ${s.authors}, ${s.year}. Quote: ${s.quote} Click to enlarge.`);

    const shadow = document.createElement('span');
    shadow.className = 'oc-shadow';
    const paper = document.createElement('span');
    paper.className = 'oc-paper';
    paper.style.setProperty('--tear', tear(rnd));
    const frame = document.createElement('span');
    frame.className = 'oc-frame';

    const img = document.createElement('img');
    img.src = s.img;
    img.width = s.w;
    img.height = s.h;
    img.loading = 'lazy';
    img.alt = `Cutout from ${s.authors} ${s.year}: "${s.quote}"`;

    const svg = buildAnnot(s);

    frame.appendChild(img);
    frame.appendChild(svg);
    paper.appendChild(frame);
    shadow.appendChild(paper);
    a.appendChild(shadow);

    const show = () => {
      tip.innerHTML = '';
      const b = document.createElement('b');
      b.textContent = s.title;
      const meta = document.createElement('span');
      meta.className = 'oc-meta';
      meta.textContent = `${s.authors} · ${s.year}`;
      const hint = document.createElement('span');
      hint.className = 'oc-hint';
      hint.textContent = 'Click to enlarge';
      tip.append(b, meta, hint);
      tip.classList.add('oc-on');
      const r = a.getBoundingClientRect();
      const tw = tip.offsetWidth, th = tip.offsetHeight;
      let x = r.left + r.width / 2 - tw / 2;
      x = Math.max(8, Math.min(x, window.innerWidth - tw - 8));
      let y = r.top - th - 10;
      if (y < 8) y = r.bottom + 10;
      tip.style.left = x + 'px';
      tip.style.top = y + 'px';
    };
    const hide = () => tip.classList.remove('oc-on');
    a.addEventListener('mouseenter', show);
    a.addEventListener('mouseleave', hide);
    a.addEventListener('focus', show);
    a.addEventListener('blur', hide);
    a.addEventListener('click', (e) => {
      e.preventDefault();
      hide();
      openLb(s, a);
    });

    board.appendChild(a);
  });

  window.addEventListener('scroll', () => tip.classList.remove('oc-on'), { passive: true });

  mount.appendChild(board);
  document.body.appendChild(tip);
  document.body.appendChild(lb);

  // draw the ink once each scrap scrolls into view
  const inks = board.querySelectorAll('.oc-ink');
  inks.forEach((p) => p.style.setProperty('--len', Math.ceil(p.getTotalLength())));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add('oc-in'), (i % 3) * 120);
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.25 });
  board.querySelectorAll('.oc-scrap').forEach((sc) => io.observe(sc));

  // deep link: qoe.html#oc-risk opens that cutout enlarged
  const initial = (location.hash.match(/^#oc-([a-z]+)$/) || [])[1];
  const s0 = SCRAPS.find((s) => s.key === initial);
  if (s0) openLb(s0, null);
})();
