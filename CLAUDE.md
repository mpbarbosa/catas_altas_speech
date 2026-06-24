# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A self-contained, **zero-runtime-dependency** pt-BR text-to-speech engine wrapping the browser
Web Speech API (`window.speechSynthesis`). It was extracted _verbatim_ from the speech feature of
the `guia_js` project; the only adaptation for standalone use was vendoring `DualObserverSubject`
locally (`src/core/`). Distributed as ESM, consumed primarily via jsDelivr CDN.

## Commands

```bash
npm install
npm run build      # tsc -p tsconfig.json → dist/esm (ESM .js + .d.ts + sourcemaps)
npm run clean      # rm -rf dist
npm run typecheck  # tsc --noEmit (type-check without emitting)
npm run test       # vitest run (unit tests, node env)
npm run test:coverage # vitest run --coverage (v8)
npm run lint       # eslint . && prettier --check .
npm run format     # prettier --write . (excludes src/, dist/, examples/)
npm run serve      # python3 -m http.server 8099  (then open /examples/)
npm run deploy     # ./scripts/deploy.sh — local build+commit dist+tag+push (CDN release)
```

**Tests:** Vitest, in `tests/` mirroring `src/`, run under the `node` environment (the
Web Speech API is faked via `vi.stubGlobal` / injected — no DOM needed). They cover the
collaborators **and** the orchestrator: `SpeechItem`, `SpeechConfiguration`,
`VoiceSelector`, `SpeechQueue`, `VoiceLoader`, and `SpeechSynthesisManager`
(~66% overall; `TimerManager` and the deeper manager branches remain untested). Linting
(ESLint flat config + Prettier) and type-checking are also wired in. `tsconfig` only
includes `src/`, so `tests/` are run by Vitest (esbuild) but not by `npm run typecheck`.

## CI/CD

- **`.github/workflows/ci.yml`** (push to `main` + PRs): `npm ci` → lint → typecheck → test
  (with coverage) → a **dist-drift check** that rebuilds and fails if the committed `dist/`
  differs from a fresh build.
- **`.github/workflows/release.yml`** (`workflow_dispatch`, input `bump` = patch/minor/major):
  bumps the version, rebuilds, commits `dist/`, tags (plain semver, **no `v`**), pushes, creates a
  GitHub Release, and purges the jsDelivr cache. `scripts/deploy.sh` does the same dance locally.
- **Prettier governs only root docs/config**; `src/`, `dist/`, and `examples/` are in
  `.prettierignore` to avoid churning the verbatim guia_js style.
- npm-registry publishing is **deferred** (no `NPM_TOKEN`) — see `ROADMAP.md` for the drop-in step.

## Critical conventions

- **`dist/` is committed on purpose** (see the note in `.gitignore`) so jsDelivr `gh` can serve the
  built ESM. After changing `src/`, **run `npm run build` and commit the regenerated `dist/`** —
  otherwise CDN consumers get stale code.
- **Releases are git tags.** Consumers pin `@<tag>` in the jsDelivr URL
  (`cdn.jsdelivr.net/gh/mpbarbosa/catas_altas_speech@0.1.0/dist/esm/index.js`). Bumping behavior
  means bumping `package.json` version and tagging.
- **Module system is `NodeNext`** — all relative imports in `src/` must use explicit `.js`
  extensions (e.g. `import SpeechQueue from './SpeechQueue.js'`) even though the files are `.ts`.
- **`tsconfig` has `strict: false`.** `SpeechSynthesisManager` deliberately types its composition
  members (`voiceLoader`, `voiceSelector`, etc.) as `any` and uses `!` non-null assertions on
  `this.synth`.
- **Browser-only.** The `SpeechSynthesisManager` constructor throws if `window.speechSynthesis` is
  absent. `speak()` must first be called inside a user-gesture handler (mobile audio unlock).
- Code carries a lot of **intentional backward-compat surface** kept for the original `guia_js`
  call sites: `@deprecated` `startVoiceRetryTimer`/`stopVoiceRetryTimer`, `this.rate`/`this.pitch`
  mirrored from `SpeechConfiguration`, `observers`/`functionObservers` getters. Preserve these
  unless explicitly cleaning up.

## Architecture

`SpeechSynthesisManager` (`src/speech/SpeechSynthesisManager.ts`) is the public entry point and
orchestrator, composed of single-responsibility collaborators:

- **`VoiceLoader`** — loads voices with exponential-backoff retry. Chrome/Android return `[]` from
  `getVoices()` until the engine warms up; this resolves once voices appear. Promise-based, caches
  results, dedupes concurrent loads.
- **`VoiceSelector`** — picks a voice by priority: exact `pt-br` → `pt-*` prefix → first available →
  null. Scores candidates (local voices and exact-lang matches preferred).
- **`SpeechConfiguration`** — owns/clamps `rate` (0.1–10.0) and `pitch` (0.0–2.0).
- **`SpeechQueue`** (holds `SpeechItem`s) — priority-ordered queue (higher number speaks first, FIFO
  within a tier) with **automatic expiration** (default 30s) so stale cues drop instead of speaking
  late. Higher-priority `speak()` calls preempt queued lower-priority ones. Emits observer
  notifications on every mutation.
- **`TimerManager`** (`src/utils/`) — **singleton**, default-exported as an instance. All timers go
  through it by string id so `destroy()`/`stop()` can clean them up and avoid leaks. `unref()`s
  timers under Node.

**Voice loading flow** (`loadVoices`): synchronous `getVoices()` attempt first → async
`VoiceLoader` retry in parallel → registers `speechSynthesis.onvoiceschanged` to re-select when the
browser populates voices later.

**Queue processing** (`processQueue`): single-utterance-at-a-time guarded by `isCurrentlySpeaking`;
`utterance.onend`/`onerror` chain the next item via `TimerManager.setTimeout(..., 10ms)`. Errors
never stall the queue — processing continues after a failed utterance.

### Observer pattern (`src/core/`)

`DualObserverSubject` is the vendored Subject supporting both object observers (`{update()}`) and
function observers, with immutable subscribe/unsubscribe and per-observer error isolation.
`ObserverSubject.ts` is just a re-export alias — it existed in `guia_js` to pull from a CDN, and is
kept so the speech files import unchanged. **Don't collapse `ObserverSubject` into
`DualObserverSubject`** if you want to keep import parity with upstream. `src/utils/ObserverMixin.ts`
provides `withObserver()` to graft delegation methods onto a prototype; `SpeechQueue` uses it for
`unsubscribe` only (it has custom `subscribe`/`notify` logic).

### Public API surface

`src/index.ts` is the barrel. Default export is `SpeechSynthesisManager`; named exports include
`SPEECH_PRIORITY` (`PERIODIC:0, LOGRADOURO:1, BAIRRO:2, FIRST_ADDRESS:2.5, MUNICIPIO:3` — these
tiers are domain terms from the `guia_js` travel-guide context) and `SPEECH_CONFIG`. The internal
classes (`SpeechQueue`, `VoiceLoader`, `VoiceSelector`, `SpeechConfiguration`) are also re-exported.

`examples/index.html` is a manual browser demo that imports from the jsDelivr CDN (not the local
build) — open it via `npm run serve`.
