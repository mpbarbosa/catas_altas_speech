# Naming Guide

Naming is the primary documentation of code. In `catas_altas_speech`, names should
be interpretable in isolation — and they mostly already are, including the pt-BR
domain vocabulary inherited from `guia_js`.

## Goal

Every symbol, file, and (future) test is interpretable from its name alone, so a
reader knows the purpose without opening the body.

## What Consistent Naming Means Here

1. **Classes are specific nouns:** `SpeechSynthesisManager`, `SpeechQueue`,
   `SpeechItem`, `VoiceLoader`, `VoiceSelector`, `SpeechConfiguration`,
   `DualObserverSubject`, `TimerManager`.
2. **Functions are verb phrases:** `loadVoices`, `selectVoice`, `scoreVoice`,
   `enqueue`, `dequeue`, `cleanExpired`, `processQueue`, `clearTimer`.
3. **Booleans are predicates:** `isExpired()`, `isEmpty()`, `isSpeaking()`,
   `hasVoices()`, `isLoggingEnabled`.
4. **Constants name meaning, not value:** `SPEECH_CONFIG.maxVoiceRetryAttempts`,
   `SPEECH_PRIORITY.MUNICIPIO`.
5. **File names match the primary symbol:** `VoiceLoader.ts`, `SpeechQueue.ts`.

## Domain vocabulary

`SPEECH_PRIORITY` encodes the **travel-guide domain** this engine came from —
`PERIODIC`, `LOGRADOURO` (street), `BAIRRO` (neighborhood), `FIRST_ADDRESS`,
`MUNICIPIO` (municipality). These are ubiquitous-language terms, not implementation
labels; preserve them. New priority tiers should use the same domain register, and
the pt-BR comments/examples (`"Gol do Brasil!"`) are intentional, not placeholders.

## Required Rules

1. No generic unprefixed names (`util`, `helper`, `manager`, `handler`) standing
   alone — a qualifying noun is required.
2. Every function name contains a verb.
3. Every boolean-returning function uses predicate form (`is*`/`has*`/`can*`).
4. File names match the primary class or concept they contain.
5. Acronym casing stays consistent (`pt-BR` in prose/lang codes; camelCase
   identifiers like `getVoices`).

## Current repo reality

- **`SpeechSynthesisManager` / `TimerManager`** use the `Manager` suffix the guide
  warns about — but both carry a domain subject (`SpeechSynthesis`, `Timer`), so
  they pass the test. Do not introduce a bare `Manager`/`Handler`.
- **`src/utils/logger.ts`** is a category-ish filename, but it names a single
  concern (logging) and exports `log`/`warn`/`error`/`debug` — acceptable. The
  guide's real target is dumping-ground `utils.js`; this repo has none.
- **`SpeechConfiguration`** vs. the abbreviated `cfg` style: the codebase favors
  full words — keep it that way (no `cfg`, `mgr`, `proc`).

## Warning Signs

- A new file named `utils.ts`/`helpers.ts`/`common.ts`.
- A boolean method like `checkExpiry()` instead of `isExpired()`.
- A new exported class named `Manager`/`Processor` with no domain subject.
- Anglicizing or "cleaning up" the pt-BR domain terms in `SPEECH_PRIORITY`.

## Review Heuristics

- **Cold-read test** — from the identifier alone, can a reader predict what it does?
- **Predicate test** — does each boolean read naturally in an `if`? (`if (item.isExpired())`.)
- **Rename test** — if a second name is equally plausible, the name is not precise.

## Related Guides

- [LLM Context Efficiency Guide](./LLM_CONTEXT_GUIDE.md) — precise names are
  compressed semantic tokens that save an agent from reading the body.
- [High Cohesion Guide](./HIGH_COHESION_GUIDE.md) — if a unit is hard to name, it
  likely does too much.

## Summary Checklist

- [ ] Classes are specific nouns; no bare `Manager`/`Handler`.
- [ ] Every function name has a verb; every boolean is a predicate.
- [ ] File names match their primary symbol.
- [ ] `SPEECH_PRIORITY` domain terms (pt-BR) are preserved, not anglicized.
- [ ] No new `utils`/`helpers` catch-all files.
