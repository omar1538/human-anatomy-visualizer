# Setup

Everyone must use the same Node version and the same dependency versions.

1. Install **Node 22** (`.nvmrc` says which; with nvm: `nvm use`). Node 20 or newer also works.
2. Install dependencies from the lockfile: `npm ci` (not `npm install`, so versions never drift).
3. Start the dev server: `npm run dev`, then open the printed address.
4. Before opening a pull request: `npm run lint` and `npm run build` must pass.
5. Format with `npm run format` (Prettier).

Dependencies are pinned to exact versions in `package.json`. Add or upgrade one only in a
dedicated pull request that all three review, because `package.json` and `package-lock.json`
are shared files.

## Testing WebGPU vs the WebGL 2 fallback

- WebGPU: recent Chrome or Edge. The panel shows `Renderer: WebGPU`.
- Fallback: open the app in a browser without WebGPU (or one where it is disabled). The panel shows `Renderer: WebGL 2`. Everything must still work.

## Deployment (GitHub Pages)

Every push to `main` runs `.github/workflows/deploy.yml`: `npm ci`, `npm run lint`, `npm run build`
(Node version from `.nvmrc`), then publishes `dist/` to GitHub Pages. A failing lint or build
means nothing is deployed.

One-time setup (repository admin): **Settings > Pages > Build and deployment > Source: "GitHub Actions"**.
The site URL appears in the run summary and under Settings > Pages. A run can also be started by
hand from the Actions tab ("Run workflow").

## Testing the PWA locally

The service worker is only registered in production builds (never in `npm run dev`, where it would
serve stale files). To test it:

```sh
npm run build && npm run preview
```

Open the printed address (`localhost` counts as a secure context, so the service worker works without HTTPS).
In Chrome DevTools > **Application**: check _Manifest_ (name, icons, no installability warning) and
_Service workers_ (status "activated"). The install icon appears at the right of the address bar.

Offline test: after the page has loaded once, stop `npm run preview` (Ctrl+C) and reload. The app
must still open with the real heart (five layers in the panel, not the placeholder body), and
selecting a structure must still show its details in Learn mode.

What the service worker caches (`public/sw.js`):

| Files                                                    | Strategy                          | Why                                                                                            |
| -------------------------------------------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------- |
| Pages (`index.html`)                                     | Network first, cache when offline | Always the latest version when online                                                          |
| Vite build files (`assets/*-<hash>.js`, `.css`)          | Cache first                       | A new version gets a new name, so a cached copy is never stale                                 |
| `heart.glb`, `organs.json`, `quiz.json`, icons, manifest | Stale-while-revalidate            | Instant from the cache, refreshed in the background, so content fixes arrive on the next visit |

The shell, the default model and its content are cached at install, so the whole app works offline
right after the first visit.

After changing `public/sw.js`, bump `CACHE_VERSION` in it so old caches are deleted. If the browser
keeps an old version, use _Unregister_ in DevTools > Application > Service workers, or _Clear site data_.
