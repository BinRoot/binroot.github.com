// l3-qr.js -- Lesson 3, slide 34: continue to Lesson 4.
//
// Art and headline link directly to Lesson 4. The QR and printed course URL
// link to the course site. The title is hidden by `.bare`.
(function () {
  const svg = document.getElementById('qr-l3-fig');
  if (!svg) return;
  const L = window.L2;
  const xlink = 'http://www.w3.org/1999/xlink';
  const HREF = '../reversible-circuit-design/';
  const COURSE = 'https://shukla.io/quantum-oracle-engineering/';
  const SHOWN = 'shukla.io/quantum-oracle-engineering';
  const QR = window.qr_data;
  const link = L.el('a', { 'aria-label': 'Continue to Lesson 4: Reversible by design' }, svg);
  link.setAttribute('href', HREF); link.setAttributeNS(xlink, 'href', HREF);
  // art
  const img = L.el('image', { x: 40, y: 40, width: 260, height: 260, href: '../img/myth04.png' }, link);
  img.setAttributeNS(xlink, 'href', '../img/myth04.png');
  L.text(link, 'Lesson 4: Reversible by design', 170, 322, { size: 16, weight: 700 });
  // cliffhanger
  L.text(link, 'Continue to Lesson 4', 540, 44, { size: 26, weight: 700 });
  L.text(link, '“It runs backward.', 540, 80, { size: 15, fill: L.ORANGE, weight: 700, italic: true });
  L.text(link, 'Does it simulate the right game?”', 540, 102, { size: 15, fill: L.ORANGE, weight: 700, italic: true });
  const course = L.el('a', { href: COURSE, target: '_blank', rel: 'noopener noreferrer', 'aria-label': 'Quantum Oracle Engineering course site' }, svg);
  course.setAttributeNS(xlink, 'href', COURSE);
  if (QR && QR.d) {
    const SIZE = 150, CX = 540, TOP = 126;
    L.el('rect', { x: CX - SIZE / 2 - 10, y: TOP - 10, width: SIZE + 20, height: SIZE + 20, fill: L.BG }, course);
    const g = L.el('g', { transform: `translate(${CX - SIZE / 2},${TOP}) scale(${SIZE / QR.n})` }, course);
    L.el('path', { d: QR.d, fill: L.INK, 'shape-rendering': 'crispEdges' }, g);
  }
  L.text(course, SHOWN, 540, 306, { size: 20, weight: 700, mono: true }).setAttribute('text-decoration', 'underline');
})();
