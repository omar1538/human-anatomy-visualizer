// Track A: tests for the slicing plane and its filled cross-section.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as THREE from 'three/webgpu';
import { createSlicer, isClosedMesh } from '../src/render/slicing.js';

function openBox() {
  // A box with its top face removed: four edges belong to only one triangle.
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const index = Array.from(geometry.index.array);
  index.splice(2 * 6, 6); // BoxGeometry face order: +x, -x, +y, -y, +z, -z
  geometry.setIndex(index);
  return geometry;
}

function setup() {
  const scene = new THREE.Scene();
  const model = new THREE.Group();
  const closed = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0x804020 }),
  );
  closed.name = 'closed_part';
  const open = new THREE.Mesh(openBox(), new THREE.MeshStandardMaterial());
  open.name = 'open_part';
  open.position.x = 2;
  model.add(closed, open);
  scene.add(model);
  return { scene, model, closed, open, slicer: createSlicer({ scene, model }) };
}

const fillsOf = (mesh) => mesh.children.filter((c) => c.userData.sliceHelper);

describe('isClosedMesh', () => {
  test('a box is closed, even though its faces do not share vertices', () => {
    assert.equal(isClosedMesh(new THREE.BoxGeometry(1, 1, 1)), true);
  });
  test('a plane or a box with a missing face is open', () => {
    assert.equal(isClosedMesh(new THREE.PlaneGeometry(1, 1)), false);
    assert.equal(isClosedMesh(openBox()), false);
  });
});

describe('slicer', () => {
  test('wraps the model in a clipping group that is off until a slice is set', () => {
    const { scene, model, slicer } = setup();
    assert.ok(model.parent.isClippingGroup);
    assert.equal(model.parent.parent, scene);
    assert.equal(model.parent.enabled, false);
    assert.equal(slicer.get(), null);
  });

  test('closed meshes get a hidden, unclickable inside fill; open meshes do not', () => {
    const { closed, open, slicer } = setup();
    const [fill] = fillsOf(closed);
    assert.ok(fill, 'the closed mesh has a fill');
    assert.equal(fill.visible, false);
    assert.equal(fill.material.side, THREE.BackSide);
    assert.equal(fill.geometry, closed.geometry, 'the fill reuses the geometry');
    const hits = [];
    fill.raycast(new THREE.Raycaster(), hits);
    assert.equal(hits.length, 0);
    assert.equal(fillsOf(open).length, 0);
    assert.deepEqual(slicer.openMeshes(), ['open_part']);
  });

  test('setting a slice turns the fills on and shows open meshes from both sides', () => {
    const { model, closed, open, slicer } = setup();
    slicer.set({ axis: 'z', position: 0.5 });
    assert.equal(model.parent.enabled, true);
    assert.equal(fillsOf(closed)[0].visible, true);
    assert.equal(open.material.side, THREE.DoubleSide);
    assert.deepEqual(slicer.get(), { axis: 'z', position: 0.5, flip: false });
  });

  test('by default the part towards +axis is removed, and `flip` keeps it instead', () => {
    const { slicer } = setup(); // the model spans z from -0.5 to 0.5, so the cut is at z = 0
    slicer.set({ axis: 'z', position: 0.5 });
    assert.equal(slicer.keeps(new THREE.Vector3(0, 0, -0.3)), true);
    assert.equal(slicer.keeps(new THREE.Vector3(0, 0, 0.3)), false);
    slicer.set({ axis: 'z', position: 0.5, flip: true });
    assert.equal(slicer.keeps(new THREE.Vector3(0, 0, -0.3)), false);
    assert.equal(slicer.keeps(new THREE.Vector3(0, 0, 0.3)), true);
  });

  test('the position goes across the model and is clamped to 0..1', () => {
    const { slicer } = setup(); // x spans -0.5 (closed box) to 2.5 (open box)
    slicer.set({ axis: 'x', position: 0.5 }); // cut at x = 1
    assert.equal(slicer.keeps(new THREE.Vector3(0.9, 0, 0)), true);
    assert.equal(slicer.keeps(new THREE.Vector3(1.1, 0, 0)), false);
    slicer.set({ axis: 'x', position: 7 });
    assert.equal(slicer.get().position, 1);
  });

  test('clearing restores everything, and every point is kept again', () => {
    const { model, closed, open, slicer } = setup();
    const side = open.material.side;
    slicer.set({ axis: 'y', position: 0.2 });
    slicer.clear();
    assert.equal(model.parent.enabled, false);
    assert.equal(fillsOf(closed)[0].visible, false);
    assert.equal(open.material.side, side);
    assert.equal(slicer.get(), null);
    assert.equal(slicer.keeps(new THREE.Vector3(0, 99, 0)), true);
  });

  test('an unknown axis is refused', () => {
    const { slicer } = setup();
    assert.throws(() => slicer.set({ axis: 'w' }), /Unknown slice axis/);
  });

  test('dispose removes the fills and puts the model back in the scene', () => {
    const { scene, model, closed, slicer } = setup();
    slicer.dispose();
    assert.equal(model.parent, scene);
    assert.equal(fillsOf(closed).length, 0);
  });
});

describe('the real heart model', () => {
  // Reads heart.glb directly, so the test needs no browser: which structures can be filled.
  test('25 of its 29 structures are closed and can show a filled cut', () => {
    const glb = readFileSync(new URL('../public/assets/models/heart.glb', import.meta.url));
    const jsonLength = glb.readUInt32LE(12);
    const json = JSON.parse(glb.subarray(20, 20 + jsonLength).toString());
    const bin = glb.subarray(20 + jsonLength + 8);
    const accessor = (i) => {
      const a = json.accessors[i];
      const view = json.bufferViews[a.bufferView];
      const offset = bin.byteOffset + (view.byteOffset ?? 0) + (a.byteOffset ?? 0);
      const Type =
        a.componentType === 5126
          ? Float32Array
          : a.componentType === 5125
            ? Uint32Array
            : Uint16Array;
      const n = a.count * (a.type === 'VEC3' ? 3 : 1);
      return new Type(bin.buffer.slice(offset, offset + n * Type.BYTES_PER_ELEMENT));
    };
    const open = [];
    let total = 0;
    for (const node of json.nodes) {
      if (node.mesh === undefined) continue;
      total++;
      const primitive = json.meshes[node.mesh].primitives[0];
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(accessor(primitive.attributes.POSITION), 3),
      );
      geometry.setIndex(new THREE.BufferAttribute(accessor(primitive.indices), 1));
      if (!isClosedMesh(geometry)) open.push(node.name);
    }
    assert.equal(total, 29);
    assert.deepEqual(open.sort(), [
      'aortic_valve',
      'inferior_vena_cava',
      'papillary_muscles',
      'right_atrium',
    ]);
  });
});
