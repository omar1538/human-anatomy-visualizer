# Project status

**Last updated: 18 November 2026 (start of Week 3 of 6).** Update this file at the end of each week.

The plan is in [`ROADMAP.md`](ROADMAP.md); this file says where we actually are. The reference for
what must ship is the project's _cahier des charges_.

## Summary

The core of the cahier des charges is built and in `main`: the 3D heart with WebGPU and the WebGL 2
fallback, mouse and touch controls, layers, Learn mode (FR/EN), the main interface with the credits
and the not-a-medical-tool notice, and the offline PWA, deployed on GitHub Pages. Slicing is merged
too. **Nothing has been tested on a real phone or on real WebGPU hardware yet**, and three of the
five final deliverables have not started.

## Cahier des charges check

| Requirement                                                     | State                                                                                                                                 |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| §3.1 Show one or two organs in 3D in the browser                | Done: the heart, 29 structures in 5 groups                                                                                            |
| §3.1 Rotate, zoom, move with a mouse or touch                   | Done. On portrait phones the heart is cut off left and right: fix in an open PR (see below)                                           |
| §3.1 Identify the organ and its parts (name, short explanation) | Done: Learn mode, FR/EN, texts still drafts                                                                                           |
| §3.1 Simple interface on a laptop and a phone                   | Done (`src/ui/`): toolbar, layers, slicing, reset, About, language                                                                    |
| §3.1 Installable and usable offline                             | Done in a desktop browser (installability check passes, works with the server stopped). **Not tested on a phone**                     |
| §3.2 Smooth on a standard laptop and a mid-range phone          | **Not measured**                                                                                                                      |
| §3.2 WebGPU, with the WebGL 2 fallback                          | Fallback tested (headless browser). **WebGPU not confirmed on real hardware.** AR-capable phones always start on WebGL 2 (decision 1) |
| §3.2 Usable without a manual                                    | How-to in the About window; to confirm in the Week 5 usability test                                                                   |
| §3.2 No personal data collected                                 | Done: no account, no analytics, no external requests; only the language choice is stored on the device                                |
| §3.2 Authors and licences credited in the application           | Done: About window with the credit lines of `ATTRIBUTION.md`                                                                          |
| §3.2 Educational use only, not a medical tool                   | Done: first screen and About window                                                                                                   |
| §5 App deployed with HTTPS                                      | Done: GitHub Pages, deployed by CI/CD after every merge into `main`                                                                   |
| §5 Source code on GitHub with the PWA files and 3D assets       | Done                                                                                                                                  |
| §5 Attribution file                                             | Done for assets, libraries and Tracks A and B. **Track C's AI declaration is incomplete**                                             |
| §5 Design notebook                                              | Started in an open PR                                                                                                                 |
| §5 Technical documentation (installation and deployment)        | Done: [`SETUP.md`](SETUP.md)                                                                                                          |
| §5 Short user manual                                            | Started in an open PR                                                                                                                 |
| §5 Demo video (max. 5 minutes, voice-over)                      | Not started (Week 6)                                                                                                                  |

## In `main` (by track)

**Track A: Rendering & 3D.** `createViewer()` API ([`RENDERING_API.md`](RENDERING_API.md)):
`WebGPURenderer` with automatic WebGL 2 fallback; orbit, zoom and pan; on-demand rendering; layers;
picking with highlight and group selection; `viewer.organ(id)`; **slicing** with a filled cut
(`src/render/slicing.js`, controls in the toolbar's "Slice" menu); WebXR AR (hit test, tap to place,
floating fallback), tested in a WebXR emulator only. Automated tests in `tests/` (25), run by CI.

**Track B: Data & content.** `heart.glb` (2.7 MB, about 110k triangles, 29 structures, 5 groups)
from BodyParts3D and HuBMAP HRA fused with ICP; conversion pipeline v1; `organs.json` (34 records,
FR/EN, all `draft`); `quiz.json` (71 questions); `validate_content.py`; **data contract v1.0, final**
([`DATA_CONTRACT.md`](DATA_CONTRACT.md)); the CI/CD workflow.

**Track C: Platform & UX.** Service worker (`public/sw.js`, cache `v2`): network-first for pages,
cache-first for Vite's hashed build files, stale-while-revalidate for the model, `organs.json`,
`quiz.json`, icons and manifest, all precached at install. Manifest, icons, production-only
registration. Learn mode (`src/learn/`), main interface and About window with the credits
(`src/ui/`), dev panel only with `?dev`. [`SETUP.md`](SETUP.md).

**CI/CD** (`.github/workflows/ci-cd.yml`, replaces `deploy.yml`): on every push and pull request to
`main`: install, lint, `npm test`, data validation, a 5 MB limit on `.glb` files, build. A push to
`main` whose CI passed is deployed to GitHub Pages. The CI job is required by the branch protection
of `main`.

Process note: the main interface and credits (17 November) went into `main` without a pull request.
Tracks A and B should still review them.

## Open pull requests (18 November)

| Branch                               | What                                                                        | Needs                         |
| ------------------------------------ | --------------------------------------------------------------------------- | ----------------------------- |
| `track-a/fix-portrait-framing`       | Fit the heart to portrait screens, re-frame on rotation, unit tests         | Review by Track A             |
| `track-c/docs-align-with-spec`       | **Draft.** README and ROADMAP realigned on the cahier des charges, 6 weeks  | Agreement of all three tracks |
| `track-c/status-week3`               | This update                                                                 | Review                        |
| `track-c/test-plan`                  | `docs/TEST_PLAN.md`: real-device checklist and FPS method                   | Review, then run it           |
| `track-c/design-notebook-and-manual` | `docs/DESIGN_NOTEBOOK.md` and `docs/USER_MANUAL.md` (EN/FR), first versions | Review                        |

Each of them adds an entry to the Track C AI section of `ATTRIBUTION.md`, so the second and later
ones to be merged will have a small conflict there: keep the shared introduction once and every entry.

## Decisions needed (whole team)

1. **AR: core or optional, and WebGPU on AR phones.** The cahier des charges (§7) makes WebXR AR an
   optional extension. `README.md` and `ROADMAP.md` in `main` still present the product as an AR
   app; the draft PR `track-c/docs-align-with-spec` realigns them and is waiting for the team.
   Related: `src/render/renderer.js` forces WebGL 2 on every AR-capable device, so Android Chrome
   on an ARCore phone never uses WebGPU. The draft PR lists the options and their trade-offs.
2. **Raw data in Git.** `data/raw/hra/` (5.8 MB, both HRA hearts) is committed through a
   `.gitignore` exception, but CONTRIBUTING rule 6 says no raw datasets in Git. The female heart is
   not used by the pipeline. Keep it (and update rule 6) or remove it.
3. **6 or 7 weeks.** The cahier des charges says 6 weeks; `ROADMAP.md` in `main` plans 7. The draft
   PR replans on 6.
4. ~~Data contract sections marked "proposed"~~: done, `DATA_CONTRACT.md` v1.0 (17 November).

## Not tested yet

Planned in the real-device test plan (open PR `track-c/test-plan`):

- the WebGPU backend on real hardware (laptop Chrome or Edge), and the fallback in Firefox;
- installing the PWA and using it offline on an Android phone and an iPhone;
- the frame rate on a mid-range phone;
- AR on a real Android phone (no ARCore phone available in the team so far).

## Known issues

| Issue                                                                                                                                         | Where                     | Owner | State                                                          |
| --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | ----- | -------------------------------------------------------------- |
| On portrait phones the heart is cut off left and right (camera framing fits the height only)                                                  | `src/render/scene.js`     | A     | Fix in open PR `track-a/fix-portrait-framing`                  |
| AR-capable phones always start on WebGL 2, so Android Chrome never uses WebGPU                                                                | `src/render/renderer.js`  | A     | Open: decision 1                                               |
| 4 of the 29 structures are not closed meshes (`aortic_valve`, `inferior_vena_cava`, `papillary_muscles`, `right_atrium`): no filled cut there | `heart.glb`               | B     | Open (listed by `tests/slicing.test.mjs`)                      |
| `README.md` and `ROADMAP.md` are out of date (AR as the core, slicing "planned", 7 weeks)                                                     | `README.md`, `ROADMAP.md` | C     | Fix in draft PR `track-c/docs-align-with-spec`                 |
| Track C's AI use is not fully declared in `ATTRIBUTION.md` (Weeks 1 and 2 missing)                                                            | `ATTRIBUTION.md`          | C     | Open                                                           |
| All 34 `organs.json` records are `draft` (not reviewed)                                                                                       | `organs.json`             | B     | Open: content review in Week 5                                 |
| Placeholder app icons                                                                                                                         | `public/icons/`           | C     | Open (needs a real design)                                     |
| The temporary dev panel covered about a third of a phone screen                                                                               | `src/dev/devPanel.js`     | C     | Fixed: real interface in `src/ui/`, dev panel only with `?dev` |
| Each selection cloned a material and never freed the old one                                                                                  | `src/render/picking.js`   | A     | Fixed, covered by a test                                       |
| The build warned about a 940 kB chunk                                                                                                         | `vite.config.js`          | C     | Fixed: three.js in its own cached file                         |
| `public/sw.js` was not covered by `npm run lint`                                                                                              | `eslint.config.js`        | C     | Fixed                                                          |

## History

- **Week 1 (4 to 5 November):** renderer with fallback, dataset spike, deploy and PWA skeleton. The
  three tracks' work was merged into `main` directly on 5 November, without the review CONTRIBUTING
  asks for.
- **Week 2 (6 to 11 November):** layers, picking, `heart.glb`, `organs.json`, quiz bank, Learn mode,
  offline caching of the model and content. Merged into `main` on 11 November, also without review.
- **Week 3 (from 12 November):** slicing and automated tests (Track A), data contract v1.0 and CI/CD
  (Track B), main interface and in-app credits (Track C). From 18 November, changes go through pull
  requests and the CI required by the branch protection.
