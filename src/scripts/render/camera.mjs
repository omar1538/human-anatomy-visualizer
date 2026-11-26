// Track A: camera moves. Where to put the camera to frame a structure, and a smooth flight there.
// Plain maths on Three.js vectors, no GPU: covered by src/scripts/tests/camera.test.mjs.
import * as THREE from 'three/webgpu';

const FRAME_MARGIN = 1.35; // 1 = the structure touches the edges of the view; more = some space around

/**
 * Camera position and target that frame `object`, seen from `direction` (the current viewing
 * direction, so the view does not spin round). Only visible meshes count, so hidden layers do not
 * make the frame too large.
 * @param {THREE.Object3D} object an organ or a group
 * @param {number} fov vertical field of view of the camera, in degrees
 * @param {THREE.Vector3} direction from the target towards the camera
 * @returns {{ position: THREE.Vector3, target: THREE.Vector3 } | null} null if nothing is visible
 */
export function framingFor(object, fov, direction) {
  object.updateWorldMatrix(true, true);
  const box = new THREE.Box3();
  object.traverse((o) => {
    if (o.isMesh && o.visible && !o.userData.sliceHelper) box.expandByObject(o);
  });
  if (box.isEmpty()) return null;
  const sphere = box.getBoundingSphere(new THREE.Sphere());
  // Distance at which a sphere of this radius just fits the vertical field of view.
  const distance = (sphere.radius / Math.sin(THREE.MathUtils.degToRad(fov) / 2)) * FRAME_MARGIN;
  const towardsCamera = direction.clone().normalize();
  if (towardsCamera.lengthSq() === 0) towardsCamera.set(0, 0, 1);
  return {
    position: sphere.center.clone().addScaledVector(towardsCamera, distance),
    target: sphere.center.clone(),
  };
}

/** Slow start, fast middle, slow end. `t` from 0 to 1. */
export const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/**
 * A camera flight from one view to another.
 * @param {{ position: THREE.Vector3, target: THREE.Vector3 }} from
 * @param {{ position: THREE.Vector3, target: THREE.Vector3 }} to
 * @param {number} durationMs 0 jumps straight to the end
 * @param {number} startMs the time the flight starts (same clock as `at`)
 */
export function createFlight(from, to, durationMs, startMs) {
  const start = { position: from.position.clone(), target: from.target.clone() };
  const end = { position: to.position.clone(), target: to.target.clone() };
  return {
    end,
    /**
     * @param {number} nowMs
     * @returns {{ position: THREE.Vector3, target: THREE.Vector3, done: boolean }}
     */
    at(nowMs) {
      const t = durationMs > 0 ? Math.min(Math.max((nowMs - startMs) / durationMs, 0), 1) : 1;
      const k = easeInOutCubic(t);
      return {
        position: start.position.clone().lerp(end.position, k),
        target: start.target.clone().lerp(end.target, k),
        done: t >= 1,
      };
    },
  };
}
