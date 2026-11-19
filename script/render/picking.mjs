// Track A: click or tap an organ to select it, with a highlight.
// Selection can also be a whole group by id (for example "valves"), as the data contract allows.
import * as THREE from 'three/webgpu';

const HIGHLIGHT = new THREE.Color(0xffb703);
const DRAG_THRESHOLD_PX = 5; // a pointer that moved more than this was an orbit drag, not a click

function isEffectivelyVisible(obj) {
  for (let o = obj; o; o = o.parent) if (!o.visible) return false;
  return true;
}

/** Meshes under `object` (itself included) that can show the highlight. */
function highlightableMeshes(object) {
  const meshes = [];
  object.traverse((o) => {
    if (o.isMesh && o.material?.emissive) meshes.push(o);
  });
  return meshes;
}

/**
 * @param {object} options
 * @param {(hit: THREE.Intersection) => boolean} [options.accept] extra test for a hit, for example
 * to ignore the parts a slicing plane has cut away
 */
export function createPicker({ camera, domElement, root, onChange, accept = () => true }) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let selected = null; // a mesh or a group
  let saved = new Map(); // mesh -> original emissive, for every highlighted mesh
  let down = null;
  const ownMaterial = new WeakSet(); // meshes whose material was already cloned by the picker

  function unhighlight() {
    saved.forEach(({ color, intensity }, mesh) => {
      mesh.material.emissive.copy(color);
      mesh.material.emissiveIntensity = intensity;
    });
  }

  function highlight() {
    saved.forEach((_, mesh) => {
      mesh.material.emissive.copy(HIGHLIGHT);
      mesh.material.emissiveIntensity = 0.6;
    });
  }

  function setSelected(object) {
    if (selected === object) return;
    unhighlight();
    saved = new Map();
    selected = object;
    if (object) {
      for (const mesh of highlightableMeshes(object)) {
        // Each mesh must own its material, otherwise highlighting one organ would tint others.
        // Clone only the first time a mesh is selected: cloning on every selection would leave a
        // new unused material behind each time (a slow GPU memory leak).
        if (!ownMaterial.has(mesh)) {
          mesh.material = mesh.material.clone();
          ownMaterial.add(mesh);
        }
        saved.set(mesh, {
          color: mesh.material.emissive.clone(),
          intensity: mesh.material.emissiveIntensity,
        });
      }
      highlight();
    }
    onChange(object ? object.name : null, object);
  }

  function pick(clientX, clientY) {
    const rect = domElement.getBoundingClientRect();
    pointer.set(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointer, camera);
    // three.js raycasting ignores `visible`, so hidden systems are filtered out by hand.
    const hits = raycaster
      .intersectObject(root, true)
      .filter((h) => h.object.isMesh && isEffectivelyVisible(h.object) && accept(h));
    setSelected(hits[0]?.object ?? null);
  }

  const onDown = (e) => (down = { x: e.clientX, y: e.clientY });
  const onUp = (e) => {
    if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) < DRAG_THRESHOLD_PX) {
      pick(e.clientX, e.clientY);
    }
    down = null;
  };
  domElement.addEventListener('pointerdown', onDown);
  domElement.addEventListener('pointerup', onUp);

  return {
    /**
     * Selects by organ or group id (node name). Used by search and quiz features (Track C).
     * An unknown id, or a node with no mesh under it, clears the selection.
     */
    selectById(id) {
      const object = id ? root.getObjectByName(id) : null;
      let hasMesh = false;
      object?.traverse((o) => (hasMesh ||= o.isMesh));
      setSelected(hasMesh ? object : null);
    },
    clear: () => setSelected(null),
    /** @returns {THREE.Object3D | null} the selected mesh or group */
    selected: () => selected,
    /** Runs `fn` with the highlight removed, for example to copy the selection for AR. */
    withoutHighlight(fn) {
      unhighlight();
      try {
        return fn();
      } finally {
        highlight();
      }
    },
    dispose() {
      domElement.removeEventListener('pointerdown', onDown);
      domElement.removeEventListener('pointerup', onUp);
    },
  };
}
