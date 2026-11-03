# Contributing

We are three people, each owning a track (see README). Rules:

1. **Never push to `main`.** Work on a branch named `track-x/short-description`
   (e.g. `track-a/clipping-slicer`) and open a pull request.
2. **Every PR is reviewed by a teammate** before merging. Reviewing is part of the work.
3. **Small, frequent commits** with clear messages (`feat:`, `fix:`, `data:`, `docs:`, `test:`).
4. **Link PRs to issues** (`Closes #12`). Each issue belongs to a track label and a weekly milestone.
5. **`main` must always build and run.**
6. **No raw datasets in Git.** Put them in `data/raw/` (ignored). Commit only the scripts that
   produce the final assets, and the final optimised assets in `public/assets/`.
7. **Every new asset gets a line in `ATTRIBUTION.md`** in the same PR.
8. **You must be able to explain every line you merge.**
