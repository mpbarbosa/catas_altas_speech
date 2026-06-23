---
name: test-bump-deploy
description: >
  Run the full Docker verification suite, bump the patch version, commit and
  push to main, then release to the jsDelivr CDN via scripts/deploy.sh (tag +
  GitHub Release). Use when the user asks to "test, bump, and deploy",
  "release", or wants the complete quality-gate → version → ship pipeline in one
  pass for catas_altas_speech.
---

## Overview

Three-stage pipeline, each stage gates the next:

1. **Test** — Docker-isolated run of the verification suite (`scripts/test-docker.sh`)
2. **Bump + commit + push** — patch bump, README CDN re-pin, validate, commit, push `main`
3. **Release** — tag the version and push it so jsDelivr serves it (`scripts/deploy.sh`), then cut a GitHub Release

Abort immediately if any stage fails; do not proceed to the next.

**This is a single-repo, single-`main` project** (no dual worktrees). Releases
are **git tags** — jsDelivr serves `gh/mpbarbosa/catas_altas_speech@<version>/...`
straight from the tag. There is no rsync/host deploy.

> **Alternative (preferred for hands-off releases):** the same bump→build→
> README-bump→commit→tag→GitHub-Release→jsDelivr-purge flow exists as a CI
> workflow — `gh workflow run release.yml -f bump=patch`. Use this skill for the
> **local** path; use the workflow when you'd rather run it in CI.

---

## Stage 1 — Docker verification suite

### 1a. Verify Docker is running

```bash
docker info --format '{{.ServerVersion}}'
```

If this fails, stop and tell the user Docker is not running.

### 1b. Run the suite

```bash
bash scripts/test-docker.sh
```

The script copies the repo into a clean-room `node:22` container (version from
`.nvmrc`) and runs **lint (ESLint + Prettier) → type-check → build + dist-drift
check**, then `npm test` *if* a `test` script exists.

> **No unit/e2e tests exist yet** (see `ROADMAP.md`); "tests" here means the CI
> quality gates above. When a `test` script is added, this picks it up
> automatically.

**On failure:** read the per-step output, report which step failed and the first
error. Do not proceed to Stage 2. Offer to fix before retrying.

**On success:** the script prints `all checks passed`. Proceed to Stage 2.

> `npm run lint` can be intercepted by the RTK proxy on the host and may report a
> spurious non-zero exit. The Docker run is RTK-free, so trust `scripts/test-docker.sh`.
> If verifying on the host, confirm with `npx tsc --noEmit` and `npx eslint .`
> directly before treating a lint failure as real.

---

## Stage 2 — Bump, commit, push

### 2a. Inspect repo state

```bash
git status --short
git branch --show-current   # expected: main
```

Stop if the working tree is dirty in a way you don't expect — `scripts/deploy.sh`
(Stage 3) refuses to run on a tree dirty outside `dist/`.

### 2b. Bump the patch version

```bash
npm version patch --no-git-tag-version
VERSION="$(node -p "require('./package.json').version")"
```

`--no-git-tag-version` updates `package.json` + `package-lock.json` only;
`scripts/deploy.sh` creates the tag in Stage 3.

### 2c. Re-pin the README CDN references to the new version

The README's two jsDelivr `@<semver>` pins (import URL + the "Pin a tag" note)
must point at the version being released, **in the same commit that gets tagged**
— jsDelivr serves `README.md` from the tag, so a lagging bump ships an
inconsistent README. (See the `release-readme-bump` project memory.)

```bash
sed -i -E "s#@[0-9]+\.[0-9]+\.[0-9]+#@${VERSION}#g" README.md
grep -q "catas_altas_speech@${VERSION}/dist/esm/index.js" README.md \
  || { echo "README CDN ref not updated to ${VERSION}" >&2; exit 1; }
```

> The build output (`dist/`) does **not** embed the version, so a bump produces
> no `dist/` change — only `package.json`, `package-lock.json`, and `README.md`.

### 2d. Stage and validate

```bash
git add -A
npx tsc --noEmit
```

Use `npx tsc --noEmit` directly (not `npm run lint`) to avoid the RTK proxy
mangling the exit code. Stop if type errors are found.

### 2e. Review scope and commit

```bash
git diff --cached --stat
```

Match this repo's release-commit convention (`build: X.Y.Z`):

- `build: X.Y.Z` — version bump (+ README re-pin) only
- `build: X.Y.Z; <short summary>` — bump plus other staged changes

```bash
git commit -m "build: ${VERSION}" \
  -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

### 2f. Push `main`

```bash
git push origin main
```

Pushing to `main` updates the default branch directly. If the harness permission
classifier blocks the push, **stop and ask the user to authorize it** (or to run
`! git push origin main` themselves) — do not work around the denial.

**If the push is REJECTED as non-fast-forward** (`[rejected] ... (fetch first)`),
the remote moved while you worked. Do **not** force-push — rebase and, because a
release commit carries the version bump, re-bump to the next free patch:

```bash
git fetch origin
git rebase origin/main                          # 3-way-merges the version line
npm version patch --no-git-tag-version          # e.g. 0.1.4 (dup) -> 0.1.5
VERSION="$(node -p "require('./package.json').version")"
sed -i -E "s#@[0-9]+\.[0-9]+\.[0-9]+#@${VERSION}#g" README.md
git add -A && npx tsc --noEmit
git commit --amend -m "build: ${VERSION}" \
  -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
git push origin main                            # now a fast-forward
```

(The amend is safe here: the commit is local and was never accepted by the
remote.) If the rebase reports a **real conflict** (not just the version line),
stop, resolve or report it, and do not retry blindly.

**On success:** report the new version and published SHA, then proceed to Stage 3.

---

## Stage 3 — Release to jsDelivr

```bash
bash scripts/deploy.sh
```

What this script does (for context — do not replicate manually):

1. Refuses to run on a tree dirty outside `dist/`, or if tag `${VERSION}` already
   exists locally or on origin
2. `npm run clean && npm run build` (output is identical — Stage 2 changed no
   source — so there is "nothing to commit" for `dist/`)
3. Tags `${VERSION}` (plain semver, **no `v` prefix**) and pushes the branch + tag
4. Prints the jsDelivr URL for the new version

**Then cut a GitHub Release** from the tag (the deploy script does not create one):

```bash
gh release create "${VERSION}" --title "${VERSION}" --generate-notes
```

### Verify the release is live

```bash
git ls-remote --tags origin | grep -E "refs/tags/${VERSION}$"
curl -fsSL -o /dev/null -w "HTTP %{http_code}\n" \
  "https://cdn.jsdelivr.net/gh/mpbarbosa/catas_altas_speech@${VERSION}/dist/esm/index.js"
```

A fresh tag is never cached, so it should return `HTTP 200` within a minute.

**On failure:** identify which step stopped (deploy.sh prints `==>` markers),
diagnose, and report. Do not retry silently.

### Sync local main

The push in Stage 2/3 advanced `origin/main`; local `main` is already at that SHA
(deploy.sh commits nothing new here), so no pull is normally needed. If a CI
release ran concurrently, `git pull --ff-only origin main`.

---

## What to report when the pipeline finishes

```
✓ Verification suite passed in Docker (lint + type-check + build/dist-drift)
✓ Version bumped to X.Y.Z, README re-pinned, pushed to origin/main (SHA: <short>)
✓ Released X.Y.Z → tag pushed, GitHub Release created, jsDelivr @X.Y.Z live (HTTP 200)
```

---

## Safety rules

- Stop at the first failure; never skip a stage's gate on the way to release.
- Do not force-push or use destructive git operations (the one `--amend` above is
  the sole exception — a local, never-pushed release commit during rebase recovery).
- Do not retry a failing deploy step silently — always report what failed.
- `scripts/deploy.sh` requires a clean worktree (outside `dist/`). If Stage 2
  leaves the tree dirty (e.g. a hook wrote files), clean up before Stage 3.
- A new tag/release is effectively permanent on jsDelivr — confirm the version is
  intended before Stage 3, and never re-cut an empty release just to "redeploy".
