// Track A: tests for the x-ray mode and the cut-surface shader. The shaders themselves run on the
// GPU; these tests check everything around them that does not need one: which material each mesh
// uses, restoring, disposal, and how x-ray works with selection, slicing and the AR copy.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three/webgpu';
import { createCutMaterial, createXRayMaterial } from '../render/shaders.mjs';
import { createXRay } from '../render/xray.mjs';
import { createPicker } from '../render/picking.mjs';
import { createSlicer } from '../render/slicing.mjs';
import { buildPlacement } from '../render/xr.mjs';

const fakeDom = () => ({ addEventListener() {}, removeEventListener() {} });
const HIGHLIGHT = new THREE.Color(0xffb703).getHex();

/** heart > chambers > {left_ventricle, right_ventricle} sharing one material, valves > open sheet. */
function heart() {
  const shared = new THREE.MeshStandardMaterial({ color: 0xaa3333 });
  const box = (name, x) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.03, 0.02), shared);
    m.name = name;
    m.position.x = x;
    return m;
  };
  const model = new THREE.Group();
  const chambers = new THREE.Group();
  chambers.name = 'chambers';
  chambers.add(box('left_ventricle', 0), box('right_ventricle', 0.03));
  const valves = new THREE.Group();
  valves.name = 'valves';
  const sheet = new THREE.Mesh(
    new THREE.PlaneGeometry(0.02, 0.02),
    new THREE.MeshStandardMaterial(),
  );
  sheet.name = 'aortic_valve'; // open mesh: no cut fill, drawn double-sided while slicing
  sheet.position.x = 0.06;
  valves.add(sheet);
  model.add(chambers, valves);
  const get = (n) => model.getObjectByName(n);
  return { model, shared, lv: get('left_ventricle'), rv: get('right_ventricle'), sheet };
}

describe('shader materials', () => {
  test('x-ray material: transparent node material with a rim shader and a highlight input', () => {
    const base = new THREE.Color(0x336699);
    const m = createXRayMaterial(base);
    assert.ok(m.isNodeMaterial);
    assert.equal(m.transparent, true);
    assert.equal(m.depthWrite, false);
    assert.equal(m.side, THREE.DoubleSide);
    assert.ok(m.colorNode && m.opacityNode, 'colour and opacity come from the node graph');
    assert.ok(m.emissive?.isColor && typeof m.emissiveIntensity === 'number');
    assert.equal(m.userData.perMesh, true);
    assert.equal(base.getHex(), 0x336699, 'the source colour is not modified');
  });

  test('cut material: node material drawn on back faces with a hatching shader', () => {
    const m = createCutMaterial(new THREE.Color(0x804020));
    assert.ok(m.isNodeMaterial);
    assert.equal(m.side, THREE.BackSide);
    assert.ok(m.colorNode);
    assert.equal(m.userData.cut, true);
  });

  test('slicing fills use the cut material', () => {
    const { model } = heart();
    const scene = new THREE.Scene();
    scene.add(model);
    createSlicer({ scene, model });
    const fills = [];
    model.traverse((o) => o.userData.sliceHelper && fills.push(o));
    assert.equal(fills.length, 2, 'one per closed mesh (the two boxes)');
    assert.ok(fills.every((f) => f.material.userData.cut === true));
  });
});

describe('x-ray mode', () => {
  test('switches every anatomy mesh to an x-ray material and back to the exact same materials', () => {
    const { model, lv, sheet } = heart();
    const before = new Map([lv, sheet].map((m) => [m, m.material]));
    const xray = createXRay({ model });
    xray.set(true);
    assert.equal(xray.isEnabled(), true);
    assert.ok(lv.material.userData.xray && sheet.material.userData.xray);
    xray.set(false);
    before.forEach((material, mesh) => assert.equal(mesh.material, material));
  });

  test('each mesh gets its own x-ray material, tinted with its colour', () => {
    const { model, lv, rv } = heart();
    const xray = createXRay({ model });
    xray.set(true);
    assert.notEqual(lv.material, rv.material, 'shared normal material, separate x-ray materials');
  });

  test('repeated toggling reuses the same materials: no leak', () => {
    const { model, lv } = heart();
    const xray = createXRay({ model });
    xray.set(true);
    const first = lv.material;
    for (let i = 0; i < 20; i++) {
      xray.set(false);
      xray.set(true);
    }
    assert.equal(lv.material, first);
    assert.equal(xray.materialCount(), 3, 'one per mesh, never more');
  });

  test('setting the same value twice does nothing', () => {
    const { model, lv } = heart();
    const xray = createXRay({ model });
    const normal = lv.material;
    xray.set(false);
    assert.equal(lv.material, normal);
    xray.set(true);
    xray.set(true);
    xray.set(false);
    assert.equal(lv.material, normal);
  });

  test('withoutXRay puts the normal materials back only while it runs', () => {
    const { model, lv, shared } = heart();
    const xray = createXRay({ model });
    xray.set(true);
    assert.equal(
      xray.withoutXRay(() => lv.material),
      shared,
    );
    assert.ok(lv.material.userData.xray);
  });

  test('slicing helpers keep their own material', () => {
    const { model } = heart();
    const scene = new THREE.Scene();
    scene.add(model);
    createSlicer({ scene, model });
    const xray = createXRay({ model });
    xray.set(true);
    model.traverse((o) => {
      if (o.userData.sliceHelper) assert.equal(o.material.userData.cut, true);
    });
  });

  test('dispose restores the normal materials and releases every x-ray material once', () => {
    const { model, lv, shared } = heart();
    const xray = createXRay({ model });
    xray.set(true);
    const disposed = new Set();
    model.traverse((o) => {
      if (!o.isMesh) return;
      const material = o.material; // the x-ray material, captured now
      material.addEventListener('dispose', () => disposed.add(material));
    });
    xray.dispose();
    assert.equal(lv.material, shared);
    assert.equal(disposed.size, 3);
    assert.equal(xray.isEnabled(), false);
  });
});

describe('x-ray with selection', () => {
  function setup() {
    const t = heart();
    const picker = createPicker({
      camera: new THREE.PerspectiveCamera(),
      domElement: fakeDom(),
      root: t.model,
      onChange() {},
    });
    const xray = createXRay({ model: t.model });
    // What viewer.setXRay does: move the highlight from the old materials to the new ones.
    const setXRay = (on) => picker.withoutHighlight(() => xray.set(on));
    return { ...t, picker, xray, setXRay };
  }

  test('a selection made in normal mode stays highlighted in x-ray mode, and back', () => {
    const { lv, rv, picker, setXRay } = setup();
    picker.selectById('left_ventricle');
    const normal = lv.material;
    setXRay(true);
    assert.equal(lv.material.emissive.getHex(), HIGHLIGHT, 'x-ray material glows');
    assert.equal(normal.emissive.getHex(), 0, 'the normal material is back to its own emissive');
    assert.equal(rv.material.emissive.getHex(), 0, 'other organs do not glow');
    setXRay(false);
    assert.equal(lv.material, normal);
    assert.equal(lv.material.emissive.getHex(), HIGHLIGHT);
  });

  test('selecting in x-ray mode, then leaving it, never tints a shared material', () => {
    const { lv, rv, shared, picker, setXRay } = setup();
    setXRay(true);
    picker.selectById('left_ventricle');
    assert.equal(lv.material.emissive.getHex(), HIGHLIGHT);
    setXRay(false);
    assert.equal(lv.material.emissive.getHex(), HIGHLIGHT, 'highlighted on its own copy');
    assert.notEqual(lv.material, shared);
    assert.equal(shared.emissive.getHex(), 0);
    assert.equal(rv.material.emissive.getHex(), 0);
  });

  test('a group selection glows on every x-ray material of the group', () => {
    const { lv, rv, sheet, picker, setXRay } = setup();
    setXRay(true);
    picker.selectById('chambers');
    assert.ok([lv, rv].every((m) => m.material.emissive.getHex() === HIGHLIGHT));
    assert.equal(sheet.material.emissive.getHex(), 0);
    picker.selectById(null);
    assert.ok([lv, rv].every((m) => m.material.emissive.getHex() === 0));
  });

  test('the AR copy is made with the normal materials, without highlight or x-ray', () => {
    const { model, lv, picker, xray, setXRay } = setup();
    picker.selectById('left_ventricle');
    setXRay(true);
    const prepareCopy = (fn) => picker.withoutHighlight(() => xray.withoutXRay(fn));
    const placed = prepareCopy(() => buildPlacement(model, {}));
    const copies = [];
    placed.object.traverse((o) => o.isMesh && copies.push(o));
    assert.equal(copies.length, 3);
    assert.ok(
      copies.every((c) => !c.material.userData.xray),
      'no x-ray material in the copy',
    );
    assert.ok(
      copies.every((c) => c.material.emissive.getHex() === 0),
      'no highlight in the copy',
    );
    assert.ok(lv.material.userData.xray, 'the viewer is still in x-ray mode');
    assert.equal(lv.material.emissive.getHex(), HIGHLIGHT, 'and the selection still glows');
  });
});

describe('x-ray with slicing', () => {
  function setup() {
    const t = heart();
    const scene = new THREE.Scene();
    scene.add(t.model);
    const slicer = createSlicer({ scene, model: t.model });
    const xray = createXRay({ model: t.model });
    const setXRay = (on) => {
      xray.set(on);
      slicer.refresh();
    };
    return { ...t, slicer, setXRay, normalSide: t.sheet.material.side };
  }

  test('x-ray switched on while slicing, then off: open meshes stay double-sided', () => {
    const { sheet, slicer, setXRay } = setup();
    slicer.set({ axis: 'z' });
    setXRay(true);
    setXRay(false);
    assert.equal(sheet.material.side, THREE.DoubleSide);
  });

  test('slicing started during x-ray: after x-ray, the normal material gets its slicing side', () => {
    const { sheet, slicer, setXRay } = setup();
    setXRay(true);
    slicer.set({ axis: 'x' });
    setXRay(false);
    assert.equal(sheet.material.side, THREE.DoubleSide);
  });

  test('slicing cleared during x-ray: after x-ray, the normal material is restored', () => {
    const { sheet, slicer, setXRay, normalSide } = setup();
    slicer.set({ axis: 'y' });
    setXRay(true);
    slicer.clear();
    setXRay(false);
    assert.equal(sheet.material.side, normalSide);
  });

  test('x-ray materials stay double-sided whatever the slicing does', () => {
    const { sheet, slicer, setXRay } = setup();
    setXRay(true);
    slicer.set({ axis: 'z' });
    slicer.clear();
    assert.equal(sheet.material.side, THREE.DoubleSide);
  });
});
