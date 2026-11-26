// Track A: tests for layers combined with isolate mode (scripts/render/layers.mjs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three/webgpu';
import { createLayers } from '../render/layers.mjs';

function setup() {
  const mesh = (name) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
    m.name = name;
    return m;
  };
  const group = (name, ...children) => {
    const g = new THREE.Group();
    g.name = name;
    g.add(...children);
    return g;
  };
  const root = new THREE.Group();
  root.add(group('chambers', mesh('lv'), mesh('rv')), group('valves', mesh('mitral')));
  const layers = createLayers(root);
  const get = (id) => root.getObjectByName(id);
  const shown = () => ['lv', 'rv', 'mitral'].filter((id) => get(id).visible);
  return { layers, get, shown };
}

test('isolating an organ shows only that organ', () => {
  const { layers, get, shown } = setup();
  layers.isolate(get('lv'));
  assert.deepEqual(shown(), ['lv']);
  assert.equal(layers.isIsolating(), true);
});

test('isolating a group, then another organ, replaces the isolation', () => {
  const { layers, get, shown } = setup();
  layers.isolate(get('chambers'));
  assert.deepEqual(shown(), ['lv', 'rv']);
  layers.isolate(get('mitral'));
  assert.deepEqual(shown(), ['mitral']);
});

test('toggling layers never undoes the isolation', () => {
  const { layers, get, shown } = setup();
  layers.isolate(get('lv'));
  layers.setSystemVisible('valves', false);
  layers.setSystemVisible('valves', true);
  assert.deepEqual(shown(), ['lv']);
  layers.setSystemVisible('chambers', false);
  assert.deepEqual(shown(), [], 'a layer that is off hides the isolated organ too');
});

test('clearing the isolation restores the layers as they are set', () => {
  const { layers, get, shown } = setup();
  layers.setSystemVisible('valves', false);
  layers.isolate(get('lv'));
  layers.isolate(null);
  assert.deepEqual(shown(), ['lv', 'rv']);
  assert.equal(layers.isIsolating(), false);
});

test('isSystemVisible reports the layer switch, not the isolation', () => {
  const { layers, get } = setup();
  layers.isolate(get('lv'));
  assert.equal(layers.isSystemVisible('valves'), true);
  layers.setSystemVisible('valves', false);
  assert.equal(layers.isSystemVisible('valves'), false);
  assert.equal(layers.isSystemVisible('unknown'), false);
});

test('slicing helpers added later are left alone', () => {
  const { layers, get } = setup();
  const helper = new THREE.Mesh();
  helper.userData.sliceHelper = true;
  helper.visible = false;
  get('lv').add(helper);
  layers.isolate(get('lv'));
  layers.isolate(null);
  assert.equal(helper.visible, false);
});

test('reset turns every layer back on and clears the isolation', () => {
  const { layers, get, shown } = setup();
  layers.setSystemVisible('valves', false);
  layers.isolate(get('lv'));
  layers.reset();
  assert.deepEqual(shown(), ['lv', 'rv', 'mitral']);
  assert.equal(layers.isIsolating(), false);
  assert.equal(layers.isSystemVisible('valves'), true);
});
