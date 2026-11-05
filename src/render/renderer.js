// Track A: renderer creation with automatic WebGPU -> WebGL 2 fallback.
import * as THREE from 'three/webgpu';
import { isARSupported } from './xr.js';

/**
 * Creates the renderer inside `container`.
 * Three.js WebGPURenderer uses WebGPU when the browser supports it and
 * switches to its WebGL 2 backend otherwise. We read back which one is active.
 * On AR-capable devices WebGL 2 is forced, because AR through WebGPU needs a WebXR
 * binding that fewer browsers support, and the backend cannot change after start-up.
 * @param {HTMLElement} container
 * @returns {Promise<{ renderer: THREE.WebGPURenderer, backend: 'WebGPU' | 'WebGL 2', arSupported: boolean }>}
 */
export async function createRenderer(container) {
  const arSupported = await isARSupported();
  const renderer = new THREE.WebGPURenderer({ antialias: true, forceWebGL: arSupported });
  renderer.xr.enabled = arSupported;
  // Cap the pixel ratio: rendering more pixels than needed wastes battery on phones.
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight, false);
  container.appendChild(renderer.domElement);

  await renderer.init();

  const backend = renderer.backend?.isWebGPUBackend === true ? 'WebGPU' : 'WebGL 2';
  if (arSupported && backend === 'WebGL 2') {
    // WebXR emulators report a null XR framebuffer, meaning "draw to the canvas", but Three.js
    // r187 uses that value as a WeakMap key and throws on every frame. Real devices never pass
    // null, so this changes nothing on them. Remove it once Three.js handles null itself.
    const { state } = renderer.backend;
    const noFramebuffer = {};
    const drawBuffers = state.drawBuffers.bind(state);
    state.drawBuffers = (context, framebuffer) =>
      drawBuffers(context, framebuffer ?? noFramebuffer);
  }
  return { renderer, backend, arSupported };
}
