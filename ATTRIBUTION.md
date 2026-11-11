# 📄 Fichier d'Attribution et d'Origine des Ressources (ATTRIBUTION.md)
**Projet :** Human Anatomy Visualizer (visualiseur 3D/AR du cœur humain)
**Équipe :** Omar Bajar (Track A : rendu et 3D), Adam Derbel (Track B : données et contenu), Mohamed Amine Msaddak (Track C : plateforme et UX)
**Version :** 1.0 — Évaluation SUP'COM (2026/2027)

Un asset, une bibliothèque, un extrait de code ou un usage d'IA qui n'est pas listé ici ne doit pas être fusionné.
Les champs marqués *[À compléter — Track X]* sont à remplir par le membre responsable.

---

## 1. Modèles 3D, Textures et Assets Graphiques

*   **Asset :** `public/assets/models/heart.glb`, structures des groupes `coronary_arteries`, `cardiac_veins`, `great_vessels` (artères coronaires, veines cardiaques, gros vaisseaux)
    *   **Source originale :** BodyParts3D 4.0, arbre PART-OF, réduction 99 % (`partof_BP3D_4.0_obj_99.zip`) : https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html
    *   **Auteur / Créateur :** The Database Center for Life Science (DBCLS)
    *   **Licence :** CC BY 4.0 (depuis le 2025-02-25, voir https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html). Mention : « BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International »
    *   **Modifications apportées par l'équipe :** fusion des fichiers OBJ élémentaires par structure (ids FMA dans `scripts/data-pipeline/config/heart.json`), conversion mm → m et Z-up → Y-up, centrage sur le cœur, aorte descendante et veine cave inférieure coupées 75 mm sous le centre du cœur et refermées, nettoyage, décimation, renommage en snake_case, export GLB par le pipeline `scripts/data-pipeline/build.py`

*   **Asset :** `public/assets/models/heart.glb`, structures des groupes `chambers`, `valves` (cavités, septum, muscles papillaires, valves)
    *   **Source originale :** HuBMAP Human Reference Atlas, « 3D Reference Organ for Heart, Male v1.3 » : https://doi.org/10.48539/HBM564.WKNG.249 (fichier https://cdn.humanatlas.io/digital-objects/ref-organ/heart-male/latest/assets/3d-vh-m-heart.glb)
    *   **Auteur / Créateur :** Kristen Browne, Heidi Schlehlein (2024), HuBMAP CCF 3D Reference Object Library
    *   **Licence :** CC BY 4.0
    *   **Modifications apportées par l'équipe :** recalage (rotation, échelle uniforme, translation par ICP, erreur moyenne 3 mm) sur le cœur BodyParts3D, nettoyage, décimation, fusion des cinq muscles papillaires en un seul maillage, renommage, export GLB

*   **Asset :** `data/raw/hra/3d-vh-m-heart.glb` et `data/raw/hra/3d-vh-f-heart.glb` (fichiers sources bruts, non chargés par l'application)
    *   **Source originale :** https://cdn.humanatlas.io/digital-objects/ref-organ/heart-male/latest/assets/3d-vh-m-heart.glb et https://cdn.humanatlas.io/digital-objects/ref-organ/heart-female/latest/assets/3d-vh-f-heart.glb
    *   **Auteur / Créateur :** HuBMAP Human Reference Atlas (Kristen Browne, Heidi Schlehlein)
    *   **Licence :** CC BY 4.0
    *   **Modifications apportées par l'équipe :** aucune (copies exactes, sommes SHA-256 dans `docs/DATA_SOURCES.md`)

*   **Asset :** icônes de l'application (`public/icons/icon-192.png`, `icon-512.png`)
    *   **Source originale :** générées par l'équipe (provisoires)
    *   **Auteur / Créateur :** *[À compléter — Track C]*
    *   **Licence :** même licence que ce dépôt
    *   **Modifications apportées par l'équipe :** aucune ; à remplacer par les icônes finales

*   **Contenu pédagogique :** `public/assets/data/organs.json` (34 fiches) et `public/assets/data/quiz.json` (71 questions), en anglais et en français
    *   **Source originale :** rédigé pour le projet (voir section 4) ; aucun passage copié d'un manuel
    *   **Auteur / Créateur :** équipe, Track B
    *   **Licence :** même licence que ce dépôt
    *   **Modifications apportées par l'équipe :** statut `draft` ; relecture de l'exactitude prévue en semaine 6 (encadrant ou étudiant en médecine)

*Datasets évalués mais non utilisés :* Z-Anatomy (CC BY-SA 4.0, avec des modèles en NC) et TotalSegmentator (stretch, non téléchargé). Détails dans `docs/DATA_SOURCES.md`.

---

## 2. Bibliothèques tierces et Modules externes (Pinnés)

L'application installe ses dépendances par npm, avec des versions exactes figées dans `package.json` et `package-lock.json`, et Vite les intègre au build. Aucun CDN n'est chargé à l'exécution. Le lien CDN indique la version de référence.

### Application web (Track A et Track C)

*   **Bibliothèque :** three.js (`three`, y compris `three/webgpu`, `three/addons` : `GLTFLoader`, `OrbitControls`, `meshopt_decoder`)
    *   **Version fixée :** 0.187.0 (r187)
    *   **Lien CDN de référence :** https://cdn.jsdelivr.net/npm/three@0.187.0/
    *   **Rôle dans le projet :** moteur de rendu WebGPU avec repli WebGL 2, chargement GLB, contrôles de caméra, WebXR (AR)

*   **Bibliothèque :** Vite (outil de développement, non livré)
    *   **Version fixée :** 8.3.5
    *   **Lien CDN de référence :** https://cdn.jsdelivr.net/npm/vite@8.3.5/
    *   **Rôle dans le projet :** serveur de développement et build de production

*   **Bibliothèque :** ESLint, `@eslint/js`, `globals` (outils de développement, non livrés)
    *   **Version fixée :** 10.14.0, 10.0.1, 17.14.0
    *   **Lien CDN de référence :** https://cdn.jsdelivr.net/npm/eslint@10.14.0/, https://cdn.jsdelivr.net/npm/@eslint/js@10.0.1/, https://cdn.jsdelivr.net/npm/globals@17.14.0/
    *   **Rôle dans le projet :** analyse statique du code (CI)

*   **Bibliothèque :** Prettier (outil de développement, non livré)
    *   **Version fixée :** 3.9.10
    *   **Lien CDN de référence :** https://cdn.jsdelivr.net/npm/prettier@3.9.10/
    *   **Rôle dans le projet :** formatage du code

*   **Autres bibliothèques ou actions GitHub (CI/CD, PWA, tests) :** *[À compléter — Track C]*
*   **Autres bibliothèques côté rendu :** *[À compléter — Track A]*

### Pipeline de données (Track B, Python 3.13, hors application)

Versions figées dans `scripts/data-pipeline/requirements.txt`, installées par pip depuis PyPI (pas de CDN).

*   **Bibliothèque :** trimesh
    *   **Version fixée :** 5.2.0
    *   **Lien de référence :** https://pypi.org/project/trimesh/5.2.0/
    *   **Rôle dans le projet :** lecture OBJ/GLB, nettoyage et export des maillages, export GLB

*   **Bibliothèque :** fast-simplification
    *   **Version fixée :** 0.2.0
    *   **Lien de référence :** https://pypi.org/project/fast-simplification/0.2.0/
    *   **Rôle dans le projet :** décimation des maillages (quadric decimation)

*   **Bibliothèque :** NumPy
    *   **Version fixée :** 2.5.4
    *   **Lien de référence :** https://pypi.org/project/numpy/2.5.4/
    *   **Rôle dans le projet :** calculs sur les sommets et les normales

*   **Bibliothèque :** SciPy
    *   **Version fixée :** 1.18.1
    *   **Lien de référence :** https://pypi.org/project/scipy/1.18.1/
    *   **Rôle dans le projet :** recalage ICP (plus proches voisins), transformations

*   **Bibliothèque :** NetworkX
    *   **Version fixée :** 3.7
    *   **Lien de référence :** https://pypi.org/project/networkx/3.7/
    *   **Rôle dans le projet :** dépendance de trimesh (composantes connexes, orientation des faces)

*   **Bibliothèque :** Shapely, mapbox-earcut
    *   **Version fixée :** 2.2.0, 2.1.0
    *   **Lien de référence :** https://pypi.org/project/shapely/2.2.0/, https://pypi.org/project/mapbox-earcut/2.1.0/
    *   **Rôle dans le projet :** fermeture (capping) des vaisseaux coupés (`clip_y`)

`scripts/data-pipeline/validate_content.py` et `check_glb.py` n'utilisent que la bibliothèque standard Python (et NumPy pour `check_glb.py`).

---

## 3. Extraits de code copiés ou adaptés (StackOverflow, Tutoriels, Dépôts tiers)

*   **Track A (`src/render/`) :** *[À compléter — Track A]*
    *   **Source du code original :**
    *   **Auteur :**
    *   **Adaptation effectuée :**

*   **Track B (`scripts/data-pipeline/`) :** aucun extrait copié identifié. Le code a été écrit avec un assistant IA (voir section 4) et s'appuie sur la documentation officielle de trimesh, fast-simplification et du format glTF 2.0 (https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html).

*   **Track C (`src/pwa/`, `public/sw.js`, `.github/workflows/`) :** *[À compléter — Track C]*
    *   **Source du code original :**
    *   **Auteur :**
    *   **Adaptation effectuée :**

---

## 4. Déclaration de l'usage des Assistants IA (Copilot, ChatGPT, Claude)

### Track B (Adam Derbel), assistant : Claude (Anthropic), dans VS Code

Claude a servi d'assistant de rédaction et de code. L'étudiant a téléchargé les données, défini les tâches,
contrôlé les données et les résultats (dont le contrôle visuel dans Blender) et validé chaque étape avant commit.
Les vérifications cochées `[x]` ont été faites ; celles marquées `[ ]` sont prévues et seront cochées une fois faites.

Travail fait **sans assistant IA** :
- Téléchargement des datasets (BodyParts3D, HRA, Z-Anatomy) depuis les sites officiels, rangement dans `data/raw/`.
- Inspection visuelle des données téléchargées dans **Blender** (import des OBJ BodyParts3D et des GLB HRA : forme,
  orientation, échelle, parties présentes ou manquantes).

*   **Composant ou Shader concerné :** spike des datasets et choix des sources (`docs/DATA_SOURCES.md`)
    *   **Prompt ou usage principal :** aide à l'analyse des datasets téléchargés par l'étudiant (contenu, repères, licences), calcul du recalage HRA → BodyParts3D, rédaction du document ; calcul des sommes SHA-256 et contrôle que les URL officielles donnent les mêmes fichiers que les copies locales
    *   **Axe de vérification appliqué par l'étudiant :**
        - [x] Téléchargement des données par l'étudiant depuis les sites officiels
        - [x] Visualisation et contrôle des données brutes dans Blender (BodyParts3D, HRA)
       

*   **Composant ou Shader concerné :** pipeline de conversion v1 (`scripts/data-pipeline/build.py`, `sources.py`, `mesh_ops.py`, `check_glb.py`, `config/heart.json`) et `public/assets/models/heart.glb`
    *   **Prompt ou usage principal :** écriture du code du pipeline (chargement, changement de repère, recalage ICP, découpe et fermeture des vaisseaux, nettoyage, décimation, export GLB avec provenance) et de la configuration du cœur, selon les choix validés par l'étudiant (sources, périmètre « cœur seul », structures à garder)
    *   **Axe de vérification appliqué par l'étudiant :**
        - [ ] Relance du pipeline (`python scripts/data-pipeline/build.py --config scripts/data-pipeline/config/heart.json`) et contrôle `python scripts/data-pipeline/check_glb.py data/out/heart.glb` sans erreur
        - [ ] Import de `heart.glb` dans Blender : orientation (+Y haut, +Z avant), échelle en mètres, 29 structures dans 5 groupes, noms des nœuds
        - [ ] Superposition dans Blender du `heart.glb` et des données brutes : les vaisseaux BodyParts3D rejoignent les cavités HRA
        - [ ] Vérification de quelques ids FMA de `config/heart.json` dans `partof_parts_list_e.txt`
        - [ ] Affichage dans l'application (sélection, calques) avec la Track A

*   **Composant ou Shader concerné :** contrat de données (`docs/DATA_CONTRACT.md`)
    *   **Prompt ou usage principal :** aide à la rédaction du format du GLB, de `organs.json` et de `quiz.json` (dont le type `mcq` et les textes bilingues)
    *   **Axe de vérification appliqué par l'étudiant :**
        - [ ] Comparaison du contrat avec le contenu réel de `heart.glb` (axes, noms, groupes) dans Blender
        - [ ] Relecture et accord des Tracks A et C (format lu par `src/render/loader.js` et le mode Quiz)

*   **Composant ou Shader concerné :** contenu pédagogique (`public/assets/data/organs.json`, 34 fiches)
    *   **Prompt ou usage principal :** aide à la rédaction en anglais et en français de la fonction, de la localisation et des faits de chaque structure ; toutes les fiches sont en statut `draft` jusqu'à leur relecture
    *   **Axe de vérification appliqué par l'étudiant :**
        - [ ] Contrôle de chaque fiche avec une référence fiable (manuel d'anatomie ou cours), en particulier les chiffres (dominance coronaire, épaisseurs, volumes)
        - [ ] Relecture du vocabulaire médical français
        - [ ] Relecture par l'encadrant ou un étudiant en médecine (semaine 6), puis passage des fiches en `reviewed`

*   **Composant ou Shader concerné :** banque de quiz v1 (`public/assets/data/quiz.json`, 71 questions)
    *   **Prompt ou usage principal :** aide à la rédaction des questions (`find-it`, `name-it`, `mcq`), des choix et des explications en anglais et en français
    *   **Axe de vérification appliqué par l'étudiant :**
        - [ ] Résolution de toutes les questions par l'étudiant : une seule bonne réponse, distracteurs plausibles mais faux
        - [ ] Contrôle des réponses avec la même référence que `organs.json`
        - [ ] Test dans le mode Quiz de l'application (Track C) : chaque `find-it` se résout en cliquant la bonne structure

*   **Composant ou Shader concerné :** script de validation (`scripts/data-pipeline/validate_content.py`)
    *   **Prompt ou usage principal :** écriture des contrôles `organs.json` ↔ GLB et `quiz.json` ↔ `organs.json`, testés sur des fichiers volontairement erronés
    *   **Axe de vérification appliqué par l'étudiant :**
        - [ ] Exécution de `validate_content.py --strict` : 0 erreur
        - [ ] Introduction volontaire d'erreurs (id inconnu, traduction manquante, mauvaise réponse) et contrôle que le script les signale
        - [ ] Relecture du code pour pouvoir expliquer chaque contrôle à la soutenance

### Track A (Omar Bajar)

*   **Composant ou Shader concerné :** *[À compléter — Track A]*
    *   **Prompt ou usage principal :**
    *   **Axe de vérification appliqué par l'étudiant :**

### Track C (Mohamed Amine Msaddak)

*   **Composant ou Shader concerné :** *[À compléter — Track C]*
    *   **Prompt ou usage principal :**
    *   **Axe de vérification appliqué par l'étudiant :**

---

## Mentions à afficher dans les crédits de l'application

- « BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International »
- « 3D Reference Organ for Heart, Male v1.3 », Kristen Browne and Heidi Schlehlein, HuBMAP Human Reference Atlas, CC BY 4.0. Browne et al., « HuBMAP CCF 3D Reference Object Library », https://humanatlas.io/3d-reference-library
