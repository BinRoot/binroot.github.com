(() => {
  const main = document.querySelector('main');
  if (!main) return;

  const blocks = Array.from(main.children);

  // Mark each subsequent dialog in a run-of-dialogs as a continuation:
  // it'll get a connector pipe instead of its own speech-bubble tail.
  for (let i = 1; i < blocks.length; i++) {
    if (blocks[i].classList.contains('dialog') &&
        blocks[i - 1].classList.contains('dialog')) {
      blocks[i].classList.add('dialog-continuation');
    }
  }

  function isGate(el) {
    return el.classList.contains('dialog') || el.classList.contains('narrator');
  }
  function hasGateAtOrAfter(idx) {
    for (let i = idx; i < blocks.length; i++) if (isGate(blocks[i])) return true;
    return false;
  }

  // First gate = where the interactive stream begins.
  const firstGate = blocks.findIndex(isGate);
  if (firstGate === -1) return;

  // Hide everything from the first gate onward.
  for (let i = firstGate; i < blocks.length; i++) {
    blocks[i].classList.add('scene-hidden');
  }

  let cursor = firstGate - 1;     // last revealed block index
  let typing = null;
  let pendingContinue = null;     // current "▼" continue affordance

  function reveal(el) {
    el.classList.remove('scene-hidden');
    el.classList.add('scene-revealing');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      el.classList.remove('scene-revealing');
      el.classList.add('scene-revealed');
    }));
  }

  // Pixels of breathing room left below the active content. New buttons /
  // response options reveal into this buffer without forcing another scroll.
  const SCROLL_BUFFER = 140;

  function followScroll(el) {
    // Smoothly scroll the element into view, keeping SCROLL_BUFFER of empty
    // space below it. Only scrolls *down* — never yanks back upward.
    setTimeout(() => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const overshoot = rect.bottom - (vh - SCROLL_BUFFER);
      if (overshoot > 0) {
        window.scrollBy({ top: overshoot, behavior: 'smooth' });
      }
    }, 60);
  }

  function followScrollSnap(el) {
    // Instant variant — keeps content in view during typing without smooth-scroll lag.
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight;
    const overshoot = rect.bottom - (vh - SCROLL_BUFFER);
    if (overshoot > 0) window.scrollBy({ top: overshoot, behavior: 'auto' });
  }

  function clearPending() {
    if (pendingContinue) {
      pendingContinue.remove();
      pendingContinue = null;
    }
  }

  // Pause / resume the SIR game in fig1 based on whether the cursor is on it.
  function syncGameState() {
    const fig1 = document.querySelector('.fig1');
    if (!fig1) return;
    const isCurrent = blocks[cursor] === fig1;
    if (isCurrent) {
      fig1.dataset.shouldPlay = 'true';
      fig1.dispatchEvent(new CustomEvent('sir-play'));
    } else {
      fig1.dataset.shouldPlay = 'false';
      fig1.dispatchEvent(new CustomEvent('sir-pause'));
    }
  }

  function isVisualizerHost(el) {
    if (!el || !el.classList) return false;
    for (const c of el.classList) if (/^fig-v\d/.test(c)) return true;
    return false;
  }

  function isFigBlock(el) {
    if (!el || !el.classList) return false;
    for (const c of el.classList) if (/^fig\d|^fig-/.test(c)) return true;
    return false;
  }

  function hasTypeableText(el) {
    function walk(node) {
      for (const child of node.childNodes) {
        if (child.nodeType === Node.TEXT_NODE) {
          if (child.textContent.trim().length > 0) return true;
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          if (child.dataset && 'noType' in child.dataset) continue;
          if (child.classList && (child.classList.contains('dialog-responses') ||
                                  child.classList.contains('scene-continue'))) continue;
          // <pre> is a code block, rendered by the visualizer, not typed.
          if (child.tagName === 'PRE') continue;
          if (walk(child)) return true;
        }
      }
      return false;
    }
    return walk(el);
  }

  function activateTextAnimation(el, onDone) {
    el.addEventListener('click', (e) => {
      if (typing && !e.target.closest('.dialog-responses')) typing.skip();
    });
    followScroll(el);
    startTyping(el, onDone || (() => {}));
  }

  // Reveal exactly the next block. A code block + immediately-following
  // visualizer are revealed together as a single unit. Non-gate blocks
  // get a continue button — unless no further gates exist, in which case
  // we auto-progress through the trailing tail (e.g., References).
  function progress() {
    clearPending();

    const next = cursor + 1;
    if (next >= blocks.length) { syncGameState(); return; }
    cursor = next;
    const el = blocks[cursor];
    reveal(el);

    if (el.classList.contains('dialog')) {
      activateDialog(el);
    } else if (el.classList.contains('narrator')) {
      activateNarrator(el);
    } else {
      // Non-gate block. If it's a code block followed by a visualizer,
      // reveal them as one unit and place the continue affordance below
      // the visualizer.
      let last = el;
      if (el.classList.contains('sourceCode') && isVisualizerHost(blocks[cursor + 1])) {
        cursor++;
        last = blocks[cursor];
        reveal(last);
      }

      const finalize = () => {
        if (hasGateAtOrAfter(cursor + 1)) {
          addContinueAfter(last);
        } else {
          setTimeout(progress, 250);
        }
      };

      // If this is a fig block with prose content, animate it like a narrator
      // before placing the continue affordance.
      if (isFigBlock(el) && hasTypeableText(el)) {
        activateTextAnimation(el, finalize);
      } else {
        finalize();
      }
    }

    syncGameState();
  }

  function addContinueAfter(el) {
    const wrap = document.createElement('div');
    wrap.className = 'scene-continue';
    const btn = document.createElement('button');
    btn.textContent = '▼ continue';
    btn.addEventListener('click', () => progress());
    wrap.appendChild(btn);
    el.after(wrap);
    pendingContinue = wrap;
    followScroll(wrap);
  }

  // ---- Layout-stable typing animation ----
  // Replace every text node with per-character spans set to visibility:hidden.
  // The full layout is computed up front (at final size), so revealing
  // characters one at a time doesn't reflow the bubble. This keeps centered
  // text (narrator) from shifting horizontally as it grows.
  function startTyping(root, onDone) {
    const items = [];

    function collect(node) {
      for (const child of Array.from(node.childNodes)) {
        if (child.nodeType === Node.TEXT_NODE) {
          const full = child.textContent;
          if (full.length === 0) continue;
          const frag = document.createDocumentFragment();
          const spans = [];
          for (const c of full) {
            const span = document.createElement('span');
            span.textContent = c;
            span.style.visibility = 'hidden';
            frag.appendChild(span);
            spans.push(span);
          }
          child.parentNode.replaceChild(frag, child);
          items.push({ type: 'text', spans });
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          if (child.classList && (child.classList.contains('dialog-responses') ||
                                  child.classList.contains('scene-continue'))) {
            continue;
          }
          if (child.dataset && 'noType' in child.dataset) continue;
          // <pre> is a multi-line code block, shown by the visualizer — don't
          // wrap its text in per-character spans.
          if (child.tagName === 'PRE') continue;
          // Inline elements with their own visible decoration (background,
          // padding, etc.) need to stay hidden until typing reaches them —
          // otherwise an empty styled box flashes before any characters arrive.
          if (child.tagName === 'CODE') {
            child.style.visibility = 'hidden';
            items.push({ type: 'element', element: child });
          }
          collect(child);
        }
      }
    }
    collect(root);

    let it = 0, ch = 0, timer = null, done = false;
    let scrollCounter = 0;
    const TICK_MS = 22;

    function finish() {
      if (done) return;
      done = true;
      if (timer) clearTimeout(timer);
      for (const item of items) {
        if (item.type === 'text') {
          for (const s of item.spans) s.style.visibility = '';
        } else if (item.type === 'element') {
          item.element.style.visibility = '';
        }
      }
      typing = null;
      if (onDone) onDone();
    }

    function tick() {
      if (it >= items.length) { finish(); return; }
      const item = items[it];
      if (item.type === 'element') {
        // Reveal element decoration in the same frame as its first character
        // so we don't flash an empty styled box.
        item.element.style.visibility = '';
        it++;
        tick();
        return;
      }
      const spans = item.spans;
      if (ch < spans.length) {
        spans[ch++].style.visibility = '';
        if (++scrollCounter % 4 === 0) followScrollSnap(root);
        timer = setTimeout(tick, TICK_MS);
      } else {
        it++; ch = 0;
        timer = setTimeout(tick, TICK_MS);
      }
    }

    typing = { skip: finish };
    tick();
  }

  // ---- Dialog ----
  function activateDialog(el) {
    const respAttr = el.getAttribute('data-resp') || '';
    const responses = respAttr ? respAttr.split('|').map(s => s.trim()).filter(Boolean) : [];

    el.addEventListener('click', (e) => {
      if (typing && !e.target.closest('.dialog-responses')) typing.skip();
    });

    followScroll(el);
    startTyping(el, () => {
      const wrap = document.createElement('div');
      wrap.className = 'dialog-responses';

      if (responses.length === 0) {
        const btn = document.createElement('button');
        btn.textContent = '▼ continue';
        btn.addEventListener('click', () => { wrap.remove(); progress(); });
        wrap.appendChild(btn);
      } else {
        responses.forEach(resp => {
          const btn = document.createElement('button');
          btn.textContent = resp;
          btn.addEventListener('click', () => {
            wrap.remove();
            const chosen = document.createElement('div');
            chosen.className = 'dialog-chosen';
            chosen.textContent = `⤷ ${resp}`;
            el.appendChild(chosen);
            progress();
          });
          wrap.appendChild(btn);
        });
      }
      el.appendChild(wrap);
      followScroll(wrap);
    });
  }

  // ---- Narrator ----
  function activateNarrator(el) {
    el.addEventListener('click', (e) => {
      if (typing && !e.target.closest('.dialog-responses')) typing.skip();
    });

    followScroll(el);
    startTyping(el, () => {
      const wrap = document.createElement('div');
      wrap.className = 'dialog-responses narrator-responses';
      const btn = document.createElement('button');
      btn.textContent = '▼ continue';
      btn.addEventListener('click', () => { wrap.remove(); progress(); });
      wrap.appendChild(btn);
      el.appendChild(wrap);
      followScroll(wrap);
    });
  }

  // ---- "Show all" escape hatch ----
  const showAllBtn = document.createElement('button');
  showAllBtn.className = 'show-all-btn';
  showAllBtn.textContent = '[ show all ]';
  showAllBtn.title = 'Skip dialog and reveal everything';
  const showAllSlot = main.querySelector('.post-meta-show-all');
  if (showAllSlot) {
    showAllSlot.appendChild(showAllBtn);
  } else {
    main.insertBefore(showAllBtn, main.firstChild);
  }

  let showingAll = false;        // true while everything is on screen
  let showAllInFlight = false;   // true during the reveal cascade

  function revealAll() {
    if (typing) typing.skip();
    document.querySelectorAll('.dialog-responses, .scene-continue').forEach(el => el.remove());
    pendingContinue = null;

    let idx = cursor + 1;
    function step() {
      if (idx >= blocks.length) {
        cursor = blocks.length - 1;
        syncGameState();
        showAllInFlight = false;
        return;
      }
      const el = blocks[idx];
      el.classList.remove('scene-hidden');
      el.classList.add('scene-revealing');
      requestAnimationFrame(() => requestAnimationFrame(() => {
        el.classList.remove('scene-revealing');
        el.classList.add('scene-revealed');
      }));
      idx++;
      setTimeout(step, 80);
    }
    step();
  }

  function hideAllAndReset() {
    if (typing) typing.skip();
    typing = null;

    for (let i = firstGate; i < blocks.length; i++) {
      blocks[i].classList.add('scene-hidden');
      blocks[i].classList.remove('scene-revealing', 'scene-revealed');
      blocks[i].querySelectorAll('.dialog-responses').forEach(r => r.remove());
    }
    document.querySelectorAll('.scene-continue').forEach(el => el.remove());
    pendingContinue = null;

    cursor = firstGate - 1;
    syncGameState();
    progress();
  }

  showAllBtn.addEventListener('click', () => {
    if (showAllInFlight) return;
    if (showingAll) {
      showingAll = false;
      showAllBtn.textContent = '[ show all ]';
      hideAllAndReset();
    } else {
      showingAll = true;
      showAllInFlight = true;
      showAllBtn.textContent = '[ hide all ]';
      revealAll();
    }
  });

  progress();
})();
