#!/usr/bin/env bash
# Creates labels, weekly milestones and the starting issues for the 3 tracks.
# Run once from the repo folder, after `gh auth login` and after the repo exists on GitHub.
set -e

gh label create track-a --color 2E75B6 --description "Rendering & 3D" --force
gh label create track-b --color 3D4F73 --description "Data & content" --force
gh label create track-c --color 6AA84F --description "Platform & UX" --force
gh label create stretch --color FBBC04 --description "Only after core is stable" --force

for w in 1 2 3 4 5 6 7; do
  gh api repos/:owner/:repo/milestones -f title="Week $w" >/dev/null
done

issue() { # title, label, milestone, body
  gh issue create --title "$1" --label "$2" --milestone "$3" --body "$4" >/dev/null
  echo "created: $1"
}

# ---------------- Track A: Rendering & 3D ----------------
issue "Renderer init: WebGPU with automatic WebGL 2 fallback" track-a "Week 1" "Initialise Three.js WebGPURenderer, fall back to WebGL 2 when unsupported, show the active backend on screen."
issue "Scene, camera, lights and orbit controls" track-a "Week 1" "Mouse and touch controls. Reset view function."
issue "Load a GLB model into the scene" track-a "Week 1" "Loader with progress callback. Use a sample from the HRA library until Track B delivers."
issue "System layers: show/hide groups of meshes" track-a "Week 2" "API: setSystemVisible(systemId, bool). Used by Track C panels."
issue "Picking by raycasting and highlight" track-a "Week 2" "Click or tap selects a structure; emit a selection event with the organ id."
issue "Slicing plane with filled cross-section" track-a "Week 3" "Adjustable clipping plane on one axis with a cap so the inside does not look hollow. Test on the heart."
issue "Isolate and x-ray modes" track-a "Week 4" "Isolate selection, make the rest transparent with an opacity slider."
issue "Lazy loading per system" track-a "Week 4" "Load a light core pack first, other systems on demand."
issue "Mobile performance pass and light asset tier" track-a "Week 5" "Pixel-ratio cap, render on demand, choose full or light pack at start-up. Measure fps on a mid-range phone."
issue "Flow particles with WebGPU compute shaders" "track-a,stretch" "Week 6" "Illustrative flow along vessels and airways. Only if the core is stable."

# ---------------- Track B: Data & content ----------------
issue "Dataset spike: download samples and check licences" track-b "Week 1" "Try BodyParts3D, Z-Anatomy, HRA GLB. Convert one organ end to end. Record exact licences. Decide the primary source."
issue "Write the data contract with Tracks A and C" track-b "Week 1" "Finalise docs/DATA_CONTRACT.md: mesh names, organs.json fields, system ids."
issue "Conversion pipeline v1 (clean, decimate, rename, group, export GLB)" track-b "Week 2" "Scripts in scripts/data-pipeline/. Output goes to public/assets/models/."
issue "Choose and export the organ and system set" track-b "Week 2" "Agree the list (for example heart, lungs, liver, kidneys, stomach, brain) plus skeleton and muscles as context layers."
issue "organs.json: content for the first 5 organs" track-b "Week 3" "Function, location, key facts in EN and FR, written in our own words."
issue "Validation script: every mesh has metadata and a licence" track-b "Week 3" "Run it in CI so the repo cannot merge broken data."
issue "organs.json: content for all chosen organs" track-b "Week 4" "Complete EN and FR texts."
issue "Quiz bank v1" track-b "Week 4" "At least 60 questions in quiz.json with explanations."
issue "Light asset pack for phones and complete ATTRIBUTION.md" track-b "Week 5" "Decimated models for the light tier. Every asset credited."
issue "Content accuracy review" track-b "Week 6" "Have the supervisor or a medical student check the texts against a reliable reference."
issue "Real CT slices from TotalSegmentator linked to the model" "track-b,stretch" "Week 6" "Download a few cases only. Only if the core is stable."

# ---------------- Track C: Platform & UX ----------------
issue "Project setup (Vite) and docs/SETUP.md" track-c "Week 1" "ES modules, lint, formatting. Anyone can run the app after reading SETUP.md."
issue "CI/CD: deploy to GitHub Pages with Actions" track-c "Week 1" "Every merge to main deploys over HTTPS."
issue "PWA skeleton: manifest and service worker" track-c "Week 1" "Installable shell. Caching strategy comes later."
issue "UI panels: system toggles and information panel" track-c "Week 2" "Wired to organs.json and to Track A's layer and selection API."
issue "Search with camera fly-to" track-c "Week 3" "Type an organ name, camera moves to it."
issue "Learn mode" track-c "Week 3" "Selecting a structure shows function, location and key facts in the chosen language."
issue "Quiz mode with progress saved on the device" track-c "Week 4" "Name-it and find-it questions, score, history in local storage."
issue "Shareable lesson links" track-c "Week 5" "Encode camera, visible layers and selection in the URL and restore them on load."
issue "EN/FR interface toggle" track-c "Week 5" "All UI strings translated."
issue "Usability test with 5 students and automated tests" track-c "Week 6" "Task list, success and timings, SUS questionnaire. Basic end-to-end tests."
issue "Offline hardening, user manual and demo video" track-c "Week 7" "Works in airplane mode after the first visit. Manual and 5-minute video."
