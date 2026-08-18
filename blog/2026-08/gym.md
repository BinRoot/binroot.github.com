---
title: Who benchmarks the benchmark?
pagetitle: "Who benchmarks the benchmark? Auditing an agentic gym"
author: Nishant Shukla
date: 2026-08-18
lang: en
---

```{=html}
<style>
/* The list number is painted by the li, outside the span. Pulling the span
   left by a marker's width and paying it back as padding extends the band
   over the number without moving any text. Default box-decoration-break
   keeps the extra padding on the first fragment only when the line wraps. */
.the-model{
  padding:.16em .45em .16em 1.75em;
  margin-left:-1.75em;
  background:rgba(207,63,34,.13);
  border-radius:3px;
}
/* Break out of the prose column up to the chart's own 1176px, then shrink
   with the window. 50% is half the containing paragraph, so the negative
   margin re-centres the wider box on the same axis as the text. */
a.wide{
  --w:min(1176px, calc(100vw - 48px));
  display:block; width:var(--w);
  margin:1.5em 0 1.5em calc(50% - var(--w)/2);
}
a.wide img{display:block; width:100%; height:auto}
</style>
```

Agent failures are often [environment failures disguised as model failures](https://rywalker.com/context-engineering-hard-problem).

To detangle the failure modes, we build benchmarks (also called gyms) that control the environment so we can better study and improve the model in isolation.

In this post, I seek a method to score benchmarks themselves.

# Agents train at the Gym

Gyms are typically made up of these 7 components:

1. Task specification: the user prompt and initial context
2. Agent policy: the system prompt, finetuning, or other behavior nudging
3. [Planning & reasoning: the model itself]{.the-model}
4. Tool contract: the list of tools available, their descriptions, and their params
5. Tool implementation: how executing each tool affects the state
6. Environment state: the simulation of the real world
7. Verifier: assertions to judge the outcome of the gym scenario (pass/fail)

That's a lot of points of failure! However, only #3 measures the model itself.

When you investigate a failing gym scenario, these are common symptoms you may witness:

- "Won't follow instructions"
- "Flaky: passes sometimes"
- "Hits a hard ceiling"
- "Just not smart enough"

The problem is, it's not always easy to attribute causes to the symptom.
Click around to see what I'm talking about:

```{=html}
<!--CONVERGENCE-MAP-->
```

# Gyms are hard to do right

The [Agentic Benchmark Checklist](https://arxiv.org/html/2507.02825v3) assessed 10 widely used agentic benchmarks and found 7 violating task validity and 7 violating outcome validity. A separate audit [broke 8 benchmarks](https://moogician.github.io/blog/2026/trustworthy-benchmarks-cont/) without solving a single task, most of them to a near-perfect score. [SciCode-Verified](https://arxiv.org/html/2608.04975v1) found 262 defects across 63 of its 64 problems, 192 of them rejecting correct solutions. Famously, OpenAI stopped reporting SWE-bench Verified after finding that [59.4% of the problems its models failed were themselves broken](https://openai.com/index/why-we-no-longer-evaluate-swe-bench-verified/), with 35.5% carrying tests so narrow they reject functionally correct submissions.

Let's zoom in on one. The [EnterpriseOps Gym](https://enterpriseops-gym.github.io) measures an agent's ability to follow complex instructions to operate a set of real-world MCP tools. It's 1150 expert-curated tasks across 8 domains, 7 to 30 steps each, running against live containerized MCP servers with real state. The results are in the chart below. Fable 5 scores 52% on the "Teams" domain.

<a data-zoom class="wide" href="https://artificialanalysis.ai/evaluations/enterprise-ops-gym-aa#enterpriseops-gym-aa-success-rate-by-domain"><img src="img/enterpriseops-gym-aa.webp" alt="Heatmap of strict task success rate by domain for 14 models on EnterpriseOps-Gym-AA, with Claude Fable 5 scoring highest in nearly every domain" width="1176" height="863"></a>

52% reads like the goal to beat, but you may be surprised to learn that I took the `teams`/`oracle` split (61 tasks) from 26.2% to 100% with `gpt-5.6-luna` by fixing various issues in the gym itself.

Here's the breakdown:

```{=html}
<!--PARETO-->
```

## 1. Contradictions in the environment: +31.1 points, ~19 tasks

Contradictions are the largest single source of failure. Well, there are two types:

**(1) Misleading observations.** For example, `create_virtual_event_townhall` commits the row and *then* returns `None`, which results in an error, even though the write succeeded:

```
Failed to create townhall: schemas.virtual_event_townhall.VirtualEventTownhallResponse()
argument after ** must be a mapping, not NoneType
```

The confusing error message causes the agent to retry, and strict verifiers fail this scenario. This one was [reported in March](https://github.com/ServiceNow/EnterpriseOps-Gym/issues/4) with the affected task ids and acknowledged by the maintainers, and it is still open.

**(2) Misleading descriptions.** For example, `add_channel_member` documents that the operation is *"allowed only for channels with a membershipType value of private or shared"*. That's true of real Teams and false of this server, which accepts standard channels and writes the row. An agent that believed the documentation correctly skipped the call and was graded wrong.

This second case is the more damaging one, because it rewards **agents that don't follow instructions**. The benchmark's own system prompt orders the agent to "never infer" and to "abort with a reason", and then the environment penalizes exactly that compliance.

One more example, just for good measure: the tab tools ship an `examples` value pointing at app id `06805b9e-77e3-4b93-ac81-525eb87513b8`, and the server rejects it:

```
Teams app '06805b9e-77e3-4b93-ac81-525eb87513b8' not found in organization app catalog.
```

Five tasks need a tab app id and have no app-listing tool in their oracle set, so the documentation is the only available source, and it is wrong.

## 2. Flaky verifiers: +19.7 points, ~12 tasks

Sometimes verifiers are satisfiable, but only by luck (aka *flaky* rather than broken). These come in a few forms:

**(1) A value that appears nowhere.** Four verifiers require `callback_uri = 'https://meetings.techcorp.com/api/calls'`. That string is in no prompt and in no seed database. An agent that refuses to invent values cannot pass; one that fabricates a plausible URL cannot pass either, unless it guesses this exact one.

**(2) A sentence with two readings.** One task promotes Bob to owner, then says *"add the other owners of the team (excluding me) as co-organizers"*, leaving open whether the just-promoted Bob counts. Across four runs the tool sequences were **identical**, producing different results:

| Run | co-organizers sent | Result |
|---|---|---|
| 1 | `alice, bob` | pass |
| 2 | `alice` | fail |
| 3 | `alice, bob` | pass |
| 4 | `alice` | fail |

By the way, this same class of problems occurs when the agent generates prose. For example, one verifier requires the literal `%leadership channel%`; the agent posted the task's text verbatim but bolded a word, `The <b>Leadership</b> channel`, using the HTML content type, and failed. Another only passed when the agent wrote *"the weekly TechCorp Weekly Release Readiness townhall"*; every run that phrased it naturally, matching the instruction word for word, failed.

## 3. Overspecified policy: +9.8 points

The system prompt ships **inside the dataset row**, so it is task data, and it instructs:

> "When identifiers such as names or IDs are missing, perform **exactly one lookup per entity type** ... **Never infer** user/team/channel data ... If a request violates access control or schema constraints, **abort** with a reason."

The database contains `TechCorp Solutions Team`. The model queried `displayName eq 'TechCorp Solutions'`, got `[]`, and, permitted one lookup and forbidden to infer, aborted. **18 of 61 tasks ended with 3 or fewer tool calls.** The tool's own `_filter` documentation advertises `startswith()` and `contains()`, either of which returns the team. So does a single unfiltered call.

Correcting that one clause and changing nothing else recovered +9.8 points and eliminated 13 of the 18 early aborts. The clause is present in **all 5 prompt variants across all 61 tasks**, so it plausibly suppresses every model on the published leaderboard.

## 4. Impossible verifiers: +8.2 points, 5 tasks here

There are some assertions that are unsatisfiable by any behavior, causing a hard cap on every model's score. Fortunately, these can sometimes be found by static analysis without running an agent at all.

**(1) Impossible SQL.** For example, one welcome-message verifier requires `LOWER(m.body_json) LIKE '%Alice Johnson%'`, comparing a lowercased column against a capitalized literal, so it matches nothing, ever.

**(2) A type bug in the comparison engine.** `expected_value` is stored as the string `"1"` and compared with `==` against SQL's integer `1`. `1 == "1"` is `False`, so those verifiers fail regardless of what the agent does. This affects **144 verifiers across the public split, including 20 tasks in which *every* verifier is string-typed**, unwinnable for every model (including every entry currently on the leaderboard).

While in there I found a third: verifier results are [silently dropped when two verifiers share a name](https://github.com/ServiceNow/EnterpriseOps-Gym/issues/23), so only the last one is ever checked. [PR #24](https://github.com/ServiceNow/EnterpriseOps-Gym/pull/24) fixes it. The repo is open and they do merge these: an earlier report of 14 broken CSM tasks landed as [revised task data](https://github.com/ServiceNow/EnterpriseOps-Gym/pull/16).

## 5. Mismatched tool sets: +3.3 points, 2 tasks

The "oracle" mode in the benchmark is meant to hand the agent exactly the tools its task needs.

- One task names `list_team_apps`; the server exposes `list_teams_apps`, one letter apart.
- One task ends *"Finally, please update the 'Project Phoenix' team description to 'Official project team for the Phoenix initiative'"*, and its verifier checks exactly that string, but `update_team` is absent from its tool list. The instruction the task closes on cannot be carried out as written.

## 6. Undefined clock: +1.6 points, 1 task

Some tasks assume relative dates ("next Friday", "next quarter"), yet the scenarios don't define what *now* is. The real wall clock doesn't work as a substitute: the scenarios are written around 2025-11 to 2026-01, so a later "today" makes every task read as historical and a careful agent correctly refuses to schedule.

The corpus is also **internally inconsistent about time**, so no single simulated date is correct for all of it. Some verifiers bake this in directly: one requires call records within `datetime('now', '-60 days')` when the newest fixture row is 2025-12-29. It passed when authored and fails permanently afterwards, and the cap widens as the dataset ages.

# We need a benchmark for benchmarks

[BetterBench](https://arxiv.org/pdf/2411.12990) does score benchmarks, on 46 criteria, but they are about documentation and process. A gym can score full marks and still ship twenty faulty tasks. So here is a different score. Instead of running a model, you replay a task's known-correct solution and ask whether the gym accepts it, which makes the answer a property of the gym rather than of whoever ran it:

- **S, solvable**: what share of tasks can a lucky sequence of actions pass?
- **C, conformant**: of those, what share can a rule-following sequence pass?
- **R, reliable**: of those, what share pass every single time?

$$\mathrm{SCR} = S \times C \times R$$

**C** is the one that catches an environment lying about itself, which in my split was 42% of the gap. We can actually make it checkable by giving every task a certificate: a replayable trace, closed over the task's declared tools, conformant with the docs and the policy. [WebForge](https://arxiv.org/pdf/2604.10988) and [SkillsBench](https://arxiv.org/html/2602.12670v1) already run solvability certificates in CI.

τ²-bench makes this argument better than I can. It ships an expected action trace for every task, and the audit's fixes include removing incorrect ones. 

Maybe we should start publishing SCR scores?

I can try to derive them:

| Gym | S | C | R | SCR |
|---|---|---|---|---|
| EnterpriseOps `teams`/`oracle` | 0.74 | 0.56 | 0.64 | **0.26** |
| SciCode | 0.82 | 0.65 | 0.86 | **0.46** |
| τ²-bench retail and airline | ? | ? | ? | **≤ 0.68** |
| SWE-bench Verified | 1.00 | 0.84 | 1.00 | **≤ 0.84** |

SciCode and SWE-bench hand you the split for free, since both audits already sort their defects by mechanism, though SWE-bench's two 1.00s mean unmeasured rather than clean. τ² publishes only a total (53 documented fixes across 164 tasks), which is plenty for the composite (the factors are conditional, so everything cancels except blocked-over-total) but not enough to fill the columns.

Column **C** is a new measurement I think, and it deserves a deeper dive than this post can give it.

Regardless, it's time we start benchmarking the benchmarks.

```{=html}
<!--LIGHTBOX-->
```

