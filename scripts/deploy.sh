#!/usr/bin/env bash
#
# Deploy to jsDelivr (gh). jsDelivr serves straight from GitHub tags, so a
# "deploy" is: rebuild dist/ -> commit it -> tag with the package version -> push.
#
# Usage: ./scripts/deploy.sh        (or: npm run deploy)
#
set -euo pipefail

cd "$(dirname "$0")/.."

VERSION="$(node -p "require('./package.json').version")"
# Tag convention: plain semver, no leading "v" (jsDelivr URLs pin @<version>).
TAG="${VERSION}"
BRANCH="$(git rev-parse --abbrev-ref HEAD)"

echo "==> Deploying ${TAG} from branch '${BRANCH}'"

# Refuse to run on a dirty tree, EXCEPT for dist/ (which the build regenerates).
if [ -n "$(git status --porcelain -- ':!dist')" ]; then
  echo "ERROR: working tree has uncommitted changes outside dist/. Commit or stash first." >&2
  git status --short -- ':!dist' >&2
  exit 1
fi

# Tag must not already exist (locally or on the remote).
if git rev-parse -q --verify "refs/tags/${TAG}" >/dev/null; then
  echo "ERROR: tag ${TAG} already exists locally. Bump the version in package.json." >&2
  exit 1
fi
if git ls-remote --exit-code --tags origin "${TAG}" >/dev/null 2>&1; then
  echo "ERROR: tag ${TAG} already exists on origin. Bump the version in package.json." >&2
  exit 1
fi

echo "==> Building"
npm run clean
npm run build

# dist/ is committed on purpose so jsDelivr can serve it.
git add dist
if git diff --cached --quiet; then
  echo "==> dist/ unchanged, nothing new to commit"
else
  git commit -m "build: ${TAG}"
fi

echo "==> Tagging ${TAG}"
git tag -a "${TAG}" -m "Release ${TAG}"

echo "==> Pushing ${BRANCH} + tags"
git push origin "${BRANCH}"
git push origin "${TAG}"

echo ""
echo "Done. jsDelivr URL (allow a few minutes to propagate):"
echo "  https://cdn.jsdelivr.net/gh/mpbarbosa/catas_altas_speech@${VERSION}/dist/esm/index.js"
