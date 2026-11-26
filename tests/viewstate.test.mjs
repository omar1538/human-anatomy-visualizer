// Track A: tests for the view state used by shareable lesson links (scripts/render/viewstate.mjs).
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  captureViewState,
  parseViewState,
  VIEW_STATE_VERSION,
} from '../scripts/render/viewstate.mjs';

const v = (x, y, z) => ({ x, y, z });
const parts = {
  camera: { position: v(0.123456789, 0.02, 0.33), target: v(0, 0.01, -0.0000001) },
  selection: 'left_ventricle',
  systems: ['chambers', 'valves', 'great_vessels'],
  isSystemVisible: (s) => s !== 'valves',
  slice: { axis: 'z', position: 0.333333, flip: true },
  xray: true,
};

describe('captureViewState', () => {
  test('captures camera, selection, hidden layers, slice and x-ray as plain data', () => {
    const s = captureViewState(parts);
    assert.equal(s.v, VIEW_STATE_VERSION);
    assert.deepEqual(s.camera.position, [0.1235, 0.02, 0.33], 'rounded to 0.1 mm');
    assert.equal(s.selection, 'left_ventricle');
    assert.deepEqual(s.hidden, ['valves']);
    assert.deepEqual(s.slice, { axis: 'z', position: 0.3333, flip: true });
    assert.equal(s.xray, true);
  });

  test('no selection, no slice, x-ray off', () => {
    const s = captureViewState({ ...parts, selection: null, slice: null, xray: false });
    assert.equal(s.selection, null);
    assert.equal(s.slice, null);
    assert.equal(s.xray, false);
  });

  test('round trip: JSON text of a captured state parses back to the same state', () => {
    const s = captureViewState(parts);
    const back = parseViewState(JSON.stringify(s));
    assert.deepEqual(back, {
      camera: s.camera,
      selection: s.selection,
      hidden: s.hidden,
      slice: s.slice,
      xray: s.xray,
      isolated: s.isolated,
    });
  });
});

describe('parseViewState', () => {
  test('rejects what cannot be a view state', () => {
    for (const bad of [null, 42, 'not json', '[1,2,3]', [], { v: 99 }]) {
      assert.equal(parseViewState(bad), null, JSON.stringify(bad));
    }
  });

  test('keeps only valid parts; missing parts stay missing (left as they are)', () => {
    const s = parseViewState({
      camera: { position: [0, 0, 'x'], target: [0, 0, 0] },
      selection: '<script>',
      hidden: ['valves', 'Bad Id', 7, 'cardiac_veins'],
      slice: { axis: 'w', position: 0.5 },
      xray: 'yes',
    });
    assert.deepEqual(s, { hidden: ['valves', 'cardiac_veins'] });
  });

  test('clamps the slice position and reads flip strictly', () => {
    const s = parseViewState({ slice: { axis: 'y', position: 7, flip: 'true' } });
    assert.deepEqual(s.slice, { axis: 'y', position: 1, flip: false });
  });

  test('null means "clear": no selection, no slice', () => {
    assert.deepEqual(parseViewState({ selection: null, slice: null }), {
      selection: null,
      slice: null,
    });
  });

  test('isolation: captured, kept when valid, cleared by null, dropped when invalid', () => {
    assert.equal(captureViewState({ ...parts, isolated: 'valves' }).isolated, 'valves');
    assert.equal(captureViewState(parts).isolated, null);
    assert.deepEqual(parseViewState({ isolated: 'valves' }), { isolated: 'valves' });
    assert.deepEqual(parseViewState({ isolated: null }), { isolated: null });
    assert.deepEqual(parseViewState({ isolated: '<img>' }), {});
  });

  test('an empty object is valid and changes nothing', () => {
    assert.deepEqual(parseViewState({}), {});
  });
});
