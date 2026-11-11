// Track C: registers the service worker (public/sw.js).
// Production only: in `npm run dev` a service worker would serve stale files and fight Vite's hot reload.

export function registerServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;

  // Relative URL: resolves next to index.html, so it works under any base path (vite base './').
  // Its scope is that same folder.
  const register = () =>
    navigator.serviceWorker.register('./sw.js').catch((err) => {
      console.warn('Service worker registration failed:', err);
    });

  // Wait for load so registration does not compete with the first render.
  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register, { once: true });
}
