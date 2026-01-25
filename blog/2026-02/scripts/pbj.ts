// pbj.ts
// PB&J sandwich grammar demonstrating AND and OR nodes

import { SCFG, and, or } from "./types";
import { sample } from "./sample";

// ===== PB&J Grammar =====

export const pbjGrammar: SCFG = {
  init: or("single-slice-method", "two-slice-method"),

  // Method 1: Both spreads on one slice, plain bread on top
  "single-slice-method": and("loaded-slice", "plain-bread", "stack", "finish"),
  "loaded-slice": or(
    and("bread", "pb-type", "spread", "jelly-type", "spread"), // PB first
    and("bread", "jelly-type", "spread", "pb-type", "spread") // jelly first
  ),
  "plain-bread": "bread",

  // Method 2: One spread per slice, then combine
  "two-slice-method": or(
    and("pb-slice", "jelly-slice", "stack", "finish"), // prepare PB slice first
    and("jelly-slice", "pb-slice", "stack", "finish") // prepare jelly slice first
  ),
  "pb-slice": and("bread", "pb-type", "spread"),
  "jelly-slice": and("bread", "jelly-type", "spread"),

  // Ingredient choices
  "pb-type": or("crunchy", "smooth"),
  "jelly-type": or("grape", "strawberry"),

  // Finishing
  "finish": or("cut-diagonal", "cut-horizontal", "no-cut"),
};

// ===== Forth Interpreter =====

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
  "no-cut": () => {
    // no-op: leave sandwich as-is
  },
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

// ===== Run Samples =====

function main() {
  console.log("=== PB&J Sandwich Grammar ===\n");
  console.log(JSON.stringify(pbjGrammar, null, 2));
  console.log("\n=== Samples ===\n");

  for (let i = 1; i <= 6; i++) {
    const tokens = sample(pbjGrammar);
    const result = runForth(tokens);
    console.log(`Sample ${i}:`);
    console.log(`  Forth: ${tokens.join(" ")}`);
    console.log(`  Result: ${result}`);
    console.log();
  }
}

main();
