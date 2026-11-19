import { defineConfig } from 'vite';

// base './' lets the built site work from any path (GitHub Pages project URL).
export default defineConfig({
  base: './',
  // The web app lives in script/ (index.html, code, and script/public/ copied as is: service
  // worker, manifest, icons, model and data). The build still goes to dist/ at the repo root.
  root: 'script',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    target: 'esnext',
    rolldownOptions: {
      output: {
        // three.js in its own file: when only our code changes, browsers (and the service
        // worker cache) keep the large three.js file instead of downloading it again.
        codeSplitting: { groups: [{ name: 'three', test: /node_modules[\\/]three[\\/]/ }] },
      },
    },
    // three.js alone is about 900 kB minified and cannot be split further without dropping
    // features, so the default 500 kB warning would always fire. Our own code stays far below.
    chunkSizeWarningLimit: 1000,
  },
});
