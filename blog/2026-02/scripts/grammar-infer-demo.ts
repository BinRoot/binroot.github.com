import { sample } from "./sample";
import { inferPBJGrammar } from "./grammar-infer";
import { SCFG, Atom } from "./types";

/**
 * Demo: Grammar inference from example samples.
 *
 * Key techniques:
 * 1. Group samples by structural similarity
 * 2. Detect correlated positions (choices that always go together)
 * 3. Assign weights for uniform distribution over original samples
 */

async function main() {
  console.log("=== Grammar Inference from Examples ===\n");

  const targets: Atom[][] = [
    ["bread", "crunchy", "spread", "grape", "spread", "bread", "stack"],
    ["bread", "smooth", "spread", "strawberry", "spread", "bread", "stack"],
    ["bread", "crunchy", "spread", "bread", "strawberry", "spread", "stack"],
  ];

  console.log("Input: 3 example sequences");
  for (let i = 0; i < targets.length; i++) {
    console.log(`  ${i + 1}. ${targets[i].join(" ")}`);
  }

  console.log("\nAnalysis:");
  console.log("  - Samples 1 & 2: same structure, correlated choices");
  console.log("    (crunchy→grape, smooth→strawberry)");
  console.log("  - Sample 3: different structure (two-slice method)");

  const grammar = inferPBJGrammar(targets);

  console.log("\nInferred Grammar:");
  console.log(JSON.stringify(grammar, null, 2));

  console.log("\nSampled outputs:");
  for (let i = 0; i < 6; i++) {
    console.log("  ", sample(grammar).join(" "));
  }

  // Validation
  const stats = validate(grammar, targets, 300);
  console.log("\nValidation (300 samples):");
  console.log(`  Exact matches: ${stats.total}/300 (${(stats.total / 3).toFixed(1)}%)`);
  console.log(`  Distribution: T1=${stats.counts[0]}, T2=${stats.counts[1]}, T3=${stats.counts[2]}`);
}

function validate(grammar: SCFG, targets: Atom[][], n: number) {
  const counts = targets.map(() => 0);
  for (let i = 0; i < n; i++) {
    const s = sample(grammar);
    for (let j = 0; j < targets.length; j++) {
      if (s.length === targets[j].length && s.every((v, k) => v === targets[j][k])) {
        counts[j]++;
        break;
      }
    }
  }
  return { counts, total: counts.reduce((a, b) => a + b, 0) };
}

main().catch(console.error);
