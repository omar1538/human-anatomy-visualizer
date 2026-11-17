// Track A: WebXR augmented reality. Places the selected organ (or the whole model)
// in the user's real space, on a detected surface or floating in front of the phone.
import * as THREE from 'three/webgpu';

const DEFAULT_SIZE_M = 0.4; // an organ at life size is too small to study on a phone
const FLOAT_DISTANCE_M = 0.8; // used when no surface has been detected yet
const SUPPORT_CHECK_TIMEOUT_MS = 3000;

/**
 * Some browsers never answer the support check. The app waits for this result before it
 * starts, so a time limit keeps the 3D viewer working there, without AR.
 * @param {number} [timeoutMs]
 * @returns {Promise<boolean>} whether this browser and device can start an AR session
 */
export async function isARSupported(timeoutMs = SUPPORT_CHECK_TIMEOUT_MS) {
  let timer;
  const timeout = new Promise((resolve) => {
    timer = setTimeout(() => resolve(false), timeoutMs);
  });
  try {
    const check = navigator.xr?.isSessionSupported('immersive-ar');
    return (await Promise.race([check, timeout])) === true;
  } catch {
    return false; // for example blocked by a permissions policy
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Builds a copy of `source` that stands on its pivot's origin, facing +Z,
 * with its largest dimension equal to `size` metres. The original is not modified.
 * The copy gets its own materials, so later highlights on the original do not show on it.
 * @param {THREE.Object3D} source
 * @param {{ size?: number, showAll?: boolean }} [options] `showAll` also shows meshes hidden by a
 * layer (used for an explicit selection); otherwise hidden layers stay hidden in the copy
 * @returns {{ object: THREE.Group, height: number, dispose: () => void }}
 */
export function buildPlacement(source, { size = DEFAULT_SIZE_M, showAll = false } = {}) {
  source.updateWorldMatrix(true, false);
  const copy = source.clone(true);
  copy.visible = true; // the original may be hidden during the session
  // Slicing helpers (cut-surface fills) are not part of the anatomy: leave them out of the copy.
  const helpers = [];
  copy.traverse((o) => o.userData.sliceHelper && helpers.push(o));
  helpers.forEach((o) => o.removeFromParent());
  const materials = [];
  copy.traverse((o) => {
    if (showAll) o.visible = true;
    if (o.isMesh && o.material && !Array.isArray(o.material)) {
      o.material = o.material.clone();
      materials.push(o.material);
    }
  });
  source.matrixWorld.decompose(copy.position, copy.quaternion, copy.scale);

  const box = new THREE.Box3().setFromObject(copy);
  const dimensions = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const scale = size / (Math.max(dimensions.x, dimensions.y, dimensions.z) || 1);

  const inner = new THREE.Group();
  inner.add(copy);
  inner.scale.setScalar(scale);
  inner.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);

  const object = new THREE.Group();
  object.add(inner);

  return {
    object,
    height: dimensions.y * scale,
    // Geometry is shared with the original, so only the materials made for this copy are released.
    dispose: () => materials.forEach((m) => m.dispose()),
  };
}

function createReticle() {
  const geometry = new THREE.RingGeometry(0.06, 0.08, 32).rotateX(-Math.PI / 2);
  const reticle = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: 0xffffff }));
  reticle.matrixAutoUpdate = false; // set directly from the hit test pose
  reticle.visible = false;
  return reticle;
}

/**
 * @param {object} options
 * @param {THREE.WebGPURenderer} options.renderer
 * @param {THREE.Scene} options.scene
 * @param {THREE.PerspectiveCamera} options.camera
 * @param {THREE.Object3D} options.model placed when no organ is selected
 * @param {ReturnType<typeof import('./picking.js').createPicker>} options.picker
 * @param {(active: boolean) => void} options.onChange called when a session starts or ends
 */
export function createAR({ renderer, scene, camera, model, picker, onChange }) {
  const reticle = createReticle();
  const target = new THREE.Vector3();
  const cameraPosition = new THREE.Vector3();
  const cameraDirection = new THREE.Vector3();

  let session = null;
  let hitTestSource = null;
  let saved = null;
  let size = DEFAULT_SIZE_M;
  let placed = null;
  let placedSource = null;

  function removePlaced() {
    if (!placed) return;
    scene.remove(placed.object);
    placed.dispose();
    placed = null;
    placedSource = null;
  }

  /** Tap: puts the current selection (organ or group) in the room, or moves it if already there. */
  function place() {
    const selection = picker.selected();
    const source = selection ?? model;
    if (source !== placedSource) {
      removePlaced();
      // Copied without the highlight, so it shows the structure's real colours.
      placed = picker.withoutHighlight(() =>
        buildPlacement(source, { size, showAll: Boolean(selection) }),
      );
      placedSource = source;
      scene.add(placed.object);
    }

    // The XR camera's matrixWorld holds the phone's pose for the current frame.
    const pose = renderer.xr.getCamera().matrixWorld;
    cameraPosition.setFromMatrixPosition(pose);
    if (reticle.visible) {
      target.setFromMatrixPosition(reticle.matrix);
    } else {
      cameraDirection.set(0, 0, -1).transformDirection(pose);
      target.copy(cameraPosition).addScaledVector(cameraDirection, FLOAT_DISTANCE_M);
      target.y -= placed.height / 2;
    }
    placed.object.position.copy(target);
    // Stay upright and turn to face the user, whatever surface was hit.
    placed.object.rotation.y = Math.atan2(cameraPosition.x - target.x, cameraPosition.z - target.z);
  }

  function cleanup() {
    if (!session) return;
    session = null;
    hitTestSource = null; // the browser cancels hit test sources when the session ends
    removePlaced();
    scene.remove(reticle);
    reticle.visible = false;

    scene.background = saved.background;
    model.visible = saved.modelVisible;
    camera.position.copy(saved.position);
    camera.quaternion.copy(saved.quaternion);
    camera.near = saved.near;
    camera.far = saved.far;
    camera.fov = saved.fov;
    camera.updateProjectionMatrix();
    onChange(false);
  }

  return {
    isActive: () => session !== null,

    /** Must be called from a user gesture such as a click: browsers require it. */
    async enter({ overlay, size: requestedSize = DEFAULT_SIZE_M } = {}) {
      if (session) return;
      const init = { optionalFeatures: ['hit-test'] };
      if (overlay) {
        init.optionalFeatures.push('dom-overlay');
        init.domOverlay = { root: overlay };
      }
      const xrSession = await navigator.xr.requestSession('immersive-ar', init);

      session = xrSession;
      size = requestedSize;
      saved = {
        background: scene.background,
        modelVisible: model.visible,
        position: camera.position.clone(),
        quaternion: camera.quaternion.clone(),
        near: camera.near,
        far: camera.far,
        fov: camera.fov,
      };
      scene.background = null; // transparent, so the phone's camera image shows through
      model.visible = false;
      scene.add(reticle);
      xrSession.addEventListener('select', place);
      xrSession.addEventListener('end', cleanup);

      try {
        renderer.xr.setReferenceSpaceType('local');
        await renderer.xr.setSession(xrSession);
      } catch (error) {
        cleanup();
        await xrSession.end().catch(() => {});
        throw error;
      }
      onChange(true);

      try {
        const viewerSpace = await xrSession.requestReferenceSpace('viewer');
        const source = await xrSession.requestHitTestSource({ space: viewerSpace });
        if (session === xrSession) hitTestSource = source;
      } catch (error) {
        // Surface detection is optional: a tap then places the organ in front of the phone.
        console.warn('AR surface detection is unavailable:', error);
      }
    },

    exit: () => session?.end(),

    /** Call once per XR frame. Moves the reticle onto the surface the phone points at. */
    update(frame) {
      const results = hitTestSource && frame ? frame.getHitTestResults(hitTestSource) : [];
      const pose = results[0]?.getPose(renderer.xr.getReferenceSpace());
      reticle.visible = Boolean(pose);
      if (pose) reticle.matrix.fromArray(pose.transform.matrix);
    },

    dispose() {
      session?.end();
      reticle.geometry.dispose();
      reticle.material.dispose();
    },
  };
}
