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
 * Places the camera so that `object` fits in view.
 * @returns {{ position: THREE.Vector3, target: THREE.Vector3 }} the default view (used by reset)
 */
export function frameObject(camera, object) {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const radius = Math.max(size.x, size.y, size.z) * 0.5 || 1;
  const distance = (radius / Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)) * 1.2;
  const position = center.clone().add(new THREE.Vector3(0, radius * 0.1, distance));
  camera.position.copy(position);
  camera.near = Math.max(distance / 100, 0.01);
  camera.far = distance * 20;
  camera.updateProjectionMatrix();
  return { position, target: center };
}
