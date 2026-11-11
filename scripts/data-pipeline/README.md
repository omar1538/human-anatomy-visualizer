# Data pipeline (Track B)

Turns the raw datasets into the GLB files the app loads: one GLB per body system,
in the frame and naming defined in [`docs/DATA_CONTRACT.md`](../../docs/DATA_CONTRACT.md).

```
raw meshes ─► load + place in app frame ─► clean ─► decimate ─► finish ─► group ─► GLB + build-report.json
             (sources.py)                  (mesh_ops.py)                  (build.py)
```

| Step | What it does |
|------|--------------|
| load | BodyParts3D: union of the OBJ element files of one or more FMA concepts (minus `exclude_fma`). HRA: chosen nodes of a GLB. |
| place | BodyParts3D: mm → m, Z-up → Y-up, body bounding-box centre → origin. HRA: whole organ fitted onto the matching BodyParts3D organ (ICP, rotation + uniform scale + translation); the same transform is used for every part of that organ. |
| clean | weld duplicate vertices, drop degenerate and duplicate faces, drop unused vertices, drop fragments smaller than `min_component_faces`. |
| decimate | quadric decimation (`fast-simplification`) down to `max_faces`. |
| finish | consistent winding (outward normals when watertight), fresh smooth unit normals. |
| group | node tree `system → organ group → structure`; node name = `id`; one PBR material per structure, named `id`. |
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
.venv/Scripts/python scripts/data-pipeline/check_glb.py data/out/*.glb
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
  "name": "spike-heart",
  "defaults": { "max_faces": 6000, "min_component_faces": 20, "color": "#b5443f" },
  "systems": [ { "id": "circulatory" } ],          // one GLB per system
  "structures": [                                   // parents before children
    { "id": "heart", "system": "circulatory", "label": "Heart" },          // group node, no mesh
    { "id": "heart_left_ventricle", "system": "circulatory", "parent": "heart",
      "label": "Left ventricle", "max_faces": 8000, "color": "#a83a35",
      "source": { "type": "hra", "file": "3d-vh-m-heart.glb",
                  "nodes": ["VH_M_heart_left_ventricle"],
                  "register_to": ["FMA7088"] } },                          // fit onto BodyParts3D heart
    { "id": "left_coronary_artery", "system": "circulatory", "parent": "heart",
      "source": { "type": "bp3d", "fma": ["FMA50040"], "exclude_fma": [] } }
  ]
}
```

- `id`: lower snake_case, unique across all systems, equals the GLB node name and the `organs.json` id.
- `label`: for the build report only; display names live in `organs.json`.
- `double_sided`: set for thin sheets (valves, membranes) that have no inside.
- Find FMA ids in `data/raw/bodyparts3d/partof_parts_list_e.txt`.

## Frame

App frame (all GLBs): metres, **+Y up, +Z anterior (the body faces +Z), +X = subject's left**,
origin = centre of the BodyParts3D whole-body bounding box (`BP3D_BODY_CENTRE_MM` in `sources.py`;
recompute with `build.py --body-centre`). The soles of the feet are at y ≈ −0.86 m.
