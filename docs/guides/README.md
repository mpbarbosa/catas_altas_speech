# Engineering Guides

Adapted engineering guides for `catas_altas_speech`, imported from the shared
[`doc_template_lib`](https://github.com/mpbarbosa) template library and rewritten
against this codebase. Each imported guide maps generic principles to real files,
commands, and constraints in this repo (a zero-dependency, browser-only pt-BR
text-to-speech library).

This index records a decision for **every** guide in the library catalog — both
the ones imported and the ones deliberately skipped — so decisions are not
re-litigated. The full source catalog is the library's `CLAUDE.md`.

## How to use these guides

- Read [LLM Context Efficiency](./LLM_CONTEXT_GUIDE.md) and `../../CLAUDE.md` first
  in a new session — they encode the repo's non-obvious conventions (committed
  `dist/`, NodeNext `.js` imports, browser-only, `strict: false`).
- Before editing voice-loading, queue, or `speak()` code, read the
  [Web Speech API Guide](./WEB_SPEECH_API_GUIDE.md) — much of that code works
  around browser quirks and looks simplifiable but is not.
- Cite a guide by name in review ("this re-validates inside `processQueue` — see
  Defensive Coding") rather than restating its rules.
- When a "Not imported" trigger fires (e.g. a test suite is added), import and
  adapt that guide and move its row up.

## Imported guides

| Guide                                                     | Why it applies to this repo                                                                                                                                                                                           |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [High Cohesion](./HIGH_COHESION_GUIDE.md)                 | The engine is a thin orchestrator over single-purpose collaborators (`VoiceLoader`, `VoiceSelector`, `SpeechConfiguration`, `SpeechQueue`) — cohesion is the core design.                                             |
| [Low Coupling](./LOW_COUPLING_GUIDE.md)                   | Zero runtime dependencies by design; collaborators are injected and `DualObserverSubject` is vendored locally to avoid an external edge.                                                                              |
| [Module Structure](./NODE_MODULE_GUIDE.md)                | A distributable ESM module: single `src/index.ts` entry point, downward layering (`speech` → `utils`/`core` → config), packaged for jsDelivr/npm. Surfaces real deviations (default exports, import-time singletons). |
| [Defensive Coding](./DEFENSIVE_CODING_GUIDE.md)           | Pervasive boundary validation (`speak`, `setRate`, constructors) and frozen/sealed value objects (`SpeechItem`, `SpeechQueue`).                                                                                       |
| [Error Handling](./ERROR_HANDLING_GUIDE.md)               | The queue must survive transient Web Speech API `onerror` events; voice-load failure and observer errors are contained.                                                                                               |
| [Referential Transparency](./REFERENTIAL_TRANSPARENCY.md) | Pure core (`VoiceSelector`, immutable `SpeechItem`) with effects isolated to `TimerManager`/`logger`/`synth`; flags the one hidden-time input (`isExpired` → `Date.now()`).                                           |
| [Naming](./NAMING_GUIDE.md)                               | Clear public API plus the pt-BR `SPEECH_PRIORITY` domain vocabulary (`LOGRADOURO`, `BAIRRO`, `MUNICIPIO`) inherited from `guia_js`.                                                                                   |
| [Unit Test](./UNIT_TEST_GUIDE.md)                         | Vitest covers the pure collaborators (66–93%); `SpeechSynthesisManager`/`TimerManager` remain untested (~37% overall). Names the seams and the next targets.                                                          |
| [LLM Context Efficiency](./LLM_CONTEXT_GUIDE.md)          | Repo is Claude Code–maintained; documents the committed-`dist/` trap and the one large file (`SpeechSynthesisManager`).                                                                                               |

## Project-specific guides

Authored for this repo — _not_ from the `doc_template_lib` catalog, so not part of
the import/skip coverage below.

| Guide                                       | Purpose                                                                                                                                                                                                     |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Web Speech API](./WEB_SPEECH_API_GUIDE.md) | The browser Web Speech API's quirks (async voice loading, mobile gesture-unlock, `onerror`, pause/resume) mapped to the exact code that handles each — an agent-facing "looks wrong, is correct" reference. |

## Not imported

| Guide                         | Reason                                                                                                             | Re-assess when                                              |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| `SOLID_GUIDE`                 | SRP/DIP for a library this size are covered by High Cohesion + Low Coupling.                                       | The composition/type hierarchy grows more layers.           |
| `INTERFACE_FIRST_GUIDE`       | Public surface is small and stable (one barrel, a handful of classes).                                             | The exported API expands or gains polymorphic contracts.    |
| `CLEAN_ARCHITECTURE_GUIDE`    | Too small for full layered architecture; dependency-direction story is covered by Low Coupling + Module Structure. | The codebase grows distinct app/infrastructure layers.      |
| `DRY_GUIDE`                   | Duplication is minimal and local (e.g. the sync/async voice-select paths).                                         | Shared logic recurs across more modules.                    |
| `CODE_QUALITY_CONTROL_GUIDE`  | Change-quality is enforced by the CI gates (lint, type-check, dist-drift) and the `/code-review` skill.            | A heavier review/quality process is needed.                 |
| `INCREMENTAL_CHANGE_GUIDE`    | Covered in spirit by LLM Context + the dist-drift gate.                                                            | Larger multi-step migrations begin (e.g. the TS-6 work).    |
| `CLAUDE_CODE_WORKFLOW_GUIDE`  | Overlaps LLM Context for a repo this size.                                                                         | Multi-session or multi-agent workflows become routine.      |
| `OBSERVABILITY_GUIDE`         | No server or production runtime to observe; only an optional console logger.                                       | A backend or telemetry surface is added (unlikely).         |
| `INTEGRATION_TEST_GUIDE`      | No integration tests exist.                                                                                        | Contract tests around the Web Speech API are added.         |
| `E2E_TEST_GUIDE`              | No browser automation.                                                                                             | Playwright (or similar) drives `examples/index.html`.       |
| `REST_API_GUIDE`              | No HTTP layer.                                                                                                     | An HTTP API is introduced (out of scope for a TTS lib).     |
| `DDD_GUIDE`                   | Single-purpose utility library, not a domain-rich application.                                                     | The project takes on a rich, evolving domain model.         |
| `LIGHTWEIGHT_DDD_GUIDE`       | Same as above — no bounded contexts to model.                                                                      | A real domain layer emerges.                                |
| `DOMAIN_DESIGN_CONTROL_GUIDE` | No domain-model / API change-review surface to govern.                                                             | A domain model or public API contract needs change control. |
| `MOBILE_FIRST_GUIDE`          | A headless library, not a UI; mobile audio-unlock is a usage note, not interface design.                           | The project ships its own UI.                               |
| `REACT_GUIDE`                 | No React anywhere in the codebase.                                                                                 | A React component layer is added (out of scope).            |

> **Out of scope (not code guides):** the library's own meta-docs
> (`docs/API.md`, `docs/ARCHITECTURE.md`, `docs/CONTRIBUTING.md`,
> `docs/GETTING_STARTED.md`, `CHANGELOG.md`) and `meta/GUIDE_AUTHORING_GUIDE.md`
> (how to author guides _in the library_) are not reusable engineering guides and
> are never imported.
