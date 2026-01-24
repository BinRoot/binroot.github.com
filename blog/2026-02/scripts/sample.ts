import { Atom, Expr, SCFG, AndExpr, OrExpr, MaybeExpr } from "./types";

export function sample(model: SCFG): Atom[] {
  const ruleNames = new Set(Object.keys(model).filter((k) => k !== "init"));

  function isAnd(x: Expr): x is AndExpr {
    return (
      typeof x === "object" &&
      x !== null &&
      (x as AndExpr).kind === "and" &&
      Array.isArray((x as AndExpr).parts)
    );
  }

  function isOr(x: Expr): x is OrExpr {
    return (
      typeof x === "object" &&
      x !== null &&
      (x as OrExpr).kind === "or" &&
      Array.isArray((x as OrExpr).alts)
    );
  }

  function isMaybe(x: Expr): x is MaybeExpr {
    return (
      typeof x === "object" &&
      x !== null &&
      (x as MaybeExpr).kind === "maybe" &&
      "expr" in (x as MaybeExpr) &&
      typeof (x as MaybeExpr).p === "number"
    );
  }

  function clamp01(x: number): number {
    return Math.max(0, Math.min(1, x));
  }

  function normalizeWeights(ws: number[], n: number): number[] {
    if (ws.length !== n) return Array.from({ length: n }, () => 1 / n);
    const clipped = ws.map((w) => (Number.isFinite(w) ? Math.max(0, w) : 0));
    const sum = clipped.reduce((a, b) => a + b, 0);
    if (sum <= 0) return Array.from({ length: n }, () => 1 / n);
    return clipped.map((w) => w / sum);
  }

  function pickIndex(weights: number[]): number {
    const r = Math.random();
    let acc = 0;
    for (let i = 0; i < weights.length; i++) {
      acc += weights[i];
      if (r <= acc) return i;
    }
    return weights.length - 1;
  }

  function expand(expr: Expr): Atom[] {
    if (typeof expr === "string") {
      if (ruleNames.has(expr)) return expand(model[expr]);
      return [expr];
    }

    if (isAnd(expr)) {
      const out: Atom[] = [];
      for (const part of expr.parts) out.push(...expand(part));
      return out;
    }

    if (isOr(expr)) {
      if (expr.alts.length === 0) return [];
      if (expr.alts.length === 1) return expand(expr.alts[0]);
      const weights = normalizeWeights(
        expr.weights ?? [],
        expr.alts.length
      );
      const choice = pickIndex(weights);
      return expand(expr.alts[choice]);
    }

    if (isMaybe(expr)) {
      const p = clamp01(expr.p);
      if (Math.random() > p) return [];
      return expand(expr.expr);
    }

    return [];
  }

  return expand(model.init);
}
