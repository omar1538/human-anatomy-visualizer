# Fichier d'Attribution et d'Origine des Ressources (ATTRIBUTION.md)

**Projet :** Human Anatomy Visualizer, application d'anatomie en réalité augmentée (WebXR)
**Équipe :** Omar Bajar (Track A : WebXR et rendu), Adam Derbel (Track B : données et contenu),
Mohamed Amine Msaddak (Track C : plateforme et interface)
**Version :** 1.0 (Évaluation SUP'COM 2026/2027)

Tout asset, bibliothèque, extrait de code ou usage d'IA doit figurer dans ce fichier, dans la même
pull request que la modification concernée. Un modèle absent de ce fichier ne doit pas être fusionné.

---

## 1. Modèles 3D, Textures et Assets Graphiques

**Asset :** `public/assets/models/heart.glb`, cavités, septum, muscles papillaires et valves
(groupes `chambers`, `valves`)
**Source originale :** HuBMAP Human Reference Atlas, 3D Reference Object Library,
https://lod.humanatlas.io/ref-organ/heart-male/v1.3/ (fichier `3d-vh-m-heart.glb`).
DOI officiel indiqué sur cette page : 10.48539/HBM564.WKNG.249 (le lien doi.org ne fonctionne pas
au 11/11/2026)
**Auteur / Créateur :** Kristen Browne, Heidi Schlehlein (2024), « 3D Reference Organ for Heart, Male v1.3 »
**Licence :** CC BY 4.0
**Modifications apportées par l'équipe :** recalage (rotation, échelle uniforme, translation par ICP)
sur le cœur BodyParts3D, nettoyage, décimation, fusion des cinq muscles papillaires en un seul
maillage, renommage des nœuds selon `docs/DATA_CONTRACT.md`, export GLB
(`scripts/data-pipeline/config/heart.json`).

---

**Asset :** `public/assets/models/heart.glb`, artères coronaires, veines cardiaques et gros vaisseaux
(groupes `coronary_arteries`, `cardiac_veins`, `great_vessels`)
**Source originale :** BodyParts3D 4.0, https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html
**Auteur / Créateur :** © The Database Center for Life Science (DBCLS)
**Licence :** CC BY 4.0 (depuis le 25/02/2025)
**Modifications apportées par l'équipe :** fusion des maillages élémentaires par structure
(identifiants FMA dans `scripts/data-pipeline/config/heart.json`), conversion mm → m et Z-up → Y-up,
centrage sur le cœur, aorte descendante et veine cave inférieure coupées sous le cœur et refermées,
nettoyage, décimation, renommage, export GLB.

---

**Asset :** `data/raw/hra/3d-vh-m-heart.glb` et `data/raw/hra/3d-vh-f-heart.glb` (données brutes)
**Source originale :** https://cdn.humanatlas.io/digital-objects/ref-organ/heart-male/latest/assets/3d-vh-m-heart.glb
et https://cdn.humanatlas.io/digital-objects/ref-organ/heart-female/latest/assets/3d-vh-f-heart.glb
**Auteur / Créateur :** HuBMAP Human Reference Atlas
**Licence :** CC BY 4.0
**Modifications apportées par l'équipe :** aucune (fichiers sources, sommes SHA-256 dans
`docs/DATA_SOURCES.md`). Le cœur féminin n'est pas utilisé par le pipeline.

---

**Asset :** icônes de l'application (`public/icons/icon-192.png`, `public/icons/icon-512.png`)
**Source originale :** créées par l'équipe (provisoires)
**Auteur / Créateur :** équipe du projet
**Licence :** celle du dépôt
**Modifications apportées par l'équipe :** aucune. À remplacer par les icônes définitives.

---

**Asset :** corps provisoire (`src/render/placeholder.js`)
**Source originale :** formes géométriques générées par le code (sphères, cylindres de Three.js)
**Auteur / Créateur :** équipe du projet
**Licence :** celle du dépôt
**Modifications apportées par l'équipe :** sans objet. Utilisé seulement avec `?model=placeholder`.

**Mentions à afficher dans les crédits de l'application :**

- « BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International »
- « 3D Reference Organ for Heart, Male v1.3 », Kristen Browne and Heidi Schlehlein, HuBMAP Human
  Reference Atlas, CC BY 4.0. Browne et al., « HuBMAP CCF 3D Reference Object Library »,
  https://humanatlas.io/3d-reference-library

---

## 2. Bibliothèques tierces et Modules externes (Pinnés)

Aucun CDN n'est utilisé : toutes les bibliothèques JavaScript sont installées par npm avec une
version exacte dans `package.json` et figées dans `package-lock.json` (`npm ci`), puis intégrées
au build par Vite. Les liens CDN ci-dessous servent uniquement de référence de version.

**Bibliothèque :** Three.js (module `three`, y compris `GLTFLoader`, `OrbitControls` et
`MeshoptDecoder` fournis dans le même paquet)
**Version fixée :** 0.187.0 (r187)
**Lien CDN de référence :** https://cdn.jsdelivr.net/npm/three@0.187.0/
**Rôle dans le projet :** moteur de rendu (`WebGPURenderer` avec repli WebGL 2), gestion de la
session WebXR, chargement des modèles GLB, contrôles de caméra.

---

**Bibliothèque :** Vite
**Version fixée :** 8.3.5
**Lien CDN de référence :** https://cdn.jsdelivr.net/npm/vite@8.3.5/
**Rôle dans le projet :** serveur de développement et build de production (outil de développement,
non livré dans l'application).

---

**Bibliothèque :** ESLint, @eslint/js, globals
**Version fixée :** 10.14.0, 10.0.1, 17.14.0
**Lien CDN de référence :** https://cdn.jsdelivr.net/npm/eslint@10.14.0/,
https://cdn.jsdelivr.net/npm/@eslint/js@10.0.1/, https://cdn.jsdelivr.net/npm/globals@17.14.0/
**Rôle dans le projet :** vérification du code (outils de développement, non livrés).

---

**Bibliothèque :** Prettier
**Version fixée :** 3.9.10
**Lien CDN de référence :** https://cdn.jsdelivr.net/npm/prettier@3.9.10/
**Rôle dans le projet :** formatage du code (outil de développement, non livré).

---

**Bibliothèque :** pipeline de données Python (`scripts/data-pipeline/requirements.txt`) :
trimesh, fast-simplification, numpy, scipy, networkx, shapely, mapbox-earcut
**Version fixée :** trimesh 5.2.0 et fast-simplification 0.2.0 sont fixées. **Les cinq autres ne
le sont pas encore** (versions minimales seulement : numpy ≥ 2.0, scipy ≥ 1.11, networkx ≥ 3.0,
shapely ≥ 2.0, mapbox-earcut ≥ 1.0). À compléter par la Track B : fixer chaque version avec `==`.
**Lien CDN de référence :** sans objet (paquets PyPI, par exemple https://pypi.org/project/trimesh/5.2.0/)
**Rôle dans le projet :** conversion des données brutes en `heart.glb` (non livré dans l'application).

---

**Bibliothèque :** GitHub Actions : actions/checkout, actions/setup-node, actions/configure-pages,
actions/upload-pages-artifact, actions/deploy-pages
**Version fixée :** v7, v7, v6, v5, v5 (versions majeures, `.github/workflows/deploy.yml`)
**Lien CDN de référence :** sans objet (https://github.com/actions)
**Rôle dans le projet :** build et déploiement automatiques sur GitHub Pages.

---

**Outil de test (non intégré au dépôt) :** Immersive Web Emulator de Meta (extension de navigateur)
et sa bibliothèque `iwer` 2.8.0, https://github.com/meta-quest/immersive-web-emulator/
**Rôle :** émuler un appareil WebXR sur ordinateur pour tester la session AR sans téléphone.

---

## 3. Extraits de code copiés ou adaptés (StackOverflow, Tutoriels, Dépôts tiers)

**Fonction / Fichier :** `src/render/xr.js` (fonctions `createReticle`, `place` et `update`, et
la demande de session `immersive-ar` dans `enter`)
**Source du code original :** schéma de l'exemple officiel Three.js « webxr_ar_hittest »
(https://github.com/mrdoob/three.js/blob/r187/examples/webxr_ar_hittest.html, licence MIT) et
spécification W3C WebXR Hit Test Module (https://www.w3.org/TR/webxr-hit-test-1/)
**Auteur :** auteurs de Three.js ; W3C Immersive Web Working Group
**Adaptation effectuée :** reprise du principe (source de hit test dans l'espace `viewer`, réticule
placé à partir de la pose, placement au signal `select`). Réécrit pour le projet : copie de la
sélection (organe ou groupe) sans modifier l'original, mise à l'échelle, orientation vers
l'utilisateur, placement flottant quand aucune surface n'est détectée, restauration de la scène à
la fin de la session.

---

**Fonction / Fichier :** `src/render/renderer.js` (contournement du framebuffer XR `null`)
**Source du code original :** aucune ; écrit après lecture du code source de Three.js r187
(`WebGLState.drawBuffers` et `WebGLBackend._setFramebuffer`)
**Auteur :** équipe du projet (Track A)
**Adaptation effectuée :** sans objet.

---

**Fonction / Fichier :** À compléter par la Track B (`scripts/data-pipeline/`, notamment le recalage
ICP et la décimation) et par la Track C (`public/sw.js`, `src/pwa/register.js`,
`.github/workflows/deploy.yml`) pour tout code repris d'un tutoriel, d'une documentation ou d'un
dépôt tiers.

---

## 4. Déclaration de l'usage des Assistants IA (Copilot, ChatGPT, Claude)

**Composant ou Shader concerné :** Track A : `src/render/` (`renderer.js`, `scene.js`, `controls.js`,
`layers.js`, `picking.js`, `loader.js`, `xr.js`, `index.js`), `src/dev/devPanel.js`, `src/main.js`,
et la documentation `docs/RENDERING_API.md`, `docs/ROADMAP.md`, `README.md`
**Prompt ou usage principal :** Claude (Claude Code, Anthropic) utilisé pour générer et corriger le
code de rendu et de la session WebXR AR, diagnostiquer des erreurs (blocage de la détection du
support WebXR, framebuffer `null` des émulateurs), écrire les tests de vérification et rédiger la
documentation.
**Axe de vérification appliqué par l'étudiant :** `npm run lint` et `npm run build` à chaque
changement ; tests automatisés de la logique AR contre une session WebXR simulée (sélection d'organes
et de groupes, placement, restauration de la scène, chargement de `organs.json`) ; essais dans Chrome
sur le chemin WebGL 2 et dans l'émulateur WebXR `iwer` avec le vrai `heart.glb` et des captures
d'écran ; lecture du code source de Three.js r187 pour confirmer la cause des erreurs.
À compléter par Omar : relecture personnelle ligne par ligne (règle 8 de `CONTRIBUTING.md`) et, dès
que possible, test sur un vrai téléphone Android.

---

**Composant ou Shader concerné :** Track C : `.github/workflows/deploy.yml`, `public/manifest.webmanifest`,
`public/sw.js`, `src/pwa/register.js`, `docs/SETUP.md`, `docs/STATUS.md` (commits co-signés par Claude
dans l'historique Git)
**Prompt ou usage principal :** À compléter par Mohamed Amine Msaddak.
**Axe de vérification appliqué par l'étudiant :** À compléter par Mohamed Amine Msaddak.

---

**Composant ou Shader concerné :** Track B : `scripts/data-pipeline/`, `docs/DATA_CONTRACT.md`,
`docs/DATA_SOURCES.md`
**Prompt ou usage principal :** À compléter par Adam Derbel (indiquer « aucun usage » le cas échéant).
**Axe de vérification appliqué par l'étudiant :** À compléter par Adam Derbel.
