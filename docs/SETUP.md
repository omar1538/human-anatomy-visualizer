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
In Chrome DevTools > **Application**: check _Manifest_ (name, icons, installability) and
_Service workers_ (status "activated"). Reload once, then tick **Offline** in the Network tab and
reload again: the app should still open.

After changing `public/sw.js`, bump `CACHE_VERSION` in it so old caches are deleted. If the browser
keeps an old version, use _Unregister_ in DevTools > Application > Service workers, or _Clear site data_.
