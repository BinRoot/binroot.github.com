// ─── Sway Game Engine (no DOM dependencies) ─────────────────────────

// Flip probability by friendly-neighbor count (d20 thresholds):
// k=0 → 20%, k=1 → 15%, k=2 → 10%, k=3 → 5%, k=4 → 0%
export const FLIP_THRESHOLDS = [4, 3, 2, 1, 0];

export function createGrid(N) {
  return Array.from({ length: N }, () => new Uint8Array(N));
}

export function friendlyNeighbors(grid, N, row, col) {
  const color = grid[row][col];
  if (color === 0) return 0;
  let k = 0;
  if (row > 0 && grid[row - 1][col] === color) k++;
  if (row < N - 1 && grid[row + 1][col] === color) k++;
  if (col > 0 && grid[row][col - 1] === color) k++;
  if (col < N - 1 && grid[row][col + 1] === color) k++;
  return k;
}

export function d20Threshold(k) {
  return FLIP_THRESHOLDS[Math.min(k, 4)];
}

// Run one sway pass. Mutates grid in place, returns array of {r, c, from, to}.
export function swayStep(grid, N) {
  const flips = [];
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (grid[r][c] === 0) continue;
      const k = friendlyNeighbors(grid, N, r, c);
      const threshold = d20Threshold(k);
      const roll = Math.floor(Math.random() * 20) + 1;
      if (roll <= threshold) {
        flips.push({ r, c, from: grid[r][c], to: grid[r][c] === 1 ? 2 : 1 });
      }
    }
  }
  for (const f of flips) {
    grid[f.r][f.c] = f.to;
  }
  return flips;
}

export function countStones(grid, N) {
  let b = 0, w = 0;
  for (let r = 0; r < N; r++)
    for (let c = 0; c < N; c++) {
      if (grid[r][c] === 1) b++;
      if (grid[r][c] === 2) w++;
    }
  return { b, w };
}

export function isBoardFull(grid, N) {
  for (let r = 0; r < N; r++)
    for (let c = 0; c < N; c++)
      if (grid[r][c] === 0) return false;
  return true;
}

export function getEmptyCells(grid, N) {
  const empties = [];
  for (let r = 0; r < N; r++)
    for (let c = 0; c < N; c++)
      if (grid[r][c] === 0) empties.push([r, c]);
  return empties;
}

// ─── AI Strategies ──────────────────────────────────────────────────

// Random: pick a random empty cell
export function strategyRandom(grid, N, color) {
  const empties = getEmptyCells(grid, N);
  if (empties.length === 0) return null;
  return empties[Math.floor(Math.random() * empties.length)];
}

// Clusterer scoring for a single cell (deterministic, no randomness).
// Expects the cell to already be placed on the grid.
function clustererScore(grid, N, r, c, color) {
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  let score = friendlyNeighbors(grid, N, r, c) * 3;
  for (const [dr, dc] of dirs) {
    const nr = r + dr, nc = c + dc;
    if (nr >= 0 && nr < N && nc >= 0 && nc < N && grid[nr][nc] === color) {
      score += 1;
    }
  }
  const centerDist = Math.abs(r - (N - 1) / 2) + Math.abs(c - (N - 1) / 2);
  score -= centerDist * 0.15;
  return score;
}

// Returns { move, score } for the best Clusterer move (deterministic).
function clustererBest(grid, N, color) {
  const empties = getEmptyCells(grid, N);
  let best = null, bestScore = -Infinity;
  for (const [r, c] of empties) {
    grid[r][c] = color;
    const score = clustererScore(grid, N, r, c, color);
    grid[r][c] = 0;
    if (score > bestScore) { bestScore = score; best = [r, c]; }
  }
  return { move: best, score: bestScore };
}

// Clusterer: greedily maximize own friendly neighbors / stability
export function strategyClustery(grid, N, color) {
  const empties = getEmptyCells(grid, N);
  if (empties.length === 0) return null;

  let best = null, bestScore = -Infinity;
  for (const [r, c] of empties) {
    grid[r][c] = color;
    const score = clustererScore(grid, N, r, c, color) + Math.random() * 0.3;
    grid[r][c] = 0;
    if (score > bestScore) { bestScore = score; best = [r, c]; }
  }
  return best;
}

// Anti-cluster: prioritize blocking opponent's clusters
export function strategyAntiCluster(grid, N, color) {
  const empties = getEmptyCells(grid, N);
  if (empties.length === 0) return null;

  const opponent = color === 1 ? 2 : 1;
  let best = null, bestScore = -Infinity;
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  for (const [r, c] of empties) {
    let score = 0;

    // Count how many opponent neighbors this cell has (blocking value)
    let oppNeighbors = 0;
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < N && nc >= 0 && nc < N) {
        if (grid[nr][nc] === opponent) oppNeighbors++;
      }
    }
    // High reward for disrupting opponent clusters
    score += oppNeighbors * 4;

    // Still value own clustering somewhat
    grid[r][c] = color;
    score += friendlyNeighbors(grid, N, r, c) * 1.5;
    grid[r][c] = 0;

    // Prefer center
    const centerDist = Math.abs(r - (N - 1) / 2) + Math.abs(c - (N - 1) / 2);
    score -= centerDist * 0.1;
    score += Math.random() * 0.3;

    if (score > bestScore) { bestScore = score; best = [r, c]; }
  }
  return best;
}

// Fortress: claim corners and edges first, where fewer friends → flip-immunity
export function strategyFortress(grid, N, color) {
  const empties = getEmptyCells(grid, N);
  if (empties.length === 0) return null;

  let best = null, bestScore = -Infinity;
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  for (const [r, c] of empties) {
    grid[r][c] = color;
    let score = 0;

    const k = friendlyNeighbors(grid, N, r, c);
    // How many neighbors does this cell even have? (edges/corners have fewer)
    let maxK = 0;
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < N && nc >= 0 && nc < N) maxK++;
    }

    // Reward being close to flip-immune (k close to maxK)
    // A corner with 1 friend (k=1 of maxK=2) is better than center with 1 friend (k=1 of maxK=4)
    const saturation = maxK > 0 ? k / maxK : 0;
    score += saturation * 5;

    // Reward clustering as secondary goal
    score += k * 2;

    // Strongly prefer edges and corners (low maxK = easy to saturate)
    score += (4 - maxK) * 1.5;

    score += Math.random() * 0.3;
    grid[r][c] = 0;

    if (score > bestScore) { bestScore = score; best = [r, c]; }
  }
  return best;
}

// Destabilizer: maximize total opponent flip probability across the board
export function strategyDestabilizer(grid, N, color) {
  const empties = getEmptyCells(grid, N);
  if (empties.length === 0) return null;

  const opponent = color === 1 ? 2 : 1;
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  // Compute current total opponent flip probability
  function totalOpponentFlipProb(g) {
    let prob = 0;
    for (let r = 0; r < N; r++)
      for (let c = 0; c < N; c++)
        if (g[r][c] === opponent) {
          const k = friendlyNeighbors(g, N, r, c);
          prob += d20Threshold(k) / 20;
        }
    return prob;
  }

  const baseLine = totalOpponentFlipProb(grid);
  let best = null, bestScore = -Infinity;

  for (const [r, c] of empties) {
    grid[r][c] = color;

    // How much did we increase opponent's total flip exposure?
    const newProb = totalOpponentFlipProb(grid);
    const destabilize = newProb - baseLine;

    // Also value own stability
    const ownK = friendlyNeighbors(grid, N, r, c);
    let score = destabilize * 8 + ownK * 1.5;

    score += Math.random() * 0.3;
    grid[r][c] = 0;

    if (score > bestScore) { bestScore = score; best = [r, c]; }
  }
  return best;
}

// Fork Builder: creates multi-turn threats by maximizing the number of strong
// follow-up moves. Instead of optimizing current k, it builds latent structure
// that forces the opponent to choose which threat to address.
export function strategyForkBuilder(grid, N, color) {
  const empties = getEmptyCells(grid, N);
  if (empties.length === 0) return null;

  const opponent = color === 1 ? 2 : 1;

  // Total flip risk for our stones (lower = safer)
  function selfRisk() {
    let risk = 0;
    for (let r = 0; r < N; r++)
      for (let c = 0; c < N; c++)
        if (grid[r][c] === color)
          risk += d20Threshold(friendlyNeighbors(grid, N, r, c)) / 20;
    return risk;
  }

  // Count our stones with k < 2 (vulnerable to flipping)
  function countVulnerable() {
    let v = 0;
    for (let r = 0; r < N; r++)
      for (let c = 0; c < N; c++)
        if (grid[r][c] === color && friendlyNeighbors(grid, N, r, c) < 2)
          v++;
    return v;
  }

  let best = null, bestScore = -Infinity;

  for (const [r, c] of empties) {
    grid[r][c] = color;

    // 1. Own stability
    const ownK = friendlyNeighbors(grid, N, r, c);

    // 2. Immediate risk: how many of our stones did this stabilize?
    const vulnAfterX = countVulnerable();

    // 3. Evaluate followup cells within Manhattan distance 3
    //    Count "forks": followups that stabilize 2+ currently-vulnerable stones
    let bestFollowupStabilized = 0;
    let forkCount = 0;

    for (const [fr, fc] of empties) {
      if (fr === r && fc === c) continue;
      if (Math.abs(fr - r) + Math.abs(fc - c) > 3) continue;

      grid[fr][fc] = color;
      const stabilized = vulnAfterX - countVulnerable();
      grid[fr][fc] = 0;

      if (stabilized > bestFollowupStabilized) bestFollowupStabilized = stabilized;
      if (stabilized >= 2) forkCount++;
    }

    // 4. Opponent bridge denial
    grid[r][c] = opponent;
    const oppValue = clustererScore(grid, N, r, c, opponent);
    grid[r][c] = color;

    // 5. Center preference
    const centerDist = Math.abs(r - (N - 1) / 2) + Math.abs(c - (N - 1) / 2);

    grid[r][c] = 0;

    // Boost for stabilizing neighbors (same spirit as Clusterer's neighbor bonus)
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    let neighborBoost = 0;
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < N && nc >= 0 && nc < N && grid[nr][nc] === color)
        neighborBoost++;
    }

    const score =
      ownK * 3.0 +
      neighborBoost * 1.0 +
      bestFollowupStabilized * 1.5 +
      forkCount * 0.5 +
      oppValue * 0.05 -
      centerDist * 0.15 +
      Math.random() * 0.15;

    if (score > bestScore) { bestScore = score; best = [r, c]; }
  }
  return best;
}

// Minimax (1-ply anti-Clusterer): for each candidate move, simulate the
// opponent playing their deterministic Clusterer best response, then pick the
// move that minimizes that response's quality score.
export function strategyMinimax(grid, N, color) {
  const empties = getEmptyCells(grid, N);
  if (empties.length === 0) return null;

  const opponent = color === 1 ? 2 : 1;
  let best = null, bestScore = Infinity; // minimizing opponent's score

  for (const [r, c] of empties) {
    grid[r][c] = color;

    // What's the opponent's best Clusterer response?
    const response = clustererBest(grid, N, opponent);
    const oppScore = response.score;

    // Tiebreak: also value our own clustering
    const ownK = clustererScore(grid, N, r, c, color);

    // Combined: minimize opponent's best reply, maximize own position
    const score = oppScore - ownK * 0.5;

    grid[r][c] = 0;
    if (score < bestScore || (score === bestScore && Math.random() < 0.5)) {
      bestScore = score;
      best = [r, c];
    }
  }
  return best;
}

// Play a full game. Returns { b, w, winner }.
// strategyBlack/strategyWhite are functions: (grid, N, color) => [r, c] | null
export function playGame(N, strategyBlack, strategyWhite) {
  const grid = createGrid(N);
  let round = 0;

  while (!isBoardFull(grid, N)) {
    round++;

    // Black plays
    const bMove = strategyBlack(grid, N, 1);
    if (bMove) grid[bMove[0]][bMove[1]] = 1;

    if (isBoardFull(grid, N)) { swayStep(grid, N); break; }

    // White plays
    const wMove = strategyWhite(grid, N, 2);
    if (wMove) grid[wMove[0]][wMove[1]] = 2;

    // Sway
    swayStep(grid, N);
  }

  const { b, w } = countStones(grid, N);
  const winner = b > w ? 'black' : w > b ? 'white' : 'tie';
  return { b, w, winner };
}
