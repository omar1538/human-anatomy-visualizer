# Data contract (Track B -> Tracks A and C)

Defined in Week 1, changed only through a PR reviewed by all three.

## Mesh naming (GLB)
- One GLB per **system** (e.g. `circulatory.glb`, `digestive.glb`) plus a light core pack.
- Every selectable structure is a named node whose name equals the `id` in `organs.json`.
- Units: metres, Y up, body centred at origin.

## `public/assets/data/organs.json`
Array of records. Required fields:

- `id`: unique string, equals the GLB node name
- `name`: `{ "en": "...", "fr": "..." }`
- `system`: one of the agreed system ids
- `function`: `{ "en": "...", "fr": "..." }` short explanation written by the team
- `location`: short text
- `facts`: array of short strings
- `source`, `licence`: where the mesh comes from and under which licence

## `public/assets/data/quiz.json`
Array of questions: `id`, `type` (`name-it` | `find-it`), `organId`, `prompt`, `choices`, `answer`, `explanation`.
