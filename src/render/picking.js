// Track A: click or tap an organ to select it, with a highlight.
import * as THREE from 'three/webgpu';

const HIGHLIGHT = new THREE.Color(0xffb703);
const DRAG_THRESHOLD_PX = 5; // a pointer that moved more than this was an orbit drag, not a click

function isEffectivelyVisible(obj) {
  for (let o = obj; o; o = o.parent) if (!o.visible) return false;
  return true;
}

export function createPicker({ camera, domElement, root, onChange }) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let selected = null;
  let saved = null; // original emissive of the selected mesh
  let down = null;

  function setSelected(mesh) {
    if (selected === mesh) return;
    if (selected) {
      selected.material.emissive.copy(saved.color);
      selected.material.emissiveIntensity = saved.intensity;
    }
    selected = mesh;
    if (mesh) {
      // Each mesh must own its material, otherwise highlighting one organ would tint others.
      mesh.material = mesh.material.clone();
      saved = { color: mesh.material.emissive.clone(), intensity: mesh.material.emissiveIntensity };
      mesh.material.emissive.copy(HIGHLIGHT);
      mesh.material.emissiveIntensity = 0.6;
    }
    onChange(mesh ? mesh.name : null, mesh);
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
      .filter((h) => h.object.isMesh && isEffectivelyVisible(h.object));
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
    /** Selects by organ id (mesh name). Used by search and quiz features (Track C). */
    selectById(id) {
      setSelected(id ? (root.getObjectByName(id) ?? null) : null);
    },
    clear: () => setSelected(null),
    dispose() {
      domElement.removeEventListener('pointerdown', onDown);
      domElement.removeEventListener('pointerup', onUp);
    },
  };
}
