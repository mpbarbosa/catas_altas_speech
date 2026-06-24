# High Cohesion Guide

High cohesion is the load-bearing design rule of `catas_altas_speech`: the engine
is a small orchestrator (`SpeechSynthesisManager`) composed of single-purpose
collaborators rather than one class that does everything.

## Goal

Each module, class, and function in `src/` should have one clear responsibility.
Related behavior stays together; unrelated behavior is split into a separately
named unit with an explicit boundary.

## What High Cohesion Means

A cohesive unit is describable in one sentence with no "and":

- `VoiceLoader` — load voices from the Web Speech API, retrying with backoff.
- `VoiceSelector` — pick the best pt-BR voice from a list.
- `SpeechConfiguration` — hold and clamp `rate`/`pitch`.
- `SpeechItem` — an immutable, expiring queue entry.
- `SpeechQueue` — order entries by priority and drop expired ones.
- `TimerManager` — track timers by id so they can be cleared without leaks.

If the best description needs repeated "and", the responsibility is too broad.

## Why It Matters

1. Localized change — adjusting voice scoring touches only `VoiceSelector`.
2. Easier review and (future) testing — see [Unit Test Guide](./UNIT_TEST_GUIDE.md).
3. Clearer LLM edits — one job per file means an agent loads less and breaks less.
4. The orchestrator stays thin: `SpeechSynthesisManager` composes collaborators
   instead of owning their internals.

## Required Rules

1. A file centers on one primary concern; its name matches that concern.
2. A function does one job and has one reason to change.
3. Voice loading, voice selection, parameter config, queueing, and timer
   management stay in their own units — only `SpeechSynthesisManager` composes them.
4. `src/utils/` must not become a dumping ground; each file (`logger`,
   `TimerManager`, `ObserverMixin`) names a single concern.
5. The barrel `src/index.ts` composes the public surface but owns no logic.

## Positive Signals (present in this repo)

- File names match responsibility (`VoiceLoader.ts` loads voices; nothing else).
- `VoiceSelector` is pure: `filterByLanguage`, `scoreVoice`, `selectVoice` — no
  speech synthesis, no loading.
- Each collaborator passes the one-sentence test above.

## Warning Signs (watch for during change)

- `SpeechSynthesisManager` absorbing selection/loading logic instead of delegating.
- A new helper landing in `src/utils/logger.ts` that has nothing to do with logging.
- A method that loads voices, selects one, and speaks in a single pass.

## Current repo reality

Cohesion is strong: the manager already delegates to `VoiceLoader`,
`VoiceSelector`, `SpeechConfiguration`, and `SpeechQueue`. The main pressure point
is `SpeechSynthesisManager` itself — it is large and mixes orchestration with some
legacy/back-compat surface (deprecated `startVoiceRetryTimer`, mirrored
`this.rate`/`this.pitch`). That is deliberate (verbatim extraction from `guia_js`);
keep new logic in the focused collaborators rather than growing the manager.

## Review Heuristics

- **One-sentence test** — purpose stated without "and"/"also".
- **Change-impact test** — does changing one behavior force edits in unrelated files?
- **Naming test** — if the only good name is vague, the unit does too much.

## Related Guides

- [Low Coupling Guide](./LOW_COUPLING_GUIDE.md) — the complement: focused units
  (cohesion) with thin dependencies (coupling) reinforce each other.
- [LLM Context Efficiency Guide](./LLM_CONTEXT_GUIDE.md) — single-concern files
  are the low-cost context units an agent can reason about in isolation.
- [Naming Guide](./NAMING_GUIDE.md) — naming difficulty is a cohesion smell.

## Summary Checklist

- [ ] The file has one primary concern, and its name says which.
- [ ] Helpers support the same concern as the file they live in.
- [ ] New behavior lands in a focused collaborator, not the orchestrator.
- [ ] The unit passes the one-sentence test.
