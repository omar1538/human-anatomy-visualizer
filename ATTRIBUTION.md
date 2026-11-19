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
    *   **Source originale :** générées par l'équipe (provisoires) avec un petit script Node (disque bleu sur fond sombre), sans image externe
    *   **Auteur / Créateur :** Mohamed Amine Msaddak (Track C), avec l'assistant Claude ; commit `08250a5` du 5 novembre 2026
    *   **Licence :** même licence que ce dépôt
    *   **Modifications apportées par l'équipe :** aucune ; à remplacer par les icônes finales

*   **Asset :** corps provisoire (`scripts/render/placeholder.mjs`)
    *   **Source originale :** formes géométriques générées par le code (sphères, cylindres de Three.js)
    *   **Auteur / Créateur :** équipe du projet
    *   **Licence :** même licence que ce dépôt
    *   **Modifications apportées par l'équipe :** sans objet. Utilisé seulement avec `?model=placeholder`

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

*   **Bibliothèque :** GitHub Actions : checkout, setup-node, setup-python, configure-pages, upload-pages-artifact, deploy-pages
    *   **Version fixée :** v7, v7, v7, v6, v5, v5 (versions majeures, `.github/workflows/ci-cd.yml`)
    *   **Lien CDN de référence :** sans objet (https://github.com/actions)
    *   **Rôle dans le projet :** CI (lint, validation des données, taille des GLB, build) et déploiement automatique sur GitHub Pages

*   **Bibliothèque :** Immersive Web Emulator (Meta) et `iwer` (outil de test, non intégré au dépôt)
    *   **Version fixée :** 2.8.0
    *   **Lien CDN de référence :** sans objet (https://github.com/meta-quest/immersive-web-emulator/)
    *   **Rôle dans le projet :** émuler un appareil WebXR sur ordinateur pour tester la session AR sans téléphone

*   **Autres bibliothèques ou outils (PWA, tests) :** *[À compléter — Track C]*

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

*   **Track A, `scripts/render/xr.mjs` :** `createReticle`, `place`, `update`, et la demande de session `immersive-ar` dans `enter`
    *   **Source du code original :** exemple officiel Three.js « webxr_ar_hittest » (https://github.com/mrdoob/three.js/blob/r187/examples/webxr_ar_hittest.html, licence MIT) et spécification W3C WebXR Hit Test Module (https://www.w3.org/TR/webxr-hit-test-1/)
    *   **Auteur :** auteurs de Three.js ; W3C Immersive Web Working Group
    *   **Adaptation effectuée :** reprise du principe (source de hit test dans l'espace `viewer`, réticule placé à partir de la pose, placement au signal `select`). Réécrit pour le projet : copie de la sélection (organe ou groupe) sans modifier l'original, mise à l'échelle, orientation vers l'utilisateur, placement flottant sans surface détectée, restauration de la scène à la fin de la session

*   **Track A, `scripts/render/renderer.mjs` :** contournement du framebuffer XR `null`
    *   **Source du code original :** aucune ; écrit après lecture du code source de Three.js r187 (`WebGLState.drawBuffers`, `WebGLBackend._setFramebuffer`)
    *   **Auteur :** équipe du projet (Track A)
    *   **Adaptation effectuée :** sans objet

*   **Track B (`scripts/data-pipeline/`) :** aucun extrait copié identifié. Le code a été écrit avec un assistant IA (voir section 4) et s'appuie sur la documentation officielle de trimesh, fast-simplification et du format glTF 2.0 (https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html).

*   **Track C (`src/pwa/`, `public/sw.js`, `.github/workflows/`) :** *[À compléter — Track C]*
    *   **Source du code original :**
    *   **Auteur :**
    *   **Adaptation effectuée :**

---

## 4. Déclaration de l'usage des Assistants IA (Copilot, ChatGPT, Claude)

### Track B (Adam Derbel), assistant : Claude Opus 5.5 (Anthropic), via l'extension Claude Code dans VS Code

Claude a servi d'assistant de rédaction et de code. Les prompts ci-dessous sont des versions simplifiées des demandes faites à Claude (en français), sauf celui du CI/CD, recopié tel quel. L'étudiant a téléchargé les données, défini les tâches,
contrôlé les données et les résultats (dont le contrôle visuel dans Blender) et validé chaque étape avant commit.

Travail fait **sans assistant IA** :
- Téléchargement des datasets (BodyParts3D, HRA, Z-Anatomy) depuis les sites officiels, rangement dans `data/raw/`.
- Inspection visuelle des données téléchargées dans **Blender** (import des OBJ BodyParts3D et des GLB HRA : forme,
  orientation, échelle, parties présentes ou manquantes).

*   **Composant ou Shader concerné :** spike des datasets et choix des sources (`docs/DATA_SOURCES.md`)
    *   **Prompt ou usage principal :** « J'ai téléchargé BodyParts3D, Z-Anatomy et HRA dans data/raw. Compare-les pour le cœur : quelles structures, quelles unités et quels axes, quelles licences. Dis-moi lesquels utiliser et écris le résultat dans docs/DATA_SOURCES.md. » Puis : « Ajoute une section qui explique comment retélécharger les données, avec les URL et les sommes de contrôle. »
    *   **Axe de vérification appliqué par l'étudiant :**
        - Téléchargement des données par l'étudiant depuis les sites officiels
        - Visualisation et contrôle des données brutes dans Blender (BodyParts3D, HRA)

*   **Composant ou Shader concerné :** pipeline de conversion v1 (`scripts/data-pipeline/build.py`, `sources.py`, `mesh_ops.py`, `check_glb.py`, `config/heart.json`) et `public/assets/models/heart.glb`
    *   **Prompt ou usage principal :** « Écris un pipeline Python qui prend les cavités et les valves du cœur HRA et les vaisseaux de BodyParts3D, les met dans le même repère (mètres, Y vers le haut), les nettoie, les décime, les renomme en snake_case, les range en groupes et exporte un seul heart.glb avec la source et la licence de chaque maillage. »
    *   **Axe de vérification appliqué par l'étudiant :**
        - Relance du pipeline (`python scripts/data-pipeline/build.py --config scripts/data-pipeline/config/heart.json`) et contrôle `python scripts/data-pipeline/check_glb.py data/out/heart.glb` sans erreur
        - Import de `heart.glb` dans Blender : orientation (+Y haut, +Z avant), échelle en mètres, 29 structures dans 5 groupes, noms des nœuds
        - Superposition dans Blender du `heart.glb` et des données brutes : les vaisseaux BodyParts3D rejoignent les cavités HRA
        - Vérification de quelques ids FMA de `config/heart.json` dans `partof_parts_list_e.txt`
        - Affichage dans l'application (sélection, calques) avec la Track A

*   **Composant ou Shader concerné :** contrat de données (`docs/DATA_CONTRACT.md`)
    *   **Prompt ou usage principal :** « Écris le contrat de données entre ma piste et les pistes A et C : comment est fait heart.glb (axes, noms des nœuds, groupes) et le format de organs.json et de quiz.json. » Puis : « On passe le contrat en version finale. »
    *   **Axe de vérification appliqué par l'étudiant :**
        - Comparaison du contrat avec le contenu réel de `heart.glb` (axes, noms, groupes) dans Blender
        - Relecture et accord des Tracks A et C (format lu par `src/render/loader.js` et le mode Quiz)

*   **Composant ou Shader concerné :** contenu pédagogique (`public/assets/data/organs.json`, 34 fiches)
    *   **Prompt ou usage principal :** « Crée organs.json avec une fiche pour chaque structure de heart.glb : nom, fonction, localisation et quelques faits, en anglais et en français. Commence par les 4 cavités et le septum, puis fais toutes les autres. » Toutes les fiches restent en statut `draft` jusqu'à leur relecture.
    *   **Axe de vérification appliqué par l'étudiant :**
        - Contrôle de chaque fiche avec une référence fiable (manuel d'anatomie ou cours), en particulier les chiffres (dominance coronaire, épaisseurs, volumes)
        - Relecture du vocabulaire médical français

*   **Composant ou Shader concerné :** banque de quiz v1 (`public/assets/data/quiz.json`, 71 questions)
    *   **Prompt ou usage principal :** « Écris une banque de quiz d'au moins 60 questions sur le cœur, en anglais et en français, avec une explication pour chaque réponse : des questions où l'on clique sur la structure, où l'on nomme la structure surlignée, et des QCM sur la fonction. »
    *   **Axe de vérification appliqué :**
        - Résolution de toutes les questions par l'étudiant : une seule bonne réponse, distracteurs plausibles mais faux
        - Contrôle des réponses avec la même référence que `organs.json`

*   **Composant ou Shader concerné :** script de validation (`scripts/data-pipeline/validate_content.py`)
    *   **Prompt ou usage principal :** « Écris un script de validation qui vérifie que chaque maillage de heart.glb a sa fiche dans organs.json, avec les textes en anglais et en français et une licence. » Puis : « Ajoute la vérification de quiz.json. »
    *   **Axe de vérification appliqué par l'étudiant :**
        - Exécution de `python scripts/data-pipeline/validate_content.py --strict` : 0 erreur

*   **Composant ou Shader concerné :** pipeline CI/CD (`.github/workflows/ci-cd.yml`, script `validate` de `package.json`, `docs/SETUP.md`)
    *   **Prompt ou usage principal :** (recopié tel quel)

        > Ajoute une pipeline CI/CD avec GitHub Actions à ce projet.
        >
        > Avant de commencer, lis tout le projet pour comprendre la structure du projet.
        >
        > Crée le fichier .github/workflows/ci-cd.yml avec :
        > - Déclenchement : à chaque push et pull request sur main.
        > - Job CI :
        >   1. Installer les dépendances
        >   2. Lint (ESLint)
        >   3. Lancer le script de validation des données (chaque mesh a ses métadonnées FR/EN, une licence et un auteur, et le fichier GLB existe). Si ce script n'existe pas, crée scripts/validate.mjs en respectant docs/DATA_CONTRACT.md.
        >   4. Faire échouer la CI si un fichier .glb dépasse 5 Mo.
        >   5. Build de l'application.
        > - Job CD : déployer sur GitHub Pages, seulement sur push dans main et seulement si la CI passe (actions/upload-pages-artifact et actions/deploy-pages).
        >
        > Ajoute aussi ce qui manque pour que tout fonctionne : scripts "lint", "build" et "validate" dans package.json, config ESLint si absente, et le bon "base" dans la config Vite pour GitHub Pages.
        >
        > Ensuite, lance localement lint, validate et build pour vérifier qu'ils passent, et corrige les erreurs.
        > À la fin, explique-moi en français ce que tu as ajouté et ce que je dois activer moi-même sur GitHub (Settings → Pages → Source : GitHub Actions).
        >
        > Ne fais pas de commit sans me demander.
    *   **Axe de vérification appliqué par l'étudiant :**

### Track A (Omar Bajar), assistant : Claude Opus 5.5 (Anthropic), via Claude Code dans VS Code

Claude a servi d'assistant de code, de diagnostic et de rédaction. Les prompts ci-dessous sont des
reformulations structurées des demandes faites à l'assistant : chacun regroupe les échanges d'une même
tâche et n'est pas recopié mot pour mot. L'étudiant a défini les tâches et les choix (AR plutôt que VR,
découpage en commits), relu le résultat et validé chaque étape avant commit.

*   **Composant ou Shader concerné :** socle du viewer 3D (`scripts/render/renderer.mjs`, `scene.mjs`, `controls.mjs`, `index.mjs`)
    *   **Prompt ou usage principal :**
        > Contexte : application d'anatomie dans le navigateur, Three.js r187 (versions figées), Vite.
        > Tâche : crée un viewer 3D avec `WebGPURenderer` et repli automatique sur WebGL 2, une caméra
        > cadrée sur le modèle, des contrôles orbite / zoom / déplacement à la souris et au doigt, et un
        > rendu à la demande pour économiser la batterie.
        > Contraintes : les autres pistes n'utilisent que `scripts/render/index.mjs` ; documente cette API.
        > Livrable : code commenté, `docs/RENDERING_API.md`, lint et build sans erreur.
    *   **Axe de vérification appliqué par l'étudiant :**
        - `npm run lint` et `npm run build`
        - Essai dans Chrome : le panneau indique le moteur actif (`WebGPU` ou `WebGL 2`), le modèle est cadré et manipulable

*   **Composant ou Shader concerné :** calques et sélection (`scripts/render/layers.mjs`, `picking.mjs`)
    *   **Prompt ou usage principal :**
        > Tâche : regroupe les maillages par calque (afficher / masquer) et permets de sélectionner une
        > structure au clic, avec une surbrillance. Ensuite, applique `docs/DATA_CONTRACT.md` : un id de
        > groupe (`chambers`, `valves`…) doit aussi être sélectionnable et surligner toute sa structure.
        > Contraintes : ignorer les parties masquées, ne pas confondre un clic et une rotation, ne pas
        > teinter les autres organes qui partagent un matériau.
    *   **Axe de vérification appliqué par l'étudiant :**
        - Sélection au clic et par id dans le navigateur avec le vrai `heart.glb`
        - Tests automatisés (`tests/render.test.mjs`) : sélection de groupe, restauration de la surbrillance, un seul clonage de matériau par maillage

*   **Composant ou Shader concerné :** réalité augmentée WebXR (`scripts/render/xr.mjs`, contournement dans `renderer.mjs`)
    *   **Prompt ou usage principal :**
        > Contexte : le cœur du projet est l'expérience AR (WebXR Device API), cible Chrome sur Android.
        > Tâche : ajoute une session `immersive-ar` avec détection de surface (hit test) et un réticule ;
        > un tap place une copie de l'organe ou du groupe sélectionné à une taille lisible, tournée vers
        > l'utilisateur ; sans surface détectée, la copie flotte devant le téléphone. À la sortie, restaure
        > la scène.
        > Contraintes : ne jamais modifier le modèle d'origine ; l'application doit démarrer même si le
        > navigateur ne répond pas sur le support de l'AR.
        > Puis : diagnostique pourquoi la session plante dans l'émulateur WebXR et corrige sans effet sur
        > les vrais téléphones.
    *   **Axe de vérification appliqué par l'étudiant :**
        - Tests automatisés contre une session WebXR simulée (placement, échange de sélection, restauration de la scène)
        - Essais dans l'émulateur WebXR `iwer` avec le vrai `heart.glb` (organe, groupe, détection de surface), captures d'écran
        - Lecture du code source de Three.js r187 pour confirmer la cause du plantage de l'émulateur

*   **Composant ou Shader concerné :** chargement selon le contrat de données (`scripts/render/loader.mjs`, `scripts/main.mjs`)
    *   **Prompt ou usage principal :**
        > Tâche : charge par défaut `heart.glb` et `organs.json` comme décrit dans `docs/DATA_CONTRACT.md`,
        > indexe `organs.json` par id et expose `viewer.organ(id)` pour le mode Learn.
        > Contraintes : si le modèle ou le fichier de données manque, l'application démarre quand même.
    *   **Axe de vérification appliqué par l'étudiant :**
        - Essai dans Chrome : 29 structures, 5 calques, fiches FR/EN affichées à la sélection
        - Tests automatisés : fichier manquant, invalide ou injoignable

*   **Composant ou Shader concerné :** coupe de l'organe (`scripts/render/slicing.mjs`)
    *   **Prompt ou usage principal :**
        > Tâche : ajoute un plan de coupe (avant-arrière, gauche-droite, haut-bas) avec une position
        > réglable, pour voir l'intérieur du cœur. La surface coupée doit paraître pleine, pas creuse.
        > Contraintes : traiter à part les maillages non fermés ; un clic doit traverser la partie
        > retirée ; pas de nouvelle dépendance.
    *   **Axe de vérification appliqué par l'étudiant :**
        - Captures d'écran des trois coupes sur le vrai `heart.glb`
        - Tests automatisés (`tests/slicing.test.mjs`), dont la liste des 4 structures non fermées du vrai modèle

*   **Composant ou Shader concerné :** tests automatisés et étape « Test » du pipeline (`tests/`, `package.json`, `.github/workflows/ci-cd.yml`)
    *   **Prompt ou usage principal :**
        > Tâche : écris des tests pour la sélection, le placement AR, le chargement de `organs.json` et la
        > coupe, avec le lanceur de tests intégré à Node, puis ajoute une étape « Test » au pipeline CI/CD.
        > Contraintes : aucune nouvelle dépendance ; ne pas renommer le job CI exigé par la protection de `main`.
    *   **Axe de vérification appliqué par l'étudiant :**
        - `npm test` : 25 tests réussis en local
        - Pull request #3 : étape « Test (npm test) » réussie dans le pipeline GitHub Actions avant la fusion

*   **Composant ou Shader concerné :** shaders GPU personnalisés en TSL : mode rayons X (effet fresnel) et surface de coupe hachurée (`scripts/render/shaders.mjs`, `scripts/render/xray.mjs`, intégration dans `picking.mjs`, `slicing.mjs`, `xr.mjs`, `index.mjs`), `docs/SHADERS.md`
    *   **Prompt ou usage principal :**
        > Contexte : le rendu est en WebGPU seul (Three.js r187) et l'application n'a encore aucun shader personnalisé.
        > Tâche : écris deux shaders en TSL (matériaux de nœuds) : un mode rayons X avec un effet fresnel (bords opaques et lumineux, centre transparent, teinte de chaque structure), exposé par `viewer.setXRay(enabled)` et `viewer.isXRay()` ; et un shader de surface de coupe hachurée qui remplace le remplissage uni de la coupe.
        > Contraintes : ne pas deviner l'API TSL, la vérifier dans `three@0.187.0` installé ; la sélection, la surbrillance, les calques et la coupe doivent continuer à marcher en mode rayons X ; la copie placée en AR garde ses matériaux normaux ; aucune fuite de matériaux en basculant ; logique hors GPU dans des fonctions testées ; aucune nouvelle dépendance.
        > Livrable : code commenté, tests, `docs/SHADERS.md`, `docs/RENDERING_API.md` à jour.
    *   **Axe de vérification appliqué par l'étudiant :**
        - Noms de l'API TSL vérifiés dans `three@0.187.0` installé (import de `three/tsl` et `three/webgpu`), et construction des deux graphes de nœuds dans Node sans erreur
        - 18 nouveaux tests automatisés (`tests/shaders.test.mjs`) : bascule des matériaux et restauration exacte, réutilisation (aucun nouveau matériau en basculant 20 fois), libération, surbrillance en mode rayons X sans teinter un matériau partagé, copie AR avec les matériaux normaux, coupe combinée aux rayons X ; 48 tests au total réussis
        - `npm run lint` et `npm run build` sans erreur
        - Rendu non encore vérifié à l'écran : dans Chrome sans interface avec WebGPU logiciel, le processus GPU s'arrête avant d'afficher le cœur (même sans les nouveaux shaders). Vérification à faire dans Chrome sur un vrai GPU (mode normal, rayons X, coupe sur les trois axes, sélection et coupe en mode rayons X).

*   **Vérifications d'ensemble :**
    - Relecture personnelle des fichiers de la Track A (`scripts/render/`, `scripts/dev/devPanel.mjs`) avant chaque commit : rôle de chaque fichier, fonctionnement du rendu, de la sélection, de la session AR et de la coupe, en vue de la présentation au superviseur (règle 8 de `CONTRIBUTING.md`)
    - Test de l'AR sur un vrai téléphone Android : pas encore réalisé, faute d'appareil compatible ARCore disponible dans l'équipe ; remplacé pour l'instant par les tests automatisés et l'émulateur WebXR. Prévu dès qu'un téléphone compatible est disponible.

### Track C (Mohamed Amine Msaddak)

Assistant : **Claude Opus 5.5 (Anthropic), via Claude Code dans VS Code.** Pour chaque pull request,
le prompt est un extrait recopié tel quel (en anglais) de la demande faite à l'assistant. Claude a écrit
le code, les tests et les textes ; l'étudiant a défini les tâches et doit relire chaque PR avant sa fusion
(règle 8 de `CONTRIBUTING.md`).

- [ ] *[À compléter — Track C]* : déclarer aussi le travail des semaines 1 et 2 fait avec le même assistant
  (déploiement et PWA, Learn mode, interface `src/ui/`, crédits), qui n'est pas encore décrit ici.

*   **Composant ou Shader concerné :** plan de test sur appareils réels (`docs/TEST_PLAN.md`)
    *   **Prompt ou usage principal :** (extrait recopié tel quel)

        > Create docs/TEST_PLAN.md: a short checklist that a team member can follow on real devices,
        > with a place to record results (device, browser, version, pass/fail, notes):
        > - laptop Chrome/Edge: confirm the WebGPU backend is active (?dev shows it), interaction is
        >   smooth, and there are no console errors
        > - Firefox or a browser with WebGPU off: confirm the WebGL 2 fallback looks identical
        > - mid-range Android phone: install the PWA, go offline, reopen, use Learn mode and slicing, AR
        > - iPhone Safari: install to home screen, offline
        > - an FPS measurement method for the "smooth on a mid-range phone" requirement
    *   **Axe de vérification appliqué :**
        - Libellés de l'interface et comportement vérifiés dans le code (`src/ui/toolbar.js`, `src/dev/devPanel.js`, rendu à la demande dans `src/render/index.js`)
        - Le seuil de fluidité (30 FPS sur téléphone, 55 sur ordinateur) est une proposition à valider par l'équipe : le cahier des charges ne donne pas de chiffre
        - `npm run lint`, `npm test`, `npm run validate`, `npm run build`
        - [ ] Exécution du plan sur de vrais appareils (aucun résultat n'est encore saisi)
*   **Composant ou Shader concerné :** mise à jour de `docs/STATUS.md` au 18 novembre, et auteur des icônes dans ce fichier (retrouvé dans l'historique Git)
    *   **Prompt ou usage principal :** (extrait recopié tel quel)

        > Update docs/STATUS.md to today's state: slicing is merged (toolbar controls), the README
        > feature table is out of date, the known issues are current, and the open decisions are
        > still listed. Fix the "[À compléter — Track C]" icon author in ATTRIBUTION.md only if the
        > answer is in the git history. Otherwise leave a clear TODO.
    *   **Axe de vérification appliqué :**
        - Chaque affirmation vérifiée dans `main` : historique Git, fichiers, `tests/slicing.test.mjs` (liste des 4 maillages non fermés), `.github/workflows/ci-cd.yml`
        - Auteur des icônes : commit `08250a5` (Mohamed Amine Msaddak, co-écrit avec Claude)
        - `npm run lint`, `npm test`, `npm run validate`, `npm run build`
*   **Composant ou Shader concerné :** passage du rendu en WebGPU seul, sans repli WebGL 2 (`src/render/renderer.js`, `src/render/xr.js`, `src/main.js`, nouveau `src/ui/unsupported.js`), et mise à jour de la documentation (`README.md`, `docs/RENDERING_API.md`, `docs/SETUP.md`, `docs/TEST_PLAN.md`)
    *   **Prompt ou usage principal :** (extrait recopié tel quel)

        > remove the webgl fallback, i want it all on webgpu
    *   **Axe de vérification appliqué :**
        - Code de Three.js r187 lu : `WebGPURenderer` installe toujours un repli WebGL 2 (`getFallback`), retiré ici ; la RA passe par `XRGPUBinding` et exige la fonctionnalité de session `webgpu`
        - Edge sans tête, vrai GPU avec WebGPU : `Renderer: WebGPU`, 111 505 triangles, 29 appels de dessin, sélection d'une structure, aucune erreur
        - Edge sans tête, WebGPU désactivé : message « WebGPU is required » affiché, pas de canevas, seule erreur `WebGPUUnavailableError`
        - `npm run lint`, `npm test`, `npm run validate`, `npm run build`
        - [ ] Non testé : vrais téléphones, Firefox, Safari ; la RA en WebGPU (aucun appareil disponible avec `XRGPUBinding`)
*   **Composant ou Shader concerné :** nettoyage du dépôt : suppression des `.gitkeep` devenus inutiles et de `scripts/setup-github.sh` (jamais exécuté, obsolète), mise à jour de `docs/STATUS.md`, `docs/SETUP.md` et de la description de `package.json` pour le rendu WebGPU seul ; suppression des branches fusionnées
    *   **Prompt ou usage principal :** (extrait recopié tel quel)

        > now can you clean the repo ? and remove all the unecessary ?
    *   **Axe de vérification appliqué :**
        - Chaque fichier supprimé vérifié : aucune référence dans le dépôt ; `setup-github.sh` jamais exécuté (0 issue, aucune de ses étiquettes sur GitHub)
        - Données brutes (`data/raw/hra/`) et pipeline non touchés : décision d'équipe en attente
        - `npm run lint`, `npm test`, `npm run validate`, `npm run build`
*   **Composant ou Shader concerné :** restructuration du dépôt : `src/` → `scripts/` (avec `index.html` et `scripts/public/` : service worker, manifeste, icônes, modèle et données), `scripts/data-pipeline/` → `data_pipeline/`, tous les fichiers JavaScript renommés en `.mjs` ; configuration Vite (`root: 'scripts'`) et ESLint, imports, chemins Python et documentation mis à jour
    *   **Prompt ou usage principal :** (extrait recopié tel quel)

        > i want to fix overall structure of the repo, first of all, src to script and put all the necessary files in it, sw.js, index.html etc..., then change the scripts name, instead name it data_pipeline, also turn everything into mjs instead
    *   **Axe de vérification appliqué :**
        - Fichiers déplacés avec `git mv` (historique conservé) ; `heart.glb` et les données déplacés sans modification
        - Les scripts Python restent en `.py` (le pipeline est en Python) ; seuls leurs chemins changent (`parents[1]`)
        - Le service worker devient `sw.mjs`, toujours enregistré comme worker classique ; `CACHE_VERSION` passé à `v3`
        - Edge sans tête, build de production : WebGPU, 111 505 triangles, sélection, `sw.mjs` servi en `text/javascript` et contrôlant la page, aucune erreur ; serveur de développement : `main.mjs`, modules, GLB et `sw.mjs` servis
        - `npm run lint`, `npm test` (30), `npm run validate`, `npm run build`
        - [ ] Non vérifié : `build.py` et `check_glb.py` (dépendances Python du pipeline non installées ici)
        - Ensuite, à la demande (« make sw and manifest in pwa/ ») : `sw.mjs` et `manifest.webmanifest` déplacés dans `scripts/pwa/` ; un petit plugin dans `vite.config.mjs` les publie à la racine du site (le service worker doit y être pour contrôler toute l'application ; sinon Vite renommerait le manifeste dans `assets/`)
        - Puis, à la demande (« move it to root ») : `scripts/public/` ramené à la racine (`public/` : icônes, modèle, données ; `publicDir: '../public'` dans `vite.config.mjs`), pour que `scripts/` ne contienne que du code

---

## Mentions à afficher dans les crédits de l'application

- « BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International »
- « 3D Reference Organ for Heart, Male v1.3 », Kristen Browne and Heidi Schlehlein, HuBMAP Human Reference Atlas, CC BY 4.0. Browne et al., « HuBMAP CCF 3D Reference Object Library », https://humanatlas.io/3d-reference-library
