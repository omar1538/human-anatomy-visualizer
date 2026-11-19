import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.js'],
    languageOptions: { ecmaVersion: 2023, sourceType: 'module', globals: globals.browser },
    rules: { 'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }] },
  },
  {
    // The service worker is a classic script (not a module) with its own globals (self, caches).
    files: ['public/sw.js'],
    languageOptions: { ecmaVersion: 2023, sourceType: 'script', globals: globals.serviceworker },
  },
];
