# Google Home Conversation SCFG Example

This document describes a Stochastic Context-Free Grammar (SCFG) that models Google Home conversation flows, producing valid Forth code sequences.

## The Problem

Google Home has complex conversational rules:

1. **User-initiated**: "ok google" must precede any user query
2. **Multi-turn**: After a response, a pause can lead to follow-up queries
3. **AI-initiated**: Device shows indicator light, user must acknowledge (voice or tap) before AI can speak first
4. **Session termination**: All paths must eventually end

Coding these rules imperatively is error-prone. Instead, we define an SCFG where valid samples represent valid conversation flows.

## Stack Semantics (Forth)

The terminal atoms are Forth words. When executed left-to-right, they operate on a stack:

```
ok-google utterance query respond end
```

| Step | Word | Stack After |
|------|------|-------------|
| 1 | `ok-google` | `[session]` |
| 2 | `utterance` | `[session, utt]` |
| 3 | `query` | `[pending]` |
| 4 | `respond` | `[completed]` |
| 5 | `end` | `[]` |

## The Grammar

```typescript
import { SCFG, and, or, maybe } from "./types";

const googleHomeGrammar: SCFG = {
  init: or("user-init", "ai-init", [0.85, 0.15]),

  // User-initiated: wake word, conversation, end
  "user-init": and("ok-google", "convo-loop", "end"),

  // Conversation loop: single turn or multi-turn with pause
  "convo-loop": or(
    "turn",
    and("turn", "pause", "convo-loop"),
    [0.4, 0.6]
  ),

  // A turn: user utterance → query processor → response
  "turn": and("utterance", "query", "respond"),

  // AI-initiated: light, acknowledgment, AI speaks, optional follow-up
  "ai-init": and("light-on", "ack", "ai-turn", "optional-follow", "end"),

  // User acknowledges the indicator
  "ack": or("ok-google", "tap", [0.7, 0.3]),

  // AI speaks first
  "ai-turn": and("message", "notify"),

  // User may follow up after AI speaks
  "optional-follow": maybe("convo-loop", 0.7),
};
```

## Sample Sequences

### User-Initiated

**Single turn (40%):**
```
ok-google utterance query respond end
```

**Two turns (60% × 40%):**
```
ok-google utterance query respond pause utterance query respond end
```

**Three turns (60% × 60% × 40%):**
```
ok-google utterance query respond pause utterance query respond pause utterance query respond end
```

### AI-Initiated

**AI speaks, user taps, no follow-up (15% × 30% × 30%):**
```
light-on tap message notify end
```

**AI speaks, voice ack, user follows up (15% × 70% × 70%):**
```
light-on ok-google message notify utterance query respond end
```

**AI speaks, tap, multi-turn follow-up:**
```
light-on tap message notify utterance query respond pause utterance query respond end
```

## Constraints Enforced by Grammar Structure

| Constraint | How Grammar Enforces It |
|------------|------------------------|
| Wake word required for user-init | `user-init` starts with `ok-google` |
| AI cannot speak without indicator | `ai-init` requires `light-on` before `ai-turn` |
| User must ack indicator | `ack` appears between `light-on` and `ai-turn` |
| Multi-turn requires pause | `convo-loop` recursion includes `pause` |
| All sessions terminate | All paths include `end` as final atom |

## Invalid Sequences (Not Parseable)

These sequences cannot be derived from the grammar:

```
utterance query respond end              # missing ok-google
ai-response utterance query end          # AI can't speak first without light-on
light-on message notify end              # missing ack after light-on
ok-google respond end                    # missing utterance and query
```

## Using Grammar Search

Given positive examples (valid conversations) and negative examples (invalid ones), a grammar search algorithm can discover this structure by:

1. Starting from a minimal grammar
2. Applying edit operations (`wrap-and`, `wrap-or`, `extract-rule`, etc.)
3. Evaluating fitness against the example sets
4. Converging on a grammar that accepts all positive and rejects all negative examples
