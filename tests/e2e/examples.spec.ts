import { test, expect, type Page } from '@playwright/test';

// These tests drive the two example pages in a real browser to validate the
// library end to end:
//   - examples/manual-test.html imports the LOCAL build (../dist/esm/index.js),
//     so it exercises the code in this repo. This is the primary gate.
//   - examples/index.html imports the PUBLISHED build from jsDelivr, so it is a
//     smoke test of the released artifact (skipped automatically if the CDN is
//     unreachable, e.g. an offline runner).
//
// Headless Chromium exposes window.speechSynthesis (so the manager constructs)
// but typically returns zero voices and never actually plays audio. The tests
// therefore assert on observable wiring — logs, status JSON, the priority
// dropdown, slider plumbing — and on the absence of uncaught exceptions, rather
// than on audible output.

const MANUAL = '/examples/manual-test.html';
const DEMO = '/examples/index.html';

// Capture uncaught exceptions: the strongest signal that the library code broke
// when driven by a real browser.
function collectPageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}

async function readStatusJson(page: Page): Promise<Record<string, unknown>> {
  const raw = await page.locator('#status').innerText();
  return JSON.parse(raw);
}

test.describe('manual-test.html — local build (../dist/esm/index.js)', () => {
  test('loads the local ESM build and constructs the manager', async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto(MANUAL);

    await expect(page.locator('#log')).toContainText('SpeechSynthesisManager created');
    expect(errors, 'no uncaught exceptions during init').toEqual([]);
  });

  test('populates the priority dropdown from SPEECH_PRIORITY tiers', async ({ page }) => {
    await page.goto(MANUAL);

    const options = page.locator('#priority option');
    await expect(options).toHaveText([
      'PERIODIC (0)',
      'LOGRADOURO (1)',
      'BAIRRO (2)',
      'FIRST_ADDRESS (2.5)',
      'MUNICIPIO (3)',
    ]);
    // MUNICIPIO is preselected by the demo.
    await expect(page.locator('#priority')).toHaveValue('3');
  });

  test('getStatus() exposes the documented shape and defaults', async ({ page }) => {
    await page.goto(MANUAL);
    await expect(page.locator('#status')).toContainText('queueSize');

    const status = await readStatusJson(page);
    expect(Object.keys(status).sort()).toEqual(
      [
        'isSpeaking',
        'pitch',
        'queueSize',
        'queueTimerActive',
        'rate',
        'voice',
        'voiceRetryActive',
        'voiceRetryAttempts',
      ].sort(),
    );
    expect(status.rate).toBe(1);
    expect(status.pitch).toBe(1);
    expect(status.queueSize).toBe(0);
    expect(status.isSpeaking).toBe(false);
  });

  test('speak / pause / resume / stop drive the engine without errors', async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto(MANUAL);
    await expect(page.locator('#log')).toContainText('SpeechSynthesisManager created');

    await page.locator('#speak').click();
    await expect(page.locator('#log')).toContainText('speak(');
    // The demo logs a ".err" line if speak() throws — there should be none.
    await expect(page.locator('#log .err')).toHaveCount(0);

    await page.locator('#pause').click();
    await page.locator('#resume').click();
    await page.locator('#stop').click();
    await expect(page.locator('#log')).toContainText('stop()');

    expect(errors).toEqual([]);
  });

  test('accepts mixed-priority enqueue without errors', async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto(MANUAL);

    await page.locator('#enqueue3').click();
    await expect(page.locator('#log')).toContainText('enqueued 3 items');
    await expect(page.locator('#log .err')).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('rate/pitch sliders flow through SpeechConfiguration into getStatus()', async ({ page }) => {
    await page.goto(MANUAL);
    await expect(page.locator('#status')).toContainText('queueSize');

    await page.locator('#rate').fill('2');
    await expect(page.locator('#rateVal')).toHaveText('2.0');
    await page.locator('#pitch').fill('1.5');
    await expect(page.locator('#pitchVal')).toHaveText('1.5');

    // Status refreshes on a 500ms interval; poll until it reflects the change.
    await expect.poll(async () => (await readStatusJson(page)).rate).toBe(2);
    await expect.poll(async () => (await readStatusJson(page)).pitch).toBe(1.5);
  });
});

test.describe('index.html — published build (jsDelivr CDN)', () => {
  test('loads the released ESM from jsDelivr and initializes the demo', async ({ page }) => {
    let cdnFailed = false;
    page.on('requestfailed', (req) => {
      if (req.url().includes('cdn.jsdelivr.net')) cdnFailed = true;
    });
    const errors = collectPageErrors(page);

    await page.goto(DEMO);

    try {
      // On success the demo logs "pronto…", then the poller swaps in "voz:".
      await expect(page.locator('#status')).toHaveText(/pronto|voz:/, { timeout: 15_000 });
    } catch (err) {
      // Offline / blocked runner: the CDN import can't resolve. Skip rather
      // than fail — the local build is covered by the suite above.
      test.skip(cdnFailed, 'jsDelivr CDN unreachable in this environment');
      throw err;
    }

    // Exercise the demo's queue buttons; the published code must not throw.
    await page.locator('#goal').click();
    await page.locator('#stop').click();
    expect(errors, 'no uncaught exceptions driving the CDN demo').toEqual([]);
  });
});
