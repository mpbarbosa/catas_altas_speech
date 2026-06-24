// Flat ESLint config for the pt-BR speech engine (TypeScript ESM).
// Linting only governs `src/`; `dist/` is generated and `examples/` is plain HTML.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'examples/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
    },
    rules: {
      // TypeScript performs undefined-symbol checking; ESLint's no-undef
      // produces false positives on browser/Node globals in .ts files.
      'no-undef': 'off',
      // The engine was extracted verbatim from guia_js and intentionally keeps
      // `any` on composition members and `!` non-null assertions on this.synth.
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      // Allow underscore-prefixed throwaways (e.g. `catch (_e)`).
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
    },
  },
  {
    // E2E specs and tooling live outside src/ and aren't type-checked by tsc.
    // They legitimately reference browser globals (inside page.evaluate) and
    // Node globals, so disable core no-undef here as we do for src/.
    files: ['tests/e2e/**/*.ts', 'playwright.config.ts', 'scripts/**/*.mjs'],
    languageOptions: {
      globals: {
        process: 'readonly',
        console: 'readonly',
        URL: 'readonly',
        window: 'readonly',
        document: 'readonly',
        speechSynthesis: 'readonly',
      },
    },
    rules: {
      'no-undef': 'off',
    },
  },
);
