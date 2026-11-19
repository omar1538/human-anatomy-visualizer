import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    files: ['scripts/**/*.mjs'],
    ignores: ['scripts/public/sw.mjs'],
    languageOptions: { ecmaVersion: 2023, sourceType: 'module', globals: globals.browser },
    rules: { 'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }] },
  },
  {
    // The service worker is a classic script (not a module) with its own globals (self, caches).
    // It keeps the .mjs extension like the rest of the code, but is registered as a classic worker.
    files: ['scripts/public/sw.mjs'],
    languageOptions: { ecmaVersion: 2023, sourceType: 'script', globals: globals.serviceworker },
  },
];
