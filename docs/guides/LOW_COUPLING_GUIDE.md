# Low Coupling Guide

Low coupling keeps `catas_altas_speech` a **zero-runtime-dependency** library: the
engine depends on a handful of injected collaborators and the browser Web Speech
API, nothing more.

## Goal

Modules in `src/` should depend on as few other units, globals, and implicit
conventions as practical. Dependencies are explicit, narrow, and flow toward
stable code.

## What Low Coupling Means

A loosely coupled unit collaborates through a narrow contract:

- `VoiceLoader` accepts an injectable `speechSynthesis` in its config (so it does
  not hardwire `window`), and exposes `loadVoices()` / `getVoices()`.
- `VoiceSelector` takes a voice array and returns one voice — it knows nothing
  about loading or speaking.
- `SpeechQueue` notifies subscribers through `DualObserverSubject` rather than
  calling them directly.

## Why It Matters

1. Units evolve independently — `VoiceLoader`'s retry strategy can change without
   touching `VoiceSelector`.
2. The blast radius of a change stays small.
3. Collaborators can be replaced/faked, which is what makes the (future) tests in
   the [Unit Test Guide](./UNIT_TEST_GUIDE.md) possible.
4. Zero runtime deps is a hard product constraint — `DualObserverSubject` was
   vendored locally (`src/core/`) specifically to avoid an external edge.

## Required Rules

1. Depend on the narrowest stable abstraction available.
2. Keep dependency direction inward: `src/core/` (observer) and `src/utils/`
   depend on nothing in `src/speech/`; `src/speech/` composes them; `src/index.ts`
   wires the public surface.
3. Avoid hidden coupling through globals. `VoiceLoader` injects `speechSynthesis`
   instead of reaching for `window` directly; follow that pattern for new effects.
4. Centralize shared config — speech limits live once in `SPEECH_CONFIG`
   (`SpeechSynthesisManager.ts`), not scattered as magic numbers.
5. Only the orchestrator and the barrel do wiring; leaf modules stay independent.

## Positive Signals (present in this repo)

- `src/core/ObserverSubject.ts` is a thin re-export alias of `DualObserverSubject`
  — kept so `src/speech/` imports through a stable path even though the
  implementation is vendored.
- `TimerManager` is the single seam for all timers; `SpeechSynthesisManager` and
  `SpeechQueue` never call `setInterval` directly.
- `package.json` has an empty `dependencies` block — coupling to the outside world
  is zero by design.

## Warning Signs

- A `src/speech/` file importing from a consumer or reaching across to unrelated
  utilities "for convenience".
- A new collaborator constructed deep inside business logic instead of injected.
- A magic number duplicated across files that must change together — fold it into
  `SPEECH_CONFIG`.

## Current repo reality

Coupling is low and the dependency direction is clean. One pragmatic exception:
`TimerManager` is a module-level **singleton** (`export default new TimerManager()`).
That is an intentional global for process-wide timer tracking; treat it as the one
sanctioned shared-state seam and do not add others.

## Review Heuristics

- **Dependency-trace test** — can you follow what a unit depends on from its import
  block alone?
- **Replacement test** — could you swap `speechSynthesis` for a fake without
  rewriting `VoiceLoader`? (Yes — that is the injection point.)
- **Construction test** — is wiring kept in the orchestrator/barrel, not in leaf logic?

## Related Guides

- [High Cohesion Guide](./HIGH_COHESION_GUIDE.md) — the complementary principle.
- [Defensive Coding Guide](./DEFENSIVE_CODING_GUIDE.md) — typed/validated values
  at the boundary reduce coupling caused by passing raw inputs around.
- [LLM Context Efficiency Guide](./LLM_CONTEXT_GUIDE.md) — sparse import graphs
  shrink the context radius of any change.

## Summary Checklist

- [ ] The unit depends on the narrowest stable abstraction.
- [ ] Dependencies are explicit, not hidden in globals (besides `TimerManager`).
- [ ] Leaf logic does not construct its own collaborators.
- [ ] Shared values live once in `SPEECH_CONFIG`.
- [ ] Runtime `dependencies` stays empty.
