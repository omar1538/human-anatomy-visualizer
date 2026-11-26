// ESLint rules for the app (npm run lint, also run by the CI in .github/workflows/ci-cd.yml).
// Kept in .github/ so the repository root only holds the project itself; package.json passes
// this file with --config. With --config, the file patterns below are relative to the repo root.
import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    // The app's modules, run in the browser.
    files: ['src/scripts/**/*.mjs'],
    ignores: ['src/scripts/tests/**'],
    languageOptions: { ecmaVersion: 2023, sourceType: 'module', globals: globals.browser },
    rules: { 'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }] },
  },
  {
    // The automated tests, run by Node (npm test).
    files: ['src/scripts/tests/**/*.mjs'],
    languageOptions: { ecmaVersion: 2023, sourceType: 'module', globals: globals.node },
  },
  {
    // The service worker is a classic script (not a module) with its own globals (self, caches).
    // It keeps the .mjs extension like the rest of the code, but is registered as a classic worker.
    files: ['src/sw.mjs'],
    languageOptions: { ecmaVersion: 2023, sourceType: 'script', globals: globals.serviceworker },
  },
];
