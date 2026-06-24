# Defensive Coding Guide

Defensive coding means validating inputs at the boundary and enforcing invariants
at construction, so inner code can trust what it receives. `catas_altas_speech`
already does this at its public methods and value objects.

## Goal

Reject invalid data where it enters (the public API surface) and make invalid
internal state impossible to construct, so failures surface at their origin rather
than deep inside queue processing.

## What Defensive Coding Means Here

The public boundary is the exported surface in `src/index.ts` —
`SpeechSynthesisManager` methods and the classes consumers can construct.

1. **Validate at the boundary.** `SpeechSynthesisManager`:
   - constructor throws `TypeError` if `enableLogging` is not a boolean, and
     `Error('Web Speech API not available...')` when `window.speechSynthesis` is absent;
   - `speak(text, priority)` throws `TypeError`/`Error` on a non-string, empty, or
     non-numeric input before anything is queued;
   - `setRate`/`setPitch` throw `TypeError` on non-numbers, then **clamp** to the
     `SPEECH_CONFIG` range (reject the wrong type, normalize the in-type value).
2. **Enforce invariants at construction.** `SpeechItem` validates `text`/`priority`/
   `timestamp` types and then calls `Object.freeze(this)` — an item cannot exist in
   an invalid or mutable state. `SpeechQueue` validates `maxSize`/`expirationMs`
   ranges (`RangeError`) and `Object.seal(this)`.
3. **Fail fast on programming errors.** Type/range violations throw immediately;
   they are not caught and recovered from.

## Why It Matters

1. An invalid utterance rejected in `speak()` never reaches `processQueue()`, where
   the failure would be confusing and far from its cause.
2. Frozen `SpeechItem`s mean no consumer of the queue must defensively re-check
   item validity.
3. Clamping (`rate` 0.1–10.0, `pitch` 0.0–2.0) keeps the Web Speech API from
   receiving out-of-range values.

## Required Rules

1. Validate all inputs at the public boundary (`SpeechSynthesisManager` methods,
   constructible classes) before they enter queue/voice logic.
2. Domain value objects enforce invariants in the constructor (`SpeechItem`
   freeze, `SpeechQueue` seal) — invalid construction must be impossible.
3. Distinguish a **user error** (bad argument → `TypeError`/`RangeError`, expected)
   from a **programming error** (impossible state → fail fast). Never wrap an
   invariant check in `try/catch` to recover.
4. Resolve absent values at the boundary: `VoiceSelector.selectVoice([])` returns
   `null` explicitly rather than letting `undefined` propagate.

## Current repo reality

Two honest gaps to keep in mind:

- **`strict: false`** in `tsconfig.json` means the compiler does **not** enforce
  null-safety — runtime guards (e.g. the `this.synth!` assertions, the
  `typeof window === 'undefined'` checks) carry that weight. Be deliberate about
  null handling; the type-checker will not catch it for you.
- **Validation is currently duplicated**: both `SpeechSynthesisManager.speak()` and
  `SpeechQueue.enqueue()` validate the text/priority. The guide's ideal is
  validate-once-at-the-boundary; here the queue is also publicly exported, so it
  re-validates as its own boundary. Acceptable, but do not add a _third_ check in
  `processQueue()` — inner processing should trust the enqueued item.

## Warning Signs

- A new `if (!text)` guard inside `processQueue()` — inner logic re-checking what
  the boundary already validated.
- A constructible type that can be created in an invalid state (skipped freeze/seal
  or skipped type check).
- Silent coercion (e.g. turning a bad `rate` into `0`) instead of clamping a valid
  number / rejecting a non-number.

## Review Heuristics

- **Boundary test** — is every public entry point validating its inputs?
- **Invariant test** — can any value object be constructed invalid? (`SpeechItem`,
  `SpeechQueue`: no.)
- **Assertion-vs-condition test** — is a bad argument a thrown error (contract) and
  an impossible state a fail-fast (bug)?

## Related Guides

- [Error Handling Guide](./ERROR_HANDLING_GUIDE.md) — how thrown validation errors
  are classified versus programming errors that must fail fast.
- [Low Coupling Guide](./LOW_COUPLING_GUIDE.md) — validated values at the boundary
  reduce coupling from passing raw inputs through layers.
- [Unit Test Guide](./UNIT_TEST_GUIDE.md) — every invalid-input class deserves a
  rejection test (a seam to cover when tests are added).

## Summary Checklist

- [ ] Public methods validate inputs before queue/voice logic runs.
- [ ] Value objects enforce invariants at construction (freeze/seal).
- [ ] User errors throw typed built-ins; programming errors fail fast.
- [ ] Absent values resolved at the boundary (explicit `null`, not `undefined`).
- [ ] No new defensive re-checks added to inner processing.
