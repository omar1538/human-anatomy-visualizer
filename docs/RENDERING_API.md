# Rendering API (Track A)

Tracks B and C only use `src/render/index.js`. Internal files can change without notice.

```js
import { createViewer } from './render/index.js';

const viewer = await createViewer({ container, model, meta });
```

| Option      | Meaning                                                                     |
| ----------- | --------------------------------------------------------------------------- |
| `container` | HTML element that will hold the canvas                                      |
| `model`     | Root `Object3D` (a loaded GLB scene, see `loadGLB`)                         |
| `meta`      | Optional `organs.json` indexed by organ id, used to find each mesh's system |

## Viewer methods

| Member                                     | Description                                                        |
| ------------------------------------------ | ------------------------------------------------------------------ |
| `viewer.backend`                           | `'WebGPU'` or `'WebGL 2'`                                          |
| `viewer.systems()`                         | Array of system ids found in the model                             |
| `viewer.setSystemVisible(system, visible)` | Show or hide a whole system                                        |
| `viewer.isSystemVisible(system)`           | Current visibility                                                 |
| `viewer.select(id)`                        | Select an organ by id (`null` clears). For search and quiz         |
| `viewer.onSelect((id, mesh) => ...)`       | Called when the selection changes. Returns an unsubscribe function |
| `viewer.resetView()`                       | Back to the default camera                                         |
| `viewer.stats()`                           | `{ triangles, drawCalls }` of what is visible                      |
| `viewer.dispose()`                         | Release GPU resources                                              |

## Contract with Track B (models)

- Every selectable structure is a mesh whose **name equals its organ id** in `organs.json`.
- A mesh's system is read from `userData.system`, else `meta[id].system`, else its parent group name.
- Load a model with `loadGLB(url, onProgress)` from `src/render/loader.js`
  (Meshopt-compressed GLB is supported). Open the app with `?model=assets/models/core.glb`.
- Until real models exist, `placeholder.js` provides a stand-in body. Remove it once Track B delivers.

## Coming in later weeks

Slicing plane (week 3), isolate and x-ray (week 4), lazy loading per system (week 4), fly-to for search (week 3, requested by Track C).
