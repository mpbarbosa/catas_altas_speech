import { defineConfig, devices } from '@playwright/test';

// End-to-end suite that drives the example pages in a real browser to validate
// the published library surface (module loading, manager construction, the
// priority queue, voice/config plumbing). Run with `npm run test:e2e`, or in a
// clean-room Docker container via `npm run test:e2e:docker`.
//
// The static server (scripts/static-server.mjs) serves the repo root so the
// examples' relative `../dist/esm/index.js` import resolves as in production.
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:8099',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'node scripts/static-server.mjs',
    url: 'http://localhost:8099/examples/manual-test.html',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
