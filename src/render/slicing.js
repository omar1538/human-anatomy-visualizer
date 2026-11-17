// Track A: slicing plane with a filled cross-section.
//
// A clipping plane (ClippingGroup) cuts the model. On its own the cut would look hollow, so each
// closed mesh gets an "inside" copy: the same geometry drawn with its back faces only, in a flat,
// slightly darker colour. While the model is whole, those back faces are hidden behind the front
// faces. Once the front is cut away, looking through the cut shows exactly those back faces where
// the plane crosses solid tissue, which reads as a filled cross-section; hollow spaces (such as
// the inside of the chambers) still show their real inner walls.
// Meshes with holes cannot be filled reliably, so they are drawn double-sided instead.
import * as THREE from 'three/webgpu';

const AXES = {
  x: new THREE.Vector3(1, 0, 0), // left-right cut (sagittal)
  y: new THREE.Vector3(0, 1, 0), // top-bottom cut (transverse)
  z: new THREE.Vector3(0, 0, 1), // front-back cut (coronal)
};
const FILL_SHADE = 0.7; // the cut surface is drawn darker than the outside, so it reads as a cut

/**
 * Whether a mesh is closed (watertight): every edge is shared by exactly two triangles.
 * Vertices are compared by position, so seams that only split normals do not count as holes.
 * @param {THREE.BufferGeometry} geometry
 */
export function isClosedMesh(geometry) {
  const position = geometry.attributes.position;
  if (!position) return false;
  const key = (i) =>
    `${Math.round(position.getX(i) * 1e5)},${Math.round(position.getY(i) * 1e5)},${Math.round(position.getZ(i) * 1e5)}`;
  const index = geometry.index;
  const count = index ? index.count : position.count;
  const vertex = (n) => (index ? index.getX(n) : n);
  const edges = new Map();
  for (let t = 0; t < count; t += 3) {
    const k = [key(vertex(t)), key(vertex(t + 1)), key(vertex(t + 2))];
    for (const [a, b] of [
      [0, 1],
      [1, 2],
      [2, 0],
    ]) {
      const edge = k[a] < k[b] ? `${k[a]}|${k[b]}` : `${k[b]}|${k[a]}`;
      edges.set(edge, (edges.get(edge) ?? 0) + 1);
    }
  }
  if (edges.size === 0) return false;
  for (const n of edges.values()) if (n !== 2) return false;
  return true;
}

const noRaycast = () => {};

/**
 * Puts the model inside a ClippingGroup, whose plane cuts it, and prepares the cut-surface fill.
 * @param {object} options
 * @param {THREE.Scene} options.scene
 * @param {THREE.Object3D} options.model already added to the scene
 */
export function createSlicer({ scene, model }) {
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0);
  const clipGroup = new THREE.ClippingGroup();
  clipGroup.clippingPlanes = [plane];
  clipGroup.enabled = false;
  scene.add(clipGroup);
  clipGroup.add(model);

  model.updateWorldMatrix(true, true);
  const bounds = new THREE.Box3().setFromObject(model);

  const fills = []; // inside copies of closed meshes
  const open = []; // meshes with holes
  const sides = new Map(); // open mesh -> its material's side before slicing

  // Collect first: the copies added below are meshes too, and must not be visited themselves.
  const meshes = [];
  model.traverse((o) => o.isMesh && meshes.push(o));
  for (const mesh of meshes) {
    if (!isClosedMesh(mesh.geometry)) {
      open.push(mesh);
      continue;
    }
    const color = mesh.material.color?.clone() ?? new THREE.Color(0xcccccc);
    const fill = new THREE.Mesh(
      mesh.geometry,
      new THREE.MeshBasicMaterial({
        color: color.multiplyScalar(FILL_SHADE),
        side: THREE.BackSide,
      }),
    );
    fill.raycast = noRaycast; // clicks go to the real mesh
    fill.visible = false;
    fill.userData.sliceHelper = true;
    mesh.add(fill); // a child: same transform, same layer visibility, and clipped with the model
    fills.push(fill);
  }

  let state = null; // { axis, position, flip } while slicing

  function placePlane({ axis, position, flip }) {
    const i = 'xyz'.indexOf(axis);
    const cut =
      bounds.min.getComponent(i) +
      (bounds.max.getComponent(i) - bounds.min.getComponent(i)) * position;
    // Three.js keeps the side where the plane's distance is positive.
    // By default the part beyond the cut (towards +axis) is removed; `flip` removes the other part.
    plane.normal.copy(AXES[axis]).multiplyScalar(flip ? 1 : -1);
    plane.constant = flip ? -cut : cut;
  }

  function setVisible(on) {
    fills.forEach((f) => (f.visible = on));
    for (const mesh of open) {
      // Open meshes cannot be filled: show both sides so their inside walls stay visible.
      if (on && !sides.has(mesh)) {
        sides.set(mesh, mesh.material.side);
        mesh.material.side = THREE.DoubleSide;
      } else if (!on && sides.has(mesh)) {
        mesh.material.side = sides.get(mesh);
        sides.delete(mesh);
      } else continue;
      mesh.material.needsUpdate = true;
    }
  }

  return {
    /**
     * @param {{ axis?: 'x' | 'y' | 'z', position?: number, flip?: boolean }} [options]
     * `position` goes from 0 to 1 across the model along `axis`.
     */
    set({ axis = 'z', position = 0.5, flip = false } = {}) {
      if (!AXES[axis]) throw new Error(`Unknown slice axis "${axis}": use x, y or z`);
      state = { axis, position: THREE.MathUtils.clamp(position, 0, 1), flip: Boolean(flip) };
      placePlane(state);
      clipGroup.enabled = true;
      setVisible(true);
    },
    clear() {
      state = null;
      clipGroup.enabled = false;
      setVisible(false);
    },
    /** @returns {{ axis: string, position: number, flip: boolean } | null} */
    get: () => (state ? { ...state } : null),
    /** Whether a point is on the kept side (used so cut-away parts cannot be clicked). */
    keeps: (point) => !state || plane.distanceToPoint(point) >= 0,
    /** Ids of meshes that cannot get a filled cut because they have holes. */
    openMeshes: () => open.map((m) => m.name),
    dispose() {
      this.clear();
      for (const fill of fills) {
        fill.removeFromParent();
        fill.material.dispose();
      }
      scene.add(model);
      scene.remove(clipGroup);
    },
  };
}
