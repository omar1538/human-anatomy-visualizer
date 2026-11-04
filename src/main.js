// Application entry point.
import { createViewer } from './render/index.js';
import { loadGLB } from './render/loader.js';
import { createPlaceholderBody } from './render/placeholder.js';
import { mountDevPanel } from './dev/devPanel.js';

const container = document.getElementById('viewer');

// Real models come from Track B. Open the app with ?model=assets/models/core.glb to load one.
// Without it, a placeholder body is shown.
const modelUrl = new URLSearchParams(location.search).get('model');
const model = modelUrl ? await loadGLB(modelUrl) : createPlaceholderBody();

const viewer = await createViewer({ container, model });
mountDevPanel(viewer);

// Handy for debugging and automated tests.
window.viewer = viewer;
