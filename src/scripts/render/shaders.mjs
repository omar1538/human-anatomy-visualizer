// Track A: the app's two custom GPU shaders, written in TSL (Three.js Shading Language).
// TSL describes a shader as a graph of nodes in JavaScript; Three.js compiles that graph to WGSL
// for WebGPU. Each function returns a node material: a normal Three.js material whose colour and
// opacity come from our node graph instead of the built-in lighting. See docs/SHADERS.md.
import * as THREE from 'three/webgpu';
import {
  abs,
  dot,
  float,
  fract,
  mix,
  normalView,
  positionViewDirection,
  pow,
  reference,
  screenCoordinate,
  smoothstep,
  uniform,
  vec3,
} from 'three/tsl';

// ---- X-ray ----
const RIM_POWER = 2.5; // higher = thinner bright edge
const CENTRE_OPACITY = 0.12; // how much of a structure still shows where it faces the camera
const RIM_WHITENESS = 0.45; // how far the edge colour goes towards white

/**
 * X-ray material: transparent in the middle of a structure, bright and opaque at its outline
 * (a fresnel, or "rim", effect), tinted with the structure's own colour.
 *
 * The material also has `emissive` and `emissiveIntensity` properties, like a standard material.
 * The shader reads them every frame, so the picker's selection highlight works unchanged on it.
 * @param {THREE.Color} baseColor the structure's normal colour
 */
export function createXRayMaterial(baseColor) {
  const material = new THREE.MeshBasicNodeMaterial({
    transparent: true, // blend with what is behind
    depthWrite: false, // let the structures behind show through instead of hiding them
    side: THREE.DoubleSide, // the far side of each structure is part of the x-ray look
  });
  material.name = 'x-ray';
  material.emissive = new THREE.Color(0x000000); // set by the selection highlight
  material.emissiveIntensity = 1;
  material.userData.xray = true;
  material.userData.perMesh = true; // one per mesh already: the picker must not clone it

  // facing = 1 where the surface looks straight at the camera, 0 where it is seen edge-on.
  // normalView: surface normal in camera space. positionViewDirection: direction from the surface
  // to the camera. Both are unit vectors, so their dot product is the cosine of the angle between
  // them. abs() makes it work for the inner (back) faces too, whose normal points away.
  const facing = abs(dot(normalView, positionViewDirection));
  // rim = 0 in the middle, 1 at the outline; pow() keeps it near 0 except close to the edge.
  const rim = pow(float(1).sub(facing), RIM_POWER);

  const tint = uniform(baseColor.clone()); // the structure's colour, sent to the GPU once
  // Selection glow: emissive colour x intensity, read from the material each frame.
  const glow = reference('emissive', 'color', material).mul(
    reference('emissiveIntensity', 'float', material),
  );

  // Colour: the tint, lightened towards white on the rim, plus the selection glow.
  material.colorNode = mix(tint, vec3(1), rim.mul(RIM_WHITENESS)).add(glow);
  // Opacity: almost transparent in the middle, fully opaque on the rim.
  material.opacityNode = mix(float(CENTRE_OPACITY), float(1), rim);
  return material;
}

// ---- Cut surface ----
const STRIPE_SPACING_PX = 7; // distance between two hatching lines, in screen pixels
const STRIPE_HALF_WIDTH = 0.12; // half the line width, as a fraction of the spacing
const STRIPE_SOFTNESS = 0.08; // blur on each line's edge, as a fraction of the spacing
const STRIPE_DARKNESS = 0.55; // line colour = fill colour x this

/**
 * Cut-surface material: the structure's colour with fine diagonal hatching, like the cut faces of
 * a technical drawing. It is drawn on the inside (back faces) of a closed mesh, which only shows
 * where the slicing plane has opened the mesh (see slicing.mjs).
 * @param {THREE.Color} fillColor the colour of the cut surface (already darkened by the caller)
 */
export function createCutMaterial(fillColor) {
  const material = new THREE.MeshBasicNodeMaterial({ side: THREE.BackSide });
  material.name = 'cut-surface';
  material.userData.cut = true;

  const fill = uniform(fillColor.clone());
  // screenCoordinate: the pixel this fragment is drawn on. x + y is constant along a 45° line,
  // so dividing by the spacing and keeping the fractional part gives a value that repeats from 0
  // to 1 across each stripe.
  const stripe = fract(screenCoordinate.x.add(screenCoordinate.y).div(STRIPE_SPACING_PX));
  // Distance from the centre of the nearest line, 0 on the line, up to 0.5 between two lines.
  const distance = abs(stripe.sub(0.5));
  // line = 1 on a line, 0 between lines, with a soft edge so the lines are not jagged.
  const line = float(1).sub(
    smoothstep(STRIPE_HALF_WIDTH, STRIPE_HALF_WIDTH + STRIPE_SOFTNESS, distance),
  );

  // Between lines: the fill colour. On a line: the same colour, darker.
  material.colorNode = mix(fill, fill.mul(STRIPE_DARKNESS), line);
  return material;
}
