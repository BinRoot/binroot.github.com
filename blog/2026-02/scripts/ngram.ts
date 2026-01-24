import { Atom } from "./types";

/**
 * returns all n-grams and their frequency count, up to maxN sized ngram
 */
export function ngram(samples: Atom[][], maxN: number): Record<string, number> {
  if (maxN <= 0 || samples.length === 0) return {};
  const counts: Record<string, number> = Object.create(null);
  for (const sample of samples) {
    const len = sample.length;
    for (let i = 0; i < len; i++) {
      let key = "";
      for (let n = 1; n <= maxN && i + n <= len; n++) {
        key = n === 1 ? sample[i] : `${key} ${sample[i + n - 1]}`;
        counts[key] = (counts[key] ?? 0) + 1;
      }
    }
  }
  return counts;
}
