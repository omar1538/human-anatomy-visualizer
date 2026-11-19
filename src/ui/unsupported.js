// Track C: message shown instead of the viewer when the browser cannot run WebGPU.
// The app is WebGPU only (no WebGL 2 fallback), so this is the only thing such a browser shows.
import { getLanguage } from '../learn/language.js';

const TEXT = {
  en: {
    title: 'WebGPU is required',
    body: 'This 3D anatomy viewer runs on WebGPU, which this browser or device does not provide.',
    try: 'Try a recent Chrome or Edge on a computer or on Android, or Safari 26 on iPhone or Mac.',
    detail: 'Details:',
  },
  fr: {
    title: 'WebGPU est nécessaire',
    body: 'Ce visualiseur d’anatomie 3D utilise WebGPU, que ce navigateur ou cet appareil ne fournit pas.',
    try: 'Essayez un Chrome ou un Edge récent sur ordinateur ou sur Android, ou Safari 26 sur iPhone ou Mac.',
    detail: 'Détails :',
  },
};

/**
 * @param {HTMLElement} container
 * @param {Error} error
 */
export function showWebGPUUnavailable(container, error) {
  const t = TEXT[getLanguage()] ?? TEXT.en;
  const box = document.createElement('div');
  box.setAttribute('role', 'alert');
  box.style.cssText =
    'max-width:28rem;margin:20vh auto 0;padding:0 16px;line-height:1.5;text-align:center;';
  const title = document.createElement('h1');
  title.style.fontSize = '1.4rem';
  title.textContent = t.title;
  const body = document.createElement('p');
  body.textContent = t.body;
  const tip = document.createElement('p');
  tip.textContent = t.try;
  const detail = document.createElement('p');
  detail.style.cssText = 'color:#9aa8bd;font-size:0.85rem;';
  detail.textContent = `${t.detail} ${error.message}`;
  box.append(title, body, tip, detail);
  container.replaceChildren(box);
}
