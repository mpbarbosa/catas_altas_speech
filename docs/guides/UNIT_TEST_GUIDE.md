# Unit Test Guide

This guide shapes the unit tests for `catas_altas_speech`. **Vitest is now wired
in** (`npm test`, `tests/` mirroring `src/`, `node` environment) and covers the
pure collaborators; the verification gate also runs them in CI and in the
clean-room container via `bash scripts/test-docker.sh`. Use this guide when adding
or extending tests — especially for the still-uncovered orchestrator.

## Goal

Verify one unit of behavior at a time, run fast, fail predictably, and make
refactoring the engine safe.

## What Unit Testing Means Here

A unit is the smallest behaviorally meaningful piece. The high-value, easily
isolated seams in this codebase:

| Unit                  | Behavior to lock down                                                                                                   |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `VoiceSelector`       | pt-BR exact match → `pt-*` prefix → first available → `null`; `scoreVoice` prefers local + exact-lang voices            |
| `SpeechQueue`         | priority ordering (higher first, FIFO within a tier), `cleanExpired` removal, `maxSize` trimming, observer notification |
| `SpeechItem`          | `isExpired(ms)` boundary; immutability (frozen — mutation throws/no-ops)                                                |
| `SpeechConfiguration` | `rate` clamps to 0.1–10.0, `pitch` to 0.0–2.0; non-number rejected                                                      |
| `VoiceLoader`         | exponential-backoff retry; cache reuse; concurrent `loadVoices()` share one promise; empty array after max retries      |

`SpeechSynthesisManager` is harder (it touches `window.speechSynthesis`); test it
by injecting fakes at the seams, or treat it as integration scope.

## Why It Matters

1. The pure logic above (`VoiceSelector`, `SpeechQueue`, `SpeechItem`) is
   deterministic and trivially testable with direct input/output assertions.
2. Tests would lock the priority/expiry contract that consumers depend on.
3. They make the deferred TypeScript-6 migration (also in `ROADMAP.md`) safer.

## Quality Gates (when tests exist)

1. **Isolation** — no live `window`, timers, or speech synthesis; inject
   collaborators. `VoiceLoader` already accepts `speechSynthesis` in its config;
   `SpeechItem` accepts an explicit `timestamp` — use it instead of real `Date.now()`.
2. **Determinism** — control time. Pass a fixed `timestamp` to `SpeechItem` to test
   `isExpired`; do not sleep.
3. **Behavior over internals** — assert `dequeue()` order and `size()`, not the
   private `items` array layout.
4. **Error paths** — every `throw` in `speak()`/`enqueue()`/constructors deserves a
   rejection test (ties to the [Defensive Coding Guide](./DEFENSIVE_CODING_GUIDE.md)).
5. **Immutability** — assert a returned `getItems()`/`getAvailableVoices()` copy
   cannot mutate internal state.

## Suggested seams and doubles

- **Voices:** a plain array of `{ name, lang, localService }` objects stands in for
  `SpeechSynthesisVoice` — `VoiceSelector` needs nothing else.
- **`speechSynthesis`:** a fake `{ getVoices: () => [...] }` injected into
  `VoiceLoader` covers the retry/caching logic without a browser.
- **Timers:** prefer testing queue ordering through `enqueue`/`dequeue` directly
  rather than driving `TimerManager`.

## Test layout (when added)

Mirror `src/` so tests are discoverable, e.g. `src/speech/VoiceSelector.ts` →
`tests/speech/VoiceSelector.test.ts`. Wire a `test` script in `package.json`; the
existing `scripts/test-docker.sh` already runs `npm test` automatically once it
exists.

## Current repo reality

Vitest is wired in; `tests/` covers the five pure collaborators well
(`SpeechItem`, `SpeechConfiguration`, `VoiceSelector`, `SpeechQueue`,
`VoiceLoader` — 66–93% each) plus the orchestrator `SpeechSynthesisManager`
(~73%, tested by faking `window.speechSynthesis` and `SpeechSynthesisUtterance`
with `vi.stubGlobal` — no jsdom needed). **Overall coverage is ~66%.** The main
remaining gap is `TimerManager` (0%) and the deeper `SpeechSynthesisManager`
branches (the legacy retry timer and independent queue-timer paths).

## Related Guides

- [Defensive Coding Guide](./DEFENSIVE_CODING_GUIDE.md) — each invalid-input class
  maps to one rejection test.
- [Error Handling Guide](./ERROR_HANDLING_GUIDE.md) — cover the queue-recovery and
  retry-exhaustion paths, not just the happy path.
- [High Cohesion Guide](./HIGH_COHESION_GUIDE.md) / [Low Coupling Guide](./LOW_COUPLING_GUIDE.md)
  — the design properties that make these units isolatable.

## Summary Checklist

- [ ] Each test verifies one focused behavior of one unit.
- [ ] No live browser/timer/clock — inject `speechSynthesis`, pass explicit `timestamp`.
- [ ] Assertions target observable behavior (order, size, return values), not internals.
- [ ] Error paths and expiry boundaries are covered.
- [ ] A `test` script is wired before claiming test coverage anywhere.
