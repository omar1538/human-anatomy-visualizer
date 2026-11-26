// Track A: tests for selection, AR placement and organ metadata loading.
// Run with `npm test` (Node's built-in test runner, no extra dependency).
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three/webgpu';
import { createPicker } from '../render/picking.mjs';
import { buildPlacement, createAR, isARSupported } from '../render/xr.mjs';
import { loadOrganIndex } from '../render/loader.mjs';

const highlighted = (mesh) => mesh.material.emissive.getHex() !== 0;
const fakeDom = () => {
  const handlers = {};
  return {
    handlers,
    addEventListener: (type, fn) => (handlers[type] = fn),
    removeEventListener: () => {},
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }),
  };
};

/** A small heart-like tree: heart > chambers > {left, right}, valves > {mitral}. */
function heartTree() {
  const shared = new THREE.MeshStandardMaterial({ color: 0xaa0000 });
  const mesh = (name, x) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.03, 0.02), shared);
    m.name = name;
    m.position.x = x;
    return m;
  };
  const heart = new THREE.Group();
  heart.name = 'heart';
  const chambers = new THREE.Group();
  chambers.name = 'chambers';
  chambers.add(mesh('left_ventricle', 0), mesh('right_ventricle', 0.03));
  const valves = new THREE.Group();
  valves.name = 'valves';
  valves.add(mesh('mitral_valve', 0.06));
  heart.add(chambers, valves);
  const get = (n) => heart.getObjectByName(n);
  return {
    heart,
    chambers,
    valves,
    shared,
    lv: get('left_ventricle'),
    rv: get('right_ventricle'),
    mv: get('mitral_valve'),
  };
}

describe('picking', () => {
  let t, picker, events;
  beforeEach(() => {
    t = heartTree();
    events = [];
    picker = createPicker({
      camera: new THREE.PerspectiveCamera(),
      domElement: fakeDom(),
      root: t.heart,
      onChange: (id, object) => events.push([id, object?.type ?? null]),
    });
  });

  test('a group id selects the group and highlights only its meshes', () => {
    picker.selectById('chambers');
    assert.deepEqual(events.at(-1), ['chambers', 'Group']);
    assert.ok(highlighted(t.lv) && highlighted(t.rv) && !highlighted(t.mv));
    assert.equal(t.shared.emissive.getHex(), 0, 'the shared material is never tinted');
  });

  test('changing the selection restores the previous one', () => {
    picker.selectById('chambers');
    picker.selectById('mitral_valve');
    assert.ok(!highlighted(t.lv) && !highlighted(t.rv) && highlighted(t.mv));
  });

  test('each mesh material is cloned at most once (no memory leak)', () => {
    picker.selectById('chambers');
    const material = t.lv.material;
    picker.selectById(null);
    picker.selectById('chambers');
    assert.equal(t.lv.material, material);
  });

  test('an unknown id, or a node without meshes, clears the selection', () => {
    picker.selectById('chambers');
    picker.selectById('does_not_exist');
    assert.deepEqual(events.at(-1), [null, null]);
    const empty = new THREE.Group();
    empty.name = 'empty';
    t.heart.add(empty);
    picker.selectById('chambers');
    picker.selectById('empty');
    assert.equal(picker.selected(), null);
  });

  test('withoutHighlight removes the highlight only while it runs', () => {
    picker.selectById('chambers');
    assert.equal(
      picker.withoutHighlight(() => highlighted(t.lv)),
      false,
    );
    assert.ok(highlighted(t.lv));
  });

  test('a click selects the mesh under the pointer, unless `accept` rejects the hit', () => {
    const scene = new THREE.Scene();
    const box = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial());
    box.name = 'box';
    scene.add(box);
    scene.updateMatrixWorld(true);
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 10);
    camera.position.set(0, 0, 3);
    camera.updateMatrixWorld(true);
    const click = (accept) => {
      const dom = fakeDom();
      const picker = createPicker({ camera, domElement: dom, root: scene, accept, onChange() {} });
      dom.handlers.pointerdown({ clientX: 50, clientY: 50 });
      dom.handlers.pointerup({ clientX: 50, clientY: 50 });
      return picker.selected()?.name ?? null;
    };
    assert.equal(click(undefined), 'box');
    assert.equal(
      click(() => false),
      null,
    );
  });
});

describe('AR placement', () => {
  test('a group is copied with its real colours and its own materials', () => {
    const t = heartTree();
    const picker = createPicker({
      camera: new THREE.PerspectiveCamera(),
      domElement: fakeDom(),
      root: t.heart,
      onChange() {},
    });
    picker.selectById('chambers');
    const placed = picker.withoutHighlight(() =>
      buildPlacement(t.chambers, { size: 0.4, showAll: true }),
    );
    const copies = [];
    placed.object.traverse((o) => o.isMesh && copies.push(o));
    assert.equal(copies.length, 2);
    assert.ok(
      copies.every(
        (c) => !highlighted(c) && c.material !== t.lv.material && c.material !== t.shared,
      ),
    );
    picker.selectById('mitral_valve');
    assert.ok(
      copies.every((c) => !highlighted(c)),
      'later highlights do not leak onto the copy',
    );
    let disposed = 0;
    copies.forEach((c) => c.material.addEventListener('dispose', () => disposed++));
    placed.dispose();
    assert.equal(disposed, 2);
  });

  test('the copy is scaled to `size`, stands on its origin and leaves the original untouched', () => {
    const t = heartTree();
    t.heart.scale.setScalar(2);
    const before = t.lv.parent;
    const placed = buildPlacement(t.chambers, { size: 0.4 });
    placed.object.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(placed.object);
    const size = box.getSize(new THREE.Vector3());
    assert.ok(Math.abs(Math.max(size.x, size.y, size.z) - 0.4) < 1e-6);
    assert.ok(Math.abs(box.min.y) < 1e-6);
    assert.equal(t.lv.parent, before);
  });

  test('hidden layers stay hidden for the whole model, but not for an explicit selection', () => {
    const t = heartTree();
    t.mv.visible = false;
    let visible;
    buildPlacement(t.heart, {}).object.traverse(
      (o) => o.name === 'mitral_valve' && (visible = o.visible),
    );
    assert.equal(visible, false);
    buildPlacement(t.valves, { showAll: true }).object.traverse(
      (o) => o.name === 'mitral_valve' && (visible = o.visible),
    );
    assert.equal(visible, true);
  });

  test('slicing helpers are left out of the copy', () => {
    const t = heartTree();
    const helper = new THREE.Mesh(t.lv.geometry, new THREE.MeshBasicMaterial());
    helper.userData.sliceHelper = true;
    t.lv.add(helper);
    let helpers = 0;
    buildPlacement(t.chambers, {}).object.traverse((o) => o.userData.sliceHelper && helpers++);
    assert.equal(helpers, 0);
  });

  test('a session places the selected group, swaps it on a new selection, and restores the scene', async () => {
    class Session extends EventTarget {
      async requestReferenceSpace() {
        return {};
      }
      async requestHitTestSource() {
        throw new Error('no hit test');
      }
      async end() {
        this.dispatchEvent(new Event('end'));
      }
    }
    let session;
    const navigatorBefore = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
    Object.defineProperty(globalThis, 'navigator', {
      value: {
        xr: {
          isSessionSupported: async () => true,
          requestSession: async () => (session = new Session()),
        },
      },
      configurable: true,
      writable: true,
    });
    const warn = console.warn;
    console.warn = () => {};
    try {
      assert.equal(await isARSupported(), true);
      const t = heartTree();
      const scene = new THREE.Scene();
      const background = new THREE.Color(1, 0, 0);
      scene.background = background;
      scene.add(t.heart);
      const xrCamera = new THREE.PerspectiveCamera();
      xrCamera.matrixWorld.makeTranslation(0, 1.5, 0);
      const renderer = {
        xr: {
          setReferenceSpaceType() {},
          async setSession() {},
          getCamera: () => xrCamera,
          getReferenceSpace: () => ({}),
        },
      };
      const picker = createPicker({
        camera: new THREE.PerspectiveCamera(),
        domElement: fakeDom(),
        root: t.heart,
        onChange() {},
      });
      const ar = createAR({
        renderer,
        scene,
        camera: new THREE.PerspectiveCamera(),
        model: t.heart,
        picker,
        onChange() {},
      });
      const placedNames = () => {
        const names = [];
        scene.children
          .filter((o) => o.isGroup && o !== t.heart)
          .forEach((g) => g.traverse((o) => o.isMesh && names.push(o.name)));
        return names.sort();
      };

      picker.selectById('valves');
      await ar.enter({});
      assert.equal(scene.background, null, 'the camera image shows through');
      session.dispatchEvent(new Event('select'));
      assert.deepEqual(placedNames(), ['mitral_valve']);
      picker.selectById('chambers');
      session.dispatchEvent(new Event('select'));
      assert.deepEqual(placedNames(), ['left_ventricle', 'right_ventricle']);
      await session.end();
      assert.deepEqual(placedNames(), []);
      assert.equal(scene.background, background);
      assert.equal(t.heart.visible, true);
    } finally {
      console.warn = warn;
      if (navigatorBefore) Object.defineProperty(globalThis, 'navigator', navigatorBefore);
      else delete globalThis.navigator;
    }
  });

  test('AR works on the organ that is current when the session starts, not the first one', async () => {
    class Session extends EventTarget {
      async requestReferenceSpace() {
        return {};
      }
      async requestHitTestSource() {
        throw new Error('no hit test');
      }
      async end() {
        this.dispatchEvent(new Event('end'));
      }
    }
    let session;
    const navigatorBefore = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
    Object.defineProperty(globalThis, 'navigator', {
      value: { xr: { requestSession: async () => (session = new Session()) } },
      configurable: true,
      writable: true,
    });
    const warn = console.warn;
    console.warn = () => {};
    try {
      const first = heartTree().heart;
      const second = heartTree().heart;
      second.name = 'second';
      let current = first;
      const scene = new THREE.Scene();
      const xrCamera = new THREE.PerspectiveCamera();
      const renderer = {
        xr: {
          setReferenceSpaceType() {},
          async setSession() {},
          getCamera: () => xrCamera,
          getReferenceSpace: () => ({}),
        },
      };
      const picker = createPicker({
        camera: new THREE.PerspectiveCamera(),
        domElement: fakeDom(),
        root: scene,
        onChange() {},
      });
      const ar = createAR({
        renderer,
        scene,
        camera: new THREE.PerspectiveCamera(),
        getModel: () => current,
        picker,
        onChange() {},
      });
      current = second; // the viewer switched organs before AR started
      await ar.enter({});
      assert.equal(second.visible, false, 'the current organ is hidden during the session');
      assert.equal(first.visible, true, 'the previous organ is left alone');
      await session.end();
      assert.equal(second.visible, true, 'and shown again afterwards');
    } finally {
      console.warn = warn;
      if (navigatorBefore) Object.defineProperty(globalThis, 'navigator', navigatorBefore);
      else delete globalThis.navigator;
    }
  });

  test('a support check that never answers counts as unsupported', async () => {
    const navigatorBefore = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
    Object.defineProperty(globalThis, 'navigator', {
      value: { xr: { isSessionSupported: () => new Promise(() => {}) } },
      configurable: true,
      writable: true,
    });
    try {
      assert.equal(await isARSupported(20), false);
    } finally {
      if (navigatorBefore) Object.defineProperty(globalThis, 'navigator', navigatorBefore);
      else delete globalThis.navigator;
    }
  });
});

describe('organs.json loading', () => {
  const fetchBefore = globalThis.fetch;
  const respond =
    (body, ok = true) =>
    async () => ({ ok, json: async () => body });

  test('records are indexed by id, and records without an id are skipped', async () => {
    globalThis.fetch = respond([
      { id: 'left_ventricle', name: { en: 'Left ventricle', fr: 'Ventricule gauche' } },
      { name: 'no id' },
    ]);
    const index = await loadOrganIndex('organs.json');
    globalThis.fetch = fetchBefore;
    assert.deepEqual(Object.keys(index), ['left_ventricle']);
    assert.equal(index.left_ventricle.name.fr, 'Ventricule gauche');
  });

  test('a missing, invalid or unreachable file gives an empty index', async () => {
    const warn = console.warn;
    console.warn = () => {};
    try {
      globalThis.fetch = respond(null, false);
      assert.deepEqual(await loadOrganIndex('x'), {});
      globalThis.fetch = respond({ not: 'an array' });
      assert.deepEqual(await loadOrganIndex('x'), {});
      globalThis.fetch = async () => {
        throw new Error('offline');
      };
      assert.deepEqual(await loadOrganIndex('x'), {});
    } finally {
      globalThis.fetch = fetchBefore;
      console.warn = warn;
    }
  });
});
