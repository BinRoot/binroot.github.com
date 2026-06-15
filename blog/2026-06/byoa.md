---
title: Bring-Your-Own-Agent
author: Nishant Shukla
date: 2026-06-15
description: A no-backend trick where a static webpage borrows your local coding agent (Claude Code, Codex, or whatever you run) over a localhost WebSocket. Spotsocket is a Bring-Your-Own-Agent approach, compared here against MCP, CLIs, SKILL.md, and WebMCP.
keywords: Bring-Your-Own-Agent, BYOA, spotsocket, coding agent, Claude Code, Codex, MCP, SKILL.md, WebMCP, localhost WebSocket, AI agents, agentic web, no backend
canonical_url: https://shukla.io/blog/2026-06/byoa.html
---

# Intro

At work, I frequently contemplate rewrites to keep up with the moving landscape. 
I think my answers to these questions drift month-to-month:

:::slinky
- Should we train our own model?
- Should we use an open source model?
. Which foundation model(s) should we build on?
. Should we use LangChain? (hint: no)
. How do we evaluate the performance of prompts (and agents)?
. What memory is persisted and how?
. How do we enforce guardrails to keep the agent on track?
. How can the system automatically improve with feedback?
. Should we start finetuning a particular sub-system?
- Should we just build on top of Claude Code?
- **How do we let users hook up their own coding harness?**
:::

In this post, I'd like to discuss that last one in particular, the **Bring-Your-Own-Agent** (BYOA) approach. If you're thinking MCPs, CLIs, or `SKILL.md` files, wait till you see this kooky idea. I'd like to present a different approach that I've been recently fascinated by. For lack of a better name, let's call it a `spotsocket` (because I love coining terms, I'm sorry). 

Don't worry, I'm not trying to sell you anything.

# Spotsocket demo

Open Claude Code, Codex, or whatever coding agent is hot right now, and ask it to do this:

:::prompt
Read `https://shukla.io/blog/2026-06/skill.md` to set up a spotsocket and assign all backend tickets (inferred from their titles) to Alice and move them to Done
:::

Copy and paste it over, and watch the magic happen below:

::: {.kanban team="alice bob carol dana"}
- Todo
  - Set up the WebSocket gateway
  - Design the board UI {carol}
  - Write onboarding docs
  - Add dark mode toggle {dana}
  - Rate-limit the public API
  - Investigate flaky CI runs
- In Progress
  - Wire up card drag-and-drop {bob}
  - Persist board state to disk
  - Add keyboard shortcuts {carol}
- Done
  - Deploy backend v1 {alice}
  - Sketch the public API schema
  - Set up the CI pipeline {dana}
  - Pick a license
:::

---

So, notice what just happened?

Your coding agent was able to control the kanban board above without me writing a single line of backend code. After all, this blog post is just a bunch of HTML/CSS/JS files published to a GitHub page. The trick is to have the browser dial out to a server running on your `localhost`, you know, the same place your coding agent lives.

In the [skill.md](https://shukla.io/blog/2026-06/skill.md) file, you'll see it asks your coding agent to generate a WebSocket server that the frontend can interface with. That's pretty much it!


# Comparing BYOA approaches

The spotsocket method makes more sense when you compare it against the alternatives.
So, let's map it out.

| | **MCP** | **CLI** | **`SKILL.md`** | **Spotsocket** |
|---|---|---|---|---|
| **Description** | A protocol where you host a server exposing typed tools that agents can discover and call | A binary the agent shells out to, like any other Unix tool | Markdown instructions the agent reads and follows | A `SKILL.md` that has the agent generate a localhost WebSocket server your webpage connects to |
| **Canonical example** | The GitHub MCP server | The `gh` CLI | Anthropic's Agent Skills | The kanban board above |
| **Setup effort** | Build and host an MCP server, auth layer, rate limits, monitoring, backwards compatibility management | A secure, well-built API for the CLI to talk to, auth handshake, version management, OS compatibility, local secrets | Depends entirely on what the skill instructs, anywhere from "call our hosted API" to nothing at all | No extra backend code. Refactor frontend a bit to support WebSocket tool calls. |
| **Token / context cost** | Every tool definition sits in the context window, used or not | Nearly free until invoked; `--help` is discovered on demand | Progressive disclosure by design, loaded only when relevant | Same as `SKILL.md`, plus a one-time cost to generate the server |
| **Blast radius** | Whatever the server's tools expose. It's scoped, but you're trusting the host | Whatever the binary can do, which is everything you can do | Whatever the instructions convince your agent to do | Whatever the generated server exposes, plus the server itself is reachable by *any* local webpage, not just mine |
| **Requires** | A hosted server + agent config | Install on PATH | An agent that reads skills | Browser tab open, agent on the same machine, agent allowed to run a server |
| **Maturity** | Open standard, hundreds of servers, first-party support in major agents | As old as Unix | Emerging convention with first-party support | This blog post |
| **Primary benefit** | Auth: the server can manage end-user identity properly | Tokens: cheap, composable, and the agent already knows shell | Extensibility: the end-user can read and modify it | Adoption: nothing to install, nothing to host |
| **Typical failure point** | You now operate a service: hosting, versioning, and a context window tax on every tool | Trust and distribution: users installing your binary across an OS matrix, with secrets on disk | Only as good as the backend that powers it | Requires the browser open, and you're running code your agent wrote that you probably won't read |
| **Epic failure point** | Prompt injection attacks are a common attack vector. [Supabase's Cursor agent](https://simonwillison.net/2025/Jul/6/supabase-mcp-lethal-trifecta/) was tricked by a poisoned support ticket into reading a private table and leaking its API tokens into a public thread. | The [`xz-utils` backdoor (CVE-2024-3094)](https://nvd.nist.gov/vuln/detail/CVE-2024-3094) was a threat born from untrusted commit access to a binary on your PATH. | [EchoLeak (CVE-2025-32711)](https://nvd.nist.gov/vuln/detail/CVE-2025-32711) poisoned what the skill file read to hack Microsoft 365 Copilot. | [Zoom shipped a localhost server in 2019](https://medium.com/bugbountywriteup/zoom-zero-day-4-million-webcams-maybe-an-rce-just-get-them-to-visit-your-website-ac75c83f4ef5), and it went poorly, so the skill should tell your agent to check the `Origin` header, and you should check that it did. |

# "You're forgetting WebMCP"

Good point! [WebMCP](https://developer.chrome.com/docs/ai/webmcp) (which grew out of MCP-B) is the closest formal version of this idea, predating this little hack by a year. If anything, spotsocket is the "we have WebMCP at home" meme realized.

So why not just use WebMCP?

- **It's not widely available.** Your browser will need `navigator.modelContext` (Chrome 146, behind a flag as I write this) or a special extension installed. Spotsocket is easier to set up.
- **It's not standardized yet.** Anything browser-native is going to be a big deal, and big deals land slowly. Spotsocket works now.
- **It's more plumbing.** You'd need to install MCP-B's local relay, drop a script tag on the page, and register the relay as an MCP server. But... that relay is a localhost server the page connects to over a WebSocket with an origin check (hint, hint, spotsocket, except pre-built and installed instead of written by your agent on the spot).

Lastly, WebMCP is a Chrome-led effort (Google and Microsoft), shipping first in Chrome behind a flag, with Safari and Firefox nowhere in sight. I worry that road leads to fragmentation, where we get a slick agentic interface for one browser, and everyone else gets left behind.

Let's sidestep that fight. Spotsocket leans on no new browser APIs to interface with your coding agent. 


# The bet

I'm sure over the last few years we've each experienced a gradual retreat from skepticism of generated code. I bet at some point in the coming years generated code will be as trustworthy and reliable as typical dependencies we already install without reading.

My outlook is optimistic enough to accept the security nightmare today and entertain future possibilities, one of which will be ephemeral software, built within seconds and disassembled promptly after use. 
