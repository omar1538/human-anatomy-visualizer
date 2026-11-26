// Track A: x-ray mode. Swaps each mesh's material for an x-ray material and back.
// The shader itself is in shaders.mjs; this file only handles which material each mesh uses, so it
// can be tested without a GPU.
import { createXRayMaterial } from './shaders.mjs';

/**
 * @param {object} options
 * @param {import('three').Object3D} options.model
 * @param {(color: import('three').Color) => import('three').Material} [options.makeMaterial]
 * builds the x-ray material for a mesh (replaceable in tests)
 */
export function createXRay({ model, makeMaterial = createXRayMaterial }) {
  const xrayMaterials = new Map(); // mesh -> its x-ray material, made once and reused
  const normalMaterials = new Map(); // mesh -> the material it had before x-ray was switched on
  let enabled = false;

  // The anatomy only: slicing helpers keep their own material.
  function meshes() {
    const list = [];
    model.traverse((o) => {
      if (o.isMesh && !o.userData.sliceHelper && o.material && !Array.isArray(o.material)) {
        list.push(o);
      }
    });
    return list;
  }

  function apply() {
    for (const mesh of meshes()) {
      // Read the current material each time: the picker may have replaced it with its own copy.
      normalMaterials.set(mesh, mesh.material);
      let xray = xrayMaterials.get(mesh);
      if (!xray) {
        xray = makeMaterial(mesh.material.color);
        xrayMaterials.set(mesh, xray);
      }
      mesh.material = xray;
    }
  }

  function restore() {
    normalMaterials.forEach((material, mesh) => (mesh.material = material));
    normalMaterials.clear();
  }

  return {
    /** Switches x-ray on or off. Repeated calls with the same value do nothing. */
    set(on) {
      if (Boolean(on) === enabled) return;
      enabled = Boolean(on);
      if (enabled) apply();
      else restore();
    },
    isEnabled: () => enabled,
    /** Runs `fn` with the normal materials back in place, for example to copy the model for AR. */
    withoutXRay(fn) {
      if (!enabled) return fn();
      restore();
      try {
        return fn();
      } finally {
        apply();
      }
    },
    /** Number of x-ray materials made so far (one per mesh at most). Used by the tests. */
    materialCount: () => xrayMaterials.size,
    dispose() {
      restore();
      enabled = false;
      xrayMaterials.forEach((material) => material.dispose());
      xrayMaterials.clear();
    },
  };
}
