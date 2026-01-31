import { sample } from "./sample";
import { SCFG, Atom, Expr, and, or } from "./types";

/**
 * Grammar inference from examples using sequence alignment.
 * Much faster than search - directly constructs a grammar.
 */
export function inferGrammar(samples: Atom[][]): SCFG {
  if (samples.length === 0) return { init: { kind: "and", parts: [] } };
  if (samples.length === 1) return { init: and(...samples[0]) };

  // Group samples by length
  const byLength = new Map<number, Atom[][]>();
  for (const s of samples) {
    const len = s.length;
    if (!byLength.has(len)) byLength.set(len, []);
    byLength.get(len)!.push(s);
  }

  // If all same length, align position by position
  if (byLength.size === 1) {
    return inferAligned(samples);
  }

  // Different lengths: try to find common structure or use OR
  const lengths = Array.from(byLength.keys()).sort((a, b) => a - b);

  // Group by structure similarity
  const groups = groupBySimilarity(samples);

  if (groups.length === 1) {
    // All similar enough - try alignment with gaps
    return inferWithGaps(samples);
  }

  // Multiple distinct structures - use OR at top level
  const alts: Expr[] = [];
  for (const group of groups) {
    if (group.length === 1) {
      alts.push(and(...group[0]));
    } else {
      const subGrammar = inferGrammar(group);
      alts.push(subGrammar.init);
    }
  }

  return { init: or(...alts) };
}

function inferAligned(samples: Atom[][]): SCFG {
  const len = samples[0].length;
  const parts: Expr[] = [];

  for (let i = 0; i < len; i++) {
    const symbols = new Set<string>();
    for (const s of samples) {
      symbols.add(s[i]);
    }

    if (symbols.size === 1) {
      // All same - use the symbol directly
      parts.push(Array.from(symbols)[0]);
    } else {
      // Multiple options - use OR
      parts.push(or(...Array.from(symbols)));
    }
  }

  return { init: and(...parts) };
}

function inferWithGaps(samples: Atom[][]): SCFG {
  // Find longest common subsequence structure
  // For now, use a simpler heuristic: find common prefix and suffix

  const minLen = Math.min(...samples.map(s => s.length));

  // Common prefix
  let prefixLen = 0;
  outer: for (let i = 0; i < minLen; i++) {
    const first = samples[0][i];
    for (const s of samples) {
      if (s[i] !== first) break outer;
    }
    prefixLen++;
  }

  // Common suffix
  let suffixLen = 0;
  outer2: for (let i = 0; i < minLen - prefixLen; i++) {
    const first = samples[0][samples[0].length - 1 - i];
    for (const s of samples) {
      if (s[s.length - 1 - i] !== first) break outer2;
    }
    suffixLen++;
  }

  const prefix = samples[0].slice(0, prefixLen);
  const suffix = samples[0].slice(samples[0].length - suffixLen);

  // Extract middles
  const middles: Atom[][] = [];
  for (const s of samples) {
    middles.push(s.slice(prefixLen, s.length - suffixLen));
  }

  // Recursively infer middle grammar
  const middleGrammar = middles.every(m => m.length === 0)
    ? null
    : inferGrammar(middles);

  const parts: Expr[] = [...prefix];
  if (middleGrammar) {
    parts.push(middleGrammar.init);
  }
  parts.push(...suffix);

  return { init: and(...parts) };
}

function groupBySimilarity(samples: Atom[][]): Atom[][][] {
  // Simple grouping: samples with same length go together
  // More sophisticated: use edit distance clustering

  const groups: Atom[][][] = [];
  const used = new Set<number>();

  for (let i = 0; i < samples.length; i++) {
    if (used.has(i)) continue;

    const group: Atom[][] = [samples[i]];
    used.add(i);

    for (let j = i + 1; j < samples.length; j++) {
      if (used.has(j)) continue;

      // Check if similar (same length and >70% match)
      if (samples[i].length === samples[j].length) {
        let matches = 0;
        for (let k = 0; k < samples[i].length; k++) {
          if (samples[i][k] === samples[j][k]) matches++;
        }
        if (matches / samples[i].length >= 0.7) {
          group.push(samples[j]);
          used.add(j);
        }
      }
    }

    groups.push(group);
  }

  return groups;
}

/**
 * Infer grammar with balanced weights so all input samples are equally likely.
 */
export function inferPBJGrammar(samples: Atom[][]): SCFG {
  const groups = groupBySimilarity(samples);

  if (groups.length <= 1) {
    return inferGrammar(samples);
  }

  // Build OR of group grammars with weights proportional to group size
  const alts: Expr[] = [];
  const weights: number[] = [];
  const totalSamples = samples.length;

  for (const group of groups) {
    // Weight = number of samples in group / total samples
    // This ensures each original sample is equally likely
    weights.push(group.length / totalSamples);

    if (group.length === 1) {
      alts.push(and(...group[0]));
    } else {
      // For groups with multiple samples, infer aligned grammar
      const aligned = inferAlignedWithWeights(group);
      alts.push(aligned.init);
    }
  }

  return { init: { kind: "or", alts, weights } };
}

function inferAlignedWithWeights(samples: Atom[][]): SCFG {
  const len = samples[0].length;

  // Check if there are correlated positions (choices that always go together)
  const variablePositions: number[] = [];
  for (let i = 0; i < len; i++) {
    const symbols = new Set(samples.map(s => s[i]));
    if (symbols.size > 1) variablePositions.push(i);
  }

  // If multiple variable positions, check for correlation
  if (variablePositions.length >= 2) {
    // Check if all variable positions are perfectly correlated
    // (each sample has a unique combination)
    const combinations = samples.map(s => variablePositions.map(i => s[i]).join("|"));
    const uniqueCombos = new Set(combinations);

    if (uniqueCombos.size === samples.length) {
      // Perfect correlation - each sample is a distinct pattern
      // Use OR over the full samples, not independent choices
      const alts: Expr[] = samples.map(s => and(...s));
      const weights = samples.map(() => 1 / samples.length);
      return { init: { kind: "or", alts, weights } };
    }
  }

  // No correlation or single variable position - use independent choices
  const parts: Expr[] = [];
  for (let i = 0; i < len; i++) {
    const symbolCounts = new Map<string, number>();
    for (const s of samples) {
      const sym = s[i];
      symbolCounts.set(sym, (symbolCounts.get(sym) ?? 0) + 1);
    }

    if (symbolCounts.size === 1) {
      parts.push(Array.from(symbolCounts.keys())[0]);
    } else {
      const alts = Array.from(symbolCounts.keys());
      const weights = alts.map(sym => symbolCounts.get(sym)! / samples.length);
      parts.push({ kind: "or", alts, weights });
    }
  }

  return { init: and(...parts) };
}
