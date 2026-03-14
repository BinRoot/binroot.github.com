import { createGrid, friendlyNeighbors, d20Threshold, swayStep, countStones } from './engine.js';
import { drawBoard, drawStone, animatedSway } from './board-renderer.js';

const N = 8;
const canvas = document.getElementById('sampling-canvas');
const ctx = canvas.getContext('2d');
const svg = document.getElementById('sampling-tree');
const toggleBtn = document.getElementById('sampling-toggle');

const boardPadding = 16;
const cellPx = 32;
const totalPx = cellPx * N + boardPadding * 2;
const dpr = window.devicePixelRatio || 1;
canvas.width = totalPx * dpr;
canvas.height = totalPx * dpr;
canvas.style.width = totalPx + 'px';
canvas.style.height = totalPx + 'px';
ctx.scale(dpr, dpr);

// ─── Fixed mid-game board ──────────────────────────────────────────
const baseGrid = createGrid(N);
const seed = [
  [0,0,0,0,2,0,0,0],
  [0,1,1,2,2,1,0,0],
  [0,2,1,1,2,2,1,0],
  [1,2,2,1,1,2,1,0],
  [0,1,2,2,1,1,2,0],
  [0,2,1,2,1,2,2,0],
  [0,0,2,1,1,2,0,0],
  [0,0,0,0,1,0,0,0],
];
for (let r = 0; r < N; r++)
  for (let c = 0; c < N; c++)
    baseGrid[r][c] = seed[r][c];

const emptyList = [];
for (let r = 0; r < N; r++)
  for (let c = 0; c < N; c++)
    if (baseGrid[r][c] === 0) emptyList.push({ r, c });

const emptyCells = emptyList.length;

// ─── Build two-stage tree SVG ──────────────────────────────────────
const ns = 'http://www.w3.org/2000/svg';
const SVG_W = 200;
const dimColor = '#2a2a3a';
const highlightColor = '#F2BF80';
const moveHighlightColor = '#D95032';
const nodeR = 3.5;

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

// "Black to move" label
const turnLabel = document.createElementNS(ns, 'text');
turnLabel.setAttribute('x', rootX);
turnLabel.setAttribute('y', moveRootY - 8);
turnLabel.setAttribute('text-anchor', 'middle');
turnLabel.setAttribute('fill', '#888');
turnLabel.setAttribute('font-size', '10');
turnLabel.setAttribute('font-weight', '600');
turnLabel.setAttribute('font-family', "'Ubuntu', sans-serif");
turnLabel.textContent = '\u25CF Black to move';
svg.appendChild(turnLabel);

// "moves" label
const moveLabel = document.createElementNS(ns, 'text');
moveLabel.setAttribute('x', SVG_W - 4);
moveLabel.setAttribute('y', (moveRootY + moveFanY) / 2 + 2);
moveLabel.setAttribute('text-anchor', 'end');
moveLabel.setAttribute('fill', '#555');
moveLabel.setAttribute('font-size', '9');
moveLabel.setAttribute('font-family', "'Ubuntu', sans-serif");
moveLabel.textContent = `${emptyCells} moves`;
svg.appendChild(moveLabel);

const moveEdgeEls = [];
for (let i = 0; i < MOVE_BRANCHES; i++) {
  const line = document.createElementNS(ns, 'line');
  line.setAttribute('x1', rootX);
  line.setAttribute('y1', moveRootY);
  line.setAttribute('x2', moveBranches[i].x);
  line.setAttribute('y2', moveBranches[i].y);
  line.setAttribute('stroke', dimColor);
  line.setAttribute('stroke-width', '1.5');
  svg.appendChild(line);
  moveEdgeEls.push(line);
}

const rootDot = document.createElementNS(ns, 'circle');
rootDot.setAttribute('cx', rootX);
rootDot.setAttribute('cy', moveRootY);
rootDot.setAttribute('r', nodeR + 1);
rootDot.setAttribute('fill', dimColor);
svg.appendChild(rootDot);

const moveDotEls = [];
for (let i = 0; i < MOVE_BRANCHES; i++) {
  const circle = document.createElementNS(ns, 'circle');
  circle.setAttribute('cx', moveBranches[i].x);
  circle.setAttribute('cy', moveBranches[i].y);
  circle.setAttribute('r', nodeR);
  circle.setAttribute('fill', dimColor);
  svg.appendChild(circle);
  moveDotEls.push(circle);
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

// Connector
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

// Binary outcome tree
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

const bNodes = [];
bNodes.push([{ x: rootX, y: binaryTopY }]);

const bEdgeEls = [];
const bDotEls = [{ el: binaryRootDot, level: 0, index: 0 }];

for (let lv = 1; lv <= TREE_LEVELS; lv++) {
  const count = Math.pow(2, lv);
  const y = binaryTopY + lv * levelH;
  const row = [];
  for (let i = 0; i < count; i++) {
    const x = binaryXPad + (i + 0.5) * (binarySpan / count);
    row.push({ x, y });
    const parentIdx = Math.floor(i / 2);
    const parent = bNodes[lv - 1][parentIdx];
    const line = document.createElementNS(ns, 'line');
    line.setAttribute('x1', parent.x);
    line.setAttribute('y1', parent.y);
    line.setAttribute('x2', x);
    line.setAttribute('y2', y);
    line.setAttribute('stroke', dimColor);
    line.setAttribute('stroke-width', '1.5');
    svg.appendChild(line);
    bEdgeEls.push({ el: line, level: lv, childIndex: i });
    const circle = document.createElementNS(ns, 'circle');
    circle.setAttribute('cx', x);
    circle.setAttribute('cy', y);
    circle.setAttribute('r', nodeR);
    circle.setAttribute('fill', dimColor);
    svg.appendChild(circle);
    bDotEls.push({ el: circle, level: lv, index: i });
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
ellipsis.textContent = '\u22ee';
svg.appendChild(ellipsis);

const leafLabel = document.createElementNS(ns, 'text');
leafLabel.setAttribute('x', SVG_W / 2);
leafLabel.setAttribute('y', bottomY + 6);
leafLabel.setAttribute('text-anchor', 'middle');
leafLabel.setAttribute('fill', '#666');
leafLabel.setAttribute('font-size', '10');
leafLabel.setAttribute('font-family', "'Ubuntu', sans-serif");
leafLabel.textContent = `2\u00B3\u2077 \u2248 137 billion leaves`;
svg.appendChild(leafLabel);

// ─── Tree highlight ────────────────────────────────────────────────
function highlightTree(moveIdx, binaryChoices) {
  rootDot.setAttribute('fill', dimColor);
  connectorLine.setAttribute('stroke', dimColor);
  for (const el of moveEdgeEls) { el.setAttribute('stroke', dimColor); el.setAttribute('stroke-width', '1.5'); }
  for (const el of moveDotEls) { el.setAttribute('fill', dimColor); el.setAttribute('r', nodeR); }
  for (const e of bEdgeEls) { e.el.setAttribute('stroke', dimColor); e.el.setAttribute('stroke-width', '1.5'); }
  for (const d of bDotEls) { d.el.setAttribute('fill', dimColor); d.el.setAttribute('r', nodeR); }

  // Move path (red)
  rootDot.setAttribute('fill', moveHighlightColor);
  const mi = moveIdx % MOVE_BRANCHES;
  moveEdgeEls[mi].setAttribute('stroke', moveHighlightColor);
  moveEdgeEls[mi].setAttribute('stroke-width', '2.5');
  moveDotEls[mi].setAttribute('fill', moveHighlightColor);
  moveDotEls[mi].setAttribute('r', nodeR + 1.5);

  connectorLine.setAttribute('stroke', '#666');

  // Binary path (gold)
  bDotEls[0].el.setAttribute('fill', highlightColor);
  bDotEls[0].el.setAttribute('r', nodeR + 1);
  let idx = 0;
  for (let lv = 1; lv <= TREE_LEVELS; lv++) {
    idx = idx * 2 + binaryChoices[lv - 1];
    for (const e of bEdgeEls) {
      if (e.level === lv && e.childIndex === idx) {
        e.el.setAttribute('stroke', highlightColor);
        e.el.setAttribute('stroke-width', '2.5');
        break;
      }
    }
    for (const d of bDotEls) {
      if (d.level === lv && d.index === idx) {
        d.el.setAttribute('fill', highlightColor);
        d.el.setAttribute('r', nodeR + 1.5);
        break;
      }
    }
  }
}

// ─── Draw board with move highlight ────────────────────────────────
function drawWithMove(grid, moveCell, skipSet) {
  drawBoard(ctx, grid, N, cellPx, boardPadding, skipSet);
  // Overdraw the placed move with a red highlight
  if (moveCell && grid[moveCell.r][moveCell.c] !== 0) {
    const key = moveCell.r + ',' + moveCell.c;
    if (!skipSet || !skipSet.has(key)) {
      drawStone(ctx, grid[moveCell.r][moveCell.c], moveCell.c, moveCell.r, cellPx, boardPadding,
        { strokeColor: '#D95032', strokeWidth: 3 });
    }
  }
}

// ─── Full rollout (no animation, off-screen) ─────────────────────────
function fullRollout(startGrid) {
  const grid = startGrid.map(row => new Uint8Array(row));

  // Play to completion with random moves, alternating Black(1) / White(2)
  let turn = 1; // Black moves next from the seed position
  while (true) {
    const empties = [];
    for (let r = 0; r < N; r++)
      for (let c = 0; c < N; c++)
        if (grid[r][c] === 0) empties.push([r, c]);
    if (empties.length === 0) break;

    // Place a random move
    const [mr, mc] = empties[Math.floor(Math.random() * empties.length)];
    grid[mr][mc] = turn;

    // Sway step
    swayStep(grid, N);

    turn = turn === 1 ? 2 : 1;
  }

  // Score = Black count - White count
  const { b, w } = countStones(grid, N);
  return b - w;
}

// ─── Running statistics (Welford's online algorithm) ─────────────────
let sampleCount = 0;
let runMean = 0;
let runM2 = 0;

function addSample(x) {
  sampleCount++;
  const delta = x - runMean;
  runMean += delta / sampleCount;
  const delta2 = x - runMean;
  runM2 += delta * delta2;
}

function getVariance() {
  return sampleCount < 2 ? 0 : runM2 / (sampleCount - 1);
}

function updateStats() {}

// ─── Sampling with shared animation ────────────────────────────────
let running = false;
let animId = null;
let animating = false;

async function startSample() {
  animating = true;

  // Pick a random move for the animated first step
  const moveChoice = emptyList[Math.floor(Math.random() * emptyList.length)];
  const moveIdx = Math.floor(Math.random() * emptyCells);

  // Clone base grid, place the move
  const grid = baseGrid.map(row => new Uint8Array(row));
  grid[moveChoice.r][moveChoice.c] = 1;

  // Draw board with move highlighted (before sway)
  drawWithMove(grid, moveChoice, null);

  // Compute binary choices for tree viz (peek at at-risk pieces)
  const atRisk = [];
  for (let r = 0; r < N; r++)
    for (let c = 0; c < N; c++) {
      if (grid[r][c] === 0) continue;
      const k = friendlyNeighbors(grid, N, r, c);
      if (d20Threshold(k) > 0) atRisk.push({ r, c, k });
    }

  // Brief pause to show the placed move
  await new Promise(res => setTimeout(res, 250));

  // Run shared sway animation for the first step (visual)
  const { flipping } = await animatedSway(ctx, grid, N, cellPx, boardPadding, (skipSet) => {
    drawWithMove(grid, moveChoice, skipSet);
  });

  // Determine binary choices from what actually flipped (for tree viz)
  const flippedSet = new Set(flipping.map(f => f.r + ',' + f.c));
  const binaryChoices = [];
  for (let i = 0; i < atRisk.length && binaryChoices.length < TREE_LEVELS; i++) {
    const key = atRisk[i].r + ',' + atRisk[i].c;
    binaryChoices.push(flippedSet.has(key) ? 1 : 0);
  }
  while (binaryChoices.length < TREE_LEVELS) binaryChoices.push(0);

  highlightTree(moveIdx, binaryChoices);

  // Now complete the game silently from the current grid state
  const score = fullRollout(grid);
  addSample(score);
  updateStats();

  // Draw final state with move still highlighted
  drawWithMove(grid, moveChoice, null);

  animating = false;
}

// ─── Main loop ─────────────────────────────────────────────────────
let lastSample = 0;
const SAMPLE_INTERVAL = 1200;

function loop(ts) {
  if (!running) return;
  if (!animating && ts - lastSample >= SAMPLE_INTERVAL) {
    startSample();
    lastSample = ts;
  }
  animId = requestAnimationFrame(loop);
}

toggleBtn.addEventListener('click', () => {
  running = !running;
  toggleBtn.textContent = running ? 'Pause' : 'Sample';
  if (running) {
    lastSample = 0;
    animId = requestAnimationFrame(loop);
  } else if (animId) {
    cancelAnimationFrame(animId);
  }
});

// Draw initial state
drawBoard(ctx, baseGrid, N, cellPx, boardPadding);
