# Data pipeline (Track B)

Turns the raw datasets into the GLB the app loads (`heart.glb`; one GLB per entry in `systems`),
in the frame and naming defined in [`docs/DATA_CONTRACT.md`](../../docs/DATA_CONTRACT.md).

```
raw meshes ─► load + place in app frame ─► clean ─► decimate ─► finish ─► group ─► GLB + build-report.json
             (sources.py)                  (mesh_ops.py)                  (build.py)
```

| Step | What it does |
|---|---|
| load | BodyParts3D: union of the OBJ element files of one or more FMA concepts (minus `exclude_fma`). HRA: chosen nodes of a GLB. |
| place | BodyParts3D: mm → m, Z-up → Y-up. HRA: whole organ fitted onto the matching BodyParts3D organ (ICP, rotation + uniform scale + translation); the same transform is used for every part of that organ. Then shift to the origin (`origin` in the config) and cut with `clip_y` (cuts are capped). |
| clean | weld duplicate vertices, drop degenerate and duplicate faces, drop unused vertices, drop fragments smaller than `min_component_faces`. |
| decimate | quadric decimation (`fast-simplification`) down to `max_faces`; a closed mesh stays closed (gentler settings or a higher target if needed). |
| finish | consistent winding (outward normals when watertight), fresh smooth unit normals. |
| group | node tree `system → group → structure` (`heart → valves → mitral_valve`); node name = `id`; one PBR material per structure, named `id`. |
| export | GLB per system, provenance in node `extras`, attributions in `asset.copyright`. |

## Setup

Python 3.11+.

```sh
python -m venv .venv
.venv/Scripts/python -m pip install -r scripts/data-pipeline/requirements.txt   # Windows
# .venv/bin/python -m pip install -r scripts/data-pipeline/requirements.txt    # macOS/Linux
```

Raw data goes in `data/raw/` (ignored by Git, see `docs/DATA_SOURCES.md` for licences):

```
data/raw/bodyparts3d/   https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html
    partof_element_parts.txt, partof_parts_list_e.txt
    partof_BP3D_4.0_obj_99/          (unzipped partof_BP3D_4.0_obj_99.zip)
data/raw/hra/           https://humanatlas.io/3d-reference-library
    3d-vh-m-heart.glb                https://cdn.humanatlas.io/digital-objects/ref-organ/heart-male/latest/assets/3d-vh-m-heart.glb
```

## Run

```sh
.venv/Scripts/python scripts/data-pipeline/build.py --config scripts/data-pipeline/config/heart.json
.venv/Scripts/python scripts/data-pipeline/check_glb.py data/out/heart.glb
```

Output goes to `data/out/` (ignored). Copy accepted GLBs to `public/assets/models/`
and add their sources to `ATTRIBUTION.md` in the same PR.

`check_glb.py` checks what the app relies on: well-formed GLB, normals present and
unit length, accessor bounds, valid indices, snake_case unique node names, licence
and attribution on every mesh node. Also run the
[Khronos glTF-Validator](https://github.khronos.org/glTF-Validator/) before merging assets.

## Config format

```jsonc
{
  "name": "heart-v1",
  "origin": { "bp3d_centre_of": ["FMA7088"] },     // origin = centre of these BodyParts3D concepts (default: body centre)
  "defaults": { "max_faces": 3000, "min_component_faces": 0 },
  "systems": [ { "id": "heart" } ],                 // one GLB per entry: heart.glb
  "structures": [                                   // parents before children
    { "id": "chambers", "system": "heart", "label": "Chambers and walls" },   // group node, no mesh
    { "id": "left_ventricle", "system": "heart", "parent": "chambers",
      "label": "Left ventricle", "max_faces": 20000, "color": "#a83a35",
      "source": { "type": "hra", "file": "3d-vh-m-heart.glb",
                  "nodes": ["VH_M_heart_left_ventricle"],
                  "register_to": ["FMA7088"] } },                          // fit onto the BodyParts3D heart
    { "id": "right_pulmonary_artery", "system": "heart", "parent": "great_vessels",
      "source": { "type": "bp3d", "fma": ["FMA50872"], "exclude_fma": ["FMA67994"] } },  // minus intrapulmonary part
    { "id": "inferior_vena_cava", "system": "heart", "parent": "great_vessels",
      "clip_y": [-0.075, null],                                            // cut below y = -0.075 m, cap the cut
      "source": { "type": "bp3d", "fma": ["FMA10951"] } }
  ]
}
```

- `id`: lower snake_case, unique, equals the GLB node name and the `organs.json` id.
- `label`: for the build report only; display names live in `organs.json`.
- `max_faces`: decimation target. Closed meshes stay closed, so the result can be a bit above the target.
- `min_component_faces`: drop loose fragments smaller than this (default 0 = keep all).
- `clip_y`: `[min, max]` in metres in the final frame (`null` = no cut); cuts are capped.
- `double_sided`: set for thin sheets (valves) that have no inside.
- Find FMA ids in `data/raw/bodyparts3d/partof_parts_list_e.txt`.

## Frame

App frame: metres, **+Y up, +Z anterior (the body faces +Z), +X = subject's left**.
BodyParts3D is converted from its raw frame (mm, +Z up, −Y anterior); HRA organs are already in these axes
and are fitted onto the BodyParts3D organ. The origin is the whole-body centre (`BP3D_BODY_CENTRE_MM` in
`sources.py`) unless the config sets `origin`; `heart.json` puts it at the centre of the heart.
