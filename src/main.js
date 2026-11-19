// Application entry point.
import { createViewer } from './render/index.js';
import { loadGLB, loadOrganIndex } from './render/loader.js';
import { createPlaceholderBody } from './render/placeholder.js';
import { mountDevPanel } from './dev/devPanel.js';
import { registerServiceWorker } from './pwa/register.js';
import { mountLearnMode } from './learn/learnMode.js';
import { mountUI } from './ui/toolbar.js';
import { showWebGPUUnavailable } from './ui/unsupported.js';

// Registered first, so the app shell is cached even if the viewer fails to start.
registerServiceWorker();

const container = document.getElementById('viewer');

// The heart model and its metadata follow docs/DATA_CONTRACT.md (Track B).
// ?model=<url> loads another GLB, and ?model=placeholder shows the stand-in body.
const DEFAULT_MODEL = 'assets/models/heart.glb';
const ORGANS_URL = 'assets/data/organs.json';

async function loadModel(url) {
  if (url === 'placeholder') return createPlaceholderBody();
  try {
    return await loadGLB(url);
  } catch (error) {
    console.error(`Model ${url} could not be loaded, showing the placeholder body:`, error);
    return createPlaceholderBody();
  }
}

const params = new URLSearchParams(location.search);
const modelUrl = params.get('model') ?? DEFAULT_MODEL;
const [model, meta] = await Promise.all([loadModel(modelUrl), loadOrganIndex(ORGANS_URL)]);

let viewer;
try {
  viewer = await createViewer({ container, model, meta });
} catch (error) {
  // WebGPU only: without it there is no viewer, so explain why instead of a blank page.
  if (error?.name !== 'WebGPUUnavailableError') throw error;
  console.error(error);
  showWebGPUUnavailable(container, error);
}

if (viewer) {
  mountUI(viewer, meta);
  mountLearnMode(viewer, meta);
  // The developer panel (backend, raw ids, test controls) only with ?dev in the URL.
  if (params.has('dev')) mountDevPanel(viewer);

  // Handy for debugging and automated tests.
  window.viewer = viewer;
}
