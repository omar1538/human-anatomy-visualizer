# Project status

**Last updated: 5 November 2026 (end of Week 1).** Update this file at the end of each week.

The plan itself is in [`ROADMAP.md`](ROADMAP.md). This file says where we actually are.

## Summary

All three Week 1 deliverables are **in `main`** (5 November). They were merged directly,
**without the pull-request review CONTRIBUTING asks for**, so each track should review the other
two tracks' changes in `main` now and open fixes as normal PRs. The merged code builds and lints
cleanly. Conflicts in `README.md` and `ATTRIBUTION.md` were resolved by keeping both sides.

| Track             | Week 1 goal                                        | Merged from              | State                         |
| ----------------- | -------------------------------------------------- | ------------------------ | ----------------------------- |
| A: Rendering & 3D | Renderer with fallback, load a GLB, orbit controls | `track-a/webxr-ar`       | In `main`, review outstanding |
| B: Data & content | Dataset spike, one organ end to end, data contract | `track-b/dataset-spike`  | In `main`, review outstanding |
| C: Platform & UX  | Deploy with Actions, PWA skeleton, `SETUP.md`      | `track-c/week1-platform` | In `main`, review outstanding |

## What has been done

### Track A: Rendering & 3D

Viewer (`src/render/`):

- `createViewer()` public API ([`RENDERING_API.md`](RENDERING_API.md)): Three.js `WebGPURenderer`
  with automatic WebGL 2 fallback, and the active backend shown in the dev panel.
- Orbit, zoom and pan with mouse or touch. On-demand rendering, which saves battery.
- Show and hide layers, plus click-to-select with a highlight (both planned for Week 2, done early).
- `loadGLB()` with Meshopt support, a placeholder body until real models exist, and a temporary dev panel.

AR (from `track-a/webxr-ar`):

- WebXR AR: start an `immersive-ar` session, detect surfaces, tap to place the selected organ in the room.
- AR API: `arSupported`, `enterAR()`, `exitAR()`, `isInAR()`, `onARChange()`. On AR-capable
  phones WebGL 2 is forced.
- Support for testing AR with a WebXR emulator in a desktop browser.
- `README.md` and `ROADMAP.md` rewritten around AR as the core of the product (see "Decisions needed").

### Track B: Data & content

- First real model: `public/assets/models/heart.glb` (2.7 MB, about 110k triangles), in five layers:
  `chambers`, `valves`, `coronary_arteries`, `cardiac_veins`, `great_vessels`.
- Conversion pipeline v1 in Python (`scripts/data-pipeline/`). It combines BodyParts3D (vessels) and
  HuBMAP HRA (chambers, valves), fitted together with ICP, then cleaned, decimated and exported as GLB.
  A check script verifies the output.
- Draft data contract ([`DATA_CONTRACT.md`](DATA_CONTRACT.md)): the mesh name is the organ id, the
  parent group is the layer, units are metres with +Y up, and the `organs.json` format.
- Data sources and licences (CC BY 4.0), download instructions with SHA-256 checksums, and credits
  in `ATTRIBUTION.md`.

### Track C: Platform & UX

- GitHub Pages deploy (`.github/workflows/deploy.yml`): every push to `main` runs `npm ci`, lint
  and build, then publishes `dist/`.
- PWA skeleton: `manifest.webmanifest`, placeholder icons, and a service worker (`public/sw.js`)
  with a versioned app-shell cache. HTML is network-first, other files are cache-first. The app
  works offline after the first visit.
- The service worker is registered in production only (`src/pwa/register.js`).
- Phone-friendly `index.html`: viewport, theme colour, iOS home-screen tags.
- No analytics or external requests.
- [`SETUP.md`](SETUP.md): deployment, and testing the PWA locally.

### Tested so far

- `npm run lint` and `npm run build` pass on the merged `main`.
- The built site serves the service worker, the manifest, the icons and `heart.glb`.
- In a headless desktop browser (Edge, WebGL 2): `heart.glb` loads with its five layers, selection
  works, there are no page errors, the service worker takes control, and the app shell is cached.
- The raw data downloads match the checksums in `DATA_SOURCES.md`.
- **Not tested yet:** the PWA installed on a real phone, offline mode, the WebGPU backend, and AR on
  a real Android phone.

## Decisions needed (whole team)

1. **Is AR the core of the product?** The AR roadmap is now in `main`, but the team has not
   agreed on it yet. It turns WebXR AR, which was a stretch goal, into the core. This changes Track A's Weeks 3 to 6: slicing moves to Week 5, and
   isolate and x-ray become "if time allows". WebXR AR does not work in Safari on iPhone or iPad.
   If iPhone users matter, AR Quick Look (USDZ) would be extra work for Tracks A and B.
2. **Raw data in Git.** `main` now contains `data/raw/hra/` (5.8 MB), committed through a
   `.gitignore` exception, but CONTRIBUTING rule 6 says no raw datasets in Git. The female heart
   in it is not used by the pipeline. Keep it (and update rule 6) or remove it.
3. **Data contract sections marked "proposed"** (axes, origin, node tree, ids, materials) need
   Tracks A and C to agree before the contract is final.

## Before Week 2 starts

- [x] Merge the three Week 1 branches into `main` (done directly, without PRs).
- [ ] Review the other tracks' Week 1 changes in `main`; open fixes as PRs.
- [ ] Back to the normal rule from now on: every change through a reviewed PR.
- [ ] Repo owner: Settings > Pages > Source: **GitHub Actions**, then check the live site.
- [ ] Test the live site on a phone: install it, use it offline, try AR on Android.
- [ ] Avoid force-pushing branches others have pulled (`track-b/dataset-spike` was rewritten on 5 Nov).

## Known issues

| Issue                                                                                              | Where                   | Owner | State                                                           |
| -------------------------------------------------------------------------------------------------- | ----------------------- | ----- | --------------------------------------------------------------- |
| Holes in the right atrium, aortic valve and papillary muscles, which will break slicing caps there | `heart.glb`             | B     | Open                                                            |
| Placeholder app icons                                                                              | `public/icons/`         | C     | Open (needs a real design)                                      |
| Each selection cloned a material and never freed the old one, a slow memory leak                   | `src/render/picking.js` | A     | Fixed: one clone per mesh at most                               |
| The build warned about a 940 kB chunk                                                              | `vite.config.js`        | C     | Fixed: three.js in its own cached file, limit raised to 1000 kB |
| `public/sw.js` was not covered by `npm run lint`                                                   | `eslint.config.js`      | C     | Fixed                                                           |
| Workflow actions ran on deprecated Node 20                                                         | `deploy.yml`            | C     | Fixed: latest major versions                                    |

## What still has to be done

From the original roadmap. [`ROADMAP.md`](ROADMAP.md) in `main` now has the AR version, which changes
Track A's Weeks 3 to 6 (see decision 1); Tracks B and C are the same in both.

| Week  | Track A                                                           | Track B                                                                       | Track C                                                                            |
| ----- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **2** | ~~Layers, picking~~ (done in `main`)                              | ~~Pipeline v1~~ (done on branch); **first `organs.json`** for the heart's ids | UI panels: layer toggles, info panel wired to `organs.json`; replace the dev panel |
| **3** | `viewer.flyTo(id)` early in the week; slicing plane               | Content for the first 5 organs; validation script                             | Search with fly-to; Learn mode                                                     |
| **4** | Isolate, x-ray; lazy loading; `getViewState()` / `setViewState()` | Content for all organs; quiz bank v1                                          | Quiz mode, progress saved on the device                                            |
| **5** | Mobile performance pass; light asset tier                         | Light asset pack; complete `ATTRIBUTION.md`; EN/FR review                     | Shareable lesson links; EN/FR interface                                            |
| **6** | Bug fixes; performance measurement                                | Content accuracy review                                                       | Usability test with 5 students; automated tests                                    |
| **7** | Freeze; stretch only if stable                                    | Final attribution check                                                       | Offline hardening; user manual; demo video; defence rehearsal                      |

### Dependencies between tracks

- **Track C's Week 2 info panel needs `organs.json` from Track B.** It is not planned until Week 3,
  so a first version with ids, names and a short text is needed in Week 2. Until then Track C uses a
  mock file that follows `DATA_CONTRACT.md`.
- Track C's Week 3 search needs `viewer.flyTo(id)` from Track A at the start of Week 3.
- Track C's Week 5 shareable links need `getViewState()` / `setViewState()` from Track A by the end of Week 4.
- Track B's mesh compression (meshopt or Draco) needs `gltf-transform`, a new npm dependency, which
  goes through a dedicated PR reviewed by all three.
- Track B wants the Khronos glTF-Validator in CI: Track C adds it to the workflow.
