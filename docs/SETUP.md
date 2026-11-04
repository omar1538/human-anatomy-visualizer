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
