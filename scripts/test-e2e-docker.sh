#!/usr/bin/env bash
#
# Run the Playwright e2e suite (examples validation) inside the official
# Playwright Docker image — a clean-room, reproducible mirror of the `e2e` job
# in .github/workflows/ci.yml. The image ships the browsers AND their OS
# dependencies, so the only thing the container fetches is npm dependencies.
#
# The repo is mounted READ-ONLY and copied into the container, so your working
# tree and host node_modules are never touched. The Playwright image tag is
# derived from the @playwright/test version in package.json so the runtime and
# the bundled browsers always match.
#
# Usage: ./scripts/test-e2e-docker.sh   (or: npm run test:e2e:docker)
#
set -euo pipefail

cd "$(dirname "$0")/.."
PROJECT_ROOT="$(pwd)"

if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: docker is not installed or not on PATH." >&2
  exit 1
fi
if ! docker info >/dev/null 2>&1; then
  echo "ERROR: the Docker daemon is not running / not reachable." >&2
  exit 1
fi

# Pin the image to the installed @playwright/test version (digits/dots only) so
# the container's browsers match the test runner. Falls back to a sane default.
PW_VERSION="$(node -p "require('./package.json').devDependencies['@playwright/test'].replace(/[^0-9.]/g,'')" 2>/dev/null || true)"
PW_VERSION="${PW_VERSION:-1.60.0}"
IMAGE="mcr.microsoft.com/playwright:v${PW_VERSION}-jammy"

echo "==> Running Playwright e2e suite in Docker (${IMAGE})"

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

    echo "== node $(node --version), npm $(npm --version)"
    npm ci

    echo "== building local ESM bundle (manual-test.html imports ../dist)"
    npm run build

    echo "== running Playwright e2e against the example pages"
    npx playwright test

    echo "== all e2e checks passed"
  '

echo "==> Done."
