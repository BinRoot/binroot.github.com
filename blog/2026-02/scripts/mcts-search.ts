import { ngram } from "./ngram";
import { sample } from "./sample";
import { successors1, Successor } from "./successors";
import { SCFG, Atom } from "./types";

interface MCTSNode {
  grammar: SCFG;
  parent: MCTSNode | null;
  children: MCTSNode[];
  unexpandedActions: Successor[] | null; // null = not yet generated
  visits: number;
  totalValue: number; // sum of values (higher = better)
}

interface MCTSOptions {
  maxIterations: number;
  samplesPerEval: number;
  explorationConstant: number; // UCB1 exploration parameter (typically sqrt(2))
  maxDepth: number;
  symbolPool: string[];
}

/**
 * MCTS-based grammar search.
 * Searches for a grammar that maximizes n-gram alignment with target samples.
 */
export function mctsSearch(
  initialGrammar: SCFG,
  targetHistogram: Record<string, number>,
  options: Partial<MCTSOptions> = {}
): { grammar: SCFG; iterations: number; bestScore: number } {
  const opts: MCTSOptions = {
    maxIterations: options.maxIterations ?? 500,
    samplesPerEval: options.samplesPerEval ?? 20,
    explorationConstant: options.explorationConstant ?? 1.41,
    maxDepth: options.maxDepth ?? 15,
    symbolPool: options.symbolPool ?? [],
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
    maxSuccessors: 200, // Limit successors for speed
  };

  // Score cache to avoid recomputation
  const scoreCache = new Map<string, number>();

  function evaluate(grammar: SCFG): number {
    const key = stableStringify(grammar);
    const cached = scoreCache.get(key);
    if (cached !== undefined) return cached;

    const samples: Atom[][] = [];
    for (let i = 0; i < opts.samplesPerEval; i++) {
      samples.push(sample(grammar));
    }
    const counts = ngram(samples, maxN);

    // Compute weighted coverage score (longer n-grams weighted more)
    let weightedMatches = 0;
    let weightedTotal = 0;
    for (const k of targetKeys) {
      const ngramLen = k.split(" ").length;
      const weight = ngramLen * ngramLen; // quadratic weight for longer n-grams
      weightedTotal += weight * (targetProb[k] ?? 0);
      if ((counts[k] ?? 0) > 0) {
        weightedMatches += weight * (targetProb[k] ?? 0);
      }
    }
    const score = weightedTotal > 0 ? weightedMatches / weightedTotal : 0;

    scoreCache.set(key, score);
    return score;
  }

  // Create root node
  const root: MCTSNode = {
    grammar: initialGrammar,
    parent: null,
    children: [],
    unexpandedActions: null,
    visits: 0,
    totalValue: 0,
  };

  let bestGrammar = initialGrammar;
  let bestScore = evaluate(initialGrammar);

  for (let iter = 0; iter < opts.maxIterations; iter++) {
    // 1. Selection: traverse tree using UCB1
    let node = root;
    let depth = 0;

    while (depth < opts.maxDepth) {
      // Lazily generate actions
      if (node.unexpandedActions === null) {
        node.unexpandedActions = successors1(node.grammar, successorOpts);
        // Shuffle for random expansion order
        shuffleArray(node.unexpandedActions);
      }

      // If there are unexpanded actions, expand one
      if (node.unexpandedActions.length > 0) {
        break;
      }

      // All actions expanded, select best child via UCB1
      if (node.children.length === 0) {
        break; // Terminal node (no valid successors)
      }

      node = selectChild(node, opts.explorationConstant);
      depth++;
    }

    // 2. Expansion: add one new child
    let expandedNode = node;
    if (node.unexpandedActions && node.unexpandedActions.length > 0) {
      const action = node.unexpandedActions.pop()!;
      const child: MCTSNode = {
        grammar: action.model,
        parent: node,
        children: [],
        unexpandedActions: null,
        visits: 0,
        totalValue: 0,
      };
      node.children.push(child);
      expandedNode = child;
    }

    // 3. Rollout/Evaluation: evaluate the grammar
    const value = evaluate(expandedNode.grammar);

    // Track best
    if (value > bestScore) {
      bestScore = value;
      bestGrammar = expandedNode.grammar;
      // Early termination if perfect score
      if (bestScore >= 0.99) {
        return { grammar: bestGrammar, iterations: iter + 1, bestScore };
      }
    }

    // 4. Backpropagation: update values up the tree
    let current: MCTSNode | null = expandedNode;
    while (current !== null) {
      current.visits++;
      current.totalValue += value;
      current = current.parent;
    }
  }

  return { grammar: bestGrammar, iterations: opts.maxIterations, bestScore };
}

function selectChild(node: MCTSNode, c: number): MCTSNode {
  let bestChild = node.children[0];
  let bestUCB = -Infinity;

  const logParentVisits = Math.log(node.visits + 1);

  for (const child of node.children) {
    const exploitation = child.visits > 0 ? child.totalValue / child.visits : 0;
    const exploration = c * Math.sqrt(logParentVisits / (child.visits + 1));
    const ucb = exploitation + exploration;

    if (ucb > bestUCB) {
      bestUCB = ucb;
      bestChild = child;
    }
  }

  return bestChild;
}

function shuffleArray<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
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
