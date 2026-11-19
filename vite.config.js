import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// The PWA files live with the PWA code in scripts/pwa/, but the browser needs them at the site
// root under these exact names: the service worker only controls the pages at or below its own
// URL, and the service worker precaches the manifest by name. This plugin serves them at the root
// in `npm run dev` and writes them, unchanged, to the root of dist/ in `npm run build`.
const ROOT_FILES = {
  'sw.js': { source: 'scripts/pwa/sw.js', type: 'text/javascript' },
  'manifest.webmanifest': {
    source: 'scripts/pwa/manifest.webmanifest',
    type: 'application/manifest+json',
  },
};

function pwaRootFiles() {
  return {
    name: 'pwa-root-files',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const file = ROOT_FILES[(req.url ?? '').split('?')[0].replace(/^\//, '')];
        if (!file) return next();
        res.setHeader('Content-Type', file.type);
        res.end(readFileSync(resolve(file.source)));
      });
    },
    generateBundle() {
      for (const [fileName, file] of Object.entries(ROOT_FILES)) {
        this.emitFile({ type: 'asset', fileName, source: readFileSync(resolve(file.source)) });
      }
    },
  };
}

// base './' lets the built site work from any path (GitHub Pages project URL).
export default defineConfig({
  base: './',
  plugins: [pwaRootFiles()],
  build: {
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
