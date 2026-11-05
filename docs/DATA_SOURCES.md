# Data sources

**Scope: the heart only** (chambers, valves, coronary vessels, great vessels).

Licences below were **checked on the source pages on 2026-11-05** (Week 1 dataset spike).
Re-read the licence page before using any new model and record the result in `ATTRIBUTION.md`.
If a licence is unclear, replace the model.

| Source | Content | Licence (verified) | Use |
|---|---|---|---|
| [HRA 3D Reference Object Library](https://humanatlas.io/3d-reference-library) (HuBMAP) | Ready-made organ GLBs with named sub-structures, metres, Y up | **CC BY 4.0** (`dct:license` on each organ's [LOD record](https://lod.humanatlas.io/ref-organ/heart-male/latest/)); each organ has its own DOI and citation | **Heart chambers, septum, valves, papillary muscles** (male heart v1.3) |
| [BodyParts3D 4.0](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html) (DBCLS) | One adult male body, meshes indexed by FMA ids, mm, one shared frame | **CC BY 4.0** since 2025-02-25 ([licence page](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html)) | **Coronary arteries, cardiac veins, great vessels**, and the reference position of the heart |
| [Z-Anatomy](https://github.com/Z-Anatomy/Models-of-human-anatomy) | Complete labelled body, one 307 MB Blender file | CC BY-SA 4.0; includes reference models under CC BY-NC-SA 4.0 and CC BY-NC 4.0 | **Not used** |
| TotalSegmentator dataset | CT scans with 117 segmented structures (including heart chambers) | CC BY 4.0 (not re-checked in the spike) | **Stretch only** (real CT slices). About 23.6 GB: download a handful of cases, never the whole set |

## Decision

1. **Heart muscle from HRA, vessels from BodyParts3D**, in one GLB (`public/assets/models/heart.glb`).
   BodyParts3D alone cannot show the chambers (no ventricular walls, see below); HRA alone has no
   coronary or great vessels.
2. The HRA heart is **fitted onto the BodyParts3D heart** by the pipeline, so the vessels from BodyParts3D
   attach to it (mean surface distance 3 mm).
3. **Z-Anatomy is not used.** Both sources are CC BY 4.0, so the asset pack can be published under
   **CC BY 4.0** with attribution, without share-alike.

## Week 1 spike: findings

### BodyParts3D
- **Host moved**: the archive is now at `dbarchive.biosciencedbc.jp` (`biosciencedbs.jp` no longer resolves).
- **Licence changed**: the database was relicensed from CC BY-SA 2.1 JP to **CC BY 4.0** on 2025-02-25
  (licence page and README, "Update History: 2025/02/27 License is updated"). The comment header inside
  every OBJ file still says *CC BY-SA 2.1 Japan*: those files date from the 2013 release and were not
  re-exported. We follow the current licence page and use its attribution line:
  "BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International".
  Z-Anatomy still cites the old SA licence for the same meshes.
- **Downloads used**: PART-OF tree, 99 % polygon reduction (`partof_BP3D_4.0_obj_99.zip`, 62 MB, 1,258 OBJ
  element files) and `partof_element_parts.txt` (FMA concept → element files). Compound structures are
  unions of element files; the pipeline merges them.
- **Frame**: millimetres, +Z up, **−Y anterior**, +X = subject's left.
  Converted with (x, y, z) → (x, z, −y) / 1000, a proper rotation (no mirroring).
- **The heart has no ventricular walls.** It has atrial walls, the four *cavities* (blood volumes), valve leaflets,
  papillary muscles and the coronary vessels. Slicing it would not show chambers.
- **Vessels are detailed**: left main, LAD with diagonals, circumflex, right coronary with branches; coronary sinus
  and named cardiac veins; ascending aorta, arch, descending aorta; pulmonary trunk and arteries; pulmonary veins;
  both venae cavae. Pulmonary vessels have their intrapulmonary part as a separate concept, so we keep only the part
  outside the lungs. The descending aorta and the inferior vena cava run down to the abdomen: the pipeline cuts them
  75 mm below the heart centre and closes the cut.

### HRA (Human Reference Atlas)
- Male heart v1.3 (`3d-vh-m-heart.glb`, 4 MB): 14 named parts (four chambers, septum, four valves, five
  papillary muscles), 164k triangles, metres, **same axes as ours** (+Y up, +Z anterior, +X left).
- It comes from a different body (Visible Human). Fitting the whole HRA heart onto the BodyParts3D heart
  (ICP with uniform scale): **rotation 1.4°, scale 0.96, shift ≈ 15 mm, mean surface distance 3.0 mm**
  (HRA → BodyParts3D) and 3.9 mm (BodyParts3D → HRA, 90th percentile 9 mm).
  The female heart (v1.3) fits as well (3.2 mm) but is 15 % larger than the BodyParts3D male heart.
- **Open meshes in the source**: right atrium (124 pieces, non-manifold edges), aortic valve and three of the
  five papillary muscles have holes. Everything else is closed.
- The `ccf-releases` GitHub repo has no LICENSE file; the licence and citation are on each organ's LOD record.
  Download from the CDN URL given there.

### Z-Anatomy
- Single 307 MB `Startup.blend` (87 MB zipped). Needs Blender to export anything; no glTF/OBJ is published.
- CC BY-SA 4.0 would make the asset pack share-alike, and some included reference models are
  **non-commercial**. Nothing in it is needed for the heart.

## Result: `heart.glb` (pipeline v1)
Built by `scripts/data-pipeline/config/heart.json` → `public/assets/models/heart.glb`.

| | |
|---|---|
| Structures | 29 meshes in 5 groups: `chambers` (4 chambers, septum, papillary muscles), `valves` (4), `coronary_arteries` (4), `cardiac_veins` (5), `great_vessels` (11) |
| Size | 111.5k triangles, 2.72 MB GLB (uncompressed; no Draco/meshopt yet) |
| Build time | ≈ 4 s |
| Frame | metres, +Y up, +Z anterior, +X subject's left, origin = centre of the heart |
| Checks | `check_glb.py`: OK. Cross-sections checked by eye: chambers, septum, valves, coronaries and the aorta/pulmonary trunk meet where they should |
| Closed meshes | All closed except `right_atrium`, `aortic_valve`, `papillary_muscles` (holes in the HRA source). Decimation keeps closed meshes closed |

## Open points
- Holes in the HRA right atrium, aortic valve and papillary muscles: repair them, or slicing caps will be wrong on those three.
- Light tier for phones (Week 5): same config with lower `max_faces`.
- Compression (meshopt or Draco) needs `gltf-transform` (Node). Add it once Track C's Node setup lands.
- Run the Khronos glTF-Validator on every GLB (in CI).
- Optional: BodyParts3D cavities (blood volumes of the four chambers) for the flow-visualisation stretch goal.

## Rules
- Educational texts (function, facts, quiz questions) are **written by the team in its own words**,
  checked against a reliable reference. Do not copy textbook passages.
- Do not paste licensed textbook content into AI tools.
- If sources mix licences, the strictest one (share-alike) guides how the asset pack is published.
