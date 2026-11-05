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

## Augmented reality (WebXR)

AR is the core of the product. Select an organ on the phone, enter AR, then tap to place it in the room.

| Member                               | Description                                                                 |
| ------------------------------------ | --------------------------------------------------------------------------- |
| `viewer.arSupported`                 | `true` if this device can start an AR session. Hide the AR button otherwise |
| `viewer.enterAR({ overlay, size })`  | Start AR. Must be called from a click or tap. Returns a promise             |
| `viewer.exitAR()`                    | End the session                                                             |
| `viewer.isInAR()`                    | Whether a session is running                                                |
| `viewer.onARChange((active) => ...)` | Called when AR starts or ends. Returns an unsubscribe function              |

- `overlay` is an optional HTML element that stays visible over the camera image. On any button
  inside it, call `preventDefault()` on the `beforexrselect` event, or tapping it also places the organ.
- `size` is the placed object's largest dimension in metres (default `0.4`).
- A tap places the selected organ, or the whole model if nothing is selected. Another tap moves it.
  With no surface detected, it floats 0.8 m in front of the phone.
- On AR-capable devices `viewer.backend` is always `'WebGL 2'`, by design.

### Testing AR on a phone

You need an Android phone with Chrome and Google Play Services for AR. WebXR only runs on HTTPS or
`localhost`, so connect the phone by USB, enable USB debugging, then run:

```
npm run dev
adb reverse tcp:5173 tcp:5173
```

Open `http://localhost:5173` in Chrome on the phone. A desktop browser shows `AR: not available here`.

## Contract with Track B (models)

- Every selectable structure is a mesh whose **name equals its organ id** in `organs.json`.
- A mesh's system is read from `userData.system`, else `meta[id].system`, else its parent group name.
- Load a model with `loadGLB(url, onProgress)` from `src/render/loader.js`
  (Meshopt-compressed GLB is supported). Open the app with `?model=assets/models/core.glb`.
- Until real models exist, `placeholder.js` provides a stand-in body. Remove it once Track B delivers.

## Coming in later weeks

Fly-to for search with `viewer.flyTo(id)` (week 3, requested by Track C), AR gestures to move, rotate and scale (week 4), choosing an organ inside AR (week 4), lazy loading per system (week 4), `viewer.getViewState()` and `setViewState()` for shareable links (week 4, needed by Track C in week 5), labels in AR and slicing plane (week 5), isolate and x-ray (week 6). These method names are proposals until they ship.
