#!/usr/bin/env bash
#
# Run the full verification suite inside a Docker container — a clean-room,
# reproducible mirror of the CI workflow (.github/workflows/ci.yml).
#
# NOTE: this project has no unit-test suite yet (see ROADMAP.md). The
# "test suite" here is the same set of gates CI enforces:
#     lint (eslint + prettier)  ->  type-check  ->  build + dist-drift check
# If a `test` npm script is added later, this script runs it automatically too.
#
# The repo is mounted READ-ONLY and copied into the container, so your working
# tree and host node_modules are never touched. Node version is read from .nvmrc.
#
# Usage: ./scripts/test-docker.sh
#
set -euo pipefail

cd "$(dirname "$0")/.."
PROJECT_ROOT="$(pwd)"

# Fail early with a clear message if Docker isn't usable.
if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: docker is not installed or not on PATH." >&2
  exit 1
fi
if ! docker info >/dev/null 2>&1; then
  echo "ERROR: the Docker daemon is not running / not reachable." >&2
  exit 1
fi

# Node version from .nvmrc (digits/dots only); default to 22. Use the full
# node image (not -slim) because the dist-drift check needs git.
NODE_VERSION="$(tr -dc '0-9.' < .nvmrc 2>/dev/null || true)"
NODE_VERSION="${NODE_VERSION:-22}"
IMAGE="node:${NODE_VERSION}"

echo "==> Running verification suite in Docker (${IMAGE})"

docker run --rm \
  -v "${PROJECT_ROOT}:/src:ro" \
  -w / \
  -e CI=true \
  "${IMAGE}" \
  bash -euo pipefail -c '
    echo "== copying repo into clean-room workspace"
    cp -a /src /work
    cd /work
    rm -rf node_modules
    git config --global --add safe.directory /work

    echo "== node $(node --version), npm $(npm --version)"
    npm ci

    echo "== lint"
    npm run lint

    echo "== type-check"
    npm run typecheck

    echo "== build + dist-drift check"
    npm run build
    if ! git diff --quiet -- dist; then
      echo "ERROR: dist/ is out of date. Run \"npm run build\" and commit the result." >&2
      git --no-pager diff --stat -- dist >&2
      exit 1
    fi

    echo "== unit tests"
    if node -e "process.exit((require(\"/work/package.json\").scripts||{}).test?0:1)"; then
      npm test
    else
      echo "(no \"test\" script defined yet — skipping; see ROADMAP.md)"
    fi

    echo "== all checks passed"
  '

echo "==> Done."
