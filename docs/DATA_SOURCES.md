# Data sources

**Scope: the heart only** (chambers, valves, coronary vessels, great vessels).

Licences below were **checked on the source pages on 2026-11-05** (Week 1 dataset spike).
Re-read the licence page before using any new model and record the result in `ATTRIBUTION.md`.
If a licence is unclear, replace the model.

| Source                                                                                     | Content                                                              | Licence (verified)                                                                                                                                          | Use                                                                                                |
| ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| [HRA 3D Reference Object Library](https://humanatlas.io/3d-reference-library) (HuBMAP)     | Ready-made organ GLBs with named sub-structures, metres, Y up        | **CC BY 4.0** (`dct:license` on each organ's [LOD record](https://lod.humanatlas.io/ref-organ/heart-male/latest/)); each organ has its own DOI and citation | **Heart chambers, septum, valves, papillary muscles** (male heart v1.3)                            |
| [BodyParts3D 4.0](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html) (DBCLS) | One adult male body, meshes indexed by FMA ids, mm, one shared frame | **CC BY 4.0** since 2025-02-25 ([licence page](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html))                                                 | **Coronary arteries, cardiac veins, great vessels**, and the reference position of the heart       |
| [Z-Anatomy](https://github.com/Z-Anatomy/Models-of-human-anatomy)                          | Complete labelled body, one 307 MB Blender file                      | CC BY-SA 4.0; includes reference models under CC BY-NC-SA 4.0 and CC BY-NC 4.0                                                                              | **Not used**                                                                                       |
| TotalSegmentator dataset                                                                   | CT scans with 117 segmented structures (including heart chambers)    | CC BY 4.0 (not re-checked in the spike)                                                                                                                     | **Stretch only** (real CT slices). About 23.6 GB: download a handful of cases, never the whole set |

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
  every OBJ file still says _CC BY-SA 2.1 Japan_: those files date from the 2013 release and were not
  re-exported. We follow the current licence page and use its attribution line:
  "BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International".
  Z-Anatomy still cites the old SA licence for the same meshes.
- **Downloads used**: PART-OF tree, 99 % polygon reduction (`partof_BP3D_4.0_obj_99.zip`, 62 MB, 1,258 OBJ
  element files) and `partof_element_parts.txt` (FMA concept → element files). Compound structures are
  unions of element files; the pipeline merges them.
- **Frame**: millimetres, +Z up, **−Y anterior**, +X = subject's left.
  Converted with (x, y, z) → (x, z, −y) / 1000, a proper rotation (no mirroring).
- **The heart has no ventricular walls.** It has atrial walls, the four _cavities_ (blood volumes), valve leaflets,
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

Built by `data_pipeline/config/heart.json` → `public/assets/models/heart.glb`.

|               |                                                                                                                                                             |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Structures    | 29 meshes in 5 groups: `chambers` (4 chambers, septum, papillary muscles), `valves` (4), `coronary_arteries` (4), `cardiac_veins` (5), `great_vessels` (11) |
| Size          | 111.5k triangles, 2.72 MB GLB (uncompressed; no Draco/meshopt yet)                                                                                          |
| Build time    | ≈ 4 s                                                                                                                                                       |
| Frame         | metres, +Y up, +Z anterior, +X subject's left, origin = centre of the heart                                                                                 |
| Checks        | `check_glb.py`: OK. Cross-sections checked by eye: chambers, septum, valves, coronaries and the aorta/pulmonary trunk meet where they should                |
| Closed meshes | All closed except `right_atrium`, `aortic_valve`, `papillary_muscles` (holes in the HRA source). Decimation keeps closed meshes closed                      |

## Downloading the raw data

`data/raw/` is not in Git, except the two HRA hearts in `data/raw/hra/` (5.8 MB, CC BY 4.0), which are
committed. **A new developer must download everything else**: BodyParts3D (≈ 65 MB zipped) and the HRA
lung (10.9 MB, kept out of Git because the CI rejects `.glb` files above 5 MB). Checksums below were
taken on 2026-11-05 (heart, BodyParts3D) and 2026-11-26 (lung); if one no longer matches, the source
was updated: re-check the licence and the pipeline output.

| Local path                                                                                      | URL                                                                                              | SHA-256                                                            |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| `data/raw/hra/3d-vh-m-heart.glb` (committed)                                                    | https://cdn.humanatlas.io/digital-objects/ref-organ/heart-male/latest/assets/3d-vh-m-heart.glb   | `689df039c8bc264ea06a44cd926762976f0666c0ff2dc532d046409b185e6b0c` |
| `data/raw/hra/3d-vh-f-heart.glb` (committed, not used by the pipeline)                          | https://cdn.humanatlas.io/digital-objects/ref-organ/heart-female/latest/assets/3d-vh-f-heart.glb | `98f66e46b149bfc3836592d9404c50290e21d302ec55c98813435e2d9847b1d9` |
| `data/raw/hra/3d-vh-m-lung.glb` (**not committed**: download it)                                 | https://cdn.humanatlas.io/digital-objects/ref-organ/lung-male/latest/assets/3d-vh-m-lung.glb     | `bba95516fa993ac45c3b1c53f32b58d97232ffd78ae56397e5a2589c6ce4903d` |
| `data/raw/bodyparts3d/partof_BP3D_4.0_obj_99.zip` (unzip in place, then the zip can be deleted) | https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/partof_BP3D_4.0_obj_99.zip            | `9fbc713fffeee924a5a657d9813d84d7eb957bded63adb854931dd5e3eb61c97` |
| `data/raw/bodyparts3d/partof_element_parts.txt`                                                 | https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/partof_element_parts.txt              | `3f5f6df1028eb122b30de77c711597b6bb8e5541658e5985859fd228adbf88ea` |
| `data/raw/bodyparts3d/partof_parts_list_e.txt`                                                  | https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/partof_parts_list_e.txt               | `9224080557053e6f1322f1e13ab27f0ecde0db19bb3b505f0631afad230eeebd` |
| `data/raw/bodyparts3d/partof_inclusion_relation_list.txt` (optional)                            | https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/partof_inclusion_relation_list.txt    | `1b40738270931e3c1d955ce34e0fce0d8d10d8c5ad543463e40b4b4c0243007c` |

From the repo root (Git Bash). HRA lung:

```bash
curl -fL -o data/raw/hra/3d-vh-m-lung.glb   https://cdn.humanatlas.io/digital-objects/ref-organ/lung-male/latest/assets/3d-vh-m-lung.glb
sha256sum data/raw/hra/3d-vh-m-lung.glb   # compare with the table above
```

The same in PowerShell:

```powershell
Invoke-WebRequest -Uri "https://cdn.humanatlas.io/digital-objects/ref-organ/lung-male/latest/assets/3d-vh-m-lung.glb" -OutFile "data/raw/hra/3d-vh-m-lung.glb"
Get-FileHash -Algorithm SHA256 data/raw/hra/3d-vh-m-lung.glb   # compare with the table above
```

BodyParts3D (Git Bash):

```bash
cd data/raw/bodyparts3d
BASE=https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST
for f in partof_BP3D_4.0_obj_99.zip partof_element_parts.txt partof_parts_list_e.txt partof_inclusion_relation_list.txt; do
  curl -fLO "$BASE/$f"
done
sha256sum partof_*          # compare with the table above
unzip -q partof_BP3D_4.0_obj_99.zip   # → partof_BP3D_4.0_obj_99/ (1,258 OBJ files)
```

Check of the unzipped folder (one hash over all 1,258 files):

```bash
cd data/raw/bodyparts3d/partof_BP3D_4.0_obj_99
find . -type f | LC_ALL=C sort | xargs sha256sum | sha256sum
# e1fb08b770596d9d5501efcd933b603ef02c60c91f418a629a903a02f399a5bf
```

Not needed by the pipeline: Z-Anatomy (not used) and the BodyParts3D IS-A tree (`isa_*`).

## Lungs: spike (in progress)

Goal: add the lungs, to complete the pulmonary circulation that `heart.glb` cuts at the lung roots.

### HRA lung (male)
- File: `data/raw/hra/3d-vh-m-lung.glb` (10.9 MB, **not in Git**: above the CI's 5 MB limit; see `.gitignore`).
  URL: https://cdn.humanatlas.io/digital-objects/ref-organ/lung-male/latest/assets/3d-vh-m-lung.glb
- Record (LOD, read on 2026-11-26: https://lod.humanatlas.io/ref-organ/lung-male/latest/):
  - **Licence: Creative Commons Attribution 4.0 International (CC BY 4.0).**
  - Version **1.3**; publisher HuBMAP; funders: National Institutes of Health (awards OT2OD033756
    and OT2OD026671).
  - Made from the **Visible Human Male** data of the National Library of Medicine (Spitzer et al. 1996,
    https://doi.org/10.1136/jamia.1996.96236280; Ackerman 1998, https://doi.org/10.1109/5.662875).
  - "In version 1.3, the larynx, trachea, and main bronchi were removed; however, lung lobes and
    intrapulmonary bronchi remain part of the lung model." This matches the file: no trachea.
  - **Creators: Kristen Browne, Heidi Schlehlein.** Project lead: Katy Börner. Internal reviewer:
    Gloria Pryhuber.
  - **DOI: https://doi.org/10.48539/HBM532.KLZD.394** (data ID HBM532.KLZD.394), published 2024-06-15,
    last processed 2026-06-08.
  - Attribution line (same pattern as the heart): "3D Reference Organ for Lung, Male v1.3", Kristen
    Browne and Heidi Schlehlein (2024), HuBMAP Human Reference Atlas, CC BY 4.0,
    https://doi.org/10.48539/HBM532.KLZD.394
- Visual check in Blender (2026-11-26): lobes, segments and bronchi load and look complete; no problem found.
- Content (node names read from the file, 224,765 triangles):
  - **Lung tissue**: both lungs as lobes (left: upper, lower; right: upper, middle, lower), cut into
    **18 bronchopulmonary segments**, plus the hilum of each lung and lobe. Light: about 20k triangles.
  - **Bronchi**: lobar and segmental bronchi of both sides, and their cartilage (56k triangles for the
    cartilage alone).
  - **No blood vessels** and no trachea.

### BodyParts3D: FMA ids
**BodyParts3D has no lung tissue.** The 124 element files of the left lung (`FMA7310`) and the 156 of
the right lung (`FMA7309`) are all bronchi, pulmonary arteries or pulmonary veins: a "lobe" or a
"segment" is only the set of conduits that run through it. Same issue as the heart's missing
ventricular walls.

| Group | FMA ids | Element files |
|---|---|---|
| Trachea | `FMA7394` | 1 |
| Main bronchi (right, left) | `FMA7395`, `FMA7396` | 1, 1 |
| Bronchial tree (right, left) | `FMA26661`, `FMA26662` | 54, 40 |
| Lobar parts of the bronchial tree, right (upper, middle, lower) | `FMA31744`, `FMA31741`, `FMA31747` | 21, 8, 24 |
| Lobar parts of the bronchial tree, left (upper, lower) | `FMA31746`, `FMA31748` | 17, 22 |
| Intrapulmonary pulmonary arteries (right, left) | `FMA67994`, `FMA67995` | 54, 37 |
| Intrapulmonary pulmonary veins, right (superior, inferior) | `FMA68002`, `FMA68003` | 26, 23 |
| Intrapulmonary pulmonary veins, left (superior, inferior) | `FMA68004`, `FMA68005` | 24, 12 |
| Lungs (right, left): conduits only | `FMA7309`, `FMA7310` | 156, 124 |
| Lobes, right (upper, middle, lower) / left (upper, lower): conduits only | `FMA7333`, `FMA7383`, `FMA7337` / `FMA7370`, `FMA7371` | |

The intrapulmonary vessels are exactly the parts `heart.json` excludes (`exclude_fma`) from the
pulmonary arteries and veins, so they would continue the heart's vessels in the same body.

### Fit test (2026-11-26)
The HRA lung comes from another body (Visible Human), so it must be fitted onto BodyParts3D, as the
heart was. First test with `register()` from `mesh_ops.py`:

| Fit | Scale | Rotation | Mean distance |
|---|---|---|---|
| HRA lung tissue onto BodyParts3D intrapulmonary vessels + airways | 0.78 | 3.7° | 10.4 mm |
| **HRA bronchi onto BodyParts3D bronchi** | **0.975** | **5.2°** | **7.5 mm** |

The first fit is wrong: it compares an outer surface with the conduits inside it, so ICP shrinks the
lung by 22 %. **Fit bronchi onto bronchi** (like for like), then apply the same transform to the lung
tissue. With that fit, 99 % of the BodyParts3D vessel points fall in the fitted lung's bounding box.
7.5 mm is more than the heart's 3 mm: check in Blender that the vessels stay inside the lung surface.

### Check file (B5a, 2026-11-26)
`data/out/lung-check.glb` (not in Git; rebuilt by a spike script) puts together, in the BodyParts3D
body frame: the HRA lung tissue (one semi-transparent node per lobe) and bronchi, fitted bronchi onto
bronchi; the BodyParts3D trachea, main bronchi and intrapulmonary arteries (blue) and veins (red); and
the current `heart.glb` moved back from the heart frame to the body frame.

Measured on that file (a vessel point is "inside" if it is behind the nearest lung surface):

| BodyParts3D vessels | Inside the fitted HRA lung | Outside by > 5 mm | Outside by > 10 mm | Max |
|---|---|---|---|---|
| Intrapulmonary arteries | 66 % | 21 % | 13 % | 30 mm |
| Intrapulmonary veins | 64 % | 16 % | 8 % | 30 mm |

- Some vessel length outside the lung is normal: the vessels enter each lung at its hilum.
- The rest comes from the two bodies: the HRA lung (Visible Human) and the BodyParts3D lung do not have
  the same shape, and a rigid fit (rotation, scale, translation) cannot fix that.
- **Data error in BodyParts3D:** two element files of the intrapulmonary right pulmonary artery,
  `FJ2041` and `FJ2044` ("right anterior segmental artery", which belongs to the upper lobe), lie about
  10 cm *below* the lung. Leave them out (the figures above already do).

Options, to choose after looking at the check file in Blender:
1. **HRA lung + BodyParts3D vessels**, as planned, if the vessels that stick out are acceptable (or
   hidden by showing the lung tissue semi-transparent).
2. **HRA lung only** (tissue and bronchi), without vessels inside the lungs: the heart's pulmonary
   vessels then end at the lung roots, as today. Simplest and consistent.
3. **BodyParts3D only**: vessels and bronchi of the same body, no lung tissue (only conduits).

### Decision (2026-11-26): option 2, HRA lung only
After checking `lung-check.glb` in Blender, the team member chose **option 2**:

- `lungs.glb` takes **everything from the HRA male lung v1.3**: lung tissue (lobes) and intrapulmonary
  bronchi. **No BodyParts3D vessels inside the lungs**: the heart's pulmonary arteries and veins keep
  ending at the lung roots, as in `heart.glb` today.
- The HRA lung is still **placed by fitting its bronchi onto the BodyParts3D bronchi** (7.5 mm mean
  distance), so it sits around the heart in the common body frame of the contract v2. BodyParts3D is
  only used as the placement reference, not as geometry.
- No trachea (removed from HRA v1.3). It could be added later from BodyParts3D (`FMA7394`) if needed.
- Still to do: list of structures (lobes rather than the 18 segments: simpler to learn and to document),
  triangle budget under 5 MB (the HRA bronchi and their cartilage are 205k triangles), and the
  approval of the contract v2 by Tracks A and C.

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
