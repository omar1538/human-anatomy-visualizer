// Track C: Learn mode. Selecting a structure in 3D shows its organs.json record
// (name, function, location, key facts) in English or French.
import './learnMode.css';
import { LANGUAGES, getLanguage, setLanguage, onLanguageChange, localized } from './language.js';

const TEXT = {
  en: {
    region: 'Structure details',
    hint: 'Tap or click a structure to learn about it.',
    close: 'Close',
    function: 'Function',
    location: 'Location',
    facts: 'Key facts',
    partOf: 'Part of',
    contains: 'Structures in this group',
    draft: 'Draft content, not yet reviewed by a medical reader.',
    missing: 'No details for this structure yet.',
    language: 'Language',
  },
  fr: {
    region: 'Détails de la structure',
    hint: 'Touchez ou cliquez sur une structure pour en savoir plus.',
    close: 'Fermer',
    function: 'Fonction',
    location: 'Localisation',
    facts: 'À retenir',
    partOf: 'Fait partie de',
    contains: 'Structures de ce groupe',
    draft: 'Contenu provisoire, pas encore relu par un spécialiste.',
    missing: 'Pas encore de fiche pour cette structure.',
    language: 'Langue',
  },
};

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
};

/**
 * @param {Awaited<ReturnType<typeof import('../render/index.js').createViewer>>} viewer
 * @param {Record<string, object>} meta organs.json indexed by id (from loadOrganIndex)
 */
export function mountLearnMode(viewer, meta = {}) {
  let currentId = null;

  // Structures of each group, in organs.json order, for the "Structures in this group" list.
  const membersOf = new Map();
  for (const record of Object.values(meta)) {
    if (!record.system || record.system === record.id) continue;
    if (!membersOf.has(record.system)) membersOf.set(record.system, []);
    membersOf.get(record.system).push(record.id);
  }

  const panel = el('aside', 'learn-panel');
  panel.id = 'learn-panel';
  const header = el('div', 'learn-header');
  const switcher = el('div', 'learn-lang');
  switcher.setAttribute('role', 'group');
  const langButtons = LANGUAGES.map((code) => {
    const button = el('button', 'learn-lang-btn', code.toUpperCase());
    button.type = 'button';
    button.dataset.lang = code;
    button.addEventListener('click', () => setLanguage(code));
    return button;
  });
  switcher.append(...langButtons);
  const close = el('button', 'learn-close', '×');
  close.type = 'button';
  close.addEventListener('click', () => viewer.select(null));
  header.append(switcher, close);

  const body = el('div', 'learn-body');
  body.setAttribute('aria-live', 'polite'); // announce the new structure to screen readers
  panel.append(header, body);
  document.body.append(panel);

  const structureButton = (id, lang) => {
    const button = el('button', 'learn-link', localized(meta[id]?.name, lang) || id);
    button.type = 'button';
    button.dataset.select = id;
    button.addEventListener('click', () => viewer.select(id));
    return button;
  };

  const section = (title, content) => {
    const wrap = el('section', 'learn-section');
    wrap.append(el('h3', null, title));
    if (typeof content === 'string') wrap.append(el('p', null, content));
    else wrap.append(content);
    return wrap;
  };

  function render() {
    const lang = getLanguage();
    const t = TEXT[lang];
    panel.setAttribute('aria-label', t.region);
    switcher.setAttribute('aria-label', t.language);
    close.setAttribute('aria-label', t.close);
    close.hidden = !currentId;
    langButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
    panel.classList.toggle('is-open', Boolean(currentId));
    body.replaceChildren();

    if (!currentId) {
      body.append(el('p', 'learn-hint', t.hint));
      return;
    }
    const organ = viewer.organ(currentId);
    if (!organ) {
      body.append(el('h2', 'learn-title', currentId), el('p', 'learn-muted', t.missing));
      return;
    }

    body.append(el('h2', 'learn-title', localized(organ.name, lang) || currentId));
    const isGroup = membersOf.has(organ.id);
    if (!isGroup && organ.system && meta[organ.system]) {
      const partOf = el('p', 'learn-part-of', `${t.partOf} `);
      partOf.append(structureButton(organ.system, lang));
      body.append(partOf);
    }

    const fn = localized(organ.function, lang);
    if (fn) body.append(section(t.function, fn));
    const location = localized(organ.location, lang);
    if (location) body.append(section(t.location, location));

    const facts = (organ.facts ?? []).map((f) => localized(f, lang)).filter(Boolean);
    if (facts.length) {
      const list = el('ul', 'learn-facts');
      facts.forEach((fact) => list.append(el('li', null, fact)));
      body.append(section(t.facts, list));
    }

    if (isGroup) {
      const list = el('div', 'learn-members');
      membersOf.get(organ.id).forEach((id) => list.append(structureButton(id, lang)));
      body.append(section(t.contains, list));
    }

    if (organ.status !== 'reviewed') body.append(el('p', 'learn-draft', t.draft));
  }

  viewer.onSelect((id) => {
    currentId = id;
    render();
    body.scrollTop = 0;
  });
  onLanguageChange(render);

  // Escape closes the panel, unless the user is typing in a field.
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && currentId && !e.target.closest?.('input, textarea')) {
      viewer.select(null);
    }
  });

  // The panel is not part of the AR overlay, so hide it during an AR session.
  viewer.onARChange((active) => (panel.hidden = active));

  render();
}
