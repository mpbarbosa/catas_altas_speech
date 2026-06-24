import { defineConfig } from 'vitest/config';

// The engine is browser-targeted but its pure collaborators (queue, voice
// selection, config, value object) run fine under Node. Tests inject fakes for
// the Web Speech API, so no DOM environment is needed.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      // Barrel re-export and ambient type declarations have no runtime behavior.
      exclude: ['src/index.ts', 'src/globals.d.ts'],
      reporter: ['text', 'text-summary'],
    },
  },
});
