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

| Feature                                                                                                              | Status                                                                                                                                         |
| -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **3D viewer on WebGPU** (no WebGL 2 fallback), mouse and touch controls                                              | Done: runs on WebGPU in Edge on a laptop GPU; phones pending                                                                                   |
| **Place an organ, a group or the whole heart in your room** with WebXR, on a detected surface or floating in the air | Written; now needs WebXR through WebGPU (`XRGPUBinding`), which most phone browsers do not have yet                                            |
| **Move, rotate and scale** the placed organ with gestures                                                            | Planned                                                                                                                                        |
| **Choose organs and see labels inside AR**                                                                           | Planned                                                                                                                                        |
| **Explore the heart by layer** (chambers, valves, coronary arteries, cardiac veins, great vessels)                   | Done                                                                                                                                           |
| **Learn mode**: select a structure to get its function, location and key facts (EN/FR)                               | Working: the Learn panel (`scripts/learn/`) shows the FR/EN record of the selected structure or group; texts are drafts until the Week 6 review |
| **Quiz mode**: "find this organ", "name this organ", with progress saved on the device                               | Planned                                                                                                                                        |
| **Slicing**: cut through an organ with an adjustable plane to see the inside                                         | Done: "Slice" menu in the toolbar (three axes, position, keep the other half)                                                                  |
| **Shareable lesson links**: a teacher sends one link, the class sees the same view                                   | Planned                                                                                                                                        |
| **Offline PWA**: revise anywhere, no connection needed                                                               | Working: installable, and the heart, `organs.json` and the quiz bank work offline after the first visit                                        |
| _Stretch:_ **flow visualisation** along vessels and airways with WebGPU compute shaders                              | Stretch                                                                                                                                        |
| _Stretch:_ **real CT slices** linked to the model                                                                    | Stretch                                                                                                                                        |

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

## Repository layout

```
scripts/                      The web app (Vite root). All code is ES modules (.mjs)
  index.html                  Page shell, loads main.mjs
  main.mjs                    Entry point
  render/                     Track A: WebGPU renderer, scene, controls, layers, picking, slicing, optional AR
  ui/                         Track C: toolbar, About and credits window, "WebGPU is required" message
  learn/                      Track C: learn mode, language
  pwa/                        Track C: the PWA files
    register.mjs              Registers the service worker
    sw.mjs                    Service worker (offline cache), published at the site root
    manifest.webmanifest      PWA manifest, published at the site root
  dev/                        Developer panel (backend, raw ids, test controls), only with ?dev in the URL
  public/                     Copied as is to the site root:
    icons/                    App icons
    assets/models/            Final optimised GLB files
    assets/data/              organs.json, quiz bank
data_pipeline/                Track B: conversion, decimation, validation scripts (Python)
data/raw/                     Raw datasets (ignored by Git except hra/)
tests/                        Automated tests (.mjs)
docs/                         Roadmap, setup, rendering API, data sources, data contract
vite.config.mjs, eslint.config.mjs   Build and lint configuration
```

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
