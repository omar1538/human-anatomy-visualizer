import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

// The whole web app is in src/:
//   index.html, sw.mjs, manifest.webmanifest   the page and the PWA files
//   scripts/   the JavaScript modules (main.mjs, render/, ui/, learn/, pwa/, dev/, tests/)
//   styles/    the CSS
//   assets/    heart.glb and the content files (loaded at run time with fetch)
//   icons/     the app icons
// Vite bundles index.html, scripts/ and styles/ into dist/. The files below are copied to dist/
// unchanged, at the same paths, because the app and the service worker ask for them by name:
// - sw.mjs must sit next to index.html: a service worker only controls pages in its own folder
//   and below (GitHub Pages cannot send the header that would allow more);
// - the manifest and the icons keep their names so the manifest's icon paths and the service
//   worker's precache list stay right;
// - assets/ is fetched at run time (assets/models/heart.glb, assets/data/organs.json, ...).
const SRC = new URL('./src/', import.meta.url);
const COPIED_FILES = ['sw.mjs', 'manifest.webmanifest'];
const COPIED_FOLDERS = ['assets', 'icons'];

/** Every file in `folder` and its subfolders, as paths relative to src/ ("icons/icon-192.png"). */
function filesIn(folder) {
  const srcPath = fileURLToPath(SRC);
  return readdirSync(new URL(folder, SRC), { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => relative(srcPath, join(entry.parentPath, entry.name)).split(sep).join('/'));
}

function copyStaticFiles() {
  return {
    name: 'copy-static-files',
    // npm run build: write them into dist/ unchanged, at the same paths as in src/.
    generateBundle() {
      const files = [...COPIED_FILES, ...COPIED_FOLDERS.flatMap(filesIn)];
      for (const fileName of files) {
        this.emitFile({ type: 'asset', fileName, source: readFileSync(new URL(fileName, SRC)) });
      }
    },
  };
}

// base './' lets the built site work from any path (GitHub Pages project URL).
export default defineConfig({
  base: './',
  root: 'src',
  // No separate static folder: in npm run dev, Vite serves everything in src/ as it is, and
  // copyStaticFiles() publishes what the build needs.
  publicDir: false,
  plugins: [copyStaticFiles()],
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
