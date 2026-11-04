// Track A: renderer creation with automatic WebGPU -> WebGL 2 fallback.
import * as THREE from 'three/webgpu';

/**
 * Creates the renderer inside `container`.
 * Three.js WebGPURenderer uses WebGPU when the browser supports it and
 * switches to its WebGL 2 backend otherwise. We read back which one is active.
 * @param {HTMLElement} container
 * @returns {Promise<{ renderer: THREE.WebGPURenderer, backend: 'WebGPU' | 'WebGL 2' }>}
 */
export async function createRenderer(container) {
  const renderer = new THREE.WebGPURenderer({ antialias: true });
  // Cap the pixel ratio: rendering more pixels than needed wastes battery on phones.
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight, false);
  container.appendChild(renderer.domElement);

  await renderer.init();

  const backend = renderer.backend?.isWebGPUBackend === true ? 'WebGPU' : 'WebGL 2';
  return { renderer, backend };
}
