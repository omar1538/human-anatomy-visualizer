// Track A: groups meshes by anatomical system so they can be shown or hidden.

/**
 * A mesh's system comes from (in order): userData.system, the metadata
 * (organs.json from Track B, looked up by mesh name), or its parent group name.
 */
export function createLayers(root, meta = {}) {
  /** @type {Map<string, THREE.Mesh[]>} */
  const bySystem = new Map();

  root.traverse((obj) => {
    if (!obj.isMesh) return;
    const system = obj.userData.system ?? meta[obj.name]?.system ?? obj.parent?.name;
    if (!system) return;
    obj.userData.system = system;
    if (!bySystem.has(system)) bySystem.set(system, []);
    bySystem.get(system).push(obj);
  });

  return {
    /** @returns {string[]} all system ids found in the model */
    systems: () => [...bySystem.keys()],
    /** Shows or hides every mesh of a system. */
    setSystemVisible(system, visible) {
      bySystem.get(system)?.forEach((m) => (m.visible = visible));
    },
    isSystemVisible(system) {
      return bySystem.get(system)?.some((m) => m.visible) ?? false;
    },
  };
}
