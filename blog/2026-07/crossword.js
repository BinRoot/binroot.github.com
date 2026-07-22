// Rebuild the post title as a corner frame: the across word runs along the
// top, the down word descends through the shared letter, and the whole cross
// hangs in the left margin — outside the text column — so the title borders
// the body from the top-left, and the post opens inside the corner.
//
// Geometry: every piece is a small grid whose container background paints the
// lattice (ink background, white cells, gaps as lines); adjacent pieces
// overlap by one line width so they read as one grid. When the viewport has
// no margin to hang into, the tail floats inside the column instead and the
// opening text wraps around it. On phones the tail only peeks below the bar
// and fades out, as if the word keeps going off the page, so the text gets
// its full width back right away.
(() => {
  const ACROSS = 'spatial';
  const DOWN = 'languages';
  const CROSS_ACROSS = 2; // sp[a]tial
  const CROSS_DOWN = 1;   // l[a]nguages
  const BW = 2;           // lattice line width
  const GAP = 24;         // clearance between the frame and the text column
  const COLS = CROSS_ACROSS + 1; // columns the frame needs left of the text

  const style = document.createElement('style');
  style.textContent = `
    .cw { position: relative; margin: 10px 0 0; }
    .cw-box {
      --cw: clamp(30px, 9vw, 44px);
      --bw: ${BW}px;
      --ink: #1a1a1a;
      display: grid;
      gap: var(--bw);
      background: var(--ink);
      padding: var(--bw);
      width: max-content;
    }
    .cw-out .cw-box { --cw: var(--cw-o); }
    .cw-col { grid-template-columns: var(--cw); }
    .cw-above, .cw-rail { margin-left: calc(${CROSS_ACROSS} * (var(--cw) + var(--bw))); }
    .cw-across {
      grid-template-columns: repeat(${ACROSS.length}, var(--cw));
      margin-top: calc(-1 * var(--bw));
    }
    .cw-cell {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: var(--cw);
      height: var(--cw);
      background: #fff;
      color: var(--ink);
      font: 700 calc(var(--cw) * 0.52)/1 'Ubuntu', system-ui, -apple-system, 'Segoe UI', sans-serif;
      text-transform: uppercase;
    }
    .cw-shared { background: #fae5d3; }

    /* Outside mode: shift the cross left so the shared-letter column (and the
       tail below it) clears the text; the tail hangs in the margin. */
    .cw-out { margin-left: calc(-1 * (${COLS} * (var(--cw-o) + ${BW}px) + ${GAP}px)); }
    .cw-out .cw-rail {
      position: absolute;
      left: 0;
      top: calc(100% - var(--bw));
    }

    /* Inside mode (no margin to hang into): the tail floats in the column. */
    .cw-in .cw-rail {
      float: left;
      margin-top: calc(-1 * var(--bw));
      margin-right: 28px;
      margin-bottom: 14px;
    }
    .cw ~ h2 { clear: left; }

    /* Peek mode (phones): the tail shows a couple of cells and dissolves,
       and nothing wraps around it. The negative bottom margin hands the
       masked-out region back to the flow. */
    .cw-peek .cw-rail {
      position: static;
      float: none;
      margin-top: calc(-1 * var(--bw));
      margin-bottom: calc(-1 * (var(--cw) + var(--bw)));
      max-height: calc(2.5 * (var(--cw) + var(--bw)));
      overflow: hidden;
      -webkit-mask-image: linear-gradient(to bottom, #000 20%, transparent 88%);
      mask-image: linear-gradient(to bottom, #000 20%, transparent 88%);
    }

    /* Pandoc's default stylesheet centers the title block and pads it with
       4em below — undo both so the body opens snug inside the corner. */
    #title-block-header { margin-bottom: 0; text-align: left; }
    .cw-meta {
      position: absolute;
      right: 0;
      text-align: right;
      font-size: 0.85rem;
      line-height: 1.65;
      letter-spacing: 0.02em;
      color: #8a90a0;
    }
    .cw-meta p { margin: 0; }
    .cw-meta a {
      color: inherit;
      text-decoration: none;
      border-bottom: 1px dotted transparent;
      transition: color 0.2s ease, border-color 0.2s ease;
    }
    .cw-meta a:hover { color: #2d3140; border-bottom-color: #2d3140; }
    /* No room beside the bar (tiny screens): drop the meta into the flow. */
    .cw-meta-flow { position: static; margin-top: 8px; }
  `;
  document.head.appendChild(style);

  const box = (cls) => {
    const b = document.createElement('span');
    b.className = `cw-box ${cls}`;
    b.setAttribute('aria-hidden', 'true');
    return b;
  };

  const cell = (letter, shared) => {
    const c = document.createElement('span');
    c.className = shared ? 'cw-cell cw-shared' : 'cw-cell';
    c.textContent = letter;
    return c;
  };

  const h1 = document.querySelector('h1');
  if (!h1) return;
  h1.classList.add('cw');
  h1.setAttribute('aria-label', h1.textContent);
  h1.textContent = '';

  // The down word's head sits above the bar (letters before the shared one)…
  const above = box('cw-above cw-col');
  DOWN.slice(0, CROSS_DOWN).split('').forEach((ch) => above.appendChild(cell(ch, false)));
  h1.appendChild(above);

  // …the across word is the top bar…
  const across = box('cw-across');
  ACROSS.split('').forEach((ch, i) => across.appendChild(cell(ch, i === CROSS_ACROSS)));
  h1.appendChild(across);

  // …and the tail runs down the left edge, framing the opening text.
  const rail = box('cw-rail cw-col');
  DOWN.slice(CROSS_DOWN + 1).split('').forEach((ch) => rail.appendChild(cell(ch, false)));
  h1.appendChild(rail);

  // Author/date ride top-right, on the same row as the across bar.
  const header = h1.closest('header');
  const metaPs = header ? header.querySelectorAll('p.author, p.date') : [];
  let meta = null;
  if (metaPs.length) {
    meta = document.createElement('div');
    meta.className = 'cw-meta';
    metaPs.forEach((p) => meta.appendChild(p));
    header.style.position = 'relative';
    header.appendChild(meta);
  }

  // Hang the frame in the left margin when it fits, sized up to 44px cells;
  // otherwise keep it inside the column. Phones get peek mode: the tail
  // fades out under the bar and the meta drops into the flow.
  const update = () => {
    h1.classList.remove('cw-out', 'cw-in', 'cw-peek');
    h1.style.removeProperty('--cw-o');
    if (meta) {
      meta.classList.remove('cw-meta-flow');
      meta.style.top = '';
    }
    if (window.matchMedia('(max-width: 640px)').matches) {
      h1.classList.add('cw-peek');
      if (meta) meta.classList.add('cw-meta-flow');
      return;
    }
    const avail = h1.getBoundingClientRect().left;
    const cw = Math.min(44, Math.floor((avail - GAP) / COLS) - BW);
    if (cw >= 30) {
      h1.style.setProperty('--cw-o', cw + 'px');
      h1.classList.add('cw-out');
    } else {
      h1.classList.add('cw-in');
    }
    if (meta) {
      const bar = across.getBoundingClientRect();
      const top = bar.top - header.getBoundingClientRect().top;
      meta.style.top = `${top + bar.height / 2 - meta.offsetHeight / 2}px`;
      if (meta.getBoundingClientRect().left < bar.right + 10) {
        meta.classList.add('cw-meta-flow');
        meta.style.top = '';
      }
    }
  };
  update();
  window.addEventListener('resize', update);
})();
