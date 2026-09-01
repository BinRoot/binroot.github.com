// qr.js -- slide 44: the address.
//
// A concrete Lesson 2 cliffhanger, the QR and the URL.  The slide title stays
// hidden because the call to action is drawn in the figure itself.
//
// This replaces a fuller closing card that also carried the three questions,
// the break-even inequality and the three contenders.  None of that is lost
// from the deck -- the three questions are the figure on slide 20, the
// inequality is slide 42, and the contenders are named on slide 43 -- and
// putting them here again turned the one slide with a job into a summary
// competing with itself.
//
// Both the code and the words are inside one <a>, so a reader on the web can
// click either one and get the same place a phone gets by scanning.  It opens
// in a new tab so the deck is not navigated away from mid-talk.  No .no-nav
// class is needed: slides.js already lists `a` in its NO_NAV selector, so a
// tap on the link is the link's business and never flips the slide.
(function () {
  const svg = document.getElementById('qr-fig');
  if (!svg) return;

  const ns = 'http://www.w3.org/2000/svg';
  const xlink = 'http://www.w3.org/1999/xlink';
  const INK = '#2d3140';
  const PAPER = '#faf8f4';   // slides.css --bg
  const MONO = "'Ubuntu Mono', ui-monospace, Menlo, monospace";
  const HREF = 'https://shukla.io/quantum-oracle-engineering/';
  const SHOWN = 'shukla.io/quantum-oracle-engineering';

  const QR = window.qr_data;
  const SIZE = 210, CX = 380, TOP = 82;

  const el = (name, attrs, parent) => {
    const node = document.createElementNS(ns, name);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    (parent || svg).appendChild(node);
    return node;
  };

  // One link around both, so clicking the code and clicking the words agree.
  const link = el('a', { target: '_blank', rel: 'noopener noreferrer',
    'aria-label': 'Quantum Oracle Engineering course site, ' + SHOWN });
  link.setAttribute('href', HREF);
  link.setAttributeNS(xlink, 'href', HREF);

  const headline = el('text', {
    x: CX, y: 30, 'text-anchor': 'middle', fill: INK,
    'font-size': 27, 'font-weight': 700, 'font-family': "'Ubuntu', sans-serif"
  });
  headline.textContent = 'Continue to Lesson 2';
  if (QR && QR.d) {
    // A quiet zone under the code, in the deck's own paper rather than pure
    // white: scanners need the margin to be light, not white, and a white
    // block on a warm page reads as a hole punched in the slide.
    el('rect', { x: CX - SIZE / 2 - 14, y: TOP - 14, width: SIZE + 28,
      height: SIZE + 28, fill: PAPER }, link);
    const g = el('g', {
      transform: 'translate(' + (CX - SIZE / 2) + ',' + TOP + ') scale(' +
        (SIZE / QR.n) + ')' }, link);
    el('path', { d: QR.d, fill: INK, 'shape-rendering': 'crispEdges' }, g);
  }

  const url = el('text', {
    x: CX, y: TOP + SIZE + 42, 'text-anchor': 'middle', fill: INK,
    'font-size': 25, 'font-weight': 700, 'font-family': MONO
  }, link);
  url.textContent = SHOWN;

  const action = el('text', {
    x: CX, y: TOP + SIZE + 75, 'text-anchor': 'middle', fill: '#7a7f88',
    'font-size': 15, 'font-weight': 600, 'font-family': "'Ubuntu', sans-serif"
  });
  action.textContent = 'Subscribe on the course page for each new lesson';
})();
