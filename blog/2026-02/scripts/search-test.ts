// search-test.ts
// A* search test: transform a simple grammar into a structured one

import { SCFG, and } from "./types";
import { successors1, Edit, SuccessorOptions } from "./successors";

// ===== Grammars =====

// Start: just bread
// Samples: "bread"
const startGrammar: SCFG = {
  init: "bread",
};

// End: full PB&J sandwich with two slices
// Samples: "bread pb spread bread jelly spread stack"
const endGrammar: SCFG = {
  init: and("pb-slice", "jelly-slice", "stack"),
  "pb-slice": and("bread", "pb", "spread"),
  "jelly-slice": and("bread", "jelly", "spread"),
};

// ===== Utilities =====

function stableStringify(value: any): string {
  if (value === null || value === undefined) return JSON.stringify(value);
  if (typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const keys = Object.keys(value).sort();
  return `{${keys
    .map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`)
    .join(",")}}`;
}

function grammarKey(g: SCFG): string {
  return stableStringify(g);
}

function editToString(edit: Edit): string {
  switch (edit.kind) {
    case "replace-atom":
      return `replace-atom: "${edit.from}" → "${edit.to}" at ${edit.rule}:[${edit.path.join(",")}]`;
    case "wrap-and":
      return `wrap-and: side=${edit.side}, atom="${edit.atom}" at ${edit.rule}:[${edit.path.join(",")}]`;
    case "wrap-or":
      return `wrap-or: side=${edit.side}, atom="${edit.atom}", w0=${edit.w0} at ${edit.rule}:[${edit.path.join(",")}]`;
    case "wrap-maybe":
      return `wrap-maybe: p=${edit.p} at ${edit.rule}:[${edit.path.join(",")}]`;
    case "unwrap-maybe":
      return `unwrap-maybe at ${edit.rule}:[${edit.path.join(",")}]`;
    case "delete-and":
      return `delete-and: index=${edit.index} at ${edit.rule}:[${edit.path.join(",")}]`;
    case "delete-or":
      return `delete-or: index=${edit.index} at ${edit.rule}:[${edit.path.join(",")}]`;
    case "insert-or":
      return `insert-or: index=${edit.index}, atom="${edit.atom}", wNew=${edit.wNew} at ${edit.rule}:[${edit.path.join(",")}]`;
    case "set-maybe-p":
      return `set-maybe-p: p=${edit.p} at ${edit.rule}:[${edit.path.join(",")}]`;
    case "set-or-weight":
      return `set-or-weight: index=${edit.index}, w=${edit.w} at ${edit.rule}:[${edit.path.join(",")}]`;
    case "extract-rule":
      return `extract-rule: newRule="${edit.newRule}" at ${edit.rule}:[${edit.path.join(",")}]`;
    case "inline-rule":
      return `inline-rule: inlined="${edit.inlined}" at ${edit.rule}:[${edit.path.join(",")}]`;
    case "swap-and":
      return `swap-and: i=${edit.i}, j=${edit.j} at ${edit.rule}:[${edit.path.join(",")}]`;
    case "swap-or":
      return `swap-or: i=${edit.i}, j=${edit.j} at ${edit.rule}:[${edit.path.join(",")}]`;
    case "delete-rule":
      return `delete-rule: "${edit.deletedRule}"`;
    default:
      return JSON.stringify(edit);
  }
}

// ===== A* Search =====

/** Count atoms in an expression */
function countAtoms(expr: any): Map<string, number> {
  const counts = new Map<string, number>();

  function walk(e: any) {
    if (typeof e === "string") {
      counts.set(e, (counts.get(e) || 0) + 1);
    } else if (e && typeof e === "object") {
      if (e.kind === "and" && Array.isArray(e.parts)) {
        e.parts.forEach(walk);
      } else if (e.kind === "or" && Array.isArray(e.alts)) {
        e.alts.forEach(walk);
      } else if (e.kind === "maybe" && e.expr) {
        walk(e.expr);
      }
    }
  }

  walk(expr);
  return counts;
}

/** Heuristic: estimate distance from current grammar to goal */
function heuristic(current: SCFG, goal: SCFG): number {
  // If serialized forms match exactly, we're done
  if (grammarKey(current) === grammarKey(goal)) return 0;

  let h = 0;

  // Penalty for missing rules
  for (const key of Object.keys(goal)) {
    if (!(key in current)) h += 3;
  }

  // Penalty for extra rules
  for (const key of Object.keys(current)) {
    if (!(key in goal)) h += 2;
  }

  // Compare each rule that exists in both
  for (const key of Object.keys(goal)) {
    if (key in current) {
      const currentKey = stableStringify(current[key]);
      const goalKey = stableStringify(goal[key]);
      if (currentKey !== goalKey) {
        // Rule exists but structure differs - at least 1 edit needed
        h += 1;

        // Also add atom difference within this rule
        const currentAtoms = countAtoms(current[key]);
        const goalAtoms = countAtoms(goal[key]);

        for (const [atom, count] of goalAtoms) {
          const currentCount = currentAtoms.get(atom) || 0;
          if (currentCount < count) h += (count - currentCount) * 0.5;
        }

        for (const [atom, count] of currentAtoms) {
          const goalCount = goalAtoms.get(atom) || 0;
          if (count > goalCount) h += (count - goalCount) * 0.5;
        }
      }
    }
  }

  return h;
}

interface SearchNode {
  grammar: SCFG;
  g: number; // cost from start
  f: number; // g + h
  key: string;
}

interface SearchResult {
  found: boolean;
  path: Edit[];
  nodesExplored: number;
}

function astarSearch(
  start: SCFG,
  goal: SCFG,
  opts: SuccessorOptions,
  maxIterations: number = 100000,
  timeoutMs: number = 30000
): SearchResult {
  const goalKey = grammarKey(goal);
  const startTime = Date.now();

  // Priority queue (simple array, sorted by f = g + h)
  const openSet: SearchNode[] = [];
  const visited = new Set<string>();

  // Parent pointers: key → { parentKey, edit }
  const parent = new Map<string, { parentKey: string; edit: Edit }>();

  const startKey = grammarKey(start);
  const startH = heuristic(start, goal);
  openSet.push({ grammar: start, g: 0, f: startH, key: startKey });
  visited.add(startKey);

  let iterations = 0;

  while (openSet.length > 0 && iterations < maxIterations) {
    // Check timeout
    if (Date.now() - startTime > timeoutMs) {
      return { found: false, path: [], nodesExplored: iterations };
    }

    iterations++;

    // Pop lowest f = g + h
    openSet.sort((a, b) => a.f - b.f);
    const current = openSet.shift()!;


    // Goal check
    if (current.key === goalKey) {
      // Reconstruct path
      const path: Edit[] = [];
      let key = current.key;
      while (parent.has(key)) {
        const p = parent.get(key)!;
        path.unshift(p.edit);
        key = p.parentKey;
      }
      return { found: true, path, nodesExplored: iterations };
    }

    // Expand successors
    const successors = successors1(current.grammar, opts);

    for (const { model, edit } of successors) {
      const key = grammarKey(model);
      if (visited.has(key)) continue;

      visited.add(key);
      parent.set(key, { parentKey: current.key, edit });
      const h = heuristic(model, goal);
      openSet.push({ grammar: model, g: current.g + 1, f: current.g + 1 + h, key });
    }
  }

  return { found: false, path: [], nodesExplored: iterations };
}

// ===== Run Test =====

function runTest() {
  console.log("=== A* Search Test: PB&J Grammar Transformation ===\n");

  console.log("Start grammar:");
  console.log(JSON.stringify(startGrammar, null, 2));
  console.log("\nEnd grammar:");
  console.log(JSON.stringify(endGrammar, null, 2));

  const opts: SuccessorOptions = {
    // Only symbols needed for this transformation
    symbolPool: ["bread", "pb", "jelly", "spread", "stack", "pb-slice", "jelly-slice"],
    maybeGrid: [], // No maybe operations needed for this transformation
    weightGrid: [], // No or operations needed for this transformation
    // Rule names available for extraction
    newRuleNames: ["pb-slice", "jelly-slice"],
    pruneUnreachable: true,
    maxSuccessors: 200, // Limit branching factor
  };

  const TIMEOUT_MS = 30000;

  console.log("\n--- Starting search (timeout: 30s) ---\n");

  const startTime = Date.now();
  const result = astarSearch(startGrammar, endGrammar, opts, 100000, TIMEOUT_MS);
  const elapsed = Date.now() - startTime;

  if (result.found) {
    console.log(`Found path with ${result.path.length} steps!`);
    console.log(`Nodes explored: ${result.nodesExplored}`);
    console.log(`Time: ${elapsed}ms\n`);

    console.log("Path:");
    for (let i = 0; i < result.path.length; i++) {
      console.log(`  ${i + 1}. ${editToString(result.path[i])}`);
    }

    console.log("\n=== TEST PASSED ===");
  } else {
    const timedOut = elapsed >= TIMEOUT_MS;
    console.log(`No path found after ${result.nodesExplored} iterations.`);
    console.log(`Time: ${elapsed}ms${timedOut ? " (TIMEOUT)" : ""}`);
    console.log("\n=== TEST FAILED ===");
    process.exit(1);
  }
}

runTest();
