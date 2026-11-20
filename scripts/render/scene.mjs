// Track A: scene, camera and lights.
import * as THREE from 'three/webgpu';

/** @param {number} aspect */
export function createScene(aspect) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0f1520);

  const camera = new THREE.PerspectiveCamera(40, aspect, 0.05, 100);
  camera.position.set(0, 1, 4);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x3a4660, 1.1));
  const key = new THREE.DirectionalLight(0xffffff, 2.0);
  key.position.set(2, 4, 3);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x88aaff, 0.8);
  rim.position.set(-3, 2, -3);
  scene.add(rim);

  return { scene, camera };
}

/**
 * Computes a camera view in which `object` fits on screen, without moving the camera.
 * The model must fit in both directions: the vertical field of view (`camera.fov`) and the
 * horizontal one, which depends on the screen shape (`camera.aspect`). On a portrait phone the
 * horizontal field is the narrow one, so fitting only the height cut the model off left and right.
 * The camera looks along -Z, so the box's front face (at +half.z) is the closest to it.
 * @param {THREE.PerspectiveCamera} camera
 * @param {THREE.Object3D} object
 * @param {{ margin?: number }} [options] `margin` > 1 leaves space around the model
 * @returns {{ position: THREE.Vector3, target: THREE.Vector3, near: number, far: number }}
 */
export function computeFraming(camera, object, { margin = 1.08 } = {}) {
  const box = new THREE.Box3().setFromObject(object);
  const empty = box.isEmpty();
  const center = empty ? new THREE.Vector3() : box.getCenter(new THREE.Vector3());
  const half = empty
    ? new THREE.Vector3(0.5, 0.5, 0.5)
    : box.getSize(new THREE.Vector3()).multiplyScalar(0.5);

  const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
  const tanH = tanV * camera.aspect;
  // Distance from the box centre so that the front face fits in both fields of view.
  const distance = half.z + margin * Math.max(half.x / tanH, half.y / tanV) || 1;
  const lift = Math.max(half.x, half.y, half.z) * 0.1; // look slightly from above

  return {
    position: center.clone().add(new THREE.Vector3(0, lift, distance)),
    target: center,
    near: Math.max(distance / 100, 0.01),
    far: distance * 20,
  };
}

/**
 * Places the camera so that `object` fits on the current screen shape.
 * @returns {{ position: THREE.Vector3, target: THREE.Vector3 }} the default view (used by reset)
 */
export function frameObject(camera, object) {
  const { position, target, near, far } = computeFraming(camera, object);
  camera.position.copy(position);
  camera.near = near;
  camera.far = far;
  camera.updateProjectionMatrix();
  return { position, target };
}
