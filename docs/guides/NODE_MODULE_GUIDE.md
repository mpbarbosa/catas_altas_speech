# Module Structure Guide

`catas_altas_speech` is a distributable ESM module — its success _is_ being a
clean, importable package (jsDelivr today, npm per `ROADMAP.md`). This guide
governs entry-point design, layering, and export style. (The template calls this
"Node.js module structure"; the principles are about package structure, not a
backend.)

## Goal

Organize `src/` so a module's responsibility is obvious from its location,
dependencies flow one direction, and the public API is controlled from a single
entry point — without reading every file to know what is exposed.

## What It Means Here

1. **One entry point.** `src/index.ts` re-exports the complete public API and
   contains no logic — exactly the guide's prescription.
2. **Downward dependency flow.** `index.ts` → `src/speech/` (orchestration +
   domain) → `src/utils/` (`logger`, `TimerManager`, `ObserverMixin`) and
   `src/core/` (vendored `DualObserverSubject`) → `SPEECH_CONFIG` constants. Lower
   layers never import upward; `src/core/` and `src/utils/` import nothing from
   `src/speech/`.
3. **Controlled public surface.** Consumers import from the package root
   (`import SpeechSynthesisManager from "catas_altas_speech"`), backed by
   `package.json` `exports`/`main`/`module`/`types` → `dist/esm`.

## Why It Matters

1. A single entry point gives consumers one place to find everything and prevents
   internals from leaking into the public API.
2. Strict downward flow avoids circular-import init bugs.
3. Isolated, focused modules are independently testable (see
   [Unit Test Guide](./UNIT_TEST_GUIDE.md)).

## Required Rules

1. `src/index.ts` re-exports the public API and holds no logic.
2. Dependencies flow strictly downward; no `src/utils/` or `src/core/` file
   imports from `src/speech/`.
3. Each module has one responsibility (see [High Cohesion](./HIGH_COHESION_GUIDE.md)).
4. Prefer injected dependencies with sensible defaults (`VoiceLoader` already
   injects `speechSynthesis`).
5. Keep module scope free of side effects at import time.

## Current repo reality (real deviations to know)

This repo follows the structure well at the entry-point and layering level, but
three template rules are knowingly bent — extracted verbatim from `guia_js`:

- **Default exports throughout.** Every class uses `export default`; the guide
  prefers named exports. Mitigation: `src/index.ts` _also_ exposes named
  re-exports (`export { default as SpeechSynthesisManager }`), so consumers get
  named imports even though the internal style is default. Keep that named-barrel
  pattern; don't add new default-only public symbols.
- **Two import-time side effects.** `TimerManager.ts` exports a singleton
  (`export default new TimerManager()`) and `SpeechItem.ts` assigns
  `window.SpeechItem`. Both are intentional (process-wide timer tracking; browser
  back-compat) but are exactly the guide's warning signs — do not add more.
- **Collaborators constructed in the manager.** `SpeechSynthesisManager`
  instantiates `VoiceLoader`/`VoiceSelector`/`SpeechQueue` in its constructor
  rather than receiving them injected. Acceptable for a self-contained library
  with one wiring point; prefer injection if a new collaborator needs swapping in tests.
- **Config is inline.** `SPEECH_CONFIG` lives (frozen) inside
  `SpeechSynthesisManager.ts`, not a separate config layer. Fine at this size.

## Review Heuristics

- **Single-entry test** — can every public symbol be imported from the package
  root, with no reach into `src/...` internal paths?
- **Dependency-direction test** — grep for any `src/utils`/`src/core` file
  importing from `src/speech` (should find none).
- **Hidden-dependency test** — does constructing a class trigger I/O or global
  mutation? (`TimerManager`/`SpeechItem`: yes, by design — the known exceptions.)

## Related Guides

- [Low Coupling](./LOW_COUPLING_GUIDE.md) and [High Cohesion](./HIGH_COHESION_GUIDE.md)
  — the per-module properties this layering depends on.
- [Referential Transparency](./REFERENTIAL_TRANSPARENCY.md) — the pure-core /
  imperative-shell pattern that keeps the core layer testable.
- [LLM Context Efficiency](./LLM_CONTEXT_GUIDE.md) — the single declared public
  surface that `src/index.ts` provides.

## Summary Checklist

- [ ] `src/index.ts` re-exports the public API with no logic.
- [ ] Dependencies flow strictly downward (`speech` → `utils`/`core` → config).
- [ ] Each module has one responsibility.
- [ ] Public symbols are reachable via named re-exports from the package root.
- [ ] No _new_ import-time side effects or default-only public exports.
