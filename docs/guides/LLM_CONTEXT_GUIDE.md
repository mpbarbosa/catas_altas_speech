# LLM Context Efficiency Guide

Code structure determines how much an agent must read to reason about a change.
`catas_altas_speech` is small and well-factored, which keeps the context cost of
any edit low — with one repo-specific trap worth knowing.

## Goal

Structure code so the minimum necessary context answers any question about it:
sparse imports, single-concern files, self-describing names, one declared public
surface.

## What LLM Context Efficiency Means Here

1. **Single-concern files.** Each `src/speech/*` and `src/utils/*` file does one
   job, inferable from its name (see [High Cohesion Guide](./HIGH_COHESION_GUIDE.md)).
2. **Sparse import graph.** `VoiceSelector` imports nothing from the project;
   `SpeechQueue` pulls in only `SpeechItem`, the logger, and the observer. The
   dependency radius of most files is two or three.
3. **One public surface.** `src/index.ts` re-exports the entire API
   (`SpeechSynthesisManager` default; `SPEECH_PRIORITY`, `SPEECH_CONFIG`, and the
   collaborator classes named). To answer "what does this expose?", read one file.
4. **Self-describing names** (see [Naming Guide](./NAMING_GUIDE.md)) let an agent
   skip bodies.

## Why It Matters

Context windows are finite; an agent that must load five files to answer one
question is slower and more error-prone. The same properties that help a reviewer
with bounded attention help an agent make correctly-scoped edits.

## Required Rules

1. Every file has one nameable responsibility; the filename says which.
2. Every public identifier is interpretable from its name alone.
3. Keep import graphs sparse — prefer extracting a shared seam (`TimerManager`,
   `logger`) over cross-importing peers.
4. Declare the public surface only in `src/index.ts`; keep it logic-free re-exports.
5. No side effects at import time **in library code** (see the reality note).

## The committed-`dist/` trap (repo-specific)

`dist/` is committed and served by jsDelivr — but it is **generated**. When
reasoning about behavior, read `src/`, never `dist/`. Editing `dist/` directly is
always wrong: it will be overwritten by `npm run build` and flagged by the CI
dist-drift check. Treat `dist/` as out-of-context for any logic question. The
NodeNext convention (relative imports carry explicit `.js` extensions even in
`.ts` files) is also intentional — not a mistake to "fix".

## Current repo reality

- **Two import-time side effects exist** and are intentional: `TimerManager.ts`
  constructs and exports a singleton instance, and `SpeechItem.ts` assigns
  `window.SpeechItem` for browser back-compat. Both are deliberate; do not
  replicate the pattern in new modules, and note them when reasoning about import cost.
- **`SpeechSynthesisManager.ts` is the one large, mixed file** (orchestration +
  legacy back-compat). It carries higher context cost than the focused
  collaborators; when a question is about voice selection or queueing, go straight
  to the relevant collaborator instead of reading the manager.
- **`CLAUDE.md`** already encodes the critical conventions (committed dist, NodeNext
  imports, browser-only, `strict: false`) — load it first in a new session.

## Review Heuristics

- **10-line scan** — do a file's imports + first declaration reveal its whole job?
- **Dependency-radius** — how many files must load to understand one function?
  (Most here: ≤3.)
- **Question-boundary** — "what does `VoiceSelector` return when no pt-BR voice
  exists?" should be answerable from `VoiceSelector.ts` alone.

## Related Guides

- [High Cohesion Guide](./HIGH_COHESION_GUIDE.md) — single-responsibility files are
  the low-cost context units.
- [Low Coupling Guide](./LOW_COUPLING_GUIDE.md) — sparse import graphs bound the
  collateral context of a change.
- [Naming Guide](./NAMING_GUIDE.md) — names as context compression.

## Summary Checklist

- [ ] Every file name describes its single responsibility.
- [ ] Public identifiers are interpretable from their names.
- [ ] Import graphs stay sparse; the public surface lives only in `src/index.ts`.
- [ ] Reasoning is done from `src/`, never the generated `dist/`.
- [ ] New library modules add no import-time side effects.
