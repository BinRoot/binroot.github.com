// successors.ts
import {
  SCFG,
  Expr,
  AndExpr,
  OrExpr,
  MaybeExpr,
  and,
  or,
  maybe,
} from "./types";

/**
 * A finite, functionally-complete(ish) 1-step neighborhood generator for your SCFG,
 * parameterized by finite pools (symbolPool, grids, optional newRuleNames).
 *
 * Notes:
 * - We represent epsilon as `and()` (i.e. {kind:"and", parts:[]}).
 * - Any Atom string equal to an existing rule key (except "init") is treated as a nonterminal reference.
 *   If you can’t guarantee terminals won’t collide with rule names, you’ll want a distinct Ref type.
 */

export type Path = Array<string | number>;

/**
 * One-step edit operations over an SCFG (a mapping from rule names to Expr trees).
 *
 * Paths:
 * - `path` locates a node *within the RHS Expr tree* for the given `rule`.
 * - `path` is empty `[]` iff the edit targets the *entire RHS* of `model[rule]`.
 * - Path segments follow the concrete runtime shape from `types.ts`:
 *   - AndExpr:  { kind:"and",  parts: Expr[] }   => child i path: ["parts", i]
 *   - OrExpr:   { kind:"or",   alts: Expr[] }    => child i path: ["alts", i]
 *   - MaybeExpr:{ kind:"maybe",expr: Expr, p }    => child path: ["expr"]
 *
 * Conventions / semantics:
 * - Atoms are strings.
 * - Epsilon (empty string) is represented as `and()` (i.e. {kind:"and", parts:[]}).
 * - "Nonterminal reference" is represented as an Atom string that equals a rule key (except "init").
 *   If terminals can collide with rule names, you should encode refs separately.
 *
 * Each Edit describes the *single local change* applied to produce a successor model.
 */
export type Edit =
  /**
   * Replace an Atom (string leaf) at `rule:path` with another Atom `to`.
   *
   * Example:
   *   replace-atom at qa:["parts",1] from "user-question" to "user-nvm"
   *
   * Effect:
   *   - Only valid when the targeted node is a string.
   *   - Changes token/nonterminal name at that position.
   */
  | { kind: "replace-atom"; rule: string; path: Path; from: string; to: string }

  /**
   * Wrap the Expr at `rule:path` with a MaybeExpr: maybe(targetExpr, p).
   *
   * Example:
   *   wrap-maybe at nvm:["parts",1] p=0.5
   *   turns "user-nvm" into maybe("user-nvm", 0.5)
   *
   * Effect:
   *   - Makes the subtree optional (target included with prob p; else epsilon).
   *   - This is an "insert parent node" tree-edit.
   */
  | { kind: "wrap-maybe"; rule: string; path: Path; p: number }

  /**
   * Unwrap a MaybeExpr at `rule:path`: maybe(x,p) -> x.
   *
   * Example:
   *   unwrap-maybe at qa:["parts",0]
   *   turns maybe("pause",0.5) into "pause"
   *
   * Effect:
   *   - Only valid when targeted node is MaybeExpr.
   *   - Deletes the Maybe node and splices its child upward (tree delete).
   */
  | { kind: "unwrap-maybe"; rule: string; path: Path }

  /**
   * Wrap the Expr at `rule:path` in an AndExpr that also contains a new Atom.
   *
   * Example (side="right"):
   *   wrap-and at init:[] side="right" atom="pause"
   *   turns initExpr into and(initExpr, "pause")
   *
   * Example (side="left"):
   *   wrap-and at init:[] side="left" atom="pause"
   *   turns initExpr into and("pause", initExpr)
   *
   * Effect:
   *   - Inserts a sequence node above the target, adding one new sibling Atom.
   *   - This provides a structural "insert" operation without requiring an existing And node.
   */
  | {
      kind: "wrap-and";
      rule: string;
      path: Path;
      side: "left" | "right";
      atom: string;
    }

  /**
   * Wrap the Expr at `rule:path` in an OrExpr that also contains a new Atom,
   * with explicit binary weights [w0, 1-w0].
   *
   * Example (side="right"):
   *   wrap-or at init:["parts",1] side="right" atom="qa" w0=0.5
   *   turns X into or(X, "qa", [0.5, 0.5])
   *
   * Example (side="left"):
   *   wrap-or at init:["parts",1] side="left" atom="qa" w0=0.5
   *   turns X into or("qa", X, [0.5, 0.5])
   *
   * Effect:
   *   - Inserts a choice node above the target, adding one new alternative Atom.
   *   - Weights determine probability of choosing the first alt vs the second.
   *   - This is the "insert parent node" variant for Or.
   */
  | {
      kind: "wrap-or";
      rule: string;
      path: Path;
      side: "left" | "right";
      atom: string;
      w0: number;
    }

  /**
   * Delete one child from an existing AndExpr's `parts` list.
   *
   * Example:
   *   delete-and at qa:[] index=0
   *   removes qa.parts[0]
   *
   * Effect:
   *   - Only valid when targeted node is AndExpr.
   *   - After deletion, the node is simplified:
   *     - and() (no parts) becomes epsilon
   *     - and(x) (one part) becomes x
   *     - and(x,y,...) stays an AndExpr
   *   - This is the canonical ordered-tree "delete child" move for And.
   */
  | { kind: "delete-and"; rule: string; path: Path; index: number }

  /**
   * Insert a new Atom as an alternative into an existing OrExpr's `alts` list,
   * and assign a proposed weight `wNew` to the inserted alt.
   *
   * Example:
   *   insert-or at init:["parts",1] index=1 atom="nvm" wNew=0.25
   *   inserts "nvm" into that OrExpr.alts at position 1.
   *
   * Effect:
   *   - Only valid when targeted node is OrExpr.
   *   - Ensures the resulting OrExpr has explicit normalized weights:
   *     - The new alt gets weight wNew (clamped to [0,1]).
   *     - Existing weights are scaled to sum to (1 - wNew), preserving proportions.
   *   - This is the canonical "insert child" move for Or with probability bookkeeping.
   */
  | {
      kind: "insert-or";
      rule: string;
      path: Path;
      index: number;
      atom: string;
      wNew: number;
    }

  /**
   * Delete one alternative from an existing OrExpr's `alts` list.
   *
   * Example:
   *   delete-or at init:["parts",1] index=0
   *   removes the first alternative
   *
   * Effect:
   *   - Only valid when targeted node is OrExpr.
   *   - After deletion, the node is simplified:
   *     - or() (no alts) becomes epsilon
   *     - or(x) (one alt) becomes x
   *     - or(x,y,...) stays an OrExpr with normalized weights
   *   - If weights were present, the removed weight is dropped and remaining weights renormalized.
   */
  | { kind: "delete-or"; rule: string; path: Path; index: number }

  /**
   * Set the parameter `p` on a MaybeExpr at `rule:path`.
   *
   * Example:
   *   set-maybe-p at qa:["parts",0] p=0.75
   *
   * Effect:
   *   - Only valid when targeted node is MaybeExpr.
   *   - Adjusts probability of including its child vs epsilon.
   *   - Normalization/simplification may collapse:
   *     - p<=0 -> epsilon
   *     - p>=1 -> child
   *   (depending on how normalizeExpr is configured)
   */
  | { kind: "set-maybe-p"; rule: string; path: Path; p: number }

  /**
   * Set one alternative's weight in an OrExpr at `rule:path`.
   *
   * Example:
   *   set-or-weight at init:["parts",1] index=1 w=0.7
   *
   * Effect:
   *   - Only valid when targeted node is OrExpr.
   *   - Forces explicit weights (if absent, starts from uniform).
   *   - Sets weight[index] = w (clamped to [0,1]) and renormalizes the remainder
   *     proportionally to keep sum=1.
   */
  | {
      kind: "set-or-weight";
      rule: string;
      path: Path;
      index: number;
      w: number;
    }

  /**
   * Extract the subtree at `rule:path` into a *new* rule, then replace that subtree with a
   * nonterminal reference (the new rule name).
   *
   * Example:
   *   extract-rule at qa:["parts",3] newRule="A"
   *   - Adds model["A"] = <subtree at qa.parts[3]>
   *   - Replaces qa.parts[3] with "A"
   *
   * Effect:
   *   - Changes the grammar's rule graph (adds a new nonterminal).
   *   - Useful for compressing repeated structures and enabling reuse/recursion.
   *   - Only generated if you supply opts.newRuleNames.
   */
  | { kind: "extract-rule"; rule: string; path: Path; newRule: string }

  /**
   * Inline an existing rule at a call site: replace an Atom that references a rule name
   * with that rule's RHS Expr tree.
   *
   * Example:
   *   inline-rule at init:["parts",1,"alts",0] inlined="nvm"
   *   replaces "nvm" with model.nvm's Expr tree
   *
   * Effect:
   *   - Only valid when targeted node is a string Atom that matches a rule key (nonterminal).
   *   - Inverses extract-rule at the callsite level; can reduce indirection.
   */
  | { kind: "inline-rule"; rule: string; path: Path; inlined: string }

  /**
   * Swap two children in an AndExpr.
   *
   * Example:
   *   swap-and at qa:[] i=0 j=2
   *   swaps qa.parts[0] and qa.parts[2]
   *
   * Effect:
   *   - Only valid when targeted node is AndExpr.
   *   - Atomically swaps two children (4 ops → 1 for non-adjacent).
   */
  | { kind: "swap-and"; rule: string; path: Path; i: number; j: number }

  /**
   * Swap two alternatives (and their weights) in an OrExpr.
   *
   * Example:
   *   swap-or at init:["parts",1] i=0 j=2
   *   swaps alts[0] with alts[2] and weights[0] with weights[2]
   *
   * Effect:
   *   - Only valid when targeted node is OrExpr.
   *   - Atomically swaps two alternatives and their weights (4 ops → 1 for non-adjacent).
   */
  | { kind: "swap-or"; rule: string; path: Path; i: number; j: number }

  /**
   * Delete a rule and inline all references to it throughout the grammar.
   *
   * Example:
   *   delete-rule "nvm"
   *   inlines model.nvm everywhere it's referenced, then removes the rule
   *
   * Effect:
   *   - Replaces all Atom references to the rule with the rule's RHS Expr.
   *   - Removes the rule from the model.
   *   - This is an N→1 operation where N is the number of references.
   *   - Cannot delete "init".
   */
  | { kind: "delete-rule"; deletedRule: string };

export type Successor = { model: SCFG; edit: Edit };

export interface SuccessorOptions {
  /** Finite pool of Atoms (terminals + nonterminal names you allow to appear as refs). */
  symbolPool: string[];

  /** Candidate p values for maybe(expr,p). */
  maybeGrid: number[];

  /** Candidate weights for OR edits/wrappers. */
  weightGrid: number[];

  /**
   * Optional finite pool of fresh rule names for 1-step extract-rule edits.
   * (If omitted, extract-rule moves are not generated.)
   */
  newRuleNames?: string[];

  /** If true, drop unreachable rules (except init) after each edit. */
  pruneUnreachable?: boolean;

  /** Hard cap to prevent explosion. */
  maxSuccessors?: number;
}

// ----- Runtime guards matching your types.ts shapes -----

function isAnd(x: any): x is AndExpr {
  return (
    x && typeof x === "object" && x.kind === "and" && Array.isArray(x.parts)
  );
}
function isOr(x: any): x is OrExpr {
  return x && typeof x === "object" && x.kind === "or" && Array.isArray(x.alts);
}
function isMaybe(x: any): x is MaybeExpr {
  return (
    x &&
    typeof x === "object" &&
    x.kind === "maybe" &&
    "expr" in x &&
    typeof x.p === "number"
  );
}

// ----- Helpers -----

function epsilon(): AndExpr {
  return and(); // {kind:"and", parts:[]}
}

function clone<T>(v: T): T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sc: any = (globalThis as any).structuredClone;
  return typeof sc === "function" ? sc(v) : JSON.parse(JSON.stringify(v));
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

function normalizeWeights(ws: number[]): number[] {
  const n = ws.length;
  if (n === 0) return [];
  const clipped = ws.map((w) => (Number.isFinite(w) ? Math.max(0, w) : 0));
  const sum = clipped.reduce((a, b) => a + b, 0);
  if (sum <= 0) return Array.from({ length: n }, () => 1 / n);
  return clipped.map((w) => w / sum);
}

/** Set one weight to w and renormalize the rest proportionally. */
function setWeightAndRenorm(
  weights: number[],
  index: number,
  w: number
): number[] {
  const n = weights.length;
  if (n === 0) return [];
  if (n === 1) return [1];

  const wi = clamp01(w);
  const restMass = 1 - wi;

  const old = normalizeWeights(weights);
  const out = new Array(n).fill(0);
  out[index] = wi;

  const restIdx: number[] = [];
  for (let j = 0; j < n; j++) if (j !== index) restIdx.push(j);

  const oldRestSum = restIdx.reduce((s, j) => s + Math.max(0, old[j]), 0);

  if (restMass <= 0) return normalizeWeights(out);

  if (oldRestSum <= 0) {
    const each = restMass / restIdx.length;
    for (const j of restIdx) out[j] = each;
  } else {
    for (const j of restIdx)
      out[j] = restMass * (Math.max(0, old[j]) / oldRestSum);
  }

  return normalizeWeights(out);
}

function getAtPath(root: any, path: Path): any {
  let cur = root;
  for (const seg of path) cur = cur[seg as any];
  return cur;
}

function setAtPath(root: any, path: Path, value: any): void {
  if (path.length === 0)
    throw new Error("setAtPath called with empty path; set rule directly.");
  let cur = root;
  for (let i = 0; i < path.length - 1; i++) cur = cur[path[i] as any];
  cur[path[path.length - 1] as any] = value;
}

/** Walk every node in an Expr (preorder), yielding (node, path). */
function* walkExpr(
  node: Expr,
  path: Path = []
): Generator<{ node: Expr; path: Path }, void, void> {
  yield { node, path };

  if (typeof node === "string") return;

  if (isAnd(node)) {
    for (let i = 0; i < node.parts.length; i++) {
      yield* walkExpr(node.parts[i], [...path, "parts", i]);
    }
  } else if (isOr(node)) {
    for (let i = 0; i < node.alts.length; i++) {
      yield* walkExpr(node.alts[i], [...path, "alts", i]);
    }
  } else if (isMaybe(node)) {
    yield* walkExpr(node.expr, [...path, "expr"]);
  }
}

function deleteAndChild(node: AndExpr, index: number): Expr {
  const parts = node.parts.slice();
  parts.splice(index, 1);
  if (parts.length === 0) return epsilon();
  if (parts.length === 1) return parts[0];
  return { kind: "and", parts };
}

function deleteOrAlt(node: OrExpr, index: number): Expr {
  const alts = node.alts.slice();
  alts.splice(index, 1);

  if (alts.length === 0) return epsilon();
  if (alts.length === 1) return alts[0];

  const oldW =
    node.weights && node.weights.length === node.alts.length
      ? normalizeWeights(node.weights)
      : normalizeWeights(Array.from({ length: node.alts.length }, () => 1));

  const ws = oldW.slice();
  ws.splice(index, 1);

  return { kind: "or", alts, weights: normalizeWeights(ws) };
}

function swapAndChildren(node: AndExpr, i: number, j: number): AndExpr {
  const parts = node.parts.slice();
  [parts[i], parts[j]] = [parts[j], parts[i]];
  return { kind: "and", parts };
}

function swapOrAlts(node: OrExpr, i: number, j: number): OrExpr {
  const alts = node.alts.slice();
  [alts[i], alts[j]] = [alts[j], alts[i]];

  const oldW =
    node.weights && node.weights.length === node.alts.length
      ? node.weights.slice()
      : Array.from({ length: node.alts.length }, () => 1 / node.alts.length);

  [oldW[i], oldW[j]] = [oldW[j], oldW[i]];

  return { kind: "or", alts, weights: normalizeWeights(oldW) };
}

/** Replace all occurrences of an atom (by name) with a replacement expression. */
function inlineAllRefs(expr: Expr, ruleName: string, replacement: Expr): Expr {
  if (typeof expr === "string") {
    return expr === ruleName ? clone(replacement) : expr;
  }

  if (isAnd(expr)) {
    return {
      kind: "and",
      parts: expr.parts.map((p) => inlineAllRefs(p, ruleName, replacement)),
    };
  }

  if (isOr(expr)) {
    return {
      kind: "or",
      alts: expr.alts.map((a) => inlineAllRefs(a, ruleName, replacement)),
      weights: expr.weights,
    };
  }

  if (isMaybe(expr)) {
    return {
      kind: "maybe",
      expr: inlineAllRefs(expr.expr, ruleName, replacement),
      p: expr.p,
    };
  }

  return expr;
}

/** Delete a rule by inlining all references to it, then removing the rule. */
function deleteRuleFromModel(model: SCFG, ruleName: string): SCFG {
  if (ruleName === "init") {
    throw new Error("Cannot delete the init rule");
  }

  const ruleBody = (model as any)[ruleName] as Expr | undefined;
  if (ruleBody === undefined) {
    return model; // Rule doesn't exist, nothing to do
  }

  const result: any = {};

  for (const key of Object.keys(model)) {
    if (key === ruleName) continue; // Skip the deleted rule
    result[key] = inlineAllRefs(model[key], ruleName, ruleBody);
  }

  return result as SCFG;
}

function insertOrAlt(
  node: OrExpr,
  index: number,
  alt: Expr,
  wNew: number
): OrExpr {
  const alts = node.alts.slice();
  alts.splice(index, 0, alt);

  const oldW =
    node.weights && node.weights.length === node.alts.length
      ? normalizeWeights(node.weights)
      : normalizeWeights(Array.from({ length: node.alts.length }, () => 1));

  const wN = clamp01(wNew);
  const scaledOld = oldW.map((w) => w * (1 - wN));
  const weights = scaledOld.slice();
  weights.splice(index, 0, wN);

  return { kind: "or", alts, weights: normalizeWeights(weights) };
}

/** Normalize/simplify to reduce duplicates in the beam. */
function normalizeExpr(x: Expr): Expr {
  if (typeof x === "string") return x;

  if (isMaybe(x)) {
    const expr = normalizeExpr(x.expr);
    const p = clamp01(x.p);
    if (p <= 0) return epsilon();
    if (p >= 1) return expr;
    return { kind: "maybe", expr, p };
  }

  if (isAnd(x)) {
    // flatten nested and (associative)
    const normParts = x.parts.map(normalizeExpr);
    const flat: Expr[] = [];
    for (const p of normParts) {
      if (isAnd(p)) flat.push(...p.parts);
      else flat.push(p);
    }
    if (flat.length === 0) return epsilon();
    if (flat.length === 1) return flat[0];
    return { kind: "and", parts: flat };
  }

  if (isOr(x)) {
    const alts = x.alts.map(normalizeExpr);
    if (alts.length === 0) return epsilon();
    if (alts.length === 1) return alts[0];

    // Canonicalize weights to an explicit normalized array.
    const weights =
      x.weights && x.weights.length === alts.length
        ? normalizeWeights(x.weights)
        : normalizeWeights(Array.from({ length: alts.length }, () => 1));

    return { kind: "or", alts, weights };
  }

  return x;
}

function reachableRules(model: SCFG): Set<string> {
  const ruleNames = new Set(Object.keys(model).filter((k) => k !== "init"));
  const seen = new Set<string>();
  const stack: Expr[] = [model.init];

  while (stack.length) {
    const cur = stack.pop()!;
    if (typeof cur === "string") {
      if (ruleNames.has(cur) && !seen.has(cur)) {
        seen.add(cur);
        stack.push(model[cur]);
      }
      continue;
    }
    if (isAnd(cur)) stack.push(...cur.parts);
    else if (isOr(cur)) stack.push(...cur.alts);
    else if (isMaybe(cur)) stack.push(cur.expr);
  }

  return seen;
}

function normalizeModel(model: SCFG, pruneUnreachable: boolean): SCFG {
  const out = clone(model);
  for (const k of Object.keys(out)) {
    out[k] = normalizeExpr(out[k]);
  }
  if (!pruneUnreachable) return out;

  const reachable = reachableRules(out);
  const pruned: any = {};
  for (const k of Object.keys(out)) {
    if (k === "init" || reachable.has(k)) pruned[k] = out[k];
  }
  return pruned as SCFG;
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

// ----- Main: enumerate all 1-step successors -----

export function successors1(model: SCFG, opts: SuccessorOptions): Successor[] {
  const symbolPool = Array.from(new Set(opts.symbolPool)).sort();

  const maybeGrid = Array.from(new Set(opts.maybeGrid.map(clamp01))).sort(
    (a, b) => a - b
  );
  const weightGrid = Array.from(new Set(opts.weightGrid.map(clamp01))).sort(
    (a, b) => a - b
  );

  const prune = !!opts.pruneUnreachable;
  const out: Successor[] = [];
  const seen = new Set<string>();

  const reachable = prune ? reachableRules(model) : null;
  const ruleKeys = Object.keys(model).filter(
    (k) => k === "init" || !prune || (reachable && reachable.has(k))
  ); // includes "init"
  const ruleNames = new Set(Object.keys(model).filter((k) => k !== "init"));

  function push(next: SCFG, edit: Edit) {
    const norm = normalizeModel(next, prune);
    const key = stableStringify(norm);
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ model: norm, edit });
  }

  function capCheck() {
    return !!opts.maxSuccessors && out.length >= opts.maxSuccessors!;
  }

  for (const rule of ruleKeys) {
    const rhs = model[rule];

    for (const { node, path } of walkExpr(rhs)) {
      // ---------- Wrap any Expr ----------
      {
        // wrap with maybe
        for (const p of maybeGrid) {
          const next = clone(model);
          const wrapped = maybe(clone(node), p);
          if (path.length === 0) (next as any)[rule] = wrapped;
          else setAtPath((next as any)[rule], path, wrapped);
          push(next, { kind: "wrap-maybe", rule, path, p });
          if (capCheck()) return out;
        }

        // wrap with and/or with an inserted atom
        for (const atom of symbolPool) {
          {
            const next = clone(model);
            const wrapped = and(clone(node), atom);
            if (path.length === 0) (next as any)[rule] = wrapped;
            else setAtPath((next as any)[rule], path, wrapped);
            push(next, { kind: "wrap-and", rule, path, side: "right", atom });
            if (capCheck()) return out;
          }
          {
            const next = clone(model);
            const wrapped = and(atom, clone(node));
            if (path.length === 0) (next as any)[rule] = wrapped;
            else setAtPath((next as any)[rule], path, wrapped);
            push(next, { kind: "wrap-and", rule, path, side: "left", atom });
            if (capCheck()) return out;
          }

          const wCandidates = weightGrid.length ? weightGrid : [0.5];
          for (const w0 of wCandidates) {
            {
              const next = clone(model);
              const wrapped = or(clone(node), atom, [w0, 1 - w0] as any);
              if (path.length === 0) (next as any)[rule] = wrapped;
              else setAtPath((next as any)[rule], path, wrapped);
              push(next, {
                kind: "wrap-or",
                rule,
                path,
                side: "right",
                atom,
                w0,
              });
              if (capCheck()) return out;
            }
            {
              const next = clone(model);
              const wrapped = or(atom, clone(node), [w0, 1 - w0] as any);
              if (path.length === 0) (next as any)[rule] = wrapped;
              else setAtPath((next as any)[rule], path, wrapped);
              push(next, {
                kind: "wrap-or",
                rule,
                path,
                side: "left",
                atom,
                w0,
              });
              if (capCheck()) return out;
            }
          }
        }
      }

      // ---------- Atom (leaf) edits ----------
      if (typeof node === "string") {
        // replace atom
        for (const sym of symbolPool) {
          if (sym === node) continue;
          const next = clone(model);
          if (path.length === 0) (next as any)[rule] = sym;
          else setAtPath((next as any)[rule], path, sym);
          push(next, { kind: "replace-atom", rule, path, from: node, to: sym });
          if (capCheck()) return out;
        }

        // inline-rule if this atom references a known nonterminal
        if (ruleNames.has(node)) {
          const next = clone(model);
          const inlined = clone((model as any)[node]) as Expr;
          if (path.length === 0) (next as any)[rule] = inlined;
          else setAtPath((next as any)[rule], path, inlined);
          push(next, { kind: "inline-rule", rule, path, inlined: node });
          if (capCheck()) return out;
        }
      }

      // ---------- Maybe edits ----------
      if (isMaybe(node)) {
        // unwrap: maybe(x,p) -> x
        {
          const next = clone(model);
          const repl = node.expr;
          if (path.length === 0) (next as any)[rule] = repl;
          else setAtPath((next as any)[rule], path, repl);
          push(next, { kind: "unwrap-maybe", rule, path });
          if (capCheck()) return out;
        }

        // set p
        for (const p of maybeGrid) {
          if (Math.abs(p - node.p) < 1e-12) continue;
          const next = clone(model);
          const cur = (
            path.length === 0
              ? (next as any)[rule]
              : getAtPath((next as any)[rule], path)
          ) as MaybeExpr;
          cur.p = p;
          push(next, { kind: "set-maybe-p", rule, path, p });
          if (capCheck()) return out;
        }
      }

      // ---------- And edits ----------
      if (isAnd(node)) {
        // delete each child
        for (let i = 0; i < node.parts.length; i++) {
          const next = clone(model);
          const cur = (
            path.length === 0
              ? (next as any)[rule]
              : getAtPath((next as any)[rule], path)
          ) as AndExpr;
          const replaced = deleteAndChild(cur, i);
          if (path.length === 0) (next as any)[rule] = replaced;
          else setAtPath((next as any)[rule], path, replaced);
          push(next, { kind: "delete-and", rule, path, index: i });
          if (capCheck()) return out;
        }

        // swap two children (only non-adjacent pairs for efficiency, since adjacent is 2→1)
        for (let i = 0; i < node.parts.length; i++) {
          for (let j = i + 2; j < node.parts.length; j++) {
            const next = clone(model);
            const cur = (
              path.length === 0
                ? (next as any)[rule]
                : getAtPath((next as any)[rule], path)
            ) as AndExpr;
            const swapped = swapAndChildren(cur, i, j);
            if (path.length === 0) (next as any)[rule] = swapped;
            else setAtPath((next as any)[rule], path, swapped);
            push(next, { kind: "swap-and", rule, path, i, j });
            if (capCheck()) return out;
          }
        }
      }

      // ---------- Or edits ----------
      if (isOr(node)) {
        const m = node.alts.length;

        // insert alt at every position (as an Atom from pool)
        for (let i = 0; i <= m; i++) {
          for (const atom of symbolPool) {
            const wCandidates = weightGrid.length ? weightGrid : [1 / (m + 1)];
            for (const wNew of wCandidates) {
              const next = clone(model);
              const cur = (
                path.length === 0
                  ? (next as any)[rule]
                  : getAtPath((next as any)[rule], path)
              ) as OrExpr;
              const inserted = insertOrAlt(cur, i, atom, wNew);
              if (path.length === 0) (next as any)[rule] = inserted;
              else setAtPath((next as any)[rule], path, inserted);
              push(next, {
                kind: "insert-or",
                rule,
                path,
                index: i,
                atom,
                wNew,
              });
              if (capCheck()) return out;
            }
          }
        }

        // delete each alt
        for (let i = 0; i < m; i++) {
          const next = clone(model);
          const cur = (
            path.length === 0
              ? (next as any)[rule]
              : getAtPath((next as any)[rule], path)
          ) as OrExpr;
          const replaced = deleteOrAlt(cur, i);
          if (path.length === 0) (next as any)[rule] = replaced;
          else setAtPath((next as any)[rule], path, replaced);
          push(next, { kind: "delete-or", rule, path, index: i });
          if (capCheck()) return out;
        }

        // swap two alts (only non-adjacent pairs for efficiency, since adjacent is 2→1)
        for (let i = 0; i < m; i++) {
          for (let j = i + 2; j < m; j++) {
            const next = clone(model);
            const cur = (
              path.length === 0
                ? (next as any)[rule]
                : getAtPath((next as any)[rule], path)
            ) as OrExpr;
            const swapped = swapOrAlts(cur, i, j);
            if (path.length === 0) (next as any)[rule] = swapped;
            else setAtPath((next as any)[rule], path, swapped);
            push(next, { kind: "swap-or", rule, path, i, j });
            if (capCheck()) return out;
          }
        }

        // set one weight (forces explicit weights)
        const curWeights =
          node.weights && node.weights.length === m
            ? normalizeWeights(node.weights)
            : normalizeWeights(Array.from({ length: m }, () => 1));

        for (let i = 0; i < m; i++) {
          for (const w of weightGrid) {
            if (Math.abs(w - curWeights[i]) < 1e-12) continue;
            const next = clone(model);
            const cur = (
              path.length === 0
                ? (next as any)[rule]
                : getAtPath((next as any)[rule], path)
            ) as OrExpr;
            const base =
              cur.weights && cur.weights.length === cur.alts.length
                ? normalizeWeights(cur.weights)
                : normalizeWeights(
                    Array.from({ length: cur.alts.length }, () => 1)
                  );
            cur.weights = setWeightAndRenorm(base, i, w);
            push(next, { kind: "set-or-weight", rule, path, index: i, w });
            if (capCheck()) return out;
          }
        }
      }

      // ---------- extract-rule (optional) ----------
      if (opts.newRuleNames && opts.newRuleNames.length) {
        for (const newRule of opts.newRuleNames) {
          if ((model as any)[newRule] !== undefined) continue;

          const next = clone(model);
          const subtree: Expr =
            path.length === 0
              ? ((next as any)[rule] as Expr)
              : (getAtPath((next as any)[rule], path) as Expr);

          (next as any)[newRule] = clone(subtree) as Expr;

          if (path.length === 0) (next as any)[rule] = newRule;
          else setAtPath((next as any)[rule], path, newRule);

          push(next, { kind: "extract-rule", rule, path, newRule });
          if (capCheck()) return out;
        }
      }
    }
  }

  // ---------- delete-rule (rule-level operation) ----------
  // Generate delete-rule for each non-init rule
  for (const ruleName of Object.keys(model)) {
    if (ruleName === "init") continue; // Cannot delete init
    if (prune && reachable && !reachable.has(ruleName)) continue; // Skip unreachable rules

    const next = deleteRuleFromModel(model, ruleName);
    push(next, { kind: "delete-rule", deletedRule: ruleName });
    if (capCheck()) return out;
  }

  return out;
}
