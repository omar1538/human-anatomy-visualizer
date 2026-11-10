// Application entry point.
import { createViewer } from './render/index.js';
import { loadGLB, loadOrganIndex } from './render/loader.js';
import { createPlaceholderBody } from './render/placeholder.js';
import { mountDevPanel } from './dev/devPanel.js';
import { registerServiceWorker } from './pwa/register.js';

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

const modelUrl = new URLSearchParams(location.search).get('model') ?? DEFAULT_MODEL;
const [model, meta] = await Promise.all([loadModel(modelUrl), loadOrganIndex(ORGANS_URL)]);

const viewer = await createViewer({ container, model, meta });
mountDevPanel(viewer);

// Handy for debugging and automated tests.
window.viewer = viewer;
