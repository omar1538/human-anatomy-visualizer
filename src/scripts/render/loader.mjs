// Track A: loads a GLB file and the organ metadata (Track B delivers both).
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

/**
 * Loads `organs.json` (an array of records, see docs/DATA_CONTRACT.md) and indexes it by id.
 * A missing or invalid file gives an empty index, so the viewer still works without metadata.
 * @param {string} url
 * @returns {Promise<Record<string, object>>}
 */
export async function loadOrganIndex(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) return {};
    const records = await response.json();
    if (!Array.isArray(records)) throw new Error('organs.json must be an array of records');
    const index = {};
    for (const record of records) {
      if (typeof record?.id !== 'string') continue;
      if (index[record.id]) console.warn(`organs.json: duplicate id "${record.id}"`);
      index[record.id] = record;
    }
    return index;
  } catch (error) {
    console.warn('Organ metadata could not be loaded:', error);
    return {};
  }
}
