/* spotlight.js -- the hover highlight, for devices that cannot hover.
 *
 * On a phone the cards are one per row and nothing is ever pointed at, so the
 * accent treatment would go unseen.  Instead it follows the scroll: the card
 * whose top rule has just come into view is lit, and when no rule is in view,
 * the one you are currently inside stays lit.
 *
 * Only where there is genuinely no pointer AND the grid has collapsed to one
 * column.  In three columns "the first card whose rule is visible" picks one
 * of three arbitrarily, which reads as a glitch rather than a highlight.
 */
(() => {
  'use strict';

  const cards = Array.from(document.querySelectorAll('.lesson'));
  if (!cards.length) return;

  const mq = matchMedia('(hover: none) and (max-width: 700px)');
  let lit = null;
  let queued = false;

  function choose() {
    queued = false;
    const height = innerHeight;
    let next = null;
    for (const card of cards) {
      // The rule is drawn on the card's top edge, so its position is the rect's.
      const top = card.getBoundingClientRect().top;
      if (top >= 0 && top <= height) { next = card; break; }
      if (top < 0) next = card;   // scrolled past: the card we are reading now
    }
    if (next === lit) return;
    if (lit) lit.classList.remove('lit');
    if (next) next.classList.add('lit');
    lit = next;
  }

  // Scroll fires far more often than the highlight can change, so coalesce to
  // one measurement per frame.
  function onScroll() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(choose);
  }

  function enable() {
    // Tells the stylesheet that a single card is now carrying the accent, so
    // the no-JavaScript fallback of colouring every rule can stand down.
    document.documentElement.classList.add('lit-active');
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll, { passive: true });
    choose();
  }

  function disable() {
    document.documentElement.classList.remove('lit-active');
    removeEventListener('scroll', onScroll);
    removeEventListener('resize', onScroll);
    if (lit) lit.classList.remove('lit');
    lit = null;
  }

  const sync = () => (mq.matches ? enable() : disable());
  mq.addEventListener('change', sync);
  sync();
})();
