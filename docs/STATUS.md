# Project status

**Last updated: 18 November 2026 (start of Week 3 of 6).** Update this file at the end of each week.

The plan is in [`ROADMAP.md`](ROADMAP.md); this file says where we actually are. The reference for
what must ship is the project's _cahier des charges_.

## Summary

The core of the cahier des charges is built and in `main`: the 3D heart on WebGPU (since 18 November
WebGPU only, without the WebGL 2 fallback: see decision 1), mouse and touch controls, layers, Learn mode (FR/EN), the main interface with the credits
and the not-a-medical-tool notice, and the offline PWA, deployed on GitHub Pages. Slicing is merged
too. **Nothing has been tested on a real phone or on real WebGPU hardware yet**, and three of the
five final deliverables have not started.

## Cahier des charges check

| Requirement                                                     | State                                                                                                                                           |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| §3.1 Show one or two organs in 3D in the browser                | Done: the heart, 29 structures in 5 groups                                                                                                      |
| §3.1 Rotate, zoom, move with a mouse or touch                   | Done. On portrait phones the heart is cut off left and right: fix in an open PR (see below)                                                     |
| §3.1 Identify the organ and its parts (name, short explanation) | Done: Learn mode, FR/EN, texts still drafts                                                                                                     |
| §3.1 Simple interface on a laptop and a phone                   | Done (`src/scripts/ui/`): toolbar, layers, slicing, reset, About, language                                                                           |
| §3.1 Installable and usable offline                             | Done in a desktop browser (installability check passes, works with the server stopped). **Not tested on a phone**                               |
| §3.2 Smooth on a standard laptop and a mid-range phone          | **Not measured**                                                                                                                                |
| §3.2 WebGPU, with the WebGL 2 fallback                          | **Fallback removed on 18 November (WebGPU only), against this requirement: decision 1.** WebGPU runs in Edge on a laptop GPU; phones not tested |
| §3.2 Usable without a manual                                    | How-to in the About window; to confirm in the Week 5 usability test                                                                             |
| §3.2 No personal data collected                                 | Done: no account, no analytics, no external requests; only the language choice is stored on the device                                          |
| §3.2 Authors and licences credited in the application           | Done: About window with the credit lines of `ATTRIBUTION.md`                                                                                    |
| §3.2 Educational use only, not a medical tool                   | Done: first screen and About window                                                                                                             |
| §5 App deployed with HTTPS                                      | Done: GitHub Pages, deployed by CI/CD after every merge into `main`                                                                             |
| §5 Source code on GitHub with the PWA files and 3D assets       | Done                                                                                                                                            |
| §5 Attribution file                                             | Done for assets, libraries and Tracks A and B. **Track C's AI declaration is incomplete**                                                       |
| §5 Design notebook                                              | Started in an open PR                                                                                                                           |
| §5 Technical documentation (installation and deployment)        | Done: [`SETUP.md`](SETUP.md)                                                                                                                    |
| §5 Short user manual                                            | Started in an open PR                                                                                                                           |
| §5 Demo video (max. 5 minutes, voice-over)                      | Not started (Week 6)                                                                                                                            |

## In `main` (by track)

**Track A: Rendering & 3D.** `createViewer()` API ([`RENDERING_API.md`](RENDERING_API.md)):
`WebGPURenderer` on WebGPU only (no WebGL 2 fallback; without WebGPU an EN/FR "WebGPU is required"
message replaces the viewer); orbit, zoom and pan; on-demand rendering; layers;
picking with highlight and group selection; `viewer.organ(id)`; **slicing** with a filled cut
(`src/scripts/render/slicing.mjs`, controls in the toolbar's "Slice" menu); WebXR AR (hit test, tap to place,
floating fallback), tested in a WebXR emulator only, and now only offered where the browser has the
WebXR/WebGPU binding (`XRGPUBinding`). Automated tests in `src/scripts/tests/` (30), run by CI.

**Track B: Data & content.** `heart.glb` (2.7 MB, about 110k triangles, 29 structures, 5 groups)
from BodyParts3D and HuBMAP HRA fused with ICP; conversion pipeline v1; `organs.json` (34 records,
FR/EN, all `draft`); `quiz.json` (71 questions); `validate_content.py`; **data contract v1.0, final**
([`DATA_CONTRACT.md`](DATA_CONTRACT.md)); the CI/CD workflow.

**Track C: Platform & UX.** Service worker (`src/sw.mjs`, cache `v3`): network-first for pages,
cache-first for Vite's hashed build files, stale-while-revalidate for the model, `organs.json`,
`quiz.json`, icons and manifest, all precached at install. Manifest, icons, production-only
registration. Learn mode (`src/scripts/learn/`), main interface and About window with the credits
(`src/scripts/ui/`), dev panel only with `?dev`. [`SETUP.md`](SETUP.md).

**CI/CD** (`.github/workflows/ci-cd.yml`, replaces `deploy.yml`): on every push and pull request to
`main`: install, lint, `npm test`, data validation, a 5 MB limit on `.glb` files, build. A push to
`main` whose CI passed is deployed to GitHub Pages. The CI job is required by the branch protection
of `main`.

Process note: the main interface and credits (17 November) and the WebGPU-only change (18 November,
`6fa7bd4`) went into `main` without a pull request. Tracks A and B should still review them; the
second one changes Track A's `src/scripts/render/renderer.mjs` and `src/scripts/render/xr.mjs`.

## Open pull requests (18 November)

| Branch                               | What                                                                        | Needs                         |
| ------------------------------------ | --------------------------------------------------------------------------- | ----------------------------- |
| `track-a/fix-portrait-framing`       | Fit the heart to portrait screens, re-frame on rotation, unit tests         | Review by Track A             |
| `track-c/docs-align-with-spec`       | **Draft.** README and ROADMAP realigned on the cahier des charges, 6 weeks  | Agreement of all three tracks |
| `track-c/design-notebook-and-manual` | `docs/DESIGN_NOTEBOOK.md` and `docs/USER_MANUAL.md` (EN/FR), first versions | Review                        |
| `track-c/cleanup`                    | Removes leftover files; brings this status up to date                       | Review                        |

These branches are on GitHub; their pull requests still have to be opened. The first three were
written before the WebGPU-only change: the draft and the notebook still describe the WebGL 2
fallback and must be updated before merging. Each adds an entry to the Track C AI section of
`ATTRIBUTION.md`, so the later ones will have a small conflict there: keep every entry.

Merged on 18 November: `track-c/status-week3` (#6), `track-c/test-plan` (#7).

## Decisions needed (whole team)

1. **AR: core or optional, and WebGPU on AR phones.** The cahier des charges (§7) makes WebXR AR an
   optional extension. `README.md` and `ROADMAP.md` in `main` still present the product as an AR
   app; the draft PR `track-c/docs-align-with-spec` realigns them and is waiting for the team.
   Related, changed on 18 November: `main` is now **WebGPU only**. The WebGL 2 fallback that
   cahier des charges §3.2 asks for is gone, so browsers without WebGPU show a message instead of
   the heart, and AR only works where the browser has the WebXR/WebGPU binding (very few phones).
   The team must confirm this choice or bring the fallback back.
2. **Raw data in Git.** `data/raw/hra/` (5.8 MB, both HRA hearts) is committed through a
   `.gitignore` exception, but CONTRIBUTING rule 6 says no raw datasets in Git. The female heart is
   not used by the pipeline. Keep it (and update rule 6) or remove it.
3. **6 or 7 weeks.** The cahier des charges says 6 weeks; `ROADMAP.md` in `main` plans 7. The draft
   PR replans on 6.
4. ~~Data contract sections marked "proposed"~~: done, `DATA_CONTRACT.md` v1.0 (17 November).

## Not tested yet

Planned in the real-device test plan ([`TEST_PLAN.md`](TEST_PLAN.md)):

- WebGPU in a normal (not headless) Chrome or Edge, and the "WebGPU is required" message in Firefox;
- installing the PWA and using it offline on an Android phone and an iPhone;
- the frame rate on a mid-range phone;
- AR on a real Android phone (no ARCore phone available in the team so far).

## Known issues

| Issue                                                                                                                                         | Where                        | Owner | State                                                             |
| --------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- | ----- | ----------------------------------------------------------------- |
| On portrait phones the heart is cut off left and right (camera framing fits the height only)                                                  | `src/scripts/render/scene.mjs`    | A     | Fix in open PR `track-a/fix-portrait-framing`                     |
| No WebGL 2 fallback any more: browsers without WebGPU cannot use the app (§3.2); AR needs `XRGPUBinding`                                      | `src/scripts/render/renderer.mjs` | A, C  | Open: decision 1                                                  |
| 4 of the 29 structures are not closed meshes (`aortic_valve`, `inferior_vena_cava`, `papillary_muscles`, `right_atrium`): no filled cut there | `heart.glb`                  | B     | Open (listed by `src/scripts/tests/slicing.test.mjs`)                         |
| `ROADMAP.md` is out of date (AR as the core, 7 weeks); `README.md` was rewritten for WebGPU only on 18 November                               | `ROADMAP.md`                 | C     | Fix in draft PR `track-c/docs-align-with-spec`                    |
| Track C's AI use is not fully declared in `ATTRIBUTION.md` (Weeks 1 and 2 missing)                                                            | `ATTRIBUTION.md`             | C     | Open                                                              |
| All 34 `organs.json` records are `draft` (not reviewed)                                                                                       | `organs.json`                | B     | Open: content review in Week 5                                    |
| Placeholder app icons                                                                                                                         | `src/icons/`       | C     | Open (needs a real design)                                        |
| The temporary dev panel covered about a third of a phone screen                                                                               | `src/scripts/dev/devPanel.mjs`    | C     | Fixed: real interface in `src/scripts/ui/`, dev panel only with `?dev` |
| Each selection cloned a material and never freed the old one                                                                                  | `src/scripts/render/picking.mjs`  | A     | Fixed, covered by a test                                          |
| The build warned about a 940 kB chunk                                                                                                         | `vite.config.mjs`            | C     | Fixed: three.js in its own cached file                            |
| `src/sw.mjs` was not covered by `npm run lint`                                                                                      | `eslint.config.mjs`          | C     | Fixed                                                             |

## History

- **Week 1 (4 to 5 November):** renderer with fallback, dataset spike, deploy and PWA skeleton. The
  three tracks' work was merged into `main` directly on 5 November, without the review CONTRIBUTING
  asks for.
- **Week 2 (6 to 11 November):** layers, picking, `heart.glb`, `organs.json`, quiz bank, Learn mode,
  offline caching of the model and content. Merged into `main` on 11 November, also without review.
- **Week 3 (from 12 November):** slicing and automated tests (Track A), data contract v1.0 and CI/CD
  (Track B), main interface and in-app credits (Track C). From 18 November, changes go through pull
  requests and the CI required by the branch protection. Same day: status and test plan merged
  (#6, #7); WebGPU-only renderer merged directly; merged and unused branches deleted, leftover files
  removed.
- **19 November:** repository restructured: the web app's code moved to `src/scripts/` (`index.html`,
  the modules, and `src/scripts/pwa/` with the service worker and manifest), static files (icons, model,
  data) stay in `public/` at the root, the pipeline moved to `data_pipeline/`, and every JavaScript
  file was renamed to `.mjs`.
