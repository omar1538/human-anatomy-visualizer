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
Array of records, one per mesh node **and** one per group (34 for `heart.glb`; the root `heart` has none).
Every text the user reads is `{ "en": "...", "fr": "..." }`, both filled in.

Required fields:

- `id`: unique string, equals the GLB node name
- `name`: `{ "en", "fr" }`
- `system`: the group (layer) id: `chambers`, `valves`, `coronary_arteries`, `cardiac_veins`, `great_vessels`.
  A group's record has its own id as `system`.
- `source`: `"HRA"` or `"BodyParts3D"` (a group: the sources of its structures, joined with `" + "`)
- `licence`: as in the node's `extras.licence` (`"CC BY 4.0"`)

Content fields, written by the team in its own words (required once the content is done, see `--strict` below):

- `function`: `{ "en", "fr" }` short explanation
- `location`: `{ "en", "fr" }` short text
- `facts`: array of `{ "en", "fr" }`, short

Optional fields:
- `fma`: Foundational Model of Anatomy ids from the GLB extras, e.g. `["FMA50872"]` (BodyParts3D structures only)
- `status`: `"draft"` (written, not checked) or `"reviewed"` (checked in the accuracy review)

Example:
```json
{
  "id": "left_ventricle",
  "name": { "en": "Left ventricle", "fr": "Ventricule gauche" },
  "system": "chambers",
  "function": { "en": "Receives oxygen-rich blood ...", "fr": "Reçoit le sang riche en oxygène ..." },
  "location": { "en": "Lower left and back part of the heart ...", "fr": "Partie inférieure gauche ..." },
  "facts": [ { "en": "Its wall is the thickest ...", "fr": "Sa paroi est la plus épaisse ..." } ],
  "source": "HRA",
  "licence": "CC BY 4.0",
  "status": "draft"
}
```

`scripts/data-pipeline/validate_content.py` (standard library only) checks `organs.json` against the GLB:
every group and structure node has a record and vice versa, ids, required fields, both languages, and that
`system`, `source`, `licence` and `fma` agree with the GLB. Missing content is a warning; with `--strict`
(from Week 4, when all content is due) it is an error.

## `public/assets/data/quiz.json`
Array of questions (bank v1: 71 questions). Fields:

- `id`: unique, lower snake_case (quiz progress stores it)
- `type`: `find-it` | `name-it` | `mcq` (see below)
- `organId`: the organ or group the question is about (an `organs.json` id), for filtering and progress per structure
- `difficulty`: `1` (basic), `2`, `3` (detailed)
- `prompt`, `explanation`: `{ "en", "fr" }`. The explanation is shown after the answer, right or wrong
- `choices`, `answer`: depend on the type
- `status` (optional): `"draft"` or `"reviewed"`, as in `organs.json`

| `type` | The user… | `choices` | `answer` |
|---|---|---|---|
| `find-it` | clicks a structure in the 3D view ("Click the mitral valve") | `[]` | the id of the structure to click |
| `name-it` | sees a structure highlighted (`organId`) and picks its name | 4 organ ids; show their `name` from `organs.json` | the right id (one of `choices`) |
| `mcq` | answers a question on function or circulation | 4 texts `{ "en", "fr" }` | index of the right choice (`0` to `3`) |

Choices are already in random order; the app may shuffle them again.

```json
[
  { "id": "find_mitral", "type": "find-it", "organId": "mitral_valve", "difficulty": 2,
    "prompt": { "en": "Click the mitral valve.", "fr": "Cliquez sur la valve mitrale." },
    "choices": [], "answer": "mitral_valve",
    "explanation": { "en": "The mitral valve lies between ...", "fr": "La valve mitrale se situe entre ..." },
    "status": "draft" },
  { "id": "name_mitral", "type": "name-it", "organId": "mitral_valve", "difficulty": 2,
    "prompt": { "en": "Which structure is highlighted?", "fr": "Quelle est la structure en surbrillance ?" },
    "choices": ["aortic_valve", "mitral_valve", "pulmonary_valve", "tricuspid_valve"], "answer": "mitral_valve",
    "explanation": { "en": "...", "fr": "..." }, "status": "draft" },
  { "id": "mcq_mitral_leaflets", "type": "mcq", "organId": "mitral_valve", "difficulty": 1,
    "prompt": { "en": "How many leaflets does the mitral valve have?", "fr": "Combien de valvules possède la valve mitrale ?" },
    "choices": [ { "en": "Three", "fr": "Trois" }, { "en": "Two", "fr": "Deux" },
                 { "en": "Four", "fr": "Quatre" }, { "en": "One", "fr": "Une" } ],
    "answer": 1,
    "explanation": { "en": "...", "fr": "..." }, "status": "draft" }
]
```

`validate_content.py` also checks `quiz.json`: ids, types, that every organ id exists, that `answer`
matches `choices`, both languages, and (with `--strict`) at least 60 questions and at least one question
about every structure.
