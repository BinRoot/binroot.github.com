// simulator-oracle.js -- slide 11: the simulator is the oracle.
//
// Two rows built from the same box, the Pig simulator.  Top, the classical
// loop: call the simulator, read a 0 or a 1, call again; dots pile up into an
// estimate.  Bottom, the coherent loop: the same simulator as a circuit, run
// forward, then backward, then forward again, nothing read until one
// measurement at the end.  No equation; Lesson 2 writes it.
(function () {
  if (window.__simOracleInit) return; window.__simOracleInit = true;
  const L = window.L2;
  document.querySelectorAll('svg.simulator-oracle').forEach((svg) => {
    const root = L.el('g', {}, svg);
    const box = (x, y, w, label, dag, col) => {
      const g = L.el('g', {}, root);
      L.el('rect', { x, y: y - 22, width: w, height: 44, rx: 6, fill: '#fff', stroke: col || L.INK, 'stroke-width': 1.6 }, g);
      const t = L.text(g, label, x + w / 2, y, { size: 12, mono: true, fill: col || L.INK });
      if (dag) { const d = L.el('tspan', { 'baseline-shift': 'super', 'font-size': 9 }, t); d.textContent = '†'; }
      return g;
    };
    // top row
    const Y1 = 80, Y2 = 200;
    L.text(root, 'classical', 60, Y1, { anchor: 'end', size: 14, weight: 700 });
    L.text(root, 'quantum', 60, Y2, { anchor: 'end', size: 14, weight: 700, fill: L.BLUE });
    const dots = [], topBoxes = [];
    for (let i = 0; i < 4; i++) {
      const x = 90 + i * 120;
      topBoxes.push(box(x, Y1, 78, 'simulate', false));
      L.el('line', { x1: x + 78, y1: Y1, x2: x + 120, y2: Y1, stroke: L.WIRE, 'stroke-width': 1.5 }, root);
      dots.push(L.el('circle', { cx: x + 99, cy: Y1, r: 6, fill: i % 3 === 1 ? '#fff' : L.INK, stroke: L.INK, 'stroke-width': 1.5, opacity: 0 }, root));
    }
    L.text(root, '…', 578, Y1, { size: 18, fill: L.DIM });
    const est1 = L.text(root, 'M samples → estimate', 660, Y1, { size: 12.5, fill: L.DIM, opacity: 0 });
    L.text(root, 'read after every call', 330, Y1 + 40, { size: 12, fill: L.DIM });
    // bottom row
    const lowBoxes = [];
    for (let i = 0; i < 4; i++) {
      const x = 90 + i * 120;
      lowBoxes.push(box(x, Y2, 78, 'simulate', i % 2 === 1, L.BLUE));
      L.el('line', { x1: x + 78, y1: Y2, x2: x + 120, y2: Y2, stroke: L.WIRE, 'stroke-width': 1.5 }, root);
      L.text(root, i % 2 ? 'backward' : 'forward', x + 39, Y2 + 36, { size: 11, fill: L.BLUE });
    }
    L.text(root, '…', 578, Y2, { size: 18, fill: L.DIM });
    const meas = L.el('g', { opacity: 0 }, root);
    L.el('rect', { x: 612, y: Y2 - 14, width: 30, height: 28, rx: 3, fill: '#fff', stroke: L.INK, 'stroke-width': 1.5 }, meas);
    L.el('path', { d: `M 618 ${Y2 + 7} A 9 9 0 0 1 636 ${Y2 + 7}`, fill: 'none', stroke: L.INK, 'stroke-width': 1.3 }, meas);
    L.el('line', { x1: 627, y1: Y2 + 7, x2: 634, y2: Y2 - 5, stroke: L.INK, 'stroke-width': 1.3 }, meas);
    L.text(meas, 'one read → estimate', 627, Y2 + 36, { size: 12, fill: L.BLUE });
    L.text(root, 'nothing read until the end', 330, Y2 + 60, { size: 12, fill: L.BLUE });
    const ptr = L.el('circle', { r: 6, fill: L.ORANGE, opacity: 0 }, root);
    const T = 5.2;
    const setState = (t) => {
      // top pass 0..2.2, bottom pass 2.4..4.6
      if (t < 2.2) { const u = t / 2.2; ptr.setAttribute('opacity', 1); ptr.setAttribute('cx', L.lerp(90, 560, u)); ptr.setAttribute('cy', Y1); dots.forEach((d, i) => d.setAttribute('opacity', u > (i + 0.9) / 4 ? 1 : 0)); }
      else if (t < 4.6) { const u = (t - 2.4) / 2.2; ptr.setAttribute('opacity', u >= 0 ? 1 : 0); ptr.setAttribute('cx', L.lerp(90, 560, L.clamp01(u))); ptr.setAttribute('cy', Y2); dots.forEach((d) => d.setAttribute('opacity', 1)); }
      else { ptr.setAttribute('opacity', 0); dots.forEach((d) => d.setAttribute('opacity', 1)); }
      est1.setAttribute('opacity', L.win(t, 2.0, 0.4));
      meas.setAttribute('opacity', L.win(t, 4.5, 0.5));
    };
    L.timeline(svg, { T, setState });
  });
})();
