// validate.ts
// Static validator for SCFG → Forth stack safety
// Proves: no underflow, ends with exactly 1 item

import { Expr, SCFG, and, or } from "./types";

// ===== Stack Effect Domain =====

export interface StackEffect {
  minInput: number; // minimum stack height required (can be +Infinity)
  deltaMin: number; // minimum net change (can be -Infinity)
  deltaMax: number; // maximum net change (can be +Infinity)
}

// EMPTY = no behaviors discovered yet (bottom of lattice)
// Represented as null
type MaybeEffect = StackEffect | null;

function isReal(e: MaybeEffect): e is StackEffect {
  if (e === null) return false;
  // minInput: finite or +Infinity (not -Infinity, not NaN)
  if (Number.isNaN(e.minInput) || e.minInput === -Infinity) return false;
  // deltaMin: finite or -Infinity (not +Infinity, not NaN)
  if (Number.isNaN(e.deltaMin) || e.deltaMin === Infinity) return false;
  // deltaMax: finite or +Infinity (not -Infinity, not NaN)
  if (Number.isNaN(e.deltaMax) || e.deltaMax === -Infinity) return false;
  // Must have deltaMin <= deltaMax
  return e.deltaMin <= e.deltaMax;
}

// ===== Safe Infinity Arithmetic =====

// For minimum bounds: indeterminate → -Infinity (conservative low)
function safeAddMin(a: number, b: number): number {
  if ((a === Infinity && b === -Infinity) || (a === -Infinity && b === Infinity)) {
    return -Infinity; // indeterminate → conservative low for min
  }
  const result = a + b;
  if (Number.isNaN(result)) return -Infinity;
  return result;
}

// For maximum bounds: indeterminate → +Infinity (conservative high)
function safeAddMax(a: number, b: number): number {
  if ((a === Infinity && b === -Infinity) || (a === -Infinity && b === Infinity)) {
    return Infinity; // indeterminate → conservative high for max
  }
  const result = a + b;
  if (Number.isNaN(result)) return Infinity;
  return result;
}

// For minInput calculation: bigger is more conservative
function safeSub(a: number, b: number): number {
  // Infinity - Infinity or -Infinity - (-Infinity) → indeterminate → Infinity (conservative high)
  if ((a === Infinity && b === Infinity) || (a === -Infinity && b === -Infinity)) {
    return Infinity;
  }
  const result = a - b;
  if (Number.isNaN(result)) return Infinity;
  return result;
}

// ===== Combinators =====

const EPSILON: StackEffect = { minInput: 0, deltaMin: 0, deltaMax: 0 };

function combineOr(a: MaybeEffect, b: MaybeEffect): MaybeEffect {
  // EMPTY is identity for OR
  if (!isReal(a)) return b;
  if (!isReal(b)) return a;

  return {
    minInput: Math.max(a.minInput, b.minInput),
    deltaMin: Math.min(a.deltaMin, b.deltaMin),
    deltaMax: Math.max(a.deltaMax, b.deltaMax),
  };
}

function combineAnd(a: MaybeEffect, b: MaybeEffect): MaybeEffect {
  // EMPTY is absorbing for AND
  if (!isReal(a)) return null;
  if (!isReal(b)) return null;

  // After A runs, stack has (input + a.delta).
  // B needs at least b.minInput.
  // Worst case: input + a.deltaMin >= b.minInput
  // So: input >= b.minInput - a.deltaMin
  const minInputFromB = safeSub(b.minInput, a.deltaMin);

  return {
    minInput: Math.max(a.minInput, minInputFromB),
    deltaMin: safeAddMin(a.deltaMin, b.deltaMin),
    deltaMax: safeAddMax(a.deltaMax, b.deltaMax),
  };
}

function combineMaybe(e: MaybeEffect): MaybeEffect {
  return combineOr(e, EPSILON);
}

// ===== Dependency Graph & SCCs =====

function collectReferences(expr: Expr, ruleNames: Set<string>): Set<string> {
  const refs = new Set<string>();

  function walk(e: Expr) {
    if (typeof e === "string") {
      if (ruleNames.has(e)) refs.add(e);
    } else if (e.kind === "and") {
      e.parts.forEach(walk);
    } else if (e.kind === "or") {
      e.alts.forEach(walk);
    } else if (e.kind === "maybe") {
      walk(e.expr);
    }
  }

  walk(expr);
  return refs;
}

interface DepGraph {
  rules: string[];
  deps: Map<string, Set<string>>; // rule -> rules it references
  revDeps: Map<string, Set<string>>; // rule -> rules that reference it
  inCycle: Set<string>; // rules that are in a cycle (need widening)
}

function buildDependencyGraph(grammar: SCFG): DepGraph {
  const rules = Object.keys(grammar);
  const ruleSet = new Set(rules);
  const deps = new Map<string, Set<string>>();
  const revDeps = new Map<string, Set<string>>();

  for (const rule of rules) {
    deps.set(rule, new Set());
    revDeps.set(rule, new Set());
  }

  for (const rule of rules) {
    const referenced = collectReferences(grammar[rule], ruleSet);
    deps.set(rule, referenced);
    for (const ref of referenced) {
      revDeps.get(ref)!.add(rule);
    }
  }

  // Compute SCCs using Tarjan's algorithm to find cycles
  const inCycle = computeCyclicRules(rules, deps);

  return { rules, deps, revDeps, inCycle };
}

function computeCyclicRules(
  rules: string[],
  deps: Map<string, Set<string>>
): Set<string> {
  // Tarjan's SCC algorithm
  const index = new Map<string, number>();
  const lowlink = new Map<string, number>();
  const onStack = new Set<string>();
  const stack: string[] = [];
  const sccs: string[][] = [];
  let idx = 0;

  function strongconnect(v: string) {
    index.set(v, idx);
    lowlink.set(v, idx);
    idx++;
    stack.push(v);
    onStack.add(v);

    for (const w of deps.get(v) ?? []) {
      if (!index.has(w)) {
        strongconnect(w);
        lowlink.set(v, Math.min(lowlink.get(v)!, lowlink.get(w)!));
      } else if (onStack.has(w)) {
        lowlink.set(v, Math.min(lowlink.get(v)!, index.get(w)!));
      }
    }

    if (lowlink.get(v) === index.get(v)) {
      const scc: string[] = [];
      let w: string;
      do {
        w = stack.pop()!;
        onStack.delete(w);
        scc.push(w);
      } while (w !== v);
      sccs.push(scc);
    }
  }

  for (const v of rules) {
    if (!index.has(v)) {
      strongconnect(v);
    }
  }

  // A rule is "in a cycle" if:
  // - SCC has size > 1, OR
  // - SCC has size 1 but rule references itself
  const inCycle = new Set<string>();
  for (const scc of sccs) {
    if (scc.length > 1) {
      for (const r of scc) inCycle.add(r);
    } else if (scc.length === 1) {
      const r = scc[0];
      if (deps.get(r)?.has(r)) inCycle.add(r);
    }
  }

  return inCycle;
}

// ===== Monotone Join & Widening =====

// Lattice order: EMPTY < real effects, and for real effects:
// - minInput: higher = more conservative (non-decreasing)
// - deltaMin: lower = more conservative (non-increasing)
// - deltaMax: higher = more conservative (non-decreasing)

function joinEffects(old: MaybeEffect, neu: MaybeEffect): MaybeEffect {
  if (!isReal(old)) return neu;
  if (!isReal(neu)) return old;

  return {
    minInput: Math.max(old.minInput, neu.minInput),
    deltaMin: Math.min(old.deltaMin, neu.deltaMin),
    deltaMax: Math.max(old.deltaMax, neu.deltaMax),
  };
}

const WIDEN_THRESHOLD = 10;

function widen(
  old: MaybeEffect,
  neu: MaybeEffect,
  iterations: number,
  shouldWiden: boolean
): MaybeEffect {
  // CRITICAL: never shrink. If neu is non-real, keep old.
  if (!isReal(neu)) return old;
  if (!isReal(old)) return neu;

  // First, force monotone growth (join with old)
  const joined = joinEffects(old, neu) as StackEffect; // both real, so result is real

  // Only widen for cyclic rules after threshold
  if (!shouldWiden || iterations < WIDEN_THRESHOLD) {
    return joined;
  }

  // Widen: if growing, jump to infinity (never narrow back)
  return {
    minInput: joined.minInput > old.minInput ? Infinity : old.minInput,
    deltaMin: joined.deltaMin < old.deltaMin ? -Infinity : old.deltaMin,
    deltaMax: joined.deltaMax > old.deltaMax ? Infinity : old.deltaMax,
  };
}

function effectEqual(a: MaybeEffect, b: MaybeEffect): boolean {
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;
  return (
    a.minInput === b.minInput &&
    a.deltaMin === b.deltaMin &&
    a.deltaMax === b.deltaMax
  );
}

// ===== Effect Computation (Non-Recursive) =====

function computeEffect(
  expr: Expr,
  grammar: SCFG,
  effects: Map<string, MaybeEffect>,
  primitives: Map<string, StackEffect>
): MaybeEffect {
  if (typeof expr === "string") {
    // Rule reference: look up current approximation (NOT recursive)
    if (effects.has(expr)) {
      return effects.get(expr)!;
    }
    // Primitive: must be declared
    if (primitives.has(expr)) {
      return primitives.get(expr)!;
    }
    // Unknown token: error
    throw new Error(`Unknown symbol: "${expr}". Declare it in primitives.`);
  }

  if (expr.kind === "and") {
    if (expr.parts.length === 0) {
      return EPSILON;
    }
    return expr.parts
      .map((p) => computeEffect(p, grammar, effects, primitives))
      .reduce(combineAnd);
  }

  if (expr.kind === "or") {
    if (expr.alts.length === 0) {
      return null; // empty language
    }
    return expr.alts
      .map((a) => computeEffect(a, grammar, effects, primitives))
      .reduce(combineOr);
  }

  if (expr.kind === "maybe") {
    return combineMaybe(computeEffect(expr.expr, grammar, effects, primitives));
  }

  throw new Error(`Unknown expression kind: ${(expr as any).kind}`);
}

// ===== Fixed-Point Solver =====

export type SolveResult =
  | { converged: true; effects: Map<string, MaybeEffect> }
  | { converged: false; reason: string };

function solve(grammar: SCFG, primitives: Map<string, StackEffect>): SolveResult {
  const { rules, revDeps, inCycle } = buildDependencyGraph(grammar);

  // Check for rule/primitive name collisions
  const collisions = rules.filter((r) => primitives.has(r));
  if (collisions.length > 0) {
    return {
      converged: false,
      reason: `Rule names shadow primitives: ${collisions.join(", ")}. Rules take precedence, which may cause unexpected behavior.`,
    };
  }

  // Initialize all rules to EMPTY
  const effects = new Map<string, MaybeEffect>();
  for (const rule of rules) {
    effects.set(rule, null);
  }

  // Track iteration count per rule for widening
  const iterCount = new Map<string, number>();
  for (const rule of rules) {
    iterCount.set(rule, 0);
  }

  const worklist = new Set(rules);
  const MAX_ITERATIONS = 10000;
  let totalIterations = 0;

  while (worklist.size > 0) {
    if (totalIterations++ > MAX_ITERATIONS) {
      return {
        converged: false,
        reason: `Did not converge after ${MAX_ITERATIONS} iterations`,
      };
    }

    const rule = worklist.values().next().value;
    worklist.delete(rule);

    const oldEffect = effects.get(rule)!;
    let newEffect: MaybeEffect;

    try {
      newEffect = computeEffect(grammar[rule], grammar, effects, primitives);
    } catch (e) {
      return { converged: false, reason: (e as Error).message };
    }

    // Apply widening (only for cyclic rules)
    const ruleIters = iterCount.get(rule)! + 1;
    iterCount.set(rule, ruleIters);

    const shouldWiden = inCycle.has(rule);
    const widened = widen(oldEffect, newEffect, ruleIters, shouldWiden);

    if (!effectEqual(oldEffect, widened)) {
      effects.set(rule, widened);
      // Add dependents to worklist
      for (const dependent of revDeps.get(rule) ?? []) {
        worklist.add(dependent);
      }
    }
  }

  return { converged: true, effects };
}

// ===== Validation =====

export type ValidationResult =
  | { valid: true; effect: StackEffect }
  | { valid: false; errors: string[] };

export function validate(
  grammar: SCFG,
  primitives: Map<string, StackEffect>
): ValidationResult {
  const solveResult = solve(grammar, primitives);

  // Fail closed: non-convergence = invalid
  if (!solveResult.converged) {
    return { valid: false, errors: [solveResult.reason] };
  }

  const initEffect = solveResult.effects.get("init");
  const errors: string[] = [];

  // Check: init must have real behaviors
  if (!isReal(initEffect)) {
    errors.push("Grammar produces no terminal strings (empty language)");
    return { valid: false, errors };
  }

  // Check: can start from empty stack
  if (initEffect.minInput > 0) {
    if (initEffect.minInput === Infinity) {
      errors.push("Requires unbounded stack depth to start");
    } else {
      errors.push(`Requires ${initEffect.minInput} items but starts empty`);
    }
  }

  // Check: always ends with exactly 1 item
  if (initEffect.deltaMin !== 1 || initEffect.deltaMax !== 1) {
    if (initEffect.deltaMin === initEffect.deltaMax) {
      errors.push(`Always ends with ${initEffect.deltaMin} items, expected 1`);
    } else if (initEffect.deltaMax === Infinity && initEffect.deltaMin === -Infinity) {
      errors.push("Stack effect is completely unbounded [-∞, +∞]");
    } else if (initEffect.deltaMax === Infinity) {
      errors.push(`Can produce unbounded items [${initEffect.deltaMin}, +∞]`);
    } else if (initEffect.deltaMin === -Infinity) {
      errors.push(`Can underflow [-∞, ${initEffect.deltaMax}]`);
    } else {
      errors.push(
        `Ends with [${initEffect.deltaMin}, ${initEffect.deltaMax}] items, expected exactly 1`
      );
    }
  }

  return errors.length === 0
    ? { valid: true, effect: initEffect }
    : { valid: false, errors };
}

// ===== Primitive Presets =====

export function makePrimitive(minInput: number, delta: number): StackEffect {
  return { minInput, deltaMin: delta, deltaMax: delta };
}

export const PUSH = makePrimitive(0, 1); // literals
export const DROP = makePrimitive(1, -1);
export const DUP = makePrimitive(1, 1);
export const SWAP = makePrimitive(2, 0);
export const BINARY_OP = makePrimitive(2, -1); // +, -, *, /, spread, stack
export const UNARY_OP = makePrimitive(1, 0); // negate, cut-*, etc.
export const NOP = makePrimitive(0, 0); // no-op

// ===== Test =====

function runTests() {
  // PB&J grammar
  const pbjGrammar: SCFG = {
    init: or("single-slice-method", "two-slice-method"),
    "single-slice-method": and("loaded-slice", "plain-bread", "stack", "finish"),
    "loaded-slice": or(
      and("bread", "pb-type", "spread", "jelly-type", "spread"),
      and("bread", "jelly-type", "spread", "pb-type", "spread")
    ),
    "plain-bread": "bread",
    "two-slice-method": or(
      and("pb-slice", "jelly-slice", "stack", "finish"),
      and("jelly-slice", "pb-slice", "stack", "finish")
    ),
    "pb-slice": and("bread", "pb-type", "spread"),
    "jelly-slice": and("bread", "jelly-type", "spread"),
    "pb-type": or("crunchy", "smooth"),
    "jelly-type": or("grape", "strawberry"),
    finish: or("cut-diagonal", "cut-horizontal", "no-cut"),
  };

  const pbjPrimitives = new Map<string, StackEffect>([
    ["bread", PUSH],
    ["crunchy", PUSH],
    ["smooth", PUSH],
    ["grape", PUSH],
    ["strawberry", PUSH],
    ["spread", BINARY_OP],
    ["stack", BINARY_OP],
    ["cut-diagonal", UNARY_OP],
    ["cut-horizontal", UNARY_OP],
    ["no-cut", NOP],
  ]);

  console.log("=== PB&J Grammar Validation ===\n");
  const result = validate(pbjGrammar, pbjPrimitives);
  console.log("Result:", result);

  // Recursive grammar test
  console.log("\n=== Recursive Grammar Test ===\n");
  const recursiveGrammar: SCFG = {
    init: "sentences",
    sentences: or("sentence", and("sentence", "pause", "sentences")),
    sentence: and("word", "emit"),
  };

  const recursivePrimitives = new Map<string, StackEffect>([
    ["word", PUSH],
    ["pause", NOP],
    ["emit", DROP],
  ]);

  const result2 = validate(recursiveGrammar, recursivePrimitives);
  console.log("Result:", result2);

  // Valid recursive grammar (consumes as it produces)
  console.log("\n=== Valid Recursive Grammar ===\n");
  const validRecursive: SCFG = {
    init: and("item", "process"),
    process: or("done", and("consume", "item", "process")),
  };

  const validRecPrimitives = new Map<string, StackEffect>([
    ["item", PUSH],
    ["consume", DROP],
    ["done", NOP],
  ]);

  const result3 = validate(validRecursive, validRecPrimitives);
  console.log("Result:", result3);
}

runTests();
