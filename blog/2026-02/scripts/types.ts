export type Atom = string;

export type Expr = Atom | AndExpr | OrExpr | MaybeExpr;

export type SCFG = Record<string, Expr> & { init: Expr };

export interface AndExpr {
  kind: "and";
  parts: Expr[];
}

export interface OrExpr {
  kind: "or";
  alts: Expr[];
  weights?: number[]; // interpreted as normalized weights/probabilities
}

export interface MaybeExpr {
  kind: "maybe";
  expr: Expr;
  p: number; // probability of including expr (else epsilon)
}

// this makes TS check the length matches the number of alts.
type WeightsFor<Alts extends readonly unknown[]> = {
  [K in keyof Alts]: number;
};

// ===== Combinators =====

export function and(...parts: Expr[]): AndExpr {
  return { kind: "and", parts };
}

// Overload 1: or("a", "b")
export function or<Alts extends readonly Expr[]>(...alts: Alts): OrExpr;

// Overload 2: or("a", "b", [0.6, 0.4])
export function or<Alts extends readonly Expr[]>(
  ...args: [...alts: Alts, weights: WeightsFor<Alts>]
): OrExpr;

export function or(...args: any[]): OrExpr {
  const last = args[args.length - 1];
  const hasWeights =
    Array.isArray(last) && last.every((x) => typeof x === "number");

  if (hasWeights) {
    const weights = last as number[];
    const alts = args.slice(0, -1) as Expr[];
    return { kind: "or", alts, weights };
  }

  return { kind: "or", alts: args as Expr[] };
}

export function maybe(expr: Expr, p: number): MaybeExpr {
  return { kind: "maybe", expr, p };
}
