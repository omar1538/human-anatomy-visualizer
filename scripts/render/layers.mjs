// Track A: what is shown. Layers (show or hide a whole system) and isolation (show only one organ
// or group). Both are combined in one place, so they never undo each other:
//   a mesh is visible  <=>  its layer is on  AND  (nothing is isolated OR the mesh is isolated)

/**
 * A mesh's system comes from (in order): userData.system, the metadata
 * (organs.json from Track B, looked up by mesh name), or its parent group name.
 */
export function createLayers(root, meta = {}) {
  /** @type {Map<string, THREE.Mesh[]>} */
  const bySystem = new Map();
  const meshes = []; // every anatomy mesh, with or without a system
  const hiddenSystems = new Set();
  let isolated = null; // Set of meshes shown while isolating, or null

  root.traverse((obj) => {
    if (!obj.isMesh || obj.userData.sliceHelper) return;
    meshes.push(obj);
    const system = obj.userData.system ?? meta[obj.name]?.system ?? obj.parent?.name;
    if (!system) return;
    obj.userData.system = system;
    if (!bySystem.has(system)) bySystem.set(system, []);
    bySystem.get(system).push(obj);
  });

  function apply() {
    for (const mesh of meshes) {
      const layerOn = !hiddenSystems.has(mesh.userData.system);
      mesh.visible = layerOn && (!isolated || isolated.has(mesh));
    }
  }

  return {
    /** @returns {string[]} all system ids found in the model */
    systems: () => [...bySystem.keys()],
    /** Shows or hides every mesh of a system (isolation still applies on top). */
    setSystemVisible(system, visible) {
      if (!bySystem.has(system)) return;
      if (visible) hiddenSystems.delete(system);
      else hiddenSystems.add(system);
      apply();
    },
    /** Whether the system's layer is switched on (whatever the isolation). */
    isSystemVisible: (system) => bySystem.has(system) && !hiddenSystems.has(system),
    /**
     * Shows only the meshes under `object` (an organ or a group); null shows everything again.
     * @param {THREE.Object3D | null} object
     */
    isolate(object) {
      if (!object) {
        isolated = null;
      } else {
        isolated = new Set();
        object.traverse((o) => o.isMesh && !o.userData.sliceHelper && isolated.add(o));
      }
      apply();
    },
    /** Whether something is isolated. */
    isIsolating: () => isolated !== null,
  };
}
