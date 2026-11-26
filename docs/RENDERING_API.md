# Rendering API (Track A)

Tracks B and C only use `src/scripts/render/index.mjs`. Internal files can change without notice.

```js
import { createViewer } from './render/index.mjs';

const viewer = await createViewer({ container, model, meta });
```

| Option      | Meaning                                                                                     |
| ----------- | ------------------------------------------------------------------------------------------- |
| `container` | HTML element that will hold the canvas                                                      |
| `model`     | Root `Object3D` (a loaded GLB scene, see `loadGLB`)                                         |
| `meta`      | Optional `organs.json` indexed by id (see `loadOrganIndex`), used for layers and Learn mode |

## Viewer methods

| Member                                     | Description                                                                                                        |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `viewer.backend`                           | Always `'WebGPU'`: the app has no WebGL 2 fallback (without WebGPU `createViewer` throws `WebGPUUnavailableError`) |
| `viewer.systems()`                         | Array of system ids found in the model                                                                             |
| `viewer.setSystemVisible(system, visible)` | Show or hide a whole system                                                                                        |
| `viewer.isSystemVisible(system)`           | Current visibility                                                                                                 |
| `viewer.select(id)`                        | Select an organ or a group (e.g. `'valves'`) by id (`null` clears). For search and quiz                            |
| `viewer.onSelect((id, object) => ...)`     | Called when the selection changes. `object` is a mesh, or a group. Returns an unsubscribe function                 |
| `viewer.organ(id)`                         | The `organs.json` record for an organ or group id, or `null`. For Learn mode                                       |
| `viewer.resetView()`                       | Fits the whole model to the current screen shape (portrait or landscape) and forgets the user's view               |
| `viewer.stats()`                           | `{ triangles, drawCalls }` of what is visible                                                                      |
| `viewer.dispose()`                         | Release GPU resources                                                                                              |

## Slicing

Cuts the model with a plane to show the inside, for example the chambers of the heart.

| Member                                      | Description                                           |
| ------------------------------------------- | ----------------------------------------------------- |
| `viewer.setSlice({ axis, position, flip })` | Cut the model. Calling it again moves the cut         |
| `viewer.clearSlice()`                       | Remove the cut                                        |
| `viewer.getSlice()`                         | The current cut `{ axis, position, flip }`, or `null` |

- `axis`: `'z'` front-back (default), `'x'` left-right, `'y'` top-bottom.
- `position`: from `0` to `1` across the model along that axis (default `0.5`, the middle).
- By default the part towards +axis is removed (for `'z'`, the front half). `flip: true` removes the
  other part instead.
- The cut surface of each closed structure is drawn with the hatched cut-surface shader
  ([`SHADERS.md`](SHADERS.md)). Four structures of `heart.glb` have holes (`right_atrium`,
  `papillary_muscles`, `aortic_valve`, `inferior_vena_cava`), so they show their inner walls instead.
- Clicks go through the removed part: you can select a structure inside the cut.
- The toolbar's **Slice** menu (`src/scripts/ui/toolbar.mjs`) uses these three methods.

## X-ray

Makes every structure see-through with a bright outline, to show how the structures sit inside
each other. The shader is explained in [`SHADERS.md`](SHADERS.md).

| Member                    | Description                 |
| ------------------------- | --------------------------- |
| `viewer.setXRay(enabled)` | Switch x-ray mode on or off |
| `viewer.isXRay()`         | Whether x-ray mode is on    |

- Selection, the selection highlight, layer toggles and slicing keep working in x-ray mode.
- Organs placed in AR always use their normal materials, even if x-ray mode is on.
- There is no button yet: Track C adds it to the toolbar. Until then, with `?dev`, type
  `viewer.setXRay(true)` in the browser console.

## Isolate

| Member                 | Description                                                                                    |
| ---------------------- | ---------------------------------------------------------------------------------------------- |
| `viewer.isolate(id)`   | Show only one organ or group; `null` shows everything again. Returns `false` for an unknown id |
| `viewer.getIsolated()` | The isolated id, or `null`                                                                     |

- A structure is shown when its layer is on **and** it is part of the isolated structure, so toggling
  a layer never undoes the isolation. `isSystemVisible` reports the layer switch only.
- There is no button yet: Track C adds it to the toolbar.

## Frame rate

`await viewer.measureFps({ seconds: 10 })` draws every frame for that time and returns
`{ fps, avgFrameMs, worstFrameMs, frames, slowFrames }` (`slowFrames`: over 50 ms, the limit in
[`TEST_PLAN.md`](TEST_PLAN.md)). Rotate the model meanwhile and keep the tab visible. With `?dev` or
not, it can be called from the browser console.

## Fly-to (for search)

| Member                           | Description                                                              |
| -------------------------------- | ------------------------------------------------------------------------ |
| `viewer.flyTo(id, { duration })` | Move the camera smoothly to frame an organ or a group. Returns a promise |

- Keeps the current viewing angle and frames only the visible part of the structure.
- `duration` in milliseconds (default `700`; `0` jumps). Users who ask their system for reduced
  motion always get a jump.
- The promise gives `true` once the camera arrives, and `false` for an unknown id, a structure with
  nothing visible, during AR, or when the flight is interrupted (the user grabs the view, another
  `flyTo`, `resetView` or `setViewState`).
- It does not select. For search, call both: `viewer.select(id); viewer.flyTo(id);`

## View state (for shareable links)

| Member                       | Description                                                          |
| ---------------------------- | -------------------------------------------------------------------- |
| `viewer.getViewState()`      | The current view as a small plain object                             |
| `viewer.setViewState(state)` | Restore a view: the object, or its JSON text. Returns `true`/`false` |

The object looks like this (version 1):

```json
{
  "v": 1,
  "camera": { "position": [0.012, 0.03, 0.31], "target": [0.0, 0.01, 0.0] },
  "selection": "left_ventricle",
  "hidden": ["cardiac_veins"],
  "slice": { "axis": "z", "position": 0.5, "flip": false },
  "xray": false,
  "isolated": null
}
```

- Coordinates are rounded to 0.1 mm, so the JSON stays short enough for a link (Track C chooses
  the URL format, for example `?view=` + `encodeURIComponent(JSON.stringify(state))`).
- `setViewState` checks everything, because a link can contain anything: invalid parts are
  ignored, and missing parts leave that part of the view as it is. `selection: null` clears the
  selection, `slice: null` removes the cut, `isolated: null` shows everything again. A state from a future version (`v` other than 1) is
  refused (`false`).

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
- A tap places the selection (an organ, or a whole group such as all valves), or the whole model if
  nothing is selected. It keeps its real colours, without the selection highlight. Another tap moves it.
  With no surface detected, it floats 0.8 m in front of the phone.
- AR runs through WebGPU, so it is only offered where the browser provides the WebXR/WebGPU binding (`XRGPUBinding`) and the session gets the `webgpu` feature. Most phones do not have it yet; there `viewer.arSupported` is `false`.

### Testing AR in a desktop browser

Without a phone, use the **Immersive Web Emulator** by Meta, which adds an emulated WebXR device to the browser.

1. Download the latest 2.x release from
   [its GitHub page](https://github.com/meta-quest/immersive-web-emulator/). The Chrome Web Store
   version may be older, so prefer this one.
2. Unzip it, open `chrome://extensions`, enable **Developer mode**, and choose **Load unpacked**.
   Chromium browsers such as Brave use the same steps at their own extensions page.
3. Run `npm run dev` and open the printed `localhost` address.
4. Open DevTools (F12) and find the emulator's tab. It only appears on pages that use WebXR.
5. The panel should now show **Enter AR**. Select an organ, enter AR, and press the emulated
   controller's trigger to place it. Load a room in the emulator to test surface detection.

An emulator does not test the real camera image, real surface detection or phone performance,
so AR must still be tested on a real phone before release.

### Testing AR on a phone

You need an Android phone with Chrome and Google Play Services for AR. WebXR only runs on HTTPS or
`localhost`, so connect the phone by USB, enable USB debugging, then run:

```
npm run dev
adb reverse tcp:5173 tcp:5173
```

Open `http://localhost:5173` in Chrome on the phone. A desktop browser shows `AR: not available here`.

## Contract with Track B (models and metadata)

The app follows `docs/DATA_CONTRACT.md`:

- It opens `assets/models/heart.glb` and `assets/data/organs.json` by default.
  `?model=<url>` loads another GLB, and `?model=placeholder` shows the stand-in body.
  If the model fails to load, the placeholder is shown and the error is logged.
- Every selectable structure is a node whose **name equals its id** in `organs.json`.
  Group nodes (`chambers`, `valves`, ...) are selectable too.
- A mesh's layer is read from `userData.system`, else `meta[id].system`, else its parent group name.
- `loadGLB(url, onProgress)` and `loadOrganIndex(url)` are in `src/scripts/render/loader.mjs`.
  `loadOrganIndex` turns the `organs.json` array into an index by id. A missing or invalid file
  gives an empty index, so the viewer works before the metadata exists.
- Fields such as `name` and `function` are `{ "en": "...", "fr": "..." }`. Learn mode shows the
  language the user picks and falls back to English.

## Coming in later weeks

AR gestures to move, rotate and scale, and choosing an organ inside AR (waiting for the decision on
AR with WebGPU), labels in AR (week 5). These method names are proposals until
they ship. (Lazy loading per system does not apply while the app has a single model, `heart.glb`.)
