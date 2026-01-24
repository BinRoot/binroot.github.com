import { ngram } from "./ngram";
import { sample } from "./sample";
import { successors1 } from "./successors";
import { AndExpr, Expr, MaybeExpr, OrExpr, SCFG } from "./types";

/**
 * Searches for a model that maximizes histogram alignment when matching ngram of model samples.
 * The candidate histogram is computed from the ngram of the candidate model samples.
 * The alignment is measured by the KL divergence between the candidate histogram and the target histogram.
 * Search is beam search with a fixed width.
 */
export function search(
  initalModal: SCFG,
  targetHistogram: Record<string, number>
): SCFG {
  const targetKeys = Object.keys(targetHistogram).filter(
    (k) => (targetHistogram[k] ?? 0) > 0
  );
  if (targetKeys.length === 0) return initalModal;

  const targetTotal = targetKeys.reduce(
    (sum, k) => sum + (targetHistogram[k] ?? 0),
    0
  );
  if (targetTotal <= 0) return initalModal;

  let maxN = 1;
  const targetTokens = new Set<string>();
  for (const key of targetKeys) {
    const parts = key.trim() === "" ? [] : key.split(" ");
    if (parts.length > maxN) maxN = parts.length;
    for (const tok of parts) targetTokens.add(tok);
  }

  const targetProb: Record<string, number> = Object.create(null);
  for (const key of targetKeys) {
    targetProb[key] = (targetHistogram[key] ?? 0) / targetTotal;
  }

  const beamWidth = 5;
  const maxIterations = 100;
  const samplesPerEval = 200;
  const alpha = 0.001;

  const symbolPool = Array.from(
    new Set([
      ...targetTokens,
      ...collectAtoms(initalModal),
      ...Object.keys(initalModal).filter((k) => k !== "init"),
    ])
  ).sort();

  const successorOpts = {
    symbolPool,
    maybeGrid: [0.5],
    weightGrid: [0.5],
    pruneUnreachable: true,
    maxSuccessors: 1000,
  };

  const scoreCache = new Map<string, number>();

  function computeScore(model: SCFG): number {
    const samples: string[][] = [];
    for (let i = 0; i < samplesPerEval; i++) samples.push(sample(model));
    const counts = ngram(samples, maxN);
    let supportTotal = 0;
    for (const key of targetKeys) supportTotal += counts[key] ?? 0;
    const denom = supportTotal + alpha * targetKeys.length;
    if (denom <= 0) return Number.POSITIVE_INFINITY;
    let kl = 0;
    for (const key of targetKeys) {
      const pt = targetProb[key] ?? 0;
      if (pt <= 0) continue;
      const pm = ((counts[key] ?? 0) + alpha) / denom;
      if (pm <= 0) return Number.POSITIVE_INFINITY;
      kl += pt * Math.log(pt / pm);
    }
    return kl;
  }

  function scoreFor(model: SCFG): number {
    const key = stableStringify(model);
    const cached = scoreCache.get(key);
    if (cached !== undefined) return cached;
    const score = computeScore(model);
    scoreCache.set(key, score);
    return score;
  }

  let bestModel = initalModal;
  let bestScore = scoreFor(initalModal);
  if (bestScore === 0) return bestModel;

  let beam: Array<{ model: SCFG; score: number }> = [
    { model: initalModal, score: bestScore },
  ];

  for (let iter = 0; iter < maxIterations; iter++) {
    const candidates: Array<{ model: SCFG; score: number }> = [];
    const seen = new Set<string>();

    for (const item of beam) {
      const next = successors1(item.model, successorOpts);
      for (const { model } of next) {
        const key = stableStringify(model);
        if (seen.has(key)) continue;
        seen.add(key);
        const score = scoreFor(model);
        candidates.push({ model, score });
      }
    }

    if (candidates.length === 0) break;
    candidates.sort((a, b) => a.score - b.score);
    beam = candidates.slice(0, beamWidth);

    if (beam[0].score < bestScore) {
      bestScore = beam[0].score;
      bestModel = beam[0].model;
      if (bestScore === 0) break;
    }
  }

  return bestModel;
}

function collectAtoms(model: SCFG): string[] {
  const out = new Set<string>();
  for (const key of Object.keys(model)) {
    if (key === "init") continue;
    out.add(key);
  }
  const ruleNames = new Set(Object.keys(model).filter((k) => k !== "init"));
  for (const key of Object.keys(model)) {
    if (key === "init") collectFromExpr(model.init, out, ruleNames, model);
    else collectFromExpr(model[key], out, ruleNames, model);
  }
  return Array.from(out);
}

function collectFromExpr(
  expr: Expr,
  out: Set<string>,
  ruleNames: Set<string>,
  model: SCFG
): void {
  if (typeof expr === "string") {
    out.add(expr);
    if (ruleNames.has(expr)) {
      collectFromExpr(model[expr], out, ruleNames, model);
    }
    return;
  }
  if (isAnd(expr)) {
    for (const part of expr.parts) collectFromExpr(part, out, ruleNames, model);
    return;
  }
  if (isOr(expr)) {
    for (const alt of expr.alts) collectFromExpr(alt, out, ruleNames, model);
    return;
  }
  if (isMaybe(expr)) {
    collectFromExpr(expr.expr, out, ruleNames, model);
  }
}

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

function stableStringify(value: any): string {
  if (value === null || value === undefined) return JSON.stringify(value);
  if (typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const keys = Object.keys(value).sort();
  return `{${keys
    .map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`)
    .join(",")}}`;
}
