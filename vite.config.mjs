import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

// The PWA files live in scripts/pwa/ but must be served from the site root, unchanged:
// - a service worker only controls pages in its own folder and below, so sw.mjs must sit next to
//   index.html (GitHub Pages cannot send the Service-Worker-Allowed header that would allow more);
// - Vite would otherwise hash the manifest into assets/, which breaks its relative icon paths and
//   the service worker's precache list.
const PWA_FILES = {
  'sw.mjs': { src: 'scripts/pwa/sw.mjs', type: 'text/javascript' },
  'manifest.webmanifest': {
    src: 'scripts/pwa/manifest.webmanifest',
    type: 'application/manifest+json',
  },
};
const read = (src) => readFileSync(fileURLToPath(new URL(src, import.meta.url)));

function pwaFiles() {
  return {
    name: 'pwa-files',
    // npm run dev: serve them at the root.
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const file = PWA_FILES[(req.url ?? '').split('?')[0].replace(/^\//, '')];
        if (!file) return next();
        res.setHeader('Content-Type', file.type);
        res.end(read(file.src));
      });
    },
    // npm run build: write them at the root of dist/ with their own names.
    generateBundle() {
      for (const [fileName, { src }] of Object.entries(PWA_FILES)) {
        this.emitFile({ type: 'asset', fileName, source: read(src) });
      }
    },
  };
}

// base './' lets the built site work from any path (GitHub Pages project URL).
export default defineConfig({
  base: './',
  // The web app lives in scripts/: index.html, the code, scripts/pwa/ (service worker and
  // manifest, published at the site root by pwaFiles) and scripts/public/ (icons, model and data,
  // copied as is). The build still goes to dist/ at the repo root.
  root: 'scripts',
  plugins: [pwaFiles()],
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
