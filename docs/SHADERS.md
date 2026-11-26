# Shaders (Track A)

The app has two custom GPU shaders, both in [`scripts/render/shaders.mjs`](../scripts/render/shaders.mjs):

| Shader          | What it does                                                  | Used by                             |
| --------------- | ------------------------------------------------------------- | ----------------------------------- |
| **X-ray**       | See-through structures with a bright outline                  | `viewer.setXRay(true)` (`xray.mjs`) |
| **Cut surface** | The structure's colour with fine diagonal hatching on the cut | slicing (`slicing.mjs`)             |

Everything else in the scene uses the standard Three.js materials of `heart.glb`.

## Why node materials (TSL)

The renderer is WebGPU only. On WebGPU, Three.js shaders are written in **TSL** (Three.js Shading
Language): instead of writing WGSL text, the shader is built as a graph of nodes in JavaScript
(`mix(a, b, t)`, `dot(u, v)`, ...). Three.js then compiles that graph to WGSL for the GPU.

A **node material** is a normal Three.js material whose colour (`colorNode`) and opacity
(`opacityNode`) come from such a graph. This keeps everything else Three.js does for free: the
camera and object transforms, clipping by the slicing plane, transparency sorting, and picking.
Both shaders use `MeshBasicNodeMaterial`, the unlit node material: the effect itself replaces the
lighting.

All the names used (`MeshBasicNodeMaterial`, `normalView`, `positionViewDirection`,
`screenCoordinate`, `reference`, `uniform`, `mix`, `pow`, `fract`, `smoothstep`, ...) were checked in
the installed `three@0.187.0` (`three/tsl` and `three/webgpu`).

## X-ray shader

**Inputs**

- `normalView`: the surface normal at this pixel, in camera space (a unit vector).
- `positionViewDirection`: the direction from the surface to the camera (a unit vector).
- `tint`: the structure's own colour (a uniform, set once when the material is made).
- `emissive` and `emissiveIntensity`: read from the material every frame with `reference()`. The
  picker sets them to orange when the structure is selected, exactly as it does on a normal material.

**The fresnel term.** Where a surface faces the camera, its normal points at the camera: the two
unit vectors are aligned and their dot product is 1. Where the surface is seen edge-on (its outline),
they are perpendicular and the dot product is 0. So:

```
facing = |normalView · positionViewDirection|      1 in the middle, 0 at the outline
rim    = (1 − facing) ^ 2.5                        0 in the middle, 1 at the outline
```

`abs()` handles the inner (back) faces, whose normal points away from the camera. Raising to the
power 2.5 keeps `rim` close to 0 except near the outline, so the bright edge stays thin.

**Output**

```
colour  = mix(tint, white, rim × 0.45) + emissive × emissiveIntensity
opacity = mix(0.12, 1, rim)
```

The middle of a structure is almost transparent (12 %) in its own colour; the outline is opaque and
lighter. The material is transparent, does not write depth (so structures behind stay visible), and
is double-sided (the far side of each structure adds to the effect).

**Around the shader** (`xray.mjs`, no GPU code, covered by `tests/shaders.test.mjs`): each mesh gets
its own x-ray material, made once and reused, so toggling never creates new materials. Switching off
puts back the exact materials the meshes had. The AR copy is made with the normal materials, and
slicing helpers keep their own material.

## Cut-surface shader

The cut surface is the inside (back faces) of each closed structure, which only shows where the
slicing plane opens it (see [`RENDERING_API.md`](RENDERING_API.md#slicing)). This shader draws it
like the cut face of a technical drawing.

**Inputs**

- `screenCoordinate`: the pixel this fragment is drawn on (x, y in pixels).
- `fill`: the structure's colour, darkened by 30 % (a uniform).

**The stripe pattern.** Along a 45° diagonal, `x + y` stays the same. So `(x + y) / 7` grows by 1
every 7 pixels across the diagonals, and its fractional part repeats from 0 to 1 across each band:

```
stripe   = fract((x + y) / 7)          0 → 1 across each 7-pixel band
distance = |stripe − 0.5|              0 at the centre of a line, 0.5 halfway between lines
line     = 1 − smoothstep(0.12, 0.20, distance)
                                       1 on a line, 0 between lines, soft edge in between
colour   = mix(fill, fill × 0.55, line)
```

`smoothstep` gives each line a soft edge instead of a hard one, so the lines do not look jagged.
The pattern is in screen space, so the lines keep the same width at any zoom and on any shape.

## Not done here

The flow-particle compute shader (stretch goal) is not started.
