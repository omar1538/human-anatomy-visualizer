# Attribution

Every 3D model and dataset used in the app is listed here: name, author, source link,
licence, and what we changed (decimation, conversion, renaming).
A model that is not in this file must not be merged.

| Asset | Author / source | Link | Licence | Modifications |
|-------|-----------------|------|---------|---------------|
| App icons (`public/icons/icon-192.png`, `icon-512.png`) | Project team (placeholder, generated) | n/a | Same as this repository | None. To be replaced by final icons |
| `heart.glb`: coronary arteries, cardiac veins, great vessels (groups `coronary_arteries`, `cardiac_veins`, `great_vessels`) | BodyParts3D, © The Database Center for Life Science (DBCLS) | https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html | CC BY 4.0 | Element meshes merged per structure (FMA ids in `scripts/data-pipeline/config/heart.json`), mm → m, Z-up → Y-up, centred on the heart, descending aorta and inferior vena cava cut below the heart and capped, cleaned, decimated, renamed, exported as GLB |
| `heart.glb`: chambers, septum, papillary muscles, valves (groups `chambers`, `valves`) | Kristen Browne, Heidi Schlehlein (2024), "3D Reference Organ for Heart, Male v1.3", HuBMAP Human Reference Atlas | https://doi.org/10.48539/HBM564.WKNG.249 | CC BY 4.0 | Fitted (rotation, uniform scale, translation) onto the BodyParts3D heart, cleaned, decimated, five papillary muscles merged into one mesh, renamed, exported as GLB |

Attribution lines to show in the app's credits:

- "BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International"
- "3D Reference Organ for Heart, Male v1.3", Kristen Browne and Heidi Schlehlein, HuBMAP Human Reference Atlas, CC BY 4.0. Browne et al., "HuBMAP CCF 3D Reference Object Library", https://humanatlas.io/3d-reference-library
