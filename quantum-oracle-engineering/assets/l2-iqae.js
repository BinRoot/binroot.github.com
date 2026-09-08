// A worked interval-refinement example, not an IQAE performance benchmark.
// Each batch has 512 illustrative outcomes. Hoeffding intervals allocate
// failure probability 0.05/3 per batch; intersection preserves 95% coverage.
// The prior theta interval selects a single monotone lobe of sin²((2k+1)θ),
// including the descending lobe at k=3. Never treat the amplified frequency
// as the original payoff probability. See Grinko et al., equations 4–5.
(function () {
  const svg = document.getElementById('l2-iqae-fig');
  if (!svg) return;
  const L = window.L2, root = L.el('g', {}, svg), N = 512;
  const half = Math.sqrt(Math.log(120) / (2 * N));
  let prior = [0, Math.PI / 2];
  const rounds = [[0, 60], [1, 384], [3, 212]].map(([k, ones]) => {
    const m = 2 * k + 1, q = ones / N;
    const p = [Math.max(0, q - half), Math.min(1, q + half)];
    const lobe = Math.floor(m * prior[0] / (Math.PI / 2));
    // k is admissible only when the full current interval fits one lobe.
    if (m * prior[1] > (lobe + 1) * Math.PI / 2 + 1e-9) throw Error('Ambiguous estimation round');
    const invert = (v) => {
      const a = Math.asin(Math.sqrt(v));
      return (lobe % 2 === 0 ? lobe * Math.PI / 2 + a : (lobe + 1) * Math.PI / 2 - a) / m;
    };
    const ends = p.map(invert).sort((a, b) => a - b);
    const interval = [Math.max(prior[0], ends[0]), Math.min(prior[1], ends[1])];
    const r = { k, ones, interval, prior, q };
    prior = interval;
    return r;
  });
  const C = { x: 155, y: 210, r: 118 };
  L.text(root, 'Possible original angles', C.x, 24, { size: 22, weight: 600 });
  const point = (a, r = C.r) => [C.x + r * Math.cos(a), C.y - r * Math.sin(a)];
  const path = ([lo, hi]) => {
    const a = point(lo), b = point(hi);
    return `M ${C.x} ${C.y} L ${a} A ${C.r} ${C.r} 0 0 0 ${b} Z`;
  };
  const sector = L.el('path', { fill: L.BLUE, 'fill-opacity': 0.22, stroke: L.BLUE, 'stroke-width': 2 }, root);
  L.el('path', { d: `M ${C.x} ${C.y - C.r} V ${C.y} H ${C.x + C.r}`, fill: 'none', stroke: L.WIRE, 'stroke-width': 1.5 }, root);
  L.text(root, '0°', C.x + C.r + 12, C.y + 19, { size: 16 });
  L.text(root, '90°', C.x - 22, C.y - C.r, { size: 16 });
  const thetaText = L.text(root, '', C.x + 25, 246, { size: 21, fill: L.BLUE, mono: true, weight: 600 });
  L.text(root, 'a = sin²θ', C.x + 25, 282, { size: 24, serif: true });
  const aText = L.text(root, '', C.x + 25, 315, { size: 20, mono: true, fill: L.BLUE });
  const headers = ['Run', 'Measure', 'Narrow'];
  [430, 622, 805].forEach((x, i) => L.text(root, headers[i], x, 24, { size: 22, weight: 600 }));
  const rows = rounds.map((r, i) => {
    const y = 87 + i * 86;
    const g = L.el('g', {}, root);
    const highlight = L.el('rect', { x: 333, y: y - 34, width: 550, height: 72, rx: 12, fill: '#fffdf8', stroke: L.FAINT }, g);
    L.el('line', { x1: 344, y1: y, x2: 502, y2: y, stroke: L.WIRE, 'stroke-width': 2 }, g);
    [[365, 'A'], [431, r.k ? `Q${r.k === 1 ? '' : '³'}` : '—']].forEach(([x, label]) => {
      L.el('rect', { x, y: y - 20, width: 48, height: 40, rx: 6, fill: '#fff', stroke: L.BLUE, 'stroke-width': 1.5 }, g);
      L.text(g, label, x + 24, y, { size: 23, serif: true });
    });
    L.text(g, '→', 521, y, { size: 24, fill: L.WIRE });
    const shots = L.el('g', {}, g);
    // A few individual outcomes appear before the whole batch total.
    const bits = Array.from({ length: 8 }, (_, j) => L.text(shots, ((j * 5 + i * 3) % 8) < Math.round(r.q * 8) ? '1' : '0', 549 + j * 20, y - 9, { size: 18, mono: true, fill: L.BLUE }));
    const tally = L.text(shots, `${r.ones} / ${N} ones`, 620, y + 16, { size: 17, mono: true });
    const narrowed = L.el('g', {}, g);
    L.el('line', { x1: 746, y1: y, x2: 864, y2: y, stroke: L.FAINT, 'stroke-width': 3 }, narrowed);
    const deg = r.interval.map(a => a * 180 / Math.PI);
    L.el('line', { x1: 746 + deg[0] / 90 * 118, y1: y, x2: 746 + deg[1] / 90 * 118, y2: y, stroke: L.BLUE, 'stroke-width': 10, 'stroke-linecap': 'round' }, narrowed);
    L.text(narrowed, `${deg[0].toFixed(1)}–${deg[1].toFixed(1)}°`, 805, y + 24, { size: 16, mono: true, fill: L.BLUE });
    return { g, highlight, shots, bits, tally, narrowed };
  });
  const feedback = L.text(root, 'Choose a circuit that keeps the angle unambiguous.', 450, 368, { size: 20, fill: L.INK });
  const labels = rounds.flatMap((r, i) => [`Run ${i + 1}: ${r.k} turns of Q`, 'Collect the shots', 'Narrow the interval']);
  L.beats(svg, {
    stops: Array.from({ length: 9 }, (_, i) => i), labels, duration: 1100,
    draw: (t) => {
      const active = Math.min(2, Math.floor((t + 0.001) / 3));
      rows.forEach((row, i) => {
        row.g.setAttribute('opacity', i <= active ? 1 : 0.18);
        row.highlight.setAttribute('stroke', i === active ? L.BLUE : L.FAINT);
        const measuring = L.clamp01(t - i * 3);
        row.shots.setAttribute('opacity', measuring > 0 ? 1 : 0);
        row.bits.forEach((bit, j) => bit.setAttribute('opacity', measuring >= (j + 1) / 9 ? 1 : 0));
        row.tally.setAttribute('opacity', measuring >= 0.99 ? 1 : 0);
        row.narrowed.setAttribute('opacity', L.clamp01(t - i * 3 - 1));
      });
      const r = rounds[active], u = L.clamp01(t - active * 3 - 1);
      const bounds = r.prior.map((a, j) => L.lerp(a, r.interval[j], u));
      sector.setAttribute('d', path(bounds));
      thetaText.textContent = `${(bounds[0] * 180 / Math.PI).toFixed(1)}–${(bounds[1] * 180 / Math.PI).toFixed(1)}°`;
      const a = bounds.map(b => Math.sin(b) ** 2);
      // Round bounds outward so the displayed interval keeps its coverage.
      aText.textContent = `${(Math.floor(a[0] * 1000) / 1000).toFixed(3)} ≤ a ≤ ${(Math.ceil(a[1] * 1000) / 1000).toFixed(3)}`;
      svg.dataset.interval = JSON.stringify(a);
      feedback.textContent = t >= 8 ? 'Interval width < 2ε: stop here for ε = 0.01.' :
        u >= 0.99 ? 'This interval guides the next number of turns of Q. ↻' :
        t % 3 >= 0.99 ? 'The measured frequency belongs to this circuit; infer the original θ.' :
        'Choose a circuit that keeps the angle unambiguous.';
    }
  });
})();
