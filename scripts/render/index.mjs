// Track A: public API of the rendering layer. Tracks B and C only use this file.
import { createRenderer } from './renderer.mjs';
import { createScene, frameObject } from './scene.mjs';
import { createControls } from './controls.mjs';
import { createLayers } from './layers.mjs';
import { createPicker } from './picking.mjs';
import { createAR } from './xr.mjs';
import { createSlicer } from './slicing.mjs';
import { createXRay } from './xray.mjs';
import { createFlight, framingFor } from './camera.mjs';
import { captureViewState, parseViewState } from './viewstate.mjs';

const FLY_DURATION_MS = 700;
const prefersReducedMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * @param {object} options
 * @param {HTMLElement} options.container element that will hold the canvas
 * @param {import('three').Object3D} options.model root of the loaded model (GLB scene or placeholder)
 * @param {Record<string, {system?: string}>} [options.meta] organ metadata by id (organs.json)
 */
export async function createViewer({ container, model, meta = {} }) {
  const { renderer, backend, arSupported } = await createRenderer(container);
  const { scene, camera } = createScene(container.clientWidth / container.clientHeight);
  scene.add(model);

  const home = frameObject(camera, model);
  const controls = createControls(camera, renderer.domElement);
  controls.target.copy(home.target);
  // Zoom limits follow the model's size: a 15 cm heart needs a much closer camera than a body.
  const homeDistance = home.position.distanceTo(home.target);
  controls.minDistance = homeDistance * 0.15;
  controls.maxDistance = homeDistance * 6;
  controls.update();

  const layers = createLayers(model, meta);
  const slicer = createSlicer({ scene, model });
  const xray = createXRay({ model });
  const listeners = new Set();
  let needsRender = true;

  const picker = createPicker({
    camera,
    domElement: renderer.domElement,
    root: model,
    // A click goes through the parts the slicing plane has removed.
    accept: (hit) => slicer.keeps(hit.point),
    onChange: (id, mesh) => {
      needsRender = true;
      listeners.forEach((cb) => cb(id, mesh));
    },
  });

  const arListeners = new Set();
  const ar = createAR({
    renderer,
    scene,
    camera,
    model,
    picker,
    // The copy placed in AR always uses the normal materials: no highlight, no x-ray.
    prepareCopy: (fn) => picker.withoutHighlight(() => xray.withoutXRay(fn)),
    onChange(active) {
      controls.enabled = !active; // in AR the camera follows the phone
      needsRender = true;
      arListeners.forEach((cb) => cb(active));
    },
  });

  // Camera flight in progress (flyTo), advanced by the render loop below.
  let flight = null; // { path, resolve }
  function endFlight(reachedEnd) {
    if (!flight) return;
    const { resolve } = flight;
    flight = null;
    resolve(reachedEnd);
  }
  // The user grabbing the view stops the flight where it is.
  controls.addEventListener('start', () => endFlight(false));

  function setXRay(enabled) {
    // The highlight is moved from the old materials to the new ones.
    picker.withoutHighlight(() => xray.set(enabled));
    slicer.refresh(); // open meshes: give the normal materials their slicing side again
    needsRender = true;
  }

  // Render on demand: draw only when the camera moved or the state changed (saves battery).
  renderer.setAnimationLoop((time, frame) => {
    if (ar.isActive()) {
      // The phone is always moving in AR, so every frame must be drawn.
      ar.update(frame);
      renderer.render(scene, camera);
      return;
    }
    if (flight) {
      const step = flight.path.at(performance.now());
      camera.position.copy(step.position);
      controls.target.copy(step.target);
      needsRender = true;
      if (step.done) endFlight(true);
    }
    const moved = controls.update();
    if (moved || needsRender) {
      renderer.render(scene, camera);
      needsRender = false;
    }
  });

  const resize = new ResizeObserver(() => {
    const { clientWidth: w, clientHeight: h } = container;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    needsRender = true;
  });
  resize.observe(container);

  return {
    /** 'WebGPU' or 'WebGL 2' */
    backend,
    /** Whether this device can start an AR session. */
    arSupported,
    /**
     * Starts AR. Call it from a user gesture such as a click. In AR, each tap places the
     * selected organ (or the whole model if none is selected), or moves it if already placed.
     * @param {{ overlay?: HTMLElement, size?: number }} [options] `overlay` stays visible during
     * the session; `size` is the placed object's largest dimension in metres
     */
    enterAR(options) {
      if (!arSupported) return Promise.reject(new Error('AR is not available on this device'));
      return ar.enter(options);
    },
    exitAR: () => ar.exit(),
    isInAR: () => ar.isActive(),
    /** Called with true or false when AR starts or ends. Returns an unsubscribe function. */
    onARChange(cb) {
      arListeners.add(cb);
      return () => arListeners.delete(cb);
    },
    /** @returns {string[]} system ids present in the model */
    systems: () => layers.systems(),
    setSystemVisible(system, visible) {
      layers.setSystemVisible(system, visible);
      needsRender = true;
    },
    isSystemVisible: (system) => layers.isSystemVisible(system),
    /**
     * Cuts the model with a plane and fills the cut surface.
     * @param {{ axis?: 'x' | 'y' | 'z', position?: number, flip?: boolean }} [options]
     * `axis`: 'x' left-right, 'y' top-bottom, 'z' front-back (default). `position` goes from 0 to 1
     * across the model (default 0.5). By default the part towards +axis is removed; `flip` swaps sides.
     */
    setSlice(options) {
      slicer.set(options);
      needsRender = true;
    },
    clearSlice() {
      slicer.clear();
      needsRender = true;
    },
    /** @returns {{ axis: string, position: number, flip: boolean } | null} the current cut */
    getSlice: () => slicer.get(),
    /**
     * X-ray mode: every structure becomes see-through with a bright outline (shaders.mjs).
     * Selection, layers and slicing keep working; organs placed in AR keep their normal look.
     * @param {boolean} enabled
     */
    setXRay,
    /** @returns {boolean} whether x-ray mode is on */
    isXRay: () => xray.isEnabled(),
    /** Selects an organ or a group (for example 'valves') by id; pass null to clear. */
    select: (id) => picker.selectById(id),
    /**
     * Metadata record for an organ or group id, from organs.json, or null if there is none.
     * Used by Learn mode to show the name, function and facts in English or French.
     */
    organ: (id) => meta[id] ?? null,
    /**
     * Called with (id | null, object | null) whenever the selection changes. `object` is the
     * selected mesh, or a group when a group id was selected. Returns an unsubscribe function.
     */
    onSelect(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    /**
     * Moves the camera smoothly to frame an organ or a group, keeping the current viewing angle.
     * Used by Track C's search. It does not select: call `select(id)` too if needed.
     * The flight stops if the user grabs the view. Instant when the user prefers reduced motion.
     * @param {string} id organ or group id
     * @param {{ duration?: number }} [options] flight time in milliseconds (default 700, 0 = jump)
     * @returns {Promise<boolean>} true once the camera arrived; false for an unknown id, a structure
     * with nothing visible, or a flight that was interrupted
     */
    flyTo(id, { duration = FLY_DURATION_MS } = {}) {
      const object = id ? model.getObjectByName(id) : null;
      const direction = camera.position.clone().sub(controls.target);
      const goal = object && framingFor(object, camera.fov, direction);
      if (!goal || ar.isActive()) return Promise.resolve(false);
      endFlight(false);
      const ms = prefersReducedMotion() ? 0 : Math.max(0, duration);
      return new Promise((resolve) => {
        flight = {
          path: createFlight(
            { position: camera.position, target: controls.target },
            goal,
            ms,
            performance.now(),
          ),
          resolve,
        };
        needsRender = true;
      });
    },
    /**
     * The current view as plain data (camera, selection, hidden layers, slice, x-ray), small
     * enough to put in a link. See docs/RENDERING_API.md#view-state.
     */
    getViewState: () =>
      captureViewState({
        camera: { position: camera.position, target: controls.target },
        selection: picker.selected()?.name ?? null,
        systems: layers.systems(),
        isSystemVisible: (s) => layers.isSystemVisible(s),
        slice: slicer.get(),
        xray: xray.isEnabled(),
      }),
    /**
     * Restores a view from `getViewState()`, for example from a lesson link. Accepts the object
     * or its JSON text. Invalid parts are ignored, missing parts are left as they are.
     * @returns {boolean} false if the state could not be used at all
     */
    setViewState(input) {
      const state = parseViewState(input);
      if (!state) return false;
      endFlight(false);
      if (state.camera) {
        camera.position.fromArray(state.camera.position);
        controls.target.fromArray(state.camera.target);
        controls.update();
      }
      if (state.hidden) {
        const hidden = new Set(state.hidden);
        for (const system of layers.systems()) layers.setSystemVisible(system, !hidden.has(system));
      }
      if (state.slice === null) slicer.clear();
      else if (state.slice) slicer.set(state.slice);
      if (state.xray !== undefined) setXRay(state.xray);
      if (state.selection !== undefined) picker.selectById(state.selection);
      needsRender = true;
      return true;
    },
    resetView() {
      endFlight(false);
      camera.position.copy(home.position);
      controls.target.copy(home.target);
      controls.update();
      needsRender = true;
    },
    /** Visible triangles and meshes (one draw call each), for performance budgets. */
    stats() {
      let triangles = 0;
      let drawCalls = 0;
      model.traverse((o) => {
        if (!o.isMesh || !o.visible || o.userData.sliceHelper) return;
        const g = o.geometry;
        triangles += (g.index ? g.index.count : g.attributes.position.count) / 3;
        drawCalls += 1;
      });
      return { triangles, drawCalls };
    },
    dispose() {
      ar.dispose();
      xray.dispose();
      slicer.dispose();
      resize.disconnect();
      picker.dispose();
      controls.dispose();
      renderer.setAnimationLoop(null);
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
