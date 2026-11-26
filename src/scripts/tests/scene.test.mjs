// Camera framing: the whole model must be on screen in portrait (phone) and landscape (laptop).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three/webgpu';
import { computeFraming, frameObject } from '../render/scene.mjs';

const PORTRAIT = 9 / 19.5; // a typical phone held upright
const LANDSCAPE = 16 / 9;

// A box shaped roughly like the heart: 9 cm wide, 12 cm tall, 8 cm deep.
function heartLikeBox() {
  return new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.12, 0.08));
}

function cameraFor(aspect) {
  return new THREE.PerspectiveCamera(40, aspect, 0.05, 100);
}

/** Largest |x| and |y| of the box's 8 corners in normalised device coordinates (on screen if <= 1). */
function cornersOnScreen(camera, object, target) {
  camera.lookAt(target);
  camera.updateMatrixWorld();
  camera.updateProjectionMatrix();
  const box = new THREE.Box3().setFromObject(object);
  let maxX = 0;
  let maxY = 0;
  for (const x of [box.min.x, box.max.x])
    for (const y of [box.min.y, box.max.y])
      for (const z of [box.min.z, box.max.z]) {
        const p = new THREE.Vector3(x, y, z).project(camera);
        maxX = Math.max(maxX, Math.abs(p.x));
        maxY = Math.max(maxY, Math.abs(p.y));
      }
  return { maxX, maxY };
}

for (const [name, aspect] of [
  ['portrait phone 9/19.5', PORTRAIT],
  ['landscape 16/9', LANDSCAPE],
]) {
  test(`${name}: all 8 corners of the model are on screen`, () => {
    const camera = cameraFor(aspect);
    const model = heartLikeBox();
    const { target } = frameObject(camera, model);
    const { maxX, maxY } = cornersOnScreen(camera, model, target);
    assert.ok(maxX <= 1, `left/right edge off screen: ${maxX.toFixed(3)}`);
    assert.ok(maxY <= 1, `top/bottom edge off screen: ${maxY.toFixed(3)}`);
  });
}

test('the old formula (vertical field of view only) cut the model off in portrait', () => {
  const camera = cameraFor(PORTRAIT);
  const model = heartLikeBox();
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const radius = Math.max(size.x, size.y, size.z) * 0.5;
  const distance = (radius / Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)) * 1.2;
  camera.position.set(0, radius * 0.1, distance);
  const { maxX } = cornersOnScreen(camera, model, new THREE.Vector3());
  assert.ok(maxX > 1, 'the old framing should overflow left and right on a portrait phone');
});

test('portrait puts the camera further away than landscape', () => {
  const model = heartLikeBox();
  const target = new THREE.Vector3();
  const portrait = computeFraming(cameraFor(PORTRAIT), model).position.distanceTo(target);
  const landscape = computeFraming(cameraFor(LANDSCAPE), model).position.distanceTo(target);
  assert.ok(portrait > landscape * 1.5, `${portrait} vs ${landscape}`);
});

test('computeFraming does not move the camera', () => {
  const camera = cameraFor(PORTRAIT);
  camera.position.set(1, 2, 3);
  computeFraming(camera, heartLikeBox());
  assert.deepEqual(camera.position.toArray(), [1, 2, 3]);
});

test('an empty object still gives a usable view', () => {
  const view = computeFraming(cameraFor(LANDSCAPE), new THREE.Group());
  assert.ok(Number.isFinite(view.position.z) && view.position.z > 0);
  assert.ok(view.near > 0 && view.far > view.near);
});
