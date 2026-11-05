# Roadmap (7 weeks)

## Product focus

This is an **extended reality project: an augmented reality (AR) app built on the WebXR Device API**.
The 3D viewer exists to serve the AR experience. The main interaction is choosing an organ on the
phone and projecting it into the user's real space to walk around it and study it.

We chose **AR over VR** because it needs only a phone, which students already have, and keeps
them in their real surroundings. The target is Chrome on Android phones with ARCore. Other browsers
and desktops get the 3D viewer without AR.

Core features must be done and merged before any stretch work starts.

| Week | Track A: WebXR & rendering | Track B: Data & content | Track C: Platform & UX |
|---|---|---|---|
| **1** Foundations and spikes | WebGPU renderer with WebGL 2 fallback and backend indicator; load a sample GLB; orbit controls | Dataset spike: download samples, convert one organ end to end, check licences, choose sources; write the data contract | Vite project, app shell, GitHub Pages deploy with Actions, PWA skeleton, `docs/SETUP.md` |
| **2** Core viewing | System layers (show/hide); picking and highlight | Conversion pipeline v1; first body and organ set exported as GLB, grouped by system | UI panels (system toggles, info panel) wired to `organs.json` |
| **3** AR core and learning | **WebXR AR core:** `immersive-ar` session, surface detection, placing the selected organ in the room, tested on an Android phone; `viewer.flyTo(id)` for Track C's search | Content for the first 5 organs; validation script (every mesh has metadata and licence) | Search with fly-to; Learn mode |
| **4** AR interaction and depth | **AR interaction:** move, rotate and scale the placed organ; choose an organ from inside AR; lazy loading per system; `viewer.getViewState()` and `setViewState()` for Track C's shareable links in week 5 | Content for all chosen organs; quiz bank v1 | Quiz mode with progress saved on the device |
| **5** Reach | AR performance pass on phones; lighter asset tier, once Track B's light pack is merged; organ labels in AR; slicing plane with filled cross-section | Light asset pack for phones; complete `ATTRIBUTION.md`; EN/FR content review | Shareable lesson links; EN/FR interface |
| **6** Integration | Bug fixes; AR performance measurement on real phones; isolate and x-ray modes if time allows | Content accuracy review with supervisor or a student of medicine | Usability test with 5 students; automated tests; fixes |
| **7** Finish | Freeze; stretch only if everything is stable | Final attribution check | Offline hardening; user manual; demo video; defence rehearsal |

## Stretch (only after core is stable)
- Flow particles along vessels and airways with WebGPU compute shaders (Track A)
- Real CT slices from TotalSegmentator linked to the 3D model (Track B with Track A)

## Definition of done
Merged through a reviewed PR, works on both rendering backends, AR features tested on a real
Android phone, no console errors, documented, new assets credited in `ATTRIBUTION.md`.
