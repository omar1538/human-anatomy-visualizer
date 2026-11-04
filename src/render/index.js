// Track A: public API of the rendering layer. Tracks B and C only use this file.
// See docs/RENDERING_API.md.
import { createRenderer } from './renderer.js';
import { createScene, frameObject } from './scene.js';
import { createControls } from './controls.js';
import { createLayers } from './layers.js';
import { createPicker } from './picking.js';

/**
 * @param {object} options
 * @param {HTMLElement} options.container element that will hold the canvas
 * @param {import('three').Object3D} options.model root of the loaded model (GLB scene or placeholder)
 * @param {Record<string, {system?: string}>} [options.meta] organ metadata by id (organs.json)
 */
export async function createViewer({ container, model, meta = {} }) {
  const { renderer, backend } = await createRenderer(container);
  const { scene, camera } = createScene(container.clientWidth / container.clientHeight);
  scene.add(model);

  const home = frameObject(camera, model);
  const controls = createControls(camera, renderer.domElement);
  controls.target.copy(home.target);
  controls.update();

  const layers = createLayers(model, meta);
  const listeners = new Set();
  let needsRender = true;

  const picker = createPicker({
    camera,
    domElement: renderer.domElement,
    root: model,
    onChange: (id, mesh) => {
      needsRender = true;
      listeners.forEach((cb) => cb(id, mesh));
    },
  });

  // Render on demand: draw only when the camera moved or the state changed (saves battery).
  renderer.setAnimationLoop(() => {
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
    /** @returns {string[]} system ids present in the model */
    systems: () => layers.systems(),
    setSystemVisible(system, visible) {
      layers.setSystemVisible(system, visible);
      needsRender = true;
    },
    isSystemVisible: (system) => layers.isSystemVisible(system),
    /** Selects an organ by id; pass null to clear. */
    select: (id) => picker.selectById(id),
    /** Called with (organId | null, mesh | null) whenever the selection changes. Returns an unsubscribe function. */
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
        if (!o.isMesh || !o.visible) return;
        const g = o.geometry;
        triangles += (g.index ? g.index.count : g.attributes.position.count) / 3;
        drawCalls += 1;
      });
      return { triangles, drawCalls };
    },
    dispose() {
      resize.disconnect();
      picker.dispose();
      controls.dispose();
      renderer.setAnimationLoop(null);
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
