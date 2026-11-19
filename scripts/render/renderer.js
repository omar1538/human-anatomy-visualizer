// Track A: renderer creation, WebGPU only (no WebGL 2 fallback).
import * as THREE from 'three/webgpu';
import { isARSupported } from './xr.js';

/** Thrown when this browser or device cannot run WebGPU. main.js shows a message for it. */
export class WebGPUUnavailableError extends Error {
  constructor(reason) {
    super(`WebGPU is not available: ${reason}`);
    this.name = 'WebGPUUnavailableError';
  }
}

/**
 * Whether WebGPU can actually be used here: the API exists and the browser gives an adapter
 * (it may not, for example on a blocklisted GPU driver).
 * @returns {Promise<string | null>} null when WebGPU is usable, otherwise the reason it is not
 */
export async function checkWebGPU() {
  if (typeof navigator === 'undefined' || !navigator.gpu) return 'this browser has no WebGPU';
  try {
    const adapter = await navigator.gpu.requestAdapter();
    return adapter ? null : 'no compatible GPU adapter';
  } catch {
    return 'the GPU adapter request failed';
  }
}

/**
 * AR runs through WebGPU only where the browser provides the WebXR/WebGPU binding
 * (`XRGPUBinding`) and can start an immersive-ar session.
 * @returns {Promise<boolean>}
 */
async function isWebGPUARSupported() {
  if (typeof globalThis.XRGPUBinding === 'undefined') return false;
  return isARSupported();
}

/**
 * Creates the WebGPU renderer inside `container`.
 * There is no WebGL 2 fallback: without WebGPU this throws `WebGPUUnavailableError`.
 * @param {HTMLElement} container
 * @returns {Promise<{ renderer: THREE.WebGPURenderer, backend: 'WebGPU', arSupported: boolean }>}
 */
export async function createRenderer(container) {
  const reason = await checkWebGPU();
  if (reason) throw new WebGPUUnavailableError(reason);

  const arSupported = await isWebGPUARSupported();
  const renderer = new THREE.WebGPURenderer({ antialias: true });
  // WebGPURenderer always installs a WebGL 2 fallback backend. Remove it so a WebGPU start-up
  // failure is reported instead of silently running on WebGL 2. This is a private field in
  // Three.js r187; the isWebGPUBackend check below still catches it if a future version renames it.
  renderer._getFallback = null;
  renderer.xr.enabled = arSupported;
  // Cap the pixel ratio: rendering more pixels than needed wastes battery on phones.
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight, false);

  try {
    await renderer.init();
  } catch (error) {
    renderer.dispose();
    throw new WebGPUUnavailableError(error?.message ?? 'the WebGPU device could not start');
  }
  if (renderer.backend?.isWebGPUBackend !== true) {
    renderer.dispose();
    throw new WebGPUUnavailableError('Three.js did not start its WebGPU backend');
  }

  container.appendChild(renderer.domElement);
  return { renderer, backend: 'WebGPU', arSupported };
}
