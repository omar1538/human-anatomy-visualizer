# Data contract (Track B -> Tracks A and C)

Defined in Week 1, changed only through a PR reviewed by all three.

> **Status: draft from the Week 1 dataset spike (Track B), heart-only scope.** Sections marked
> *(proposed)* need agreement from Tracks A and C before this is final.

## Mesh file (GLB)
- One file: `public/assets/models/heart.glb` (a light version for phones comes in Week 5).
- Every selectable structure is a named node whose name equals the `id` in `organs.json`.
- Units: metres. Axes *(proposed)*: **+Y up, +Z anterior (the heart's front faces +Z, i.e. towards a default
  Three.js camera), +X = the subject's left** (glTF convention). The heart sits as in the body: apex pointing
  down, forward and to the left.
- Origin *(proposed)*: **centre of the heart** (bounding box of the BodyParts3D heart). The model spans about
  ±0.06 m around it; the aortic arch reaches y ≈ +0.09 m, the cut vessels end at y = −0.075 m.
- Each mesh has `POSITION`, `NORMAL` (unit length) and indices. No textures, no UVs, no vertex colours.

### Node tree *(proposed)*
```
heart                                   (root, extras.kind = "system")
├── chambers                            (group, extras.kind = "group")
│   ├── left_ventricle, right_ventricle, left_atrium, right_atrium,
│   └── interventricular_septum, papillary_muscles
├── valves
│   └── mitral_valve, tricuspid_valve, aortic_valve, pulmonary_valve
├── coronary_arteries
│   └── left_main_coronary_artery, anterior_interventricular_artery, circumflex_artery, right_coronary_artery
├── cardiac_veins
│   └── coronary_sinus, great_cardiac_vein, middle_cardiac_vein, small_cardiac_vein, other_cardiac_veins
└── great_vessels
    └── ascending_aorta, aortic_arch, descending_aorta, pulmonary_trunk,
        right_pulmonary_artery, left_pulmonary_artery, right_pulmonary_veins, left_pulmonary_veins,
        superior_vena_cava, inferior_vena_cava
```
- The five groups are the **layers** the UI shows and hides (they replace "systems" in the whole-body plan).
- Nodes carry no transform (identity); geometry is already in the heart frame.
- Group nodes are selectable too: picking a mesh can walk up to its group ("select all valves").

### Ids *(proposed)*
- Lower snake_case, `[a-z0-9_]`, unique: `left_ventricle`, `mitral_valve`.
  (Three.js renames nodes containing spaces, dots, colons or brackets; snake_case survives unchanged and is safe in URLs.)
- Ids are stable: lesson links and quiz progress store them. Renaming an id is a contract change.

### Materials *(proposed)*
- One PBR material per mesh, named like the node, with a base colour per structure
  (metallic 0, roughness 0.6). Usual teaching colours: arteries and oxygenated blood red, veins and the
  pulmonary arteries blue, valves pale. Track A may replace materials at runtime (highlight, x-ray).
- Thin sheets with no inside (valves) have `doubleSided: true`.
- Closed (watertight) meshes: all except `right_atrium`, `aortic_valve`, `papillary_muscles` (holes in the source,
  to be repaired). `build-report.json` lists `watertight` per structure; slicing caps (stencil) need closed meshes.

### Provenance in the GLB
- `asset.copyright`: attribution lines of every source used in the file.
- Each mesh node's `extras`: `dataset`, `licence`, `attribution`, and source ids (`fma` for BodyParts3D,
  `nodes` for HRA, plus `registered_to_fma` and `registration_mean_error_mm` for the fitted HRA parts,
  `clipped_y_m` for cut vessels).

## `public/assets/data/organs.json`
Array of records, one per mesh node **and** one per group. Required fields:

- `id`: unique string, equals the GLB node name
- `name`: `{ "en": "...", "fr": "..." }`
- `system`: the group (layer) id: `chambers`, `valves`, `coronary_arteries`, `cardiac_veins`, `great_vessels` *(proposed)*
- `function`: `{ "en": "...", "fr": "..." }` short explanation written by the team
- `location`: short text
- `facts`: array of short strings
- `source`, `licence`: where the mesh comes from and under which licence

Optional fields *(proposed)*:
- `fma`: Foundational Model of Anatomy ids, e.g. `["FMA7101"]` (useful for checking facts and for CT linking later)

The pipeline writes `build-report.json` with `id`, `parent`, source and licence for every node,
to seed `organs.json`. The validation script (Week 3) checks that every GLB node has a record and vice versa.

## `public/assets/data/quiz.json`
Array of questions: `id`, `type` (`name-it` | `find-it`), `organId`, `prompt`, `choices`, `answer`, `explanation`.
