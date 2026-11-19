// Track C: main interface. Layers (show, hide, select a group), slicing, reset view, AR, language,
// About. (Slicing controls added by Track A; they call viewer.setSlice / clearSlice.)
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
    slice: 'Slice',
    sliceTitle: 'Cut the heart to see inside',
    sliceAxes: { '': 'Off', z: 'Front-back', x: 'Left-right', y: 'Top-bottom' },
    slicePosition: 'Cut position',
    sliceFlip: 'Keep the other half',
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
    slice: 'Coupe',
    sliceTitle: "Couper le cœur pour voir l'intérieur",
    sliceAxes: { '': 'Aucune', z: 'Avant-arrière', x: 'Gauche-droite', y: 'Haut-bas' },
    slicePosition: 'Position de la coupe',
    sliceFlip: "Garder l'autre moitié",
  },
};

const SLICE_AXES = ['', 'z', 'x', 'y']; // '' = no cut

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
  const sliceToggle = button('ui-btn', '');
  sliceToggle.id = 'slice-toggle';
  sliceToggle.setAttribute('aria-controls', 'slice-panel');
  bar.append(layersToggle, sliceToggle, reset, info, langGroup);

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

  // ---- Slicing (Track A API: viewer.setSlice / clearSlice / getSlice) ----
  const slicePanel = el('div', 'ui-slice');
  slicePanel.id = 'slice-panel';
  let sliceOpen = false;
  sliceToggle.addEventListener('click', () => {
    sliceOpen = !sliceOpen;
    render();
  });
  const axisGroup = el('div', 'ui-slice-axes');
  axisGroup.setAttribute('role', 'group');
  const axisButtons = SLICE_AXES.map((axis) => {
    const b = button('ui-btn ui-slice-axis', '');
    b.dataset.sliceAxis = axis;
    b.addEventListener('click', () => {
      sliceAxis = axis;
      applySlice();
    });
    return b;
  });
  axisGroup.append(...axisButtons);
  const positionLabel = el('label', 'ui-slice-row');
  const positionText = el('span');
  const position = el('input');
  position.type = 'range';
  position.id = 'slice-position-ui';
  position.min = '0';
  position.max = '100';
  position.value = '50';
  position.addEventListener('input', applySlice);
  positionLabel.append(positionText, position);
  const flipLabel = el('label', 'ui-slice-row ui-slice-flip');
  const flip = el('input');
  flip.type = 'checkbox';
  flip.id = 'slice-flip-ui';
  flip.addEventListener('change', applySlice);
  const flipText = el('span');
  flipLabel.append(flip, flipText);
  slicePanel.append(axisGroup, positionLabel, flipLabel);
  let sliceAxis = '';

  function applySlice() {
    if (sliceAxis) {
      viewer.setSlice({
        axis: sliceAxis,
        position: Number(position.value) / 100,
        flip: flip.checked,
      });
    } else {
      viewer.clearSlice();
    }
    syncSlice();
  }

  // Reflects the viewer's current cut, which the ?dev panel can also change.
  function syncSlice() {
    const current = viewer.getSlice();
    sliceAxis = current ? current.axis : '';
    if (current) {
      position.value = String(Math.round(current.position * 100));
      flip.checked = current.flip;
    }
    axisButtons.forEach((b) =>
      b.setAttribute('aria-pressed', String(b.dataset.sliceAxis === sliceAxis)),
    );
    position.disabled = !sliceAxis;
    flip.disabled = !sliceAxis;
  }

  root.append(bar, layers, slicePanel);

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
    sliceToggle.textContent = `${sliceOpen ? '▾' : '▸'} ${t.slice}`;
    sliceToggle.title = t.sliceTitle;
    sliceToggle.setAttribute('aria-expanded', String(sliceOpen));
    slicePanel.hidden = !sliceOpen;
    axisGroup.setAttribute('aria-label', t.slice);
    axisButtons.forEach((b) => (b.textContent = t.sliceAxes[b.dataset.sliceAxis]));
    positionText.textContent = t.slicePosition;
    flipText.textContent = t.sliceFlip;
    syncSlice();
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
  root.addEventListener('pointerenter', syncSlice);
  root.addEventListener('focusin', syncSlice);

  onLanguageChange(render);
  render();
}
