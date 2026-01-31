// pbj-rank.ts
// Rank PB&J sandwiches by speed (lowest time = best)

import { pbjGrammar } from "./pbj";
import { sample } from "./sample";

// Time cost in seconds for each action
const timeCosts: Record<string, number> = {
  // Ingredients are just choices - no time cost
  bread: 2,        // grab a slice
  crunchy: 0,      // just a choice
  smooth: 0,       // just a choice
  grape: 0,        // just a choice
  strawberry: 0,   // just a choice

  // Actions
  spread: 6,       // base spreading time
  stack: 2,        // quick assembly
  "cut-diagonal": 5,
  "cut-horizontal": 4,
  "no-cut": 0,     // fastest - skip cutting
};

// Spreading crunchy PB takes longer (harder to spread evenly)
const spreadModifiers: Record<string, number> = {
  crunchy: 3,      // +3s to spread crunchy PB
  smooth: 0,       // smooth spreads easily
  grape: 1,        // jelly is quick
  strawberry: 2,   // chunks take slightly longer
};

function calculateTime(tokens: string[]): number {
  let total = 0;
  let lastIngredient: string | null = null;

  for (const token of tokens) {
    total += timeCosts[token] ?? 0;

    // Track ingredient for spread modifier
    if (token in spreadModifiers) {
      lastIngredient = token;
    }

    // Apply spread modifier based on what's being spread
    if (token === "spread" && lastIngredient) {
      total += spreadModifiers[lastIngredient] ?? 0;
      lastIngredient = null;
    }
  }

  return total;
}

// Run Forth interpreter to get final result (from pbj.ts)
type Stack = string[];
type Word = (stack: Stack) => void;

const words: Record<string, Word> = {
  spread: (stack) => {
    const topping = stack.pop()!;
    const base = stack.pop()!;
    stack.push(`(${base} + ${topping})`);
  },
  stack: (stack) => {
    const top = stack.pop()!;
    const bottom = stack.pop()!;
    stack.push(`[${bottom} | ${top}]`);
  },
  "cut-diagonal": (stack) => {
    const sandwich = stack.pop()!;
    stack.push(`${sandwich} \\ cut`);
  },
  "cut-horizontal": (stack) => {
    const sandwich = stack.pop()!;
    stack.push(`${sandwich} - cut`);
  },
  "no-cut": () => {},
};

function runForth(code: string[]): string {
  const stack: Stack = [];
  for (const token of code) {
    if (token in words) {
      words[token](stack);
    } else {
      stack.push(token);
    }
  }
  return stack[0] ?? "(empty)";
}

// Sample and rank
interface SandwichSample {
  tokens: string[];
  result: string;
  time: number;
}

function main() {
  const samples: SandwichSample[] = [];

  // Generate 100 samples
  for (let i = 0; i < 100; i++) {
    const tokens = sample(pbjGrammar);
    samples.push({
      tokens,
      result: runForth(tokens),
      time: calculateTime(tokens),
    });
  }

  // Sort by time (fastest first)
  samples.sort((a, b) => a.time - b.time);

  // Group by unique result to show distribution
  const uniqueResults = new Map<string, { count: number; time: number; tokens: string[] }>();
  for (const s of samples) {
    const key = s.tokens.join(" ");
    if (!uniqueResults.has(key)) {
      uniqueResults.set(key, { count: 1, time: s.time, tokens: s.tokens });
    } else {
      uniqueResults.get(key)!.count++;
    }
  }

  // Sort unique results by time
  const ranked = [...uniqueResults.values()].sort((a, b) => a.time - b.time);

  console.log("=== PB&J Speed Rankings ===\n");
  console.log("Time costs (seconds):");
  console.log(JSON.stringify(timeCosts, null, 2));
  console.log("\n=== Top 10 Fastest Sandwiches ===\n");

  for (let i = 0; i < Math.min(10, ranked.length); i++) {
    const r = ranked[i];
    console.log(`#${i + 1} (${r.time}s) - appeared ${r.count}x`);
    console.log(`   ${r.tokens.join(" ")}`);
    console.log(`   → ${runForth(r.tokens)}`);
    console.log();
  }

  console.log("=== Bottom 5 Slowest Sandwiches ===\n");

  for (let i = Math.max(0, ranked.length - 5); i < ranked.length; i++) {
    const r = ranked[i];
    console.log(`#${i + 1} (${r.time}s) - appeared ${r.count}x`);
    console.log(`   ${r.tokens.join(" ")}`);
    console.log(`   → ${runForth(r.tokens)}`);
    console.log();
  }

  // Stats
  const times = samples.map(s => s.time);
  const min = Math.min(...times);
  const max = Math.max(...times);
  const avg = times.reduce((a, b) => a + b, 0) / times.length;

  console.log("=== Stats ===");
  console.log(`Fastest: ${min}s`);
  console.log(`Slowest: ${max}s`);
  console.log(`Average: ${avg.toFixed(1)}s`);
  console.log(`Unique recipes: ${ranked.length}`);
}

main();
