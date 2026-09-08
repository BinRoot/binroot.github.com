// Presenter-paced figures: deck arrows and buttons share one reveal state.
// Reduced motion keeps every teaching beat, without tweening.
(function () {
  const L = window.L2;
  L.beats = (svg, { stops, labels, draw, duration = 850 }) => {
    const marks = stops.slice(1).map(() => L.el('g', { class: 'step', 'aria-hidden': 'true' }, svg));
    const controls = document.createElement('div');
    controls.className = 'l2-controls l2-beat-controls no-nav';
    const back = document.createElement('button'), next = document.createElement('button');
    back.type = next.type = 'button';
    back.textContent = 'Back';
    const status = document.createElement('span');
    status.setAttribute('aria-live', 'polite');
    controls.append(back, status, next);
    svg.closest('.l2-fig').after(controls);
    let index = 0, value = stops[0], frame = 0;
    const seek = (v) => { value = v; draw(v); };
    const update = (n) => {
      cancelAnimationFrame(frame);
      const before = index;
      index = Math.min(n, stops.length - 1);
      back.disabled = index === 0;
      next.disabled = index === stops.length - 1;
      next.textContent = next.disabled ? 'Complete' : labels[index + 1];
      status.textContent = `${index + 1} / ${stops.length} · ${labels[index]}`;
      svg.dataset.beat = String(index);
      const target = stops[index], start = value, began = performance.now();
      if (L.reduced() || !L.isCurrent(svg) || index <= before) { seek(target); return; }
      const tick = (now) => {
        const u = Math.min(1, (now - began) / duration);
        seek(L.lerp(start, target, L.ease(u)));
        if (u < 1 && L.isCurrent(svg)) frame = requestAnimationFrame(tick);
        else seek(target);
      };
      frame = requestAnimationFrame(tick);
    };
    back.addEventListener('click', () => { if (index) marks[index - 1].classList.remove('shown'); });
    next.addEventListener('click', () => { if (index < marks.length) marks[index].classList.add('shown'); });
    window.addEventListener('keydown', (e) => {
      if ((e.key === ' ' || e.key === 'Enter') && controls.contains(e.target)) {
        e.preventDefault(); e.stopImmediatePropagation(); e.target.click();
      }
    }, true);
    L.steps(svg, update);
    L.onCurrent(svg, (active) => {
      if (!active) { cancelAnimationFrame(frame); seek(stops[index]); }
    });
    window.addEventListener('beforeprint', () => { cancelAnimationFrame(frame); draw(stops.at(-1)); });
    window.addEventListener('afterprint', () => draw(stops[index]));
    return { seek };
  };
})();
