---
name: import-adapt-guides
description: >
  Analyze the reusable guide templates in the sibling doc_template_lib repo,
  assess which guides suit catas_altas_speech, copy the selected ones into
  docs/guides/, adapt each guide against the actual codebase, and update the
  docs/guides/README.md index. Use this skill when the user asks to import,
  refresh, or sync engineering guides from the shared template library.
---

## Overview

The guide template library lives at:

```
/home/mpb/Documents/GitHub/doc_template_lib/
```

It contains reusable Markdown guides in three folders:

| Folder | Content |
|--------|---------|
| `code_quality/` | Cross-cutting engineering principles (architecture, testing, naming, error handling, etc.) |
| `domain_specific/` | Domain-model, API, platform, and framework-family guides |
| `frontend/` | React and browser-platform guidance |

The target repo stores adapted guides in `docs/guides/`. The index is
`docs/guides/README.md`. **Neither exists yet** — on first run, create them.

> **Know what this repo is before importing.** `catas_altas_speech` is a small,
> **zero-runtime-dependency, browser-only pt-BR text-to-speech library** (Web
> Speech API), extracted verbatim from `guia_js`. It is **not** an app: no React,
> no HTTP server, no database, no test suite. Guides scoped to those concerns are
> skips, not imports (see "What NOT to do").

---

## Steps

### Step 1 — Read the template catalog

Read the library's `CLAUDE.md` for its full guide table (every guide, its path,
and a one-line description).

> Path: `/home/mpb/Documents/GitHub/doc_template_lib/CLAUDE.md`

Treat **meta-docs** (not reusable templates) as out of scope — skip these:
`docs/API.md`, `docs/ARCHITECTURE.md`, `docs/CONTRIBUTING.md`,
`docs/GETTING_STARTED.md`, `CHANGELOG.md`.

### Step 2 — Read the existing import index

Read the current `docs/guides/README.md` in this repo. It records which guides
are already imported (with rationale) and which were explicitly skipped (with the
reason). Use it as the baseline: do not re-import what is present, and do not
override a deliberate skip without a clear new reason.

If `docs/guides/README.md` does not exist yet, treat all guides as candidates.

### Step 3 — Understand the current codebase

Read the following to build a concrete picture before assessing anything:

- `CLAUDE.md` — architecture, conventions, the critical "committed dist / NodeNext
  `.js` imports / browser-only / strict:false" notes
- `ROADMAP.md` — deferred work (npm publish, **test suite**, Prettier-on-`src/`,
  TS 6 migration); useful for "import once X exists" re-assessment
- `README.md` — public API surface and CDN usage
- `src/` listing — the engine and its collaborators (see the mapping in Step 6)
- `tsconfig.json`, `eslint.config.js` — build/lint posture
- `scripts/` — `test-docker.sh` (verification suite) and `deploy.sh` (release)
- `.github/workflows/` — `ci.yml`, `release.yml` (the actual CI/CD gates)
- `examples/index.html` — the only "consumer", a manual browser demo

There is **no `CONTEXT.md`, `DESIGN.md`, `server.ts`, or `tests/`** — do not look
for them; their absence is itself an assessment signal.

### Step 4 — Assess each unimported template

For every guide in the library **not yet imported**, decide:

**Import** if at least two of the following hold for this repo:
1. The repo already has the kind of code the guide governs.
2. The guide addresses a real risk or recurring pressure visible in the code.
3. It would be directly cited when reviewing a PR or debugging a design choice.

**Skip** if any hold:
1. The repo has no code in that domain (e.g., no HTTP layer → skip REST/API guides).
2. An already-imported guide covers the same concern adequately.
3. The guide's pattern conflicts with the repo's stated design (e.g. heavyweight
   DDD vs. a single-purpose utility library).
4. The guide was previously skipped with a reason that still holds.

Record a decision for **every** guide — import and skip — so the README index is
complete.

#### Common re-assessment triggers for this repo

| Event | May unlock |
|-------|-----------|
| A unit-test suite is added (per ROADMAP) | `UNIT_TEST_GUIDE.md` |
| Integration/contract tests around the Web Speech API are added | `INTEGRATION_TEST_GUIDE.md` |
| Browser automation added (e.g. Playwright against `examples/`) | `E2E_TEST_GUIDE.md` |
| The composition/observer design grows more layers | `SOLID_GUIDE.md`, `INTERFACE_FIRST_GUIDE.md`, `LOW_COUPLING_GUIDE.md`, `HIGH_COHESION_GUIDE.md` |
| More error/edge handling in the queue or voice loading | `ERROR_HANDLING_GUIDE.md`, `DEFENSIVE_CODING_GUIDE.md` |
| Public API / vocabulary expands (more exported classes) | `NAMING_GUIDE.md`, `INTERFACE_FIRST_GUIDE.md` |
| Packaging/exports work (npm publish per ROADMAP) | `NODE_MODULE_GUIDE.md` |
| Continued Claude Code use on this repo | `LLM_CONTEXT_GUIDE.md`, `CLAUDE_CODE_WORKFLOW_GUIDE.md`, `INCREMENTAL_CHANGE_GUIDE.md` |

Likely **persistent skips** (no code in domain): `REST_API_GUIDE.md`,
`REACT_GUIDE.md`, `MOBILE_FIRST_GUIDE.md`, `OBSERVABILITY_GUIDE.md`,
`DDD_GUIDE.md` / `LIGHTWEIGHT_DDD_GUIDE.md` / `DOMAIN_DESIGN_CONTROL_GUIDE.md`.
Re-confirm rather than re-litigate.

### Step 5 — Read the full source of each guide to import

For each selected guide, read the full source file from the library before
writing the adapted version. Do not adapt from memory or the one-line description.

### Step 6 — Adapt each guide

Copy to `docs/guides/<GUIDE_NAME>.md` and adapt for this repo. **One guide at a time.**

#### Adaptation rules

**Replace generic project language with repo-specific terminology.**

> Generic: "the business rules in your domain model"
> Adapted: "the priority/expiry rules in `SpeechQueue` and the pt-BR selection
> strategy in `VoiceSelector`"

**Map abstract layers/components to concrete files.** Use this repo's actual layout:

| Concept | Concrete location |
|---------|------------------|
| Public API barrel (entry point) | `src/index.ts` |
| Orchestrator / manager (Web Speech API integration) | `src/speech/SpeechSynthesisManager.ts` |
| Priority + expiry queue | `src/speech/SpeechQueue.ts` |
| Immutable value object | `src/speech/SpeechItem.ts` |
| Single-responsibility collaborators | `src/speech/VoiceLoader.ts`, `src/speech/VoiceSelector.ts` |
| Parameter config (rate/pitch clamp) | `src/speech/SpeechConfiguration.ts` |
| Observer pattern (vendored) | `src/core/DualObserverSubject.ts`, `src/core/ObserverSubject.ts` (alias) |
| Cross-cutting utilities | `src/utils/logger.ts`, `src/utils/TimerManager.ts`, `src/utils/ObserverMixin.ts` |
| Ambient type declarations | `src/globals.d.ts` |
| Manual consumer / demo | `examples/index.html` |
| Verification (no test suite) | `bash scripts/test-docker.sh`; `npm run lint`, `npm run typecheck`, `npm run build` |
| Release pipeline | `scripts/deploy.sh`, `.github/workflows/release.yml` |

**Replace generic examples with real commands and paths.**

> Generic: "run your test suite"
> Adapted: "`bash scripts/test-docker.sh` (lint + type-check + build/dist-drift in
> a clean-room `node:22` container); there is no unit/e2e suite yet — see ROADMAP"

**Trim sections that do not apply.** Remove or condense sections on technologies
absent here (servers, databases, ORMs, message queues, React rendering, blue/green
deploys). Keep the core principle; drop only inapplicable examples.

**Add a "Current repo reality" section** when a principle is partially met or
evolving. Be honest about gaps — e.g. "no automated tests exist yet; the
verification gate is lint + type-check + dist-drift," or "`strict: false` is set
deliberately for this verbatim extraction."

**Preserve the guide's structural skeleton** (Goal → What it means → Why it
matters → Rules / Signals / Checklist) so guides stay skimmable.

**Cross-reference sibling guides** already in `docs/guides/` (link the adapted
copies, never the library templates).

#### Adaptation depth guide

| Guide type | Expected depth |
|------------|----------------|
| Architecture (Clean, Coupling, Cohesion) | High — map every layer to `src/speech` / `src/core` / `src/utils` paths |
| Testing (Unit, Integration, E2E) | High — but be explicit that **no suite exists**; describe the seams that *would* be tested (queue ordering/expiry, voice selection, retry) |
| Error handling / Defensive coding | Medium-high — real examples from queue error recovery + voice-load retry |
| Cross-cutting principles (DRY, Naming, Referential transparency) | Medium — add repo examples, keep the general rules |
| Packaging (Node module) | Medium — map to `package.json` `exports`/`files`, committed `dist/`, jsDelivr |
| AI-assisted development (LLM Context, Incremental Change) | Low-medium — note `CLAUDE.md`, the committed-`dist` gotcha, small token footprint |

### Step 7 — Update the README index

Write or rewrite `docs/guides/README.md` to reflect the full current state:

1. **Imported guides table** — each newly imported guide with a one-sentence,
   repo-specific rationale (not the generic description).
2. **Not imported table** — skip reason for every guide left out; confirm reasons
   still hold for persistent skips.
3. **How to use these guides** — keep current; reference the library `CLAUDE.md`
   catalog so newcomers know where to start.
4. **Links** — ensure every link resolves.

### Step 8 — Verify

After writing all adapted guides:

1. Confirm every new file is in `docs/guides/`.
2. Confirm `docs/guides/README.md` lists each new guide in "Imported" and updates
   any prior "Not imported" entry.
3. Check intra-guide links (`[Naming Guide](./NAMING_GUIDE.md)`) resolve to files
   that exist in `docs/guides/`.
4. Check no generic placeholder text ("your project", "your stack", "your domain")
   survived, and no agora-isms (FIFA, broadcaster, `server.ts`) crept in from a
   template.

---

## Quality bar for adapted guides

- [ ] A new contributor to **this** repo can follow it without the template library.
- [ ] Every file/directory path mentioned exists in this repo.
- [ ] Every command shown (`bash scripts/test-docker.sh`, `npm run typecheck`,
      `npm run build`) is real and runnable here.
- [ ] The core principle is preserved — only generic scaffolding was replaced.
- [ ] It is shorter than the source template (adaptation removes prose).
- [ ] The "Current repo reality" section is honest about gaps (notably: no tests,
      `strict: false`, committed `dist/`).

---

## What NOT to do

- Do not import guides wholesale without adapting (a guide that still says "your
  database" or "your domain model" has not been adapted).
- Do not invent code examples or tests that don't exist (there is **no test
  suite** — describe seams, don't fabricate `npm test`).
- Do not import guides for concerns this library genuinely lacks — no HTTP/REST,
  React, mobile UI, server observability, or strategic DDD for a single-purpose
  browser TTS module.
- Do not remove the "Not imported" section from the README — explicit skips
  prevent re-litigating decisions.
- Do not update `CLAUDE.md` to reference a guide before its file exists in
  `docs/guides/`.
