# Referential Transparency Guide

Keep calculations and decisions deterministic and side-effect-free; isolate the
unavoidable effects (the Web Speech API, timers, logging) at explicit boundaries.
`catas_altas_speech` already follows a pure-core / effectful-shell split — this
guide names it and flags where it leaks.

## Goal

Domain logic (voice selection, scoring, queue ordering, expiry) is deterministic
for the same inputs; effects (speaking, timers, `console`) live only in boundary
code.

## What It Means Here

The codebase has a clear pure core and an effectful shell:

| Pure / deterministic                                                                                        | Effectful / boundary                                          |
| ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `VoiceSelector` — `selectVoice`, `scoreVoice`, `filterByLanguage` (input voices → output voice, no effects) | `SpeechSynthesisManager.processQueue` — calls `synth.speak()` |
| `SpeechItem` — immutable (`Object.freeze`); `timestamp` is an explicit constructor input                    | `TimerManager` — owns every `setInterval`/`setTimeout`        |
| Copy-returning getters — `getItems()`, `getAvailableVoices()` return new arrays                             | `logger` — owns all `console` output                          |

Decision-making (which voice, what order, is it expired) is separated from
orchestration (load, speak, schedule).

## Why It Matters

1. Pure logic is testable with plain data and direct assertions — the basis of
   the [Unit Test Guide](./UNIT_TEST_GUIDE.md) seams.
2. Effects concentrated in `TimerManager`/`logger`/`synth` make the impure
   surface small and obvious.
3. Deterministic selection/scoring makes behavior easy to reason about and
   safe to refactor.

## Required Rules

1. Keep business rules (selection, scoring, ordering, expiry policy)
   deterministic; pass external data in as parameters.
2. Inject sources of non-determinism. `VoiceLoader` injects `speechSynthesis`;
   `SpeechItem` accepts an explicit `timestamp` — use them instead of reaching
   for ambient state.
3. Do not mutate caller-owned inputs. Return copies (as `getItems()` does)
   rather than handing out internal arrays.
4. Keep I/O, timers, and logging at boundary modules (`TimerManager`, `logger`,
   the `synth` calls) — never scattered through selection/queue logic.

## Current repo reality (the leak to know)

- **`SpeechItem.isExpired(expirationMs)` reads `Date.now()` internally.** This is
  a hidden time input — the one notable break from referential transparency. It
  means expiry checks are time-dependent and not purely a function of arguments.
  Mitigation for tests: construct the item with a controlled `timestamp` (a
  constructor parameter) so the only live clock is inside `isExpired`; if expiry
  logic grows, consider passing `now` in explicitly.
- **`SpeechQueue` mutates its own `items` in place** (`enqueue`/`dequeue`/
  `cleanExpired`). This is internal, caller-owned-by-the-queue state — not a
  violation of "don't mutate caller inputs" — but it is stateful by design, so
  test it through observable behavior (`dequeue()` order, `size()`), not snapshots.
- **`scoreVoice`/`selectVoice` are genuinely pure** — the cleanest seams in the
  codebase; lean on them.

## Review Heuristics

- **Substitution test** — could a `selectVoice(voices)` call be replaced by its
  result without changing behavior? (Yes — it's pure.)
- **Hidden-input test** — does behavior depend on anything beyond parameters?
  (`isExpired` → `Date.now()`: the known exception.)
- **Mutation test** — does the logic change caller-owned data? (No — getters copy.)

## Related Guides

- [Module Structure Guide](./NODE_MODULE_GUIDE.md) — the pure-core / imperative-
  shell layering this principle lives inside.
- [Unit Test Guide](./UNIT_TEST_GUIDE.md) — pure logic needs no mocks; control
  time via the `SpeechItem` `timestamp` parameter.
- [High Cohesion](./HIGH_COHESION_GUIDE.md) / [Low Coupling](./LOW_COUPLING_GUIDE.md)
  — separating calculation from effect reinforces both.

## Summary Checklist

- [ ] Selection/scoring/ordering logic is deterministic for the same inputs.
- [ ] Non-determinism is injected (`speechSynthesis`, `timestamp`), not ambient.
- [ ] Caller-owned inputs are never mutated; getters return copies.
- [ ] Effects stay in `TimerManager` / `logger` / the `synth` boundary.
- [ ] The one hidden-time input (`isExpired` → `Date.now()`) is understood and
      controlled in tests.
