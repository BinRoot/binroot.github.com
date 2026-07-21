// Chicken-wire background: a faint hexagonal mesh behind the whole page — at
// once the coop's fencing, the quantum circuit's wires, and a 2D lattice for
// a post about 2D expressions. Hexagons sitting behind a spatial code block
// glow a touch darker (their neighbors at half strength), so the language's
// cells light up its own lattice.
//
// Everything is document-anchored: the mesh is a tiled SVG background on an
// absolutely positioned layer, and the glow is an SVG of hex polygons in
// document coordinates. Text, mesh, and glow therefore live in one coordinate
// space that the browser scrolls and zooms as a unit — no scroll handler, no
// devicePixelRatio math, and no way for the glow to drift off its block.
(() => {
  const INK = '45, 49, 64';
  const MESH_ALPHA = 0.055;
  const GLOW_ALPHA = 0.06; // fill for hexes behind spatial code
  const PATH_ALPHA = 0.045; // stepping-stone cells in .hexpath suspense gaps
  const A = 14;   // half hex width
  const B = 8;    // cap rise
  const V = 16;   // side-wall height (B = A/√3, V = 2A/√3 → regular hexagons)
  const PAD = 6;  // how far past a line's box the glow reaches
  const NS = 'http://www.w3.org/2000/svg';
  const TX = 2 * A;        // lattice period
  const TY = 2 * (B + V);

  // Vertex lattice: v(k, i) = (i*A, k*(B+V) + (high ? 0 : B)), high at k+i odd.
  const vy = (k, i) => k * (B + V) + ((k + i) % 2 === 1 ? 0 : B);

  // One period of the lattice as a background tile. Edges whose twins lie on
  // the opposite seam are drawn on both, so tiles join without half-width walls.
  const seg = (x1, y1, x2, y2) => `<line x1='${x1}' y1='${y1}' x2='${x2}' y2='${y2}'/>`;
  const tile =
    `<svg xmlns='${NS}' width='${TX}' height='${TY}'>` +
    `<g stroke='rgba(${INK},${MESH_ALPHA})' stroke-width='1' fill='none'>` +
    seg(0, B, A, 0) + seg(A, 0, TX, B) +
    seg(0, B + V, A, B + V + B) + seg(A, B + V + B, TX, B + V) +
    seg(0, B, 0, B + V) + seg(TX, B, TX, B + V) +
    seg(A, B + V + B, A, TY) +
    `</g></svg>`;

  const glow = document.createElementNS(NS, 'svg');
  glow.setAttribute('aria-hidden', 'true');
  glow.setAttribute('class', 'cwire-bg');
  glow.style.cssText = 'position:absolute;left:0;top:0;z-index:-1;pointer-events:none;';
  const mesh = document.createElement('div');
  mesh.setAttribute('aria-hidden', 'true');
  mesh.className = 'cwire-bg';
  mesh.style.cssText = 'position:absolute;left:0;right:0;top:0;z-index:-1;pointer-events:none;' +
    `background-image:url("data:image/svg+xml,${encodeURIComponent(tile)}");` +
    `background-size:${TX}px ${TY}px;`;
  // Glow first, mesh second: the wire strokes paint on top of the fills.
  document.body.prepend(mesh);
  document.body.prepend(glow);

  const style = document.createElement('style');
  style.textContent = '@media print { .cwire-bg { display: none; } }';
  document.head.appendChild(style);

  let pres = null;
  let lastSig = '';

  // Suspense trails light up the first time their gap scrolls into view.
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lit = new WeakSet();
  let gapEls = null;
  let observer = null;

  const sig = () => {
    if (!pres || !pres.length) return '';
    const r = pres[0].getBoundingClientRect();
    const d = document.documentElement;
    return `${d.clientWidth}|${d.scrollHeight}|${Math.round(r.left + scrollX)}|${Math.round(r.top + scrollY)}`;
  };

  const layout = () => {
    // Our language plus the speedrun guests: every spatial language glows.
    if (!pres) {
      pres = [...document.querySelectorAll(
        'pre.spatial, pre.befunge, pre.orca, pre.racket2d, pre.hexagony, pre.ladder'
      )].map((p) => p.querySelector('code') || p);
    }
    const docW = document.documentElement.clientWidth;
    const docH = document.documentElement.scrollHeight;
    mesh.style.height = docH + 'px';
    glow.setAttribute('width', docW);
    glow.setAttribute('height', docH);

    // Per-line boxes via the Range API in document coordinates, merged into
    // one rect per text line. Whitespace-only nodes are indentation and
    // alignment gaps; glowing them would halo empty columns.
    const rects = [];
    pres.forEach((code) => {
      const lines = new Map();
      code.childNodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE && !node.textContent.trim()) return;
        const range = document.createRange();
        range.selectNode(node);
        for (const r of range.getClientRects()) {
          if (!r.width || !r.height) continue;
          const top = r.top + scrollY;
          const l = lines.get(Math.round(top));
          if (l) {
            l.x0 = Math.min(l.x0, r.left + scrollX);
            l.x1 = Math.max(l.x1, r.right + scrollX);
            l.y1 = Math.max(l.y1, r.bottom + scrollY);
          } else {
            lines.set(Math.round(top), {
              x0: r.left + scrollX, x1: r.right + scrollX,
              y0: top, y1: r.bottom + scrollY,
            });
          }
        }
      });
      lines.forEach((l) => rects.push(l));
    });

    // Core hexes have their center behind a line of code; the six lattice
    // neighbors of each get half glow.
    const core = new Set();
    rects.forEach((r) => {
      const k0 = Math.ceil((r.y0 - PAD - (B + V / 2)) / (B + V));
      const k1 = Math.floor((r.y1 + PAD - (B + V / 2)) / (B + V));
      const i0 = Math.ceil((r.x0 - PAD) / A);
      const i1 = Math.floor((r.x1 + PAD) / A);
      for (let k = k0; k <= k1; k++) {
        for (let i = Math.max(i0, 1); i <= i1; i++) {
          if ((k + i) % 2 === 1) core.add(`${k},${i}`);
        }
      }
    });
    const halo = new Set();
    core.forEach((id) => {
      const [k, i] = id.split(',').map(Number);
      [[0, -2], [0, 2], [-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([dk, di]) => {
        const n = `${k + dk},${i + di}`;
        if (!core.has(n)) halo.add(n);
      });
    });

    // Suspense gaps: a winding trail of cells descends each .hexpath,
    // stepping to a lattice neighbor each row. The wander is a hash of the
    // row index, so it is deterministic across re-layouts.
    if (!gapEls) {
      gapEls = [...document.querySelectorAll('div.hexpath')];
      if (!still && 'IntersectionObserver' in window) {
        observer = new IntersectionObserver((entries) => entries.forEach((e) => {
          if (!e.isIntersecting) return;
          lit.add(e.target);
          observer.unobserve(e.target);
          const n = gapEls.indexOf(e.target);
          glow.querySelectorAll(`g[data-trail='${n}'] polygon`).forEach((p) => {
            p.style.opacity = 1;
          });
        // Shrinking the root's bottom means a gap counts as intersecting once
        // it has risen above the bottom third of the viewport.
        }), { rootMargin: '0px 0px -33% 0px' });
        gapEls.forEach((el) => observer.observe(el));
      }
    }
    const trails = gapEls.map((el) => {
      const cells = [];
      const r = el.getBoundingClientRect();
      if (!r.height) return cells;
      const mid = Math.round((r.left + scrollX + r.width / 6) / A);
      const k0 = Math.ceil((r.top + scrollY + B - (B + V / 2)) / (B + V));
      const k1 = Math.floor((r.bottom + scrollY - B - (B + V / 2)) / (B + V));
      let i = mid;
      for (let k = k0; k <= k1; k++) {
        if ((k + i) % 2 !== 1) i += 1; // snap onto the lattice
        cells.push(`${k},${i}`);
        const wiggle = ((k * 2654435761) >>> 7) & 1 ? 1 : -1;
        i += i > mid + 2 ? -1 : i < mid - 2 ? 1 : wiggle; // herd toward center
      }
      return cells;
    });

    const poly = (id, extra = '') => {
      const [k, i] = id.split(',').map(Number);
      const pts = [
        [i * A, vy(k, i)], [(i + 1) * A, vy(k, i + 1)],
        [(i + 1) * A, vy(k + 1, i + 1)], [i * A, vy(k + 1, i)],
        [(i - 1) * A, vy(k + 1, i - 1)], [(i - 1) * A, vy(k, i - 1)],
      ];
      return `<polygon points='${pts.map((p) => p.join(',')).join(' ')}'${extra}/>`;
    };
    // Unrevealed trail cells sit at opacity 0 with a staggered transition, so
    // flipping them on when the gap enters the viewport cascades downward.
    const trailSvg = trails.map((cells, n) => {
      const on = still || lit.has(gapEls[n]);
      return `<g fill='rgba(${INK},${PATH_ALPHA})' data-trail='${n}'>` + cells.map((id, j) =>
        poly(id, on ? '' : ` style='opacity:0;transition:opacity .8s ease ${j * 160}ms'`)
      ).join('') + '</g>';
    }).join('');
    glow.innerHTML =
      trailSvg +
      `<g fill='rgba(${INK},${GLOW_ALPHA / 2})'>${[...halo].map(poly).join('')}</g>` +
      `<g fill='rgba(${INK},${GLOW_ALPHA})'>${[...core].map(poly).join('')}</g>`;

    lastSig = sig();
  };

  layout();
  let rt = null;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(layout, 120); });
  addEventListener('load', layout);
  if (document.fonts) document.fonts.ready.then(layout);
  // Watchdog for reflows nothing announces: one rect read when idle.
  setInterval(() => { if (sig() !== lastSig) layout(); }, 400);
})();
