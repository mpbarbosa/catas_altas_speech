# Web Speech API Guide

**Audience: Claude Code (and any agent) working on this repo.** This is the
authoritative reference for how the browser
[Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
behaves and **why the engine is shaped around its quirks**. Much of this code
looks like it could be simplified — it cannot, because each piece works around a
real browser behavior. This guide is the one place that knowledge lives; CLAUDE.md,
README, and code comments point here rather than restating it.

> **Project-specific guide** — authored for this repo, _not_ imported from
> `doc_template_lib`. It documents the domain (the Web Speech API), not a generic
> engineering principle.

## The API surface this library uses

| API                                                 | Where                                        | Notes                                                         |
| --------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------- |
| `window.speechSynthesis`                            | `SpeechSynthesisManager` ctor, `VoiceLoader` | The engine. Absent → constructor throws (browser-only).       |
| `.getVoices()`                                      | `VoiceLoader`, `loadVoices()`                | **Returns `[]` until warmed up** (see Quirk 1).               |
| `onvoiceschanged`                                   | `SpeechSynthesisManager.loadVoices()`        | Fires when voices become available later.                     |
| `SpeechSynthesisUtterance`                          | `processQueue()`                             | Per-item; carries `voice`/`rate`/`pitch` + `onend`/`onerror`. |
| `.speak()` / `.cancel()` / `.pause()` / `.resume()` | manager methods                              | Subject to gesture-unlock and pause/resume quirks (3, 4).     |

## Quirks and how the engine handles each — do NOT "simplify" these away

### 1. Voices load asynchronously (`getVoices()` returns `[]` at first)

Chrome, Edge, and Android populate the voice list _after_ the engine warms up; the
first `getVoices()` call returns an empty array. **Handled in two layers:**

- `VoiceLoader._loadVoicesWithRetry` — exponential backoff (100 ms → cap 5000 ms,
  up to `maxRetries` = 10), returning `[]` only after exhausting retries.
- `SpeechSynthesisManager.loadVoices()` — tries synchronously, kicks off the async
  loader, **and** registers `window.speechSynthesis.onvoiceschanged = selectVoiceSync`
  so a late-arriving voice list still triggers reselection.

> If you see "redundant" voice-loading paths (sync + async + event listener), that
> redundancy _is_ the fix. Removing any one of them breaks a real browser.

### 2. Voice availability varies by platform; pt-BR is not guaranteed

`VoiceSelector` degrades deliberately: exact `pt-BR` → any `pt-*` → first available
→ `null`. It scores `localService` (offline, faster) and exact-language voices
higher. Never assume a pt-BR voice exists — `null` is a valid result the caller
must tolerate.

### 3. Mobile requires a user gesture to unlock audio

Browsers only emit audio from `speak()` if the **first** call happens inside a
user-gesture handler (tap/click). Key trap for an agent: **`speak()` does not throw
when audio is locked — it silently produces nothing.** The library cannot fix this;
it is the consumer's responsibility (documented in README). On iOS the hardware
silent switch must be off and media volume up. Do not add retry/error logic for
"no audio" — there is no error to catch.

### 4. `pause()` / `resume()` / `cancel()` are flaky across browsers

Chrome has long-standing pause/resume bugs. The manager guards every call:
`pause()` only acts when `synth.speaking && !synth.paused`; `resume()` only when
`synth.paused`. `stop()` uses `synth.cancel()` then clears the queue and resets
`isCurrentlySpeaking`. Keep the guards — calling these unconditionally misbehaves.

### 5. `onerror` fires for transient reasons; the queue must survive it

In `processQueue()`, `utterance.onerror` logs, resets `isCurrentlySpeaking`, and
schedules the next item; `synth.speak()` is also wrapped in `try/catch` with the
same recovery. A single failed utterance must never wedge the queue. See
[Error Handling Guide](./ERROR_HANDLING_GUIDE.md).

### 6. One utterance at a time + stale-cue expiry

`isCurrentlySpeaking` prevents overlap. `onend` chains the next item via
`TimerManager.setTimeout(..., 10ms)` — the small delay avoids deep recursion across
utterances and works around browsers that fire events synchronously. The priority
queue expires entries (default 30 s) so a cue that has been waiting too long is
dropped rather than spoken late — relevant to the original travel-guide use
(`SPEECH_PRIORITY`).

### 7. Browser-only

The constructor throws `Error('Web Speech API not available...')` when
`window.speechSynthesis` is missing. There is no Node fallback by design; do not
add one.

## Testing implications

`SpeechSynthesisUtterance` and `window.speechSynthesis` are browser globals, so the
orchestrator (`SpeechSynthesisManager`) is not unit-tested yet — it needs a faked
`speechSynthesis` + `SpeechSynthesisUtterance` or a jsdom environment. The pure
collaborators are tested by **injecting** a fake `speechSynthesis` into
`VoiceLoader` and plain voice objects into `VoiceSelector` — no DOM required. See
[Unit Test Guide](./UNIT_TEST_GUIDE.md) and
[Referential Transparency Guide](./REFERENTIAL_TRANSPARENCY.md).

## Related guides

- [Error Handling](./ERROR_HANDLING_GUIDE.md) — the `onerror`/recovery contract.
- [Referential Transparency](./REFERENTIAL_TRANSPARENCY.md) — injecting
  `speechSynthesis` keeps the loader/selector testable.
- [LLM Context Efficiency](./LLM_CONTEXT_GUIDE.md) — like the committed-`dist`
  trap, the quirks above are "looks wrong, is correct" code: read this before
  editing the voice-loading or queue paths.
- [Defensive Coding](./DEFENSIVE_CODING_GUIDE.md) — boundary validation around
  these API calls.

## Quick map: quirk → code

| Quirk                                | File / symbol                                                        |
| ------------------------------------ | -------------------------------------------------------------------- |
| Async voice loading + retry          | `src/speech/VoiceLoader.ts`                                          |
| `onvoiceschanged` reselection        | `src/speech/SpeechSynthesisManager.ts` `loadVoices()`                |
| pt-BR selection / fallback           | `src/speech/VoiceSelector.ts`                                        |
| Per-utterance speak + error recovery | `src/speech/SpeechSynthesisManager.ts` `processQueue()`              |
| pause/resume/cancel guards           | `src/speech/SpeechSynthesisManager.ts`                               |
| Single-utterance + 10 ms re-entry    | `src/speech/SpeechSynthesisManager.ts` + `src/utils/TimerManager.ts` |
| Priority + expiry                    | `src/speech/SpeechQueue.ts`, `src/speech/SpeechItem.ts`              |
