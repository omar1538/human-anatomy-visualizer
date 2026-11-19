// Track A: public API of the rendering layer. Tracks B and C only use this file.
import { createRenderer } from './renderer.js';
import { createScene, frameObject } from './scene.js';
import { createControls } from './controls.js';
import { createLayers } from './layers.js';
import { createPicker } from './picking.js';
import { createAR } from './xr.js';
import { createSlicer } from './slicing.js';

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
    onChange(active) {
      controls.enabled = !active; // in AR the camera follows the phone
      needsRender = true;
      arListeners.forEach((cb) => cb(active));
    },
  });

  // Render on demand: draw only when the camera moved or the state changed (saves battery).
  renderer.setAnimationLoop((time, frame) => {
    if (ar.isActive()) {
      // The phone is always moving in AR, so every frame must be drawn.
      ar.update(frame);
      renderer.render(scene, camera);
      return;
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
    resetView() {
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
