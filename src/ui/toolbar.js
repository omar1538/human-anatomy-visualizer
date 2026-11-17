// Track C: main interface. Layers (show, hide, select a group), reset view, AR, language, About.
// Replaces the temporary dev panel (still available with ?dev in the URL).
import './ui.css';
import {
  LANGUAGES,
  getLanguage,
  setLanguage,
  onLanguageChange,
  localized,
} from '../learn/language.js';
import { createAboutDialog } from './about.js';

const TEXT = {
  en: {
    toolbar: 'Controls',
    layers: 'Layers',
    showHide: (name) => `Show or hide: ${name}`,
    select: (name) => `Select ${name} and read about it`,
    reset: 'Reset view',
    about: 'About and credits',
    language: 'Language',
    ar: 'View in AR',
    arHint: 'Point at a surface and tap to place. Tap again to move.',
    arExit: 'Exit AR',
    arFailed: 'AR could not start:',
    notice: 'Educational use only, not a medical tool.',
  },
  fr: {
    toolbar: 'Commandes',
    layers: 'Calques',
    showHide: (name) => `Afficher ou masquer : ${name}`,
    select: (name) => `Sélectionner ${name} et lire sa fiche`,
    reset: 'Réinitialiser la vue',
    about: 'À propos et crédits',
    language: 'Langue',
    ar: 'Voir en RA',
    arHint: 'Visez une surface et touchez pour placer. Touchez encore pour déplacer.',
    arExit: 'Quitter la RA',
    arFailed: "La RA n'a pas pu démarrer :",
    notice: 'Usage pédagogique uniquement, pas un outil médical.',
  },
};

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
};

const button = (className, text) => {
  const b = el('button', className, text);
  b.type = 'button';
  return b;
};

// Phones start with the layers list closed, so the model gets the screen.
const isNarrow = () => window.matchMedia('(max-width: 640px)').matches;

/**
 * @param {Awaited<ReturnType<typeof import('../render/index.js').createViewer>>} viewer
 * @param {Record<string, object>} meta organs.json indexed by id
 */
export function mountUI(viewer, meta = {}) {
  const about = createAboutDialog();
  const root = el('div', 'ui-root');
  root.id = 'ui';

  // ---- Top bar ----
  const bar = el('div', 'ui-bar');
  bar.setAttribute('role', 'toolbar');
  const layersToggle = button('ui-btn', '');
  layersToggle.id = 'layers-toggle';
  layersToggle.setAttribute('aria-controls', 'layers');
  const reset = button('ui-btn ui-icon', '⟲');
  reset.id = 'reset-view';
  reset.addEventListener('click', () => viewer.resetView());
  const info = button('ui-btn ui-icon', 'i');
  info.id = 'about-open';
  info.addEventListener('click', () => about.open());
  const langGroup = el('div', 'ui-lang');
  langGroup.setAttribute('role', 'group');
  const langButtons = LANGUAGES.map((code) => {
    const b = button('ui-btn ui-lang-btn', code.toUpperCase());
    b.dataset.lang = code;
    b.addEventListener('click', () => setLanguage(code));
    return b;
  });
  langGroup.append(...langButtons);
  bar.append(layersToggle, reset, info, langGroup);

  // ---- Layers list ----
  const layers = el('div', 'ui-layers');
  layers.id = 'layers';
  let layersOpen = !isNarrow();
  layersToggle.addEventListener('click', () => {
    layersOpen = !layersOpen;
    render();
  });
  const rows = viewer.systems().map((system) => {
    const row = el('div', 'ui-layer');
    const box = el('input');
    box.type = 'checkbox';
    box.id = `layer-${system}`;
    box.dataset.system = system;
    box.checked = viewer.isSystemVisible(system);
    box.addEventListener('change', () => viewer.setSystemVisible(system, box.checked));
    const name = button('ui-layer-name', '');
    name.dataset.selectGroup = system;
    name.addEventListener('click', () => {
      // Selecting a hidden layer would highlight nothing: show it first.
      if (!viewer.isSystemVisible(system)) {
        viewer.setSystemVisible(system, true);
        box.checked = true;
      }
      viewer.select(system);
    });
    row.append(box, name);
    return { system, box, name, row };
  });
  layers.append(...rows.map((r) => r.row));
  const notice = el('p', 'ui-notice-line');
  layers.append(notice);

  root.append(bar, layers);

  // ---- AR (only where the device supports it) ----
  let arButton = null;
  let arStatus = null;
  let arHint = null;
  let arExit = null;
  if (viewer.arSupported) {
    arButton = button('ui-btn ui-ar', '');
    arButton.id = 'enter-ar';
    arStatus = el('p', 'ui-ar-status');
    arStatus.setAttribute('role', 'status');
    // Stays visible over the camera image during the session.
    const overlay = el('div', 'ui-ar-overlay');
    overlay.id = 'ar-overlay';
    arHint = el('p');
    arExit = button('ui-btn', '');
    // Without this, tapping the button would also place the organ.
    arExit.addEventListener('beforexrselect', (e) => e.preventDefault());
    arExit.addEventListener('click', () => viewer.exitAR());
    overlay.append(arHint, arExit);
    document.body.append(overlay);
    arButton.addEventListener('click', () => {
      arStatus.textContent = '';
      viewer.enterAR({ overlay }).catch((error) => {
        arStatus.textContent = `${TEXT[getLanguage()].arFailed} ${error.message}`;
      });
    });
    viewer.onARChange((active) => overlay.classList.toggle('is-active', active));
    root.append(arButton, arStatus);
  }

  document.body.append(root);
  viewer.onARChange((active) => (root.hidden = active));

  // Keep the checkboxes right if visibility changes elsewhere (for example the ?dev panel).
  const syncBoxes = () => rows.forEach((r) => (r.box.checked = viewer.isSystemVisible(r.system)));

  function render() {
    const lang = getLanguage();
    const t = TEXT[lang];
    bar.setAttribute('aria-label', t.toolbar);
    layersToggle.textContent = `${layersOpen ? '▾' : '▸'} ${t.layers}`;
    layersToggle.setAttribute('aria-expanded', String(layersOpen));
    layers.hidden = !layersOpen;
    reset.title = t.reset;
    reset.setAttribute('aria-label', t.reset);
    info.title = t.about;
    info.setAttribute('aria-label', t.about);
    langGroup.setAttribute('aria-label', t.language);
    langButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
    for (const r of rows) {
      const label = localized(meta[r.system]?.name, lang) || r.system;
      r.name.textContent = label;
      r.name.title = t.select(label);
      r.box.setAttribute('aria-label', t.showHide(label));
    }
    notice.textContent = t.notice;
    if (arButton) {
      arButton.textContent = t.ar;
      arHint.textContent = t.arHint;
      arExit.textContent = t.arExit;
    }
    syncBoxes();
  }

  // The viewer has no "visibility changed" event, so refresh the boxes whenever the user comes
  // back to the interface (pointer or keyboard).
  root.addEventListener('pointerenter', syncBoxes);
  root.addEventListener('focusin', syncBoxes);

  onLanguageChange(render);
  render();
}
