# Roadmap

## Deferred: publish to the npm registry on release

Today the package ships **only via jsDelivr `gh`** (served from git tags — see
`.github/workflows/release.yml` and `scripts/deploy.sh`). Publishing to the npm
registry as well is deferred until an `NPM_TOKEN` is available.

To enable it later:

1. Create an npm **automation** access token and add it as the repo secret
   `NPM_TOKEN` (Settings → Secrets and variables → Actions).
2. Confirm the `name` in `package.json` is available/owned on npm (the current
   `catas_altas_speech` is unscoped; consider a scoped name like
   `@mpbarbosa/catas_altas_speech` if it's taken).
3. Add this step to the `release` job in `.github/workflows/release.yml`, after
   the "Create GitHub Release" step:

   ```yaml
   - name: Publish to npm
     env:
       NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
     run: npm publish --access public
   ```

   And add the registry to the `actions/setup-node` step so the token is wired up:

   ```yaml
   - uses: actions/setup-node@v4
     with:
       node-version-file: '.nvmrc'
       cache: npm
       registry-url: 'https://registry.npmjs.org'
   ```

`package.json` is already publish-ready: `type: module`, `exports`/`main`/
`module`/`types` point at `dist/esm`, and `files` includes `dist` + `src`.

## Possible follow-ups

- Adopt Prettier across `src/` (currently `.prettierignore`d to avoid churning
  the verbatim guia_js style) via a one-time `npm run format` pass.
- Extend the test suite. Vitest is wired in (`npm test`, `tests/` mirroring
  `src/`) and covers the pure collaborators well (`SpeechItem`,
  `SpeechConfiguration`, `VoiceSelector`, `SpeechQueue`, `VoiceLoader` — 66–93%).
  Still uncovered: `SpeechSynthesisManager` (the browser orchestrator — needs a
  faked `speechSynthesis`/`SpeechSynthesisUtterance`, or jsdom) and `TimerManager`.
  Overall line coverage is ~37%; raising it means testing those two units.
- **Migrate to TypeScript 6.x** (currently pinned to `^5`; Dependabot major
  bumps are ignored). TS 6 type-checks the codebase more strictly and requires:
  - `src/utils/logger.ts`: make Node's `process` known to the type-checker
    (e.g. add `"types": ["node"]` to `tsconfig.json`, or guard via `globalThis`),
    fixing `TS2591 Cannot find name 'process'`.
  - `src/utils/TimerManager.ts`: resolve `TS18047 'timerId' is possibly null`
    around the `.unref()` calls (narrow the `setInterval` return type).
