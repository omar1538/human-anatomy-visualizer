// Track A: loads a GLB file (Track B delivers the real models).
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

/**
 * @param {string} url
 * @param {(ratio: number) => void} [onProgress] called with a value from 0 to 1
 * @returns {Promise<import('three').Object3D>}
 */
export function loadGLB(url, onProgress) {
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (gltf) => resolve(gltf.scene),
      (e) => e.lengthComputable && onProgress?.(e.loaded / e.total),
      reject,
    );
  });
}
