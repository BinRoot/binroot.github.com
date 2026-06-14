// Render `:::slinky` lists. Items written with a `-` bullet are always shown;
// items written with a `.` bullet are hidden by default. Each contiguous run of
// `.` items collapses behind a toggle that stretches open like a slinky for any
// reader curious enough to expand it.
//
// Pandoc (with hard_line_breaks) glues each run of `.`-prefixed lines onto the
// preceding `<li>`, joined by <br>. So we flatten every <li> back into an
// ordered list of segments, classify them, then rebuild the markup ourselves.
(() => {
  const BR = /<br\s*\/?>/i;

  const buildItem = (html) => {
    const li = document.createElement('li');
    li.className = 'slinky-item';
    li.innerHTML = html;
    return li;
  };

  const buildGroup = (run) => {
    const li = document.createElement('li');
    li.className = 'slinky-group';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'slinky-toggle';
    btn.setAttribute('aria-expanded', 'false');
    const word = run.length === 1 ? 'item' : 'items';
    btn.setAttribute('aria-label', 'Show ' + run.length + ' more ' + word);
    btn.innerHTML =
      '<span class="slinky-dot"></span>' +
      '<span class="slinky-dot"></span>' +
      '<span class="slinky-dot"></span>';

    const reveal = document.createElement('div');
    reveal.className = 'slinky-reveal';
    const sub = document.createElement('ul');
    sub.className = 'slinky-list slinky-sub';
    run.forEach((html) => sub.appendChild(buildItem(html)));
    reveal.appendChild(sub);

    // Expanding is one-way: once open, the toggle is gone and the run reads as
    // ordinary bullets, indistinguishable from its neighbors.
    btn.addEventListener('click', () => {
      if (btn.getAttribute('aria-expanded') === 'true') return;
      reveal.style.maxHeight = reveal.scrollHeight + 'px';
      btn.setAttribute('aria-expanded', 'true');
      li.classList.add('slinky-open');
      // Once open, drop the cap and let overflow show so the bullet markers
      // (which sit left of the text) are no longer clipped by the animation box.
      reveal.addEventListener('transitionend', function te(e) {
        if (e.propertyName !== 'max-height') return;
        reveal.style.maxHeight = 'none';
        reveal.style.overflow = 'visible';
        reveal.removeEventListener('transitionend', te);
      });
    });

    li.appendChild(btn);
    li.appendChild(reveal);
    return li;
  };

  document.querySelectorAll('div.slinky').forEach((box) => {
    const srcUl = box.querySelector(':scope > ul');
    if (!srcUl) return;

    // Flatten <li> elements into an ordered [{ html, hidden }] sequence.
    const items = [];
    srcUl.querySelectorAll(':scope > li').forEach((li) => {
      li.innerHTML.split(BR).forEach((seg) => {
        const html = seg.trim();
        if (!html) return;
        const hidden = html.charAt(0) === '.';
        items.push({
          html: hidden ? html.replace(/^\.\s*/, '') : html,
          hidden,
        });
      });
    });

    // Rebuild: emit visible items inline, wrap each hidden run in a slinky.
    const out = document.createElement('ul');
    out.className = 'slinky-list';
    for (let i = 0; i < items.length; ) {
      if (!items[i].hidden) {
        out.appendChild(buildItem(items[i].html));
        i++;
      } else {
        const run = [];
        while (i < items.length && items[i].hidden) run.push(items[i++].html);
        out.appendChild(buildGroup(run));
      }
    }

    box.replaceChild(out, srcUl);
  });
})();
