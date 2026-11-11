// Track A: orbit, zoom and pan with mouse or touch.
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function createControls(camera, domElement) {
  const controls = new OrbitControls(camera, domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.screenSpacePanning = true;
  return controls; // zoom limits are set from the model's size in index.js
}
