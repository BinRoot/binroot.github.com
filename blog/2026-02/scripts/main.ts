import { ngram } from "./ngram";
import { sample } from "./sample";
import { search } from "./search";
import { successors1 } from "./successors";
import { SCFG, and, or, maybe, Atom } from "./types";

const model: SCFG = {
  init: and("user-okg", or("nvm", "qa", [0.5, 0.5])),

  nvm: and(maybe("pause", 0.5), "user-nvm", maybe("pause", 0.5)),

  qa: and(
    maybe("pause", 0.5),
    "user-question",
    maybe("pause", 0.5),
    "ai-answer",
    maybe("qa", 0.5)
  ),
};

async function main() {
  const successors = successors1(model, {
    symbolPool: [
      "user-okg",
      "user-nvm",
      "user-question",
      "ai-answer",
      "pause",
      "qa",
      "nvm",
      "qa",
    ],
    maybeGrid: [0.5],
    weightGrid: [0.5],
    newRuleNames: ["new-rule"],
    pruneUnreachable: true,
    maxSuccessors: 1000,
  });
  console.log(successors.length);
  console.log(JSON.stringify(successors[42], null, 2));

  const samples: Atom[][] = [];
  const numSamples = 100;
  for (let i = 0; i < numSamples; i++) {
    const s = sample(model);
    samples.push(s);
  }
  console.log(samples);
  console.log(ngram(samples, 3));

  const initModel: SCFG = {
    init: "user-okg",
  };
  const targetHistogram = ngram(samples, 3);
  const finalModel = search(initModel, targetHistogram);

  for (let i = 0; i < 10; i++) {
    const s = sample(finalModel);
    console.log("sample: ", s);
  }

  console.log(JSON.stringify(finalModel, null, 2));
}

main().catch(console.error);
