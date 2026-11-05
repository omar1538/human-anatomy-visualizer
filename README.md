# Human Anatomy Visualizer

An interactive 3D anatomy **learning platform** that runs in the browser: no installation, no account.
Explore the body by system, slice through organs, click any structure to learn what it does,
and test yourself with quizzes. Rendered with **WebGPU** (Three.js) with an automatic **WebGL 2 fallback**,
delivered as an offline-capable **PWA**.

> Educational use only. Not a medical tool.

## What makes it more than a 3D atlas

| Feature | Why it matters |
|---|---|
| **Whole-body, multi-system exploration** (skin, muscles, skeleton, organs, vessels) | Understand how systems sit on top of each other, not just one organ |
| **Slicing**: cut through an organ or the body with an adjustable plane, with a filled cross-section | See the inside, e.g. the chambers of the heart |
| **Learn mode**: click a structure to get its function, location and key facts (EN/FR) | Turns the viewer into a study tool |
| **Quiz mode**: "find this organ", "name this organ", with progress saved on the device | Active recall for students |
| **Shareable lesson links**: camera, visible layers and selection encoded in the URL | A teacher sends one link, the class sees the same view |
| **Offline PWA** | Revise anywhere, no connection needed |
| *Stretch:* **flow visualisation** with WebGPU compute shaders (illustrative blood/air flow along vessels and airways) | A real use of WebGPU beyond drawing meshes |
| *Stretch:* **real CT slices** linked to the 3D model | Connects the model to real medical imaging |

Scope is split into **core** (must ship) and **stretch** (only if the core is solid). See `docs/ROADMAP.md`.

## Team and tracks

Each member owns one track and its issues (labels `track-a`, `track-b`, `track-c`).

| Track | Owner | Focus |
|---|---|---|
| **A: Rendering & 3D** | [Member 1] | WebGPU/WebGL 2 renderer, scene, layers, picking, slicing, performance |
| **B: Data & content** | [Member 2] | Datasets, conversion pipeline, organ metadata, educational content, quiz bank, licences |
| **C: Platform & UX** | [Member 3] | App shell, UI, learn/quiz modes, shareable links, PWA, CI/CD, tests, docs |

## Tech

Three.js (`WebGPURenderer`, WebGL 2 fallback) · glTF/GLB · HTML/CSS/JavaScript (ES modules) ·
Service Worker + Web App Manifest · GitHub Pages (HTTPS) · GitHub Actions.

## Repository layout

```
src/render/            Track A: renderer, scene, controls, layers, picking, slicing
src/ui/                Track C: panels, search, toolbar
src/learn/             Track C: learn mode, quiz mode, progress, shareable links
src/pwa/               Track C: manifest helpers, service worker
scripts/data-pipeline/ Track B: conversion, decimation, validation scripts
public/assets/models/  Final optimised GLB files
public/assets/data/    organs.json, quiz bank
data/raw/              Raw datasets (ignored by Git except hra/)
tests/                 Automated tests
docs/                  Roadmap, data sources, data contract, design notes
```

## Getting started

Setup instructions are added by Track C in Week 1 (`docs/SETUP.md`).

## Docs

- `docs/ROADMAP.md`: 7-week plan per track
- `docs/DATA_SOURCES.md`: datasets, licences, caveats
- `docs/DATA_CONTRACT.md`: how Track B's data plugs into Tracks A and C
- `ATTRIBUTION.md`: credits for every asset
- `CONTRIBUTING.md`: workflow rules
