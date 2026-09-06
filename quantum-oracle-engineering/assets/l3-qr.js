// l3-qr.js -- Lesson 3, slide 34: continue to Lesson 4.
//
// The Lesson 3 card art, the cliffhanger, the QR code (the same matrix
// Lesson 1 ships, pointing at the course site) and the URL, all inside one
// link.  The title is hidden by `.bare`; the call to action is the figure.
(function () {
  const svg = document.getElementById('qr-l3-fig');
  if (!svg) return;
  const L = window.L2;
  const xlink = 'http://www.w3.org/1999/xlink';
  const HREF = 'https://shukla.io/quantum-oracle-engineering/';
  const SHOWN = 'shukla.io/quantum-oracle-engineering';
  const QR = window.qr_data;
  const link = L.el('a', { target: '_blank', rel: 'noopener noreferrer', 'aria-label': 'Quantum Oracle Engineering course site, ' + SHOWN }, svg);
  link.setAttribute('href', HREF); link.setAttributeNS(xlink, 'href', HREF);
  // art
  const img = L.el('image', { x: 40, y: 40, width: 260, height: 260, href: '../img/myth04.png' }, link);
  img.setAttributeNS(xlink, 'href', '../img/myth04.png');
  L.text(link, 'Lesson 4: Reversible by design', 170, 322, { size: 16, weight: 700 });
  // cliffhanger
  L.text(link, 'Continue to Lesson 4', 540, 44, { size: 26, weight: 700 });
  L.text(link, '“Which step, run backward,', 540, 80, { size: 15, fill: L.ORANGE, weight: 700, italic: true });
  L.text(link, 'gives a different answer?”', 540, 102, { size: 15, fill: L.ORANGE, weight: 700, italic: true });
  if (QR && QR.d) {
    const SIZE = 150, CX = 540, TOP = 126;
    L.el('rect', { x: CX - SIZE / 2 - 10, y: TOP - 10, width: SIZE + 20, height: SIZE + 20, fill: L.BG }, link);
    const g = L.el('g', { transform: `translate(${CX - SIZE / 2},${TOP}) scale(${SIZE / QR.n})` }, link);
    L.el('path', { d: QR.d, fill: L.INK, 'shape-rendering': 'crispEdges' }, g);
  }
  L.text(link, SHOWN, 540, 306, { size: 20, weight: 700, mono: true }).setAttribute('text-decoration', 'underline');
})();
