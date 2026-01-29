---
title: "Grammar Models are back, baby!"
author: Nishant Shukla
date: February 1, 2026
bibliography: references.bib
link-citations: true
---

Grammar models are back, baby!

::: timeline
- From the 60s-80s, we saw fundamental contributions to the study of context-free grammar:
  - In 1961, the CYK parsing algorithm was published [@cyk]
  - In 1968, the Earley parser was published [@earley]
  - In 1974, the GLR parser was formulated [@lang-glr], and then in 1984 it was implemented [@tomita-glr]
- (... skipping a bunch of other things ...)
- In 2023, llama.cpp popularized grammar-constrained decoding for local LLMs [@llama-grammar].
- In 2025, we begin to see state-machine grammars become mainstream [@mastra-state-machine]. Around this time, I built a context-free grammar system to constrain function calls in the multi-agent framework at my current employer.
- In 2025, OpenAI introduced native support for constraining LLM outputs with context-free grammar production rules, making grammars a first-call tool for controlling generation [@openai-cfg].
:::

Structure is fashionable again, but this is February 2026 and I hear crickets.

The purpose of this post is to outline a framework to talk about grammar generation, inference, and scoring all at once in a clean interface, with the hope that this explanation will simplify future research efforts on this topic.

It feels like we're one good abstraction away from grammars having their moment, and I think that abstraction is finally obvious.



## A Clean Interface

Think of a grammar as a strongly-typed object.

For example, this is `G`:

:::graph
root: setup tests teardown
tests: test tests | test 
:::

### Top-down generation

You can sample from the grammar (assuming uniform distribution over production choices):

```javascript
p = G.sample()  // returns a Parse
```

You may get a parse that looks like this:

:::parse
root: setup tests teardown
tests: test test test 
:::

Then, you can render data from the parse:

```javascript
x = G.render(p)  // returns an Observation
```

:::render
setup test test test teardown
:::


A sample is not usually deterministic. 

So, who knows, you may instead get a parse that looks like this:

:::parse
root: setup tests teardown
tests: test test test test test test test test test
:::

Producing parses and rendering observations from those parses is the easy part.


### Bottom-up inference

The harder problem is parsing raw observations.

To demonstrate this, let's change the grammar to be more interesting, one that introduces the concept of running tests in parallel.

:::graph
root: setup tests teardown
tests: test | seq | par
seq: tests then tests
par: tests and tests
:::

Try parsing this observation:

:::render
setup test then test and test teardown
:::


We can call `infer` to discover which parses can explain this data:

```javascript
P = G.infer(obs => x == obs)  // returns Dist<Parse> | null
```

There are two potential parses for the same sequence:

Candidate 1:

:::parse
root: setup seq teardown
seq: test then par
par: test and test
:::

Candidate 2:

:::parse
root: setup par teardown
par: seq and test
seq: test then test
:::


That's why `infer(...)` returns a probability distribution.

You can imagine the probability distribution looks somewhat like this:

:::distribution
1: 0
2: 0
3: 0.5
4: 0
5: 0
6: 0.5
7: 0
8: 0
9: 0
10: 0
:::

Abstracted away is the fact that `infer` is performing a complicated parsing algorithm. 
It's giving you access to the posterier:

$$
P(p | x) \propto P(x | p) P(p)
$$


Is one more likely than the other? We can compare two likihoods using `score`:

```javascript
s1 = G.score(p1, x1)
s2 = G.score(p2, x2)
```


## Monte Carlo Tree Search (MCTS)

`G.infer(...)` only tells you the next _possible moves_.

MCTS, on the other hand, finds you the approx. _best move_.

Don't get stuck on the name, though. 

$$
\underbrace{
  \text{Monte Carlo}
  \qquad
  \underbrace{
    \text{Tree}
    \qquad
    \underbrace{\text{Search}}_{\substack{\\[1.0ex]\text{algorithm}}}
  }_{\substack{\\[1.3ex]\text{uses a tree data structure}}}
}_{\substack{\\[1.6ex]\text{named after Monte Carlo sampling}}}
$$

In the algorithm, you construct a tree from scratch, where each path from the root represents the sequence of actions you may take.

Example:

:::mermaid
graph TD
  A[Start] --> B[Process] --> C[End]
:::



The algorithm is just 3 steps that repeat many times:

1. Pick a promising starting path
2. Roll out fully to see where it could end
3. Tally up the results

Let's take everything we've learned, using `infer`, `sample`, `render`, and `score` to implement MCTS.



```javascript
// pick a path in the tree
nodes = pick_path(root)  // UCB

// grow the tree by 1 node
n = nodes[-1]
D = G.infer(_x => _x.startsWith(n.prefix))
if (D==null) continue
p = D.sample()
t = nextToken(G.render(p), n.prefix)
n2 = n.childOrCreate(t)

// back prop
p2 = G.infer(_x => _x.startsWith(n2.prefix)).sample()
s = G.score(p2, x)
backprop(path+[n2], s)
best=max(best,(s,p2))
```



## Example

The beauty of a grammar model is that you can run forward to generate output, or run background to explain output.

Here's a naive sandwich-making model that appears straightforward at first sight.

```javascript
init: and(spread-pb-on-bread, spread-jelly-on-bread)
spread-pb-on-bread: and(bread, pb)
spread-jelly-on-bread: and(bread, jelly)
```

You get the sample `bread pb bread jelly`. 

Notice how the structure is lost. 

Here's a cool magic trick. Let's make actions like `spread` and `stack` into terminals. 

Samples may look like this `bread pb spread bread jelly spread stack`.

You may argue there is still no structure here; it's just a flat list of words.

The good news is that if we identify "spread" and "stack" as functions, then we can actually represent this sequence of words as a valid Forth program. 

Moreover, a static validator can prove the grammar only produces valid Forth, guaranteeing correctness by construction.


## Monte-Carlo Tree Search




## References
