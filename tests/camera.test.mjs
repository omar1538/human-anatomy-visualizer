// Track A: tests for the camera framing and the fly-to flight (scripts/render/camera.mjs).
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three/webgpu';
import { createFlight, easeInOutCubic, framingFor } from '../scripts/render/camera.mjs';

const near = (a, b, eps = 1e-6) => Math.abs(a - b) < eps;
const box = (size, x = 0) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), new THREE.MeshBasicMaterial());
  m.position.x = x;
  return m;
};

describe('framingFor', () => {
  test('targets the centre of the structure and keeps the viewing direction', () => {
    const organ = box(0.02, 0.1);
    const view = framingFor(organ, 40, new THREE.Vector3(0, 0, 5));
    assert.ok(near(view.target.x, 0.1) && near(view.target.y, 0) && near(view.target.z, 0));
    const dir = view.position.clone().sub(view.target).normalize();
    assert.ok(near(dir.z, 1), 'the camera stays in front, on the same side as before');
  });

  test('the whole structure fits in the field of view', () => {
    const organ = box(0.05);
    const fov = 40;
    const view = framingFor(organ, fov, new THREE.Vector3(1, 1, 1));
    const radius = new THREE.Box3()
      .setFromObject(organ)
      .getBoundingSphere(new THREE.Sphere()).radius;
    const distance = view.position.distanceTo(view.target);
    const fits = radius / distance <= Math.sin(THREE.MathUtils.degToRad(fov) / 2);
    assert.ok(fits);
  });

  test('a smaller structure brings the camera closer', () => {
    const dir = new THREE.Vector3(0, 0, 1);
    const big = framingFor(box(0.1), 40, dir);
    const small = framingFor(box(0.01), 40, dir);
    assert.ok(small.position.distanceTo(small.target) < big.position.distanceTo(big.target));
  });

  test('a group is framed as a whole, hidden meshes and slicing helpers do not count', () => {
    const group = new THREE.Group();
    const hidden = box(0.02, 5);
    hidden.visible = false;
    const helper = box(0.02, -5);
    helper.userData.sliceHelper = true;
    group.add(box(0.02, 0), box(0.02, 0.1), hidden, helper);
    const view = framingFor(group, 40, new THREE.Vector3(0, 0, 1));
    assert.ok(near(view.target.x, 0.05), 'centred between the two visible boxes');
  });

  test('nothing visible gives null', () => {
    const organ = box(0.02);
    organ.visible = false;
    assert.equal(framingFor(organ, 40, new THREE.Vector3(0, 0, 1)), null);
    assert.equal(framingFor(new THREE.Group(), 40, new THREE.Vector3(0, 0, 1)), null);
  });
});

describe('createFlight', () => {
  const from = { position: new THREE.Vector3(0, 0, 10), target: new THREE.Vector3(0, 0, 0) };
  const to = { position: new THREE.Vector3(1, 2, 3), target: new THREE.Vector3(1, 1, 1) };

  test('starts at the current view and ends exactly at the goal', () => {
    const flight = createFlight(from, to, 1000, 0);
    const start = flight.at(0);
    assert.ok(start.position.equals(from.position) && !start.done);
    const end = flight.at(1000);
    assert.ok(end.position.equals(to.position) && end.target.equals(to.target) && end.done);
    assert.ok(flight.at(5000).position.equals(to.position), 'stays at the goal afterwards');
  });

  test('moves smoothly: halfway in time is halfway in space, slower at both ends', () => {
    const flight = createFlight(from, to, 1000, 0);
    const mid = flight.at(500);
    assert.ok(near(mid.position.x, 0.5) && near(mid.target.y, 0.5));
    assert.ok(easeInOutCubic(0.1) < 0.1 && easeInOutCubic(0.9) > 0.9);
  });

  test('a zero duration jumps to the goal', () => {
    const step = createFlight(from, to, 0, 0).at(0);
    assert.ok(step.position.equals(to.position) && step.done);
  });

  test('does not change the vectors it was given', () => {
    const a = { position: from.position.clone(), target: from.target.clone() };
    createFlight(a, to, 1000, 0).at(500);
    assert.ok(a.position.equals(from.position));
  });
});
