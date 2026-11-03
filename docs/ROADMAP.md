# Roadmap (7 weeks)

Core features must be done and merged before any stretch work starts.

| Week | Track A: Rendering & 3D | Track B: Data & content | Track C: Platform & UX |
|---|---|---|---|
| **1** Foundations and spikes | WebGPU renderer with WebGL 2 fallback and backend indicator; load a sample GLB; orbit controls | Dataset spike: download samples, convert one organ end to end, check licences, choose sources; write the data contract | Vite project, app shell, GitHub Pages deploy with Actions, PWA skeleton, `docs/SETUP.md` |
| **2** Core viewing | System layers (show/hide); picking and highlight | Conversion pipeline v1; first body and organ set exported as GLB, grouped by system | UI panels (system toggles, info panel) wired to `organs.json` |
| **3** Slicing and learning | Slicing plane with filled cross-section | Content for the first 5 organs; validation script (every mesh has metadata and licence) | Search with fly-to; Learn mode |
| **4** Depth | Isolate and x-ray modes; lazy loading per system | Content for all chosen organs; quiz bank v1 | Quiz mode with progress saved on the device |
| **5** Reach | Mobile performance pass; lighter asset tier | Light asset pack for phones; complete `ATTRIBUTION.md`; EN/FR content review | Shareable lesson links; EN/FR interface |
| **6** Integration | Bug fixes; performance measurement | Content accuracy review with supervisor or a student of medicine | Usability test with 5 students; automated tests; fixes |
| **7** Finish | Freeze; stretch only if everything is stable | Final attribution check | Offline hardening; user manual; demo video; defence rehearsal |

## Stretch (only after core is stable)
- Flow particles along vessels and airways with WebGPU compute shaders (Track A)
- Real CT slices from TotalSegmentator linked to the 3D model (Track B with Track A)
- AR mode with WebXR (Track A)

## Definition of done
Merged through a reviewed PR, works on both rendering backends, no console errors,
documented, new assets credited in `ATTRIBUTION.md`.
