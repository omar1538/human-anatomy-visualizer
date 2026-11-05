# Human Anatomy Visualizer

An **extended reality anatomy learning app** that runs in the browser, built on the **WebXR Device API**.
Choose an organ on your phone, project it into the real space around you, and walk around it to study it.
No installation and no account.

We build for **augmented reality (AR)** rather than virtual reality: it needs only a phone, which students
already have, and it keeps them in their real surroundings.

> Educational use only. Not a medical tool.

## The experience

1. Choose an organ on the phone.
2. Enter AR. The phone's camera shows your room.
3. Point at a surface and tap. The organ appears there at a size you can study.
4. Walk around it and look at it from any side. Tap again to move it.

## Features

| Feature                                                                                                    | Status      |
| ---------------------------------------------------------------------------------------------------------- | ----------- |
| **Place an organ or the whole body in your room** with WebXR, on a detected surface or floating in the air | In progress |
| **Move, rotate and scale** the placed organ with gestures                                                  | Planned     |
| **Choose organs and see labels inside AR**                                                                 | Planned     |
| **Whole-body exploration by system** (muscles, skeleton, organs, vessels)                                  | Started     |
| **Learn mode**: select a structure to get its function, location and key facts (EN/FR)                     | Planned     |
| **Quiz mode**: "find this organ", "name this organ", with progress saved on the device                     | Planned     |
| **Slicing**: cut through an organ with an adjustable plane to see the inside                               | Planned     |
| **Shareable lesson links**: a teacher sends one link, the class sees the same view                         | Planned     |
| **Offline PWA**: revise anywhere, no connection needed                                                     | Planned     |
| _Stretch:_ **flow visualisation** along vessels and airways with WebGPU compute shaders                    | Stretch     |
| _Stretch:_ **real CT slices** linked to the model                                                          | Stretch     |

Scope is split into **core** (must ship) and **stretch** (only if the core is solid). See `docs/ROADMAP.md`.

## Where AR runs

AR targets **Chrome on Android phones with ARCore**. Other browsers and desktops get the 3D view without AR.
For development without a phone, use a WebXR emulator in the browser: see "Testing AR" in `docs/RENDERING_API.md`.

## Team and tracks

Each member owns one track and its issues (labels `track-a`, `track-b`, `track-c`).

| Track                    | Owner      | Focus                                                                                     |
| ------------------------ | ---------- | ----------------------------------------------------------------------------------------- |
| **A: WebXR & rendering** | [Member 1] | WebXR AR sessions and interaction, renderer, scene, layers, picking, slicing, performance |
| **B: Data & content**    | [Member 2] | Datasets, conversion pipeline, organ metadata, educational content, quiz bank, licences   |
| **C: Platform & UX**     | [Member 3] | App shell, UI, learn/quiz modes, shareable links, PWA, CI/CD, tests, docs                 |

## Tech

WebXR Device API · Three.js (`WebGPURenderer`, with WebGPU on desktop and WebGL 2 for AR and as the fallback) ·
glTF/GLB · HTML/CSS/JavaScript (ES modules) · Service Worker + Web App Manifest · GitHub Actions.

## Repository layout

```
src/render/            Track A: WebXR AR, renderer, scene, controls, layers, picking
src/dev/               Temporary developer panel, until the real interface exists
src/ui/                Track C: panels, search, toolbar
src/learn/             Track C: learn mode, quiz mode, progress, shareable links
src/pwa/               Track C: manifest helpers, service worker
scripts/data-pipeline/ Track B: conversion, decimation, validation scripts
public/assets/models/  Final optimised GLB files
public/assets/data/    organs.json, quiz bank
data/raw/              Raw datasets (ignored by Git)
tests/                 Automated tests
docs/                  Roadmap, setup, rendering API, data sources, data contract
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
- `docs/RENDERING_API.md`: the viewer and AR API, and how to test AR
- `docs/DATA_SOURCES.md`: datasets, licences, caveats
- `docs/DATA_CONTRACT.md`: how Track B's data plugs into Tracks A and C
- `ATTRIBUTION.md`: credits for every asset
- `CONTRIBUTING.md`: workflow rules
