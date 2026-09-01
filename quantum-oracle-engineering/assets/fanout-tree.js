// fanout-tree.js -- the static two-stage tree from the Sway post's sampling
// visual (blog/2026-03/sampling-viz.js), extracted without the board, the
// animation, or the highlight pass.  One move node fans into candidate
// placements, a dashed connector hands off to a binary outcome tree, and the
// leaf label carries the count.  Numbers match the post's fixed mid-game
// position: 36 stones on an 8x8 board, so 28 open cells and 2^37 outcomes
// after one placement.
(function () {
  const svg = document.getElementById('fanout-tree');
  if (!svg) return;

  const ns = 'http://www.w3.org/2000/svg';
  const SVG_W = 200;
  const dimColor = '#2a2a3a';
  const nodeR = 3.5;
  const emptyCells = 28;

  const MOVE_BRANCHES = Math.min(emptyCells, 10);
  const moveRootY = 58;
  const moveFanY = 108;
  const moveXPad = 14;
  const moveSpan = SVG_W - moveXPad * 2;
  const rootX = SVG_W / 2;

  const moveBranches = [];
  for (let i = 0; i < MOVE_BRANCHES; i++) {
    const x = moveXPad + (i + 0.5) * (moveSpan / MOVE_BRANCHES);
    moveBranches.push({ x, y: moveFanY });
  }

  const turnLabel = document.createElementNS(ns, 'text');
  turnLabel.setAttribute('x', rootX);
  turnLabel.setAttribute('y', moveRootY - 8);
  turnLabel.setAttribute('text-anchor', 'middle');
  turnLabel.setAttribute('fill', '#888');
  turnLabel.setAttribute('font-size', '10');
  turnLabel.setAttribute('font-weight', '600');
  turnLabel.setAttribute('font-family', "'Ubuntu', sans-serif");
  turnLabel.textContent = '● Black to move';
  svg.appendChild(turnLabel);

  const moveLabel = document.createElementNS(ns, 'text');
  moveLabel.setAttribute('x', SVG_W - 4);
  moveLabel.setAttribute('y', (moveRootY + moveFanY) / 2 + 2);
  moveLabel.setAttribute('text-anchor', 'end');
  moveLabel.setAttribute('fill', '#555');
  moveLabel.setAttribute('font-size', '9');
  moveLabel.setAttribute('font-family', "'Ubuntu', sans-serif");
  moveLabel.textContent = `${emptyCells} moves`;
  svg.appendChild(moveLabel);

  for (let i = 0; i < MOVE_BRANCHES; i++) {
    const line = document.createElementNS(ns, 'line');
    line.setAttribute('x1', rootX);
    line.setAttribute('y1', moveRootY);
    line.setAttribute('x2', moveBranches[i].x);
    line.setAttribute('y2', moveBranches[i].y);
    line.setAttribute('stroke', dimColor);
    line.setAttribute('stroke-width', '1.5');
    svg.appendChild(line);
  }

  const rootDot = document.createElementNS(ns, 'circle');
  rootDot.setAttribute('cx', rootX);
  rootDot.setAttribute('cy', moveRootY);
  rootDot.setAttribute('r', nodeR + 1);
  rootDot.setAttribute('fill', dimColor);
  svg.appendChild(rootDot);

  for (let i = 0; i < MOVE_BRANCHES; i++) {
    const circle = document.createElementNS(ns, 'circle');
    circle.setAttribute('cx', moveBranches[i].x);
    circle.setAttribute('cy', moveBranches[i].y);
    circle.setAttribute('r', nodeR);
    circle.setAttribute('fill', dimColor);
    svg.appendChild(circle);
  }

  if (emptyCells > MOVE_BRANCHES) {
    const dots = document.createElementNS(ns, 'text');
    dots.setAttribute('x', SVG_W - moveXPad + 2);
    dots.setAttribute('y', moveFanY + 4);
    dots.setAttribute('text-anchor', 'end');
    dots.setAttribute('fill', '#444');
    dots.setAttribute('font-size', '11');
    dots.textContent = '...';
    svg.appendChild(dots);
  }

  const connectorY = moveFanY + 18;
  const connectorLine = document.createElementNS(ns, 'line');
  connectorLine.setAttribute('x1', rootX);
  connectorLine.setAttribute('y1', moveFanY);
  connectorLine.setAttribute('x2', rootX);
  connectorLine.setAttribute('y2', connectorY);
  connectorLine.setAttribute('stroke', dimColor);
  connectorLine.setAttribute('stroke-width', '1.5');
  connectorLine.setAttribute('stroke-dasharray', '3,3');
  svg.appendChild(connectorLine);

  const TREE_LEVELS = 4;
  const binaryTopY = connectorY + 8;
  const levelH = 36;
  const binaryXPad = 10;
  const binarySpan = SVG_W - binaryXPad * 2;

  const outcomeLabel = document.createElementNS(ns, 'text');
  outcomeLabel.setAttribute('x', SVG_W - 4);
  outcomeLabel.setAttribute('y', binaryTopY + levelH + 2);
  outcomeLabel.setAttribute('text-anchor', 'end');
  outcomeLabel.setAttribute('fill', '#555');
  outcomeLabel.setAttribute('font-size', '9');
  outcomeLabel.setAttribute('font-family', "'Ubuntu', sans-serif");
  outcomeLabel.textContent = 'outcomes';
  svg.appendChild(outcomeLabel);

  const binaryRootDot = document.createElementNS(ns, 'circle');
  binaryRootDot.setAttribute('cx', rootX);
  binaryRootDot.setAttribute('cy', binaryTopY);
  binaryRootDot.setAttribute('r', nodeR);
  binaryRootDot.setAttribute('fill', dimColor);
  svg.appendChild(binaryRootDot);

  const bNodes = [[{ x: rootX, y: binaryTopY }]];
  for (let lv = 1; lv <= TREE_LEVELS; lv++) {
    const count = Math.pow(2, lv);
    const y = binaryTopY + lv * levelH;
    const row = [];
    for (let i = 0; i < count; i++) {
      const x = binaryXPad + (i + 0.5) * (binarySpan / count);
      row.push({ x, y });
      const parent = bNodes[lv - 1][Math.floor(i / 2)];
      const line = document.createElementNS(ns, 'line');
      line.setAttribute('x1', parent.x);
      line.setAttribute('y1', parent.y);
      line.setAttribute('x2', x);
      line.setAttribute('y2', y);
      line.setAttribute('stroke', dimColor);
      line.setAttribute('stroke-width', '1.5');
      svg.appendChild(line);
      const circle = document.createElementNS(ns, 'circle');
      circle.setAttribute('cx', x);
      circle.setAttribute('cy', y);
      circle.setAttribute('r', nodeR);
      circle.setAttribute('fill', dimColor);
      svg.appendChild(circle);
    }
    bNodes.push(row);
  }

  const bottomY = binaryTopY + (TREE_LEVELS + 1) * levelH;
  const ellipsis = document.createElementNS(ns, 'text');
  ellipsis.setAttribute('x', SVG_W / 2);
  ellipsis.setAttribute('y', bottomY - 10);
  ellipsis.setAttribute('text-anchor', 'middle');
  ellipsis.setAttribute('fill', '#444');
  ellipsis.setAttribute('font-size', '14');
  ellipsis.setAttribute('font-weight', '700');
  ellipsis.textContent = '⋮';
  svg.appendChild(ellipsis);

  const leafLabel = document.createElementNS(ns, 'text');
  leafLabel.setAttribute('x', SVG_W / 2);
  leafLabel.setAttribute('y', bottomY + 6);
  leafLabel.setAttribute('text-anchor', 'middle');
  leafLabel.setAttribute('fill', '#666');
  leafLabel.setAttribute('font-size', '10');
  leafLabel.setAttribute('font-family', "'Ubuntu', sans-serif");
  leafLabel.textContent = '2³⁷ ≈ 137 billion leaves';
  svg.appendChild(leafLabel);
})();
