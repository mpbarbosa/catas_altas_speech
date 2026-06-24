# Error Handling Guide

Error handling is treating failures as explicitly as successes. In
`catas_altas_speech` the central failure concern is **keeping the speech queue
alive** when the browser's Web Speech API misbehaves.

## Goal

Every failure path is deliberate: input errors throw at the boundary, runtime
speech errors are observed and recovered so the queue never stalls, and absent
voices degrade gracefully rather than crashing.

## What Consistent Error Handling Means Here

1. **Input errors throw at the boundary.** `speak()`, `setRate()`, `setPitch()`,
   and the `SpeechItem`/`SpeechQueue` constructors throw `TypeError`/`Error`/
   `RangeError` — see the [Defensive Coding Guide](./DEFENSIVE_CODING_GUIDE.md).
2. **Runtime speech errors recover.** In `processQueue()`, `utterance.onerror`
   logs via `safeWarn`, resets `isCurrentlySpeaking`, and schedules the next item
   so a single failed utterance does not freeze the queue. The `synth.speak()`
   call is wrapped in `try/catch` with the same recovery.
3. **Async voice-load failure is contained.** `loadVoicesAsync()` catches and logs
   (`safeWarn`) rather than rejecting into the constructor; `VoiceLoader` returns
   an empty array after exhausting retries instead of throwing past its boundary.
4. **Observer notifications are isolated.** `DualObserverSubject.notifyObservers`
   wraps each observer call in `try/catch`, so one bad subscriber cannot stop the
   others from being notified.

## Why It Matters

1. Mobile/Chrome speech synthesis fires `onerror` for transient reasons; without
   per-utterance recovery the whole queue would wedge on the first hiccup.
2. Voices load asynchronously and may never appear — failing loudly there would
   break construction for every consumer.
3. A throwing observer must not take down queue notifications.

## Required Rules

1. Public methods declare and throw their input-error cases (documented in JSDoc).
2. Every `catch` makes an explicit decision — **recover** (continue the queue),
   **observe** (`safeWarn`/`safeLog`), or rethrow. No silent swallow.
3. Queue processing must continue after a recoverable speech error; never leave
   `isCurrentlySpeaking` stuck `true`.
4. Programming errors (type/invariant violations) fail fast and are not caught to
   recover.

## Current repo reality

- **Errors are built-in types, not domain-named.** The code throws `TypeError`,
  `Error`, and `RangeError` with string messages rather than named domain errors
  (e.g. a hypothetical `WebSpeechUnavailableError`). For a tiny library with a
  validation-only error surface this is acceptable; if the error surface grows or
  consumers need to branch on failure type, introduce named error classes then.
- **Recovery uses `TimerManager.setTimeout(..., 10ms)`** to re-enter
  `processQueue()` — deliberate, to avoid deep recursion across utterances.
- **Logging is gated** by `enableLogging` (`safeWarn`/`safeLog`), so "observe"
  decisions are silent unless logging is on. That is a conscious default for a
  browser library; it is not a silent swallow because the decision is explicit.

## Warning Signs

- A `catch (e) {}` or `catch (e) { throw e }` that neither recovers nor adds context.
- A speech-error path that forgets to reset `isCurrentlySpeaking` or schedule the
  next item — a wedged queue.
- Letting a `VoiceLoader` rejection escape into the constructor.

## Review Heuristics

- **Swallow test** — does every `catch` recover, observe, or rethrow?
- **Queue-liveness test** — after any failure in `processQueue()`, does the next
  item still get a chance to run?
- **Taxonomy test** — is this an expected input error (throw at boundary) or a
  transient runtime error (recover)?

## Related Guides

- [Defensive Coding Guide](./DEFENSIVE_CODING_GUIDE.md) — boundary validation
  determines which input errors are raised and where.
- [Unit Test Guide](./UNIT_TEST_GUIDE.md) — the recovery paths (onerror,
  try/catch, exhausted retries) are prime seams to cover when tests exist.
- [Low Coupling Guide](./LOW_COUPLING_GUIDE.md) — per-observer error isolation
  keeps subscribers decoupled.

## Summary Checklist

- [ ] Input errors throw at the public boundary with a clear message.
- [ ] Every `catch` recovers, observes, or rethrows — no silent swallow.
- [ ] A recoverable speech error never wedges the queue (`isCurrentlySpeaking`
      reset, next item scheduled).
- [ ] Async voice-load failure stays contained in `VoiceLoader`.
- [ ] Programming errors fail fast; they are not caught to recover.
