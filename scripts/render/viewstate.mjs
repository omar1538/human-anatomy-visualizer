// Track A: the view as plain data, for Track C's shareable lesson links. A teacher's link carries
// this object (for example as JSON in the URL); opening the link puts the viewer back in the same
// state. Plain functions, no GPU: covered by tests/viewstate.test.mjs.

export const VIEW_STATE_VERSION = 1;
const AXES = new Set(['x', 'y', 'z']);
const ID = /^[a-z0-9_]{1,64}$/; // organ and group ids are snake_case (docs/DATA_CONTRACT.md)

// 0.1 mm: short links, no visible difference. `|| 0` turns -0 into 0, which JSON writes the same.
const round = (n) => Math.round(n * 10000) / 10000 || 0;
const isVector = (v) => Array.isArray(v) && v.length === 3 && v.every(Number.isFinite);

/**
 * @param {object} parts
 * @param {{ position: {x:number,y:number,z:number}, target: {x:number,y:number,z:number} }} parts.camera
 * @param {string | null} parts.selection
 * @param {string[]} parts.systems all layer ids
 * @param {(system: string) => boolean} parts.isSystemVisible
 * @param {{ axis: string, position: number, flip: boolean } | null} parts.slice
 * @param {boolean} parts.xray
 * @param {string | null} [parts.isolated] id of the isolated organ or group
 */
export function captureViewState({
  camera,
  selection,
  systems,
  isSystemVisible,
  slice,
  xray,
  isolated = null,
}) {
  const vector = (v) => [round(v.x), round(v.y), round(v.z)];
  return {
    v: VIEW_STATE_VERSION,
    camera: { position: vector(camera.position), target: vector(camera.target) },
    selection: selection ?? null,
    hidden: systems.filter((s) => !isSystemVisible(s)),
    slice: slice ? { axis: slice.axis, position: round(slice.position), flip: slice.flip } : null,
    xray: Boolean(xray),
    isolated: isolated ?? null,
  };
}

/**
 * Checks a view state that came from outside (a link can contain anything) and keeps only what
 * is valid. A missing field means "leave this part of the view as it is".
 * @param {unknown} input an object, or its JSON text
 * @returns {object | null} the clean state, or null if it cannot be used at all
 */
export function parseViewState(input) {
  let state = input;
  if (typeof state === 'string') {
    try {
      state = JSON.parse(state);
    } catch {
      return null;
    }
  }
  if (!state || typeof state !== 'object' || Array.isArray(state)) return null;
  if (state.v !== undefined && state.v !== VIEW_STATE_VERSION) return null; // a future format

  const clean = {};
  const cam = state.camera;
  if (cam && isVector(cam.position) && isVector(cam.target)) {
    clean.camera = { position: [...cam.position], target: [...cam.target] };
  }
  if (state.selection === null) clean.selection = null;
  else if (typeof state.selection === 'string' && ID.test(state.selection)) {
    clean.selection = state.selection;
  }
  if (Array.isArray(state.hidden)) {
    clean.hidden = state.hidden.filter((s) => typeof s === 'string' && ID.test(s));
  }
  if (state.slice === null) clean.slice = null;
  else if (state.slice && AXES.has(state.slice.axis) && Number.isFinite(state.slice.position)) {
    clean.slice = {
      axis: state.slice.axis,
      position: Math.min(Math.max(state.slice.position, 0), 1),
      flip: state.slice.flip === true,
    };
  }
  if (typeof state.xray === 'boolean') clean.xray = state.xray;
  if (state.isolated === null) clean.isolated = null;
  else if (typeof state.isolated === 'string' && ID.test(state.isolated)) {
    clean.isolated = state.isolated;
  }
  return clean;
}
