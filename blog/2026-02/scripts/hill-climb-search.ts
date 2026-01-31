import { ngram } from "./ngram";
import { sample } from "./sample";
import { successors1, Successor } from "./successors";
import { SCFG, Atom } from "./types";

interface HillClimbOptions {
  maxIterations: number;
  restarts: number;
  samplesPerEval: number;
  symbolPool: string[];
  targetSamples?: Atom[][]; // actual target sequences for similarity scoring
  verbose?: boolean;
}

/**
 * Random-restart hill climbing for grammar search.
 * Faster than MCTS for sparse reward landscapes.
 */
export function hillClimbSearch(
  initialGrammar: SCFG,
  targetHistogram: Record<string, number>,
  options: Partial<HillClimbOptions> = {}
): { grammar: SCFG; iterations: number; bestScore: number } {
  const opts: HillClimbOptions = {
    maxIterations: options.maxIterations ?? 100,
    restarts: options.restarts ?? 10,
    samplesPerEval: options.samplesPerEval ?? 30,
    symbolPool: options.symbolPool ?? [],
    verbose: options.verbose ?? false,
    ...options,
  };

  // Precompute target distribution
  const targetKeys = Object.keys(targetHistogram).filter(
    (k) => (targetHistogram[k] ?? 0) > 0
  );
  if (targetKeys.length === 0) {
    return { grammar: initialGrammar, iterations: 0, bestScore: 0 };
  }

  const targetTotal = targetKeys.reduce(
    (sum, k) => sum + (targetHistogram[k] ?? 0),
    0
  );
  const targetProb: Record<string, number> = {};
  for (const key of targetKeys) {
    targetProb[key] = (targetHistogram[key] ?? 0) / targetTotal;
  }

  let maxN = 1;
  const targetTokens = new Set<string>();
  for (const key of targetKeys) {
    const parts = key.trim() === "" ? [] : key.split(" ");
    if (parts.length > maxN) maxN = parts.length;
    for (const tok of parts) targetTokens.add(tok);
  }

  // Build symbol pool
  const symbolPool = Array.from(
    new Set([
      ...opts.symbolPool,
      ...targetTokens,
      ...collectAtoms(initialGrammar),
    ])
  ).sort();

  const successorOpts = {
    symbolPool,
    maybeGrid: [0.5],
    weightGrid: [0.5],
    pruneUnreachable: true,
    maxSuccessors: 300,
  };

  const scoreCache = new Map<string, number>();

  function evaluate(grammar: SCFG): number {
    const key = stableStringify(grammar);
    const cached = scoreCache.get(key);
    if (cached !== undefined) return cached;

    const targets = opts.targetSamples ?? [];
    if (targets.length === 0) return 0;

    const samples: Atom[][] = [];
    for (let i = 0; i < opts.samplesPerEval; i++) {
      samples.push(sample(grammar));
    }

    // Track which targets are covered
    const targetCovered = targets.map(() => false);
    const targetExact = targets.map(() => false);
    let totalSim = 0;

    for (const s of samples) {
      let bestSim = 0;
      let bestIdx = 0;
      for (let i = 0; i < targets.length; i++) {
        const sim = sequenceSimilarity(s, targets[i]);
        if (sim > bestSim) {
          bestSim = sim;
          bestIdx = i;
        }
        // Check exact match
        if (s.length === targets[i].length && s.every((v, j) => v === targets[i][j])) {
          targetExact[i] = true;
        }
      }
      totalSim += bestSim;
      if (bestSim >= 0.85) targetCovered[bestIdx] = true;
    }

    const avgSim = totalSim / samples.length;
    const coverage = targetCovered.filter(Boolean).length / targets.length;
    const exactCoverage = targetExact.filter(Boolean).length / targets.length;

    // Score: similarity + coverage + strong exact match bonus
    const score = avgSim * 0.3 + coverage * 0.3 + exactCoverage * 0.4;

    scoreCache.set(key, score);
    return score;
  }

  // Normalized longest common subsequence similarity
  function sequenceSimilarity(a: Atom[], b: Atom[]): number {
    if (a.length === 0 && b.length === 0) return 1;
    if (a.length === 0 || b.length === 0) return 0;

    // LCS length
    const m = a.length, n = b.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (a[i - 1] === b[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }
    const lcs = dp[m][n];

    // Similarity: 2*LCS / (len(a) + len(b)) - rewards matching length too
    return (2 * lcs) / (m + n);
  }

  let globalBestGrammar = initialGrammar;
  let globalBestScore = evaluate(initialGrammar);
  let totalIterations = 0;

  for (let restart = 0; restart < opts.restarts; restart++) {
    // Start from initial or a random perturbation
    let current = restart === 0 ? initialGrammar : randomMutate(initialGrammar, successorOpts, 3);
    let currentScore = evaluate(current);

    for (let iter = 0; iter < opts.maxIterations; iter++) {
      totalIterations++;

      // Generate neighbors
      const neighbors = successors1(current, successorOpts);
      if (neighbors.length === 0) break;

      // Find best neighbor
      let bestNeighbor: SCFG | null = null;
      let bestNeighborScore = currentScore;

      // Sample a subset of neighbors for speed
      const sampled = sampleArray(neighbors, Math.min(50, neighbors.length));

      for (const { model } of sampled) {
        const score = evaluate(model);
        if (score > bestNeighborScore) {
          bestNeighborScore = score;
          bestNeighbor = model;
        }
      }

      // If no improvement, try random walk
      if (bestNeighbor === null) {
        // Random step with 30% probability
        if (Math.random() < 0.3 && neighbors.length > 0) {
          const randomIdx = Math.floor(Math.random() * neighbors.length);
          current = neighbors[randomIdx].model;
          currentScore = evaluate(current);
        } else {
          break; // stuck
        }
      } else {
        current = bestNeighbor;
        currentScore = bestNeighborScore;
      }

      // Update global best
      if (currentScore > globalBestScore) {
        globalBestScore = currentScore;
        globalBestGrammar = current;
        if (opts.verbose) {
          console.log(`  Restart ${restart}, iter ${iter}: score ${globalBestScore.toFixed(3)}`);
        }
      }
    }
  }

  return { grammar: globalBestGrammar, iterations: totalIterations, bestScore: globalBestScore };
}

function randomMutate(grammar: SCFG, opts: any, steps: number): SCFG {
  let current = grammar;
  for (let i = 0; i < steps; i++) {
    const neighbors = successors1(current, opts);
    if (neighbors.length === 0) break;
    const idx = Math.floor(Math.random() * neighbors.length);
    current = neighbors[idx].model;
  }
  return current;
}

function sampleArray<T>(arr: T[], n: number): T[] {
  if (n >= arr.length) return arr;
  const result: T[] = [];
  const indices = new Set<number>();
  while (indices.size < n) {
    indices.add(Math.floor(Math.random() * arr.length));
  }
  for (const i of indices) {
    result.push(arr[i]);
  }
  return result;
}

function collectAtoms(model: SCFG): string[] {
  const out = new Set<string>();
  const ruleNames = new Set(Object.keys(model).filter((k) => k !== "init"));

  function collect(expr: any): void {
    if (typeof expr === "string") {
      out.add(expr);
      if (ruleNames.has(expr) && model[expr]) {
        collect(model[expr]);
      }
      return;
    }
    if (expr?.kind === "and" && Array.isArray(expr.parts)) {
      for (const part of expr.parts) collect(part);
    }
    if (expr?.kind === "or" && Array.isArray(expr.alts)) {
      for (const alt of expr.alts) collect(alt);
    }
    if (expr?.kind === "maybe" && expr.expr) {
      collect(expr.expr);
    }
  }

  for (const key of Object.keys(model)) {
    if (key !== "init") out.add(key);
    collect(model[key]);
  }

  return Array.from(out);
}

function stableStringify(value: any): string {
  if (value === null || value === undefined) return JSON.stringify(value);
  if (typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const keys = Object.keys(value).sort();
  return `{${keys
    .map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`)
    .join(",")}}`;
}
