# Human Anatomy Visualizer

An **interactive 3D anatomy viewer** that runs in the browser and renders **with WebGPU only**.
Rotate the heart, show it layer by layer, cut through it, and read what each structure does, in
English or French. It installs as an app and works offline. No account.

> Educational use only. Not a medical tool.

## WebGPU only

The app renders with **WebGPU and nothing else**: there is **no WebGL 2 fallback**. A browser or
device without WebGPU shows a "WebGPU is required" message (EN/FR) with the reason, instead of the
heart.

| Platform                 | Browser                                   | Works?                                     |
| ------------------------ | ----------------------------------------- | ------------------------------------------ |
| Windows, macOS, ChromeOS | Chrome or Edge, recent version            | Yes                                        |
| Android                  | Chrome, recent version, on a recent phone | Yes on most recent phones; older ones no   |
| iPhone, iPad, Mac        | Safari 26 or later                        | Yes; earlier versions show the message     |
| Any                      | Firefox                                   | Only where Firefox has WebGPU switched on  |
| Older GPUs or drivers    | Any                                       | The message, if the browser blocks the GPU |

Add `?dev` to the address to see the active renderer (`Renderer: WebGPU`).

## The experience

1. Open the link (or the installed app). The heart appears.
2. Rotate, zoom and pan with the mouse or with your fingers.
3. Show or hide layers, cut through the heart with "Slice", tap a structure to learn about it.
4. Optional, where supported: "View in AR" places the heart in your room through the phone's camera.

## Features

| Feature                                                                                                              | Status                                                                                                                                          |
| -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **3D viewer on WebGPU** (no WebGL 2 fallback), mouse and touch controls                                              | Done: runs on WebGPU in Edge on a laptop GPU; phones pending                                                                                    |
| **Place an organ, a group or the whole heart in your room** with WebXR, on a detected surface or floating in the air | Written; now needs WebXR through WebGPU (`XRGPUBinding`), which most phone browsers do not have yet                                             |
| **Move, rotate and scale** the placed organ with gestures                                                            | Planned                                                                                                                                         |
| **Choose organs and see labels inside AR**                                                                           | Planned                                                                                                                                         |
| **Explore the heart by layer** (chambers, valves, coronary arteries, cardiac veins, great vessels)                   | Done                                                                                                                                            |
| **Learn mode**: select a structure to get its function, location and key facts (EN/FR)                               | Working: the Learn panel (`scripts/learn/`) shows the FR/EN record of the selected structure or group; texts are drafts until the Week 6 review |
| **Quiz mode**: "find this organ", "name this organ", with progress saved on the device                               | Planned                                                                                                                                         |
| **Slicing**: cut through an organ with an adjustable plane to see the inside                                         | Done: "Slice" menu in the toolbar (three axes, position, keep the other half)                                                                   |
| **Shareable lesson links**: a teacher sends one link, the class sees the same view                                   | Planned                                                                                                                                         |
| **Offline PWA**: revise anywhere, no connection needed                                                               | Working: installable, and the heart, `organs.json` and the quiz bank work offline after the first visit                                         |
| _Stretch:_ **flow visualisation** along vessels and airways with WebGPU compute shaders                              | Stretch                                                                                                                                         |
| _Stretch:_ **real CT slices** linked to the model                                                                    | Stretch                                                                                                                                         |

Scope is split into **core** (must ship) and **stretch** (only if the core is solid). See `docs/ROADMAP.md`.

## Where AR runs

AR is optional. Because the renderer is WebGPU only, an AR session must also run through WebGPU (the
WebXR/WebGPU binding, `XRGPUBinding`). The "View in AR" button only appears in browsers that provide
it together with immersive AR; today that is very few phones. Everywhere else the 3D viewer works
without AR. See "Testing AR" in `docs/RENDERING_API.md`.

## Team and tracks

Each member owns one track and its issues (labels `track-a`, `track-b`, `track-c`).

| Track                    | Owner         | Focus                                                                                   |
| ------------------------ | ------------- | --------------------------------------------------------------------------------------- |
| **A: WebXR & rendering** | Omar          | WebGPU renderer, scene, layers, picking, slicing, performance, optional WebXR AR        |
| **B: Data & content**    | Adam          | Datasets, conversion pipeline, organ metadata, educational content, quiz bank, licences |
| **C: Platform & UX**     | Mohamed Amine | App shell, UI, learn/quiz modes, shareable links, PWA, CI/CD, tests, docs               |

## Tech

WebGPU · Three.js r187 (`WebGPURenderer`, WebGPU backend only: no WebGL 2 fallback) · WebXR Device
API (optional AR) · glTF/GLB · HTML/CSS/JavaScript (ES modules) · Service Worker + Web App Manifest ·
GitHub Actions.

## Folder architecture

The repository has four parts: the **app code** (`scripts/`), the **static files** the app loads
(`public/`), the **data pipeline** that produces those files (`data_pipeline/`, `data/`), and the
**project tooling** (tests, docs, configuration, CI/CD).

```
human-anatomy-visualizer/
│
├── scripts/                     APP CODE: the web app (Vite root). All JavaScript is ES modules (.mjs)
│   ├── index.html               Page shell: meta tags, manifest link, loads main.mjs in <head>
│   ├── main.mjs                 Entry point: loads the model and organs.json, starts the viewer,
│   │                            mounts the interface, or shows "WebGPU is required"
│   │
│   ├── render/                  Track A: everything 3D. Other folders only import render/index.mjs
│   │   ├── index.mjs            Public API: createViewer() (see docs/RENDERING_API.md)
│   │   ├── renderer.mjs         WebGPU renderer, WebGPU check (no WebGL 2 fallback)
│   │   ├── scene.mjs            Scene, camera, lights, framing the model on screen
│   │   ├── controls.mjs         Orbit, zoom and pan (mouse and touch)
│   │   ├── loader.mjs           Loads heart.glb and organs.json
│   │   ├── layers.mjs           Shows and hides the 5 groups (chambers, valves...)
│   │   ├── picking.mjs          Click or tap to select a structure, highlight
│   │   ├── slicing.mjs          Cutting plane with a filled cross-section
│   │   ├── xr.mjs               Optional WebXR AR: place the heart in the room
│   │   └── placeholder.mjs      Stand-in body shown if the model cannot load
│   │
│   ├── ui/                      Track C: the interface
│   │   ├── toolbar.mjs          Toolbar: layers, Slice, reset view, language, AR button
│   │   ├── about.mjs            About window: credits, licences, not-a-medical-tool notice
│   │   ├── unsupported.mjs      "WebGPU is required" message (EN/FR)
│   │   └── ui.css
│   │
│   ├── learn/                   Track C: Learn mode
│   │   ├── learnMode.mjs        Panel with the selected structure's record (EN/FR)
│   │   ├── language.mjs         Current language (EN/FR), shared by learn/ and ui/
│   │   └── learnMode.css
│   │
│   ├── pwa/                     Track C: installable app and offline use
│   │   ├── register.mjs         Registers the service worker (production build only)
│   │   ├── sw.mjs               Service worker: caches the app, model and data for offline use
│   │   └── manifest.webmanifest App name, icons, colours, standalone display
│   │
│   └── dev/
│       └── devPanel.mjs         Developer panel, only with ?dev in the URL
│
├── public/                      STATIC FILES: copied unchanged to the site root at build time
│   ├── icons/                   App icons (192 and 512 px)
│   └── assets/
│       ├── models/heart.glb     The 3D heart: 29 structures in 5 groups (built by the pipeline)
│       └── data/
│           ├── organs.json      One EN/FR record per structure and group
│           └── quiz.json        Quiz bank (71 questions)
│
├── data_pipeline/               Track B: Python scripts that build and check the data
│   ├── build.py                 Builds heart.glb from the raw datasets (config/heart.json)
│   ├── sources.py               Readers for the source datasets
│   ├── mesh_ops.py              Mesh operations (cleaning, decimation, alignment)
│   ├── check_glb.py             Checks a built GLB
│   ├── validate_content.py      Checks organs.json and quiz.json against heart.glb (run by CI)
│   ├── config/heart.json        Which source meshes make up the heart
│   ├── requirements.txt         Python packages for the pipeline
│   └── README.md                How to run the pipeline
│
├── data/
│   └── raw/                     Raw datasets: hra/ is committed, the rest is downloaded and ignored
│
├── tests/                       Automated tests (Node's test runner): npm test
│   ├── render.test.mjs          Selection, AR placement, organs.json loading
│   ├── renderer.test.mjs        WebGPU check
│   └── slicing.test.mjs         Slicing, and which structures can show a filled cut
│
├── docs/                        Project documentation (list below)
├── .github/workflows/ci-cd.yml  CI/CD: lint, tests, data validation, build, deploy to GitHub Pages
│
├── vite.config.mjs              Build: scripts/ is the root, public/ the static folder, output dist/;
│                                publishes pwa/sw.mjs and pwa/manifest.webmanifest at the site root
├── eslint.config.mjs            Lint rules (npm run lint)
├── package.json                 Dependencies and npm scripts
├── .editorconfig, .prettierrc, .prettierignore, .nvmrc, .gitignore
├── ATTRIBUTION.md               Credits for every asset, library and AI use
├── CONTRIBUTING.md              Workflow rules (branches, pull requests)
├── LICENSE                      MIT for the code; assets keep their own licences
└── README.md
```

Not in Git: `node_modules/` (npm packages), `dist/` (the built site), `data/raw/bodyparts3d/`
(downloaded dataset) and `data/out/` (pipeline output).

### How the parts fit together

```
data/raw/  ──(data_pipeline/build.py)──►  public/assets/models/heart.glb
                                          public/assets/data/organs.json, quiz.json
                                                      │
scripts/  (index.html + .mjs modules)                 │
          ──────────────(npm run build: Vite)─────────┴──►  dist/  ──(CI/CD)──►  GitHub Pages
```

1. **Data:** Track B builds `heart.glb` from the raw datasets with `data_pipeline/`, and writes the
   texts in `organs.json` and `quiz.json`. `validate_content.py` checks that every structure in the
   model has its record.
2. **App:** `scripts/main.mjs` loads those files by URL (`assets/models/heart.glb`,
   `assets/data/organs.json`), passes the model to `render/` (the 3D viewer), then mounts `ui/`
   and `learn/` on top of it. `ui/` and `learn/` use the viewer only through `render/index.mjs`.
3. **Build:** `npm run build` bundles `scripts/` into `dist/`, copies `public/` as is, and puts
   `sw.mjs` and `manifest.webmanifest` at the root of `dist/`.
4. **Deploy:** on every merge into `main`, CI/CD runs the checks, builds, and publishes `dist/` to
   GitHub Pages.

### Where to put a new file

| You are adding...                          | Put it in                    |
| ------------------------------------------ | ---------------------------- |
| 3D or rendering code                       | `scripts/render/`            |
| A button, panel or window                  | `scripts/ui/`                |
| Learn or quiz mode code                    | `scripts/learn/`             |
| Offline or install behaviour               | `scripts/pwa/`               |
| An image, model or data file the app loads | `public/` (under `assets/`)  |
| A script that converts or checks data      | `data_pipeline/`             |
| A test                                     | `tests/`, named `*.test.mjs` |
| Documentation                              | `docs/`                      |

Why `sw.mjs` and the manifest are in `scripts/pwa/` but served from the site root: a service worker
only controls pages in its own folder and below, so it must sit next to `index.html`. A small plugin
in `vite.config.mjs` publishes both files there, unchanged.

## Getting started

```
npm ci
npm run dev
```

Full instructions are in `docs/SETUP.md` (install, dev server, deployment, testing the PWA).

## Docs

- `docs/ROADMAP.md`: 7-week plan per track
- `docs/STATUS.md`: what is done, what is left, decisions needed
- `docs/SETUP.md`: how to install and run the project
- `docs/TEST_PLAN.md`: real-device checklist and how to measure the frame rate
- `docs/RENDERING_API.md`: the viewer and AR API, and how to test AR
- `docs/DATA_SOURCES.md`: datasets, licences, caveats
- `docs/DATA_CONTRACT.md`: how Track B's data plugs into Tracks A and C
- `ATTRIBUTION.md`: credits for every asset
- `CONTRIBUTING.md`: workflow rules
