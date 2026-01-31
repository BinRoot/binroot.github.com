import { ngram } from "./ngram";
import { sample } from "./sample";
import { successors1, Successor } from "./successors";
import { SCFG, Atom, Expr } from "./types";

interface SAOptions {
  maxIterations: number;
  initialTemp: number;
  coolingRate: number;
  samplesPerEval: number;
  symbolPool: string[];
  targetSamples: Atom[][];
  verbose?: boolean;
}

/**
 * Simulated Annealing for grammar search.
 * Accepts worse moves probabilistically to escape local optima.
 */
export function saSearch(
  initialGrammar: SCFG,
  options: Partial<SAOptions> = {}
): { grammar: SCFG; iterations: number; bestScore: number } {
  const opts: SAOptions = {
    maxIterations: options.maxIterations ?? 2000,
    initialTemp: options.initialTemp ?? 1.0,
    coolingRate: options.coolingRate ?? 0.995,
    samplesPerEval: options.samplesPerEval ?? 50,
    symbolPool: options.symbolPool ?? [],
    targetSamples: options.targetSamples ?? [],
    verbose: options.verbose ?? false,
  };

  const targets = opts.targetSamples;
  if (targets.length === 0) {
    return { grammar: initialGrammar, iterations: 0, bestScore: 0 };
  }

  // Analyze target structure
  const targetSymbols = new Set<string>();
  for (const t of targets) {
    for (const s of t) targetSymbols.add(s);
  }
  const avgTargetLen = targets.reduce((sum, t) => sum + t.length, 0) / targets.length;

  const symbolPool = Array.from(
    new Set([...opts.symbolPool, ...targetSymbols, ...collectAtoms(initialGrammar)])
  ).sort();

  const successorOpts = {
    symbolPool,
    maybeGrid: [0.3, 0.5, 0.7],
    weightGrid: [0.25, 0.5, 0.75],
    pruneUnreachable: true,
    maxSuccessors: 500,
  };

  const scoreCache = new Map<string, number>();

  function evaluate(grammar: SCFG): number {
    const key = stableStringify(grammar);
    const cached = scoreCache.get(key);
    if (cached !== undefined) return cached;

    const samples: Atom[][] = [];
    for (let i = 0; i < opts.samplesPerEval; i++) {
      samples.push(sample(grammar));
    }

    // Track coverage and exact matches
    const targetCovered = targets.map(() => false);
    const targetExact = targets.map(() => 0);
    let totalSim = 0;

    for (const s of samples) {
      let bestSim = 0;
      let bestIdx = 0;
      for (let i = 0; i < targets.length; i++) {
        // Check exact match first
        if (arraysEqual(s, targets[i])) {
          targetExact[i]++;
          bestSim = 1;
          bestIdx = i;
          break;
        }
        const sim = sequenceSimilarity(s, targets[i]);
        if (sim > bestSim) {
          bestSim = sim;
          bestIdx = i;
        }
      }
      totalSim += bestSim;
      if (bestSim >= 0.8) targetCovered[bestIdx] = true;
    }

    const avgSim = totalSim / samples.length;
    const coverage = targetCovered.filter(Boolean).length / targets.length;
    const exactRate = targetExact.reduce((a, b) => a + b, 0) / samples.length;

    // Bonus for balanced coverage (not just memorizing one target)
    const exactCounts = targetExact.filter(c => c > 0).length;
    const diversityBonus = exactCounts / targets.length;

    // Penalty for overly complex grammars (MDL-inspired)
    const complexity = grammarComplexity(grammar);
    const complexityPenalty = Math.max(0, (complexity - 20) * 0.005);

    // Combined score
    const score = avgSim * 0.2 + coverage * 0.2 + exactRate * 0.4 + diversityBonus * 0.2 - complexityPenalty;

    scoreCache.set(key, score);
    return score;
  }

  // Build a better initial grammar (skeleton with target length)
  let current = buildInitialSkeleton(targets, symbolPool);
  let currentScore = evaluate(current);

  let best = current;
  let bestScore = currentScore;

  let temp = opts.initialTemp;

  for (let iter = 0; iter < opts.maxIterations; iter++) {
    // Generate neighbors
    const neighbors = successors1(current, successorOpts);
    if (neighbors.length === 0) {
      // Reset to best if stuck
      current = best;
      currentScore = bestScore;
      continue;
    }

    // Pick a random neighbor
    const neighbor = neighbors[Math.floor(Math.random() * neighbors.length)].model;
    const neighborScore = evaluate(neighbor);

    // Accept or reject
    const delta = neighborScore - currentScore;
    if (delta > 0 || Math.random() < Math.exp(delta / temp)) {
      current = neighbor;
      currentScore = neighborScore;

      if (currentScore > bestScore) {
        bestScore = currentScore;
        best = current;
        if (opts.verbose && iter % 100 === 0) {
          console.log(`  Iter ${iter}: score ${bestScore.toFixed(3)}, temp ${temp.toFixed(4)}`);
        }
      }
    }

    // Cool down
    temp *= opts.coolingRate;

    // Reheat occasionally to escape deep local optima
    if (iter > 0 && iter % 500 === 0 && temp < 0.1) {
      temp = 0.3;
    }
  }

  return { grammar: best, iterations: opts.maxIterations, bestScore };
}

function buildInitialSkeleton(targets: Atom[][], symbolPool: string[]): SCFG {
  // Find common prefix and suffix
  const minLen = Math.min(...targets.map(t => t.length));

  let prefixLen = 0;
  outer: for (let i = 0; i < minLen; i++) {
    const first = targets[0][i];
    for (const t of targets) {
      if (t[i] !== first) break outer;
    }
    prefixLen++;
  }

  let suffixLen = 0;
  outer2: for (let i = 0; i < minLen - prefixLen; i++) {
    const first = targets[0][targets[0].length - 1 - i];
    for (const t of targets) {
      if (t[t.length - 1 - i] !== first) break outer2;
    }
    suffixLen++;
  }

  // Build skeleton: prefix + placeholder + suffix
  const prefix = targets[0].slice(0, prefixLen);
  const suffix = targets[0].slice(targets[0].length - suffixLen);

  // Middle: collect all symbols that appear in the middle
  const middleSymbols = new Set<string>();
  for (const t of targets) {
    for (let i = prefixLen; i < t.length - suffixLen; i++) {
      middleSymbols.add(t[i]);
    }
  }

  const parts: Expr[] = [...prefix];
  if (middleSymbols.size > 0) {
    // Add middle symbols as a sequence (will be refined by search)
    const middleArr = Array.from(middleSymbols);
    for (const sym of middleArr.slice(0, 5)) { // limit initial complexity
      parts.push(sym);
    }
  }
  parts.push(...suffix);

  return {
    init: parts.length === 1 ? parts[0] : { kind: "and", parts },
  };
}

function arraysEqual(a: Atom[], b: Atom[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function sequenceSimilarity(a: Atom[], b: Atom[]): number {
  if (a.length === 0 && b.length === 0) return 1;
  if (a.length === 0 || b.length === 0) return 0;

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
  return (2 * lcs) / (m + n);
}

function grammarComplexity(grammar: SCFG): number {
  let count = 0;
  function countNodes(expr: Expr): void {
    count++;
    if (typeof expr === "string") return;
    if (expr.kind === "and") {
      for (const p of expr.parts) countNodes(p);
    } else if (expr.kind === "or") {
      for (const a of expr.alts) countNodes(a);
    } else if (expr.kind === "maybe") {
      countNodes(expr.expr);
    }
  }
  for (const key of Object.keys(grammar)) {
    countNodes(grammar[key]);
  }
  return count;
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
