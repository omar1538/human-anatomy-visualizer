// Track C: "About and credits" window. The cahier des charges requires every 3D model's author
// and licence to be credited in the application, and the app to say it is not a medical tool.
// Keep the credits in sync with ATTRIBUTION.md ("Mentions à afficher dans les crédits").
import { getLanguage, onLanguageChange } from '../learn/language.js';

const REPO_URL = 'https://github.com/omar1538/human-anatomy-visualizer';

// Credits, word for word as required by each licence. Not translated: they are legal mentions.
const MODEL_CREDITS = [
  {
    parts: {
      en: 'Chambers, septum, papillary muscles, valves',
      fr: 'Cavités, septum, muscles papillaires, valves',
    },
    mention:
      '“3D Reference Organ for Heart, Male v1.3”, Kristen Browne and Heidi Schlehlein, HuBMAP Human Reference Atlas, CC BY 4.0. Browne et al., “HuBMAP CCF 3D Reference Object Library”.',
    links: [
      ['doi.org/10.48539/HBM564.WKNG.249', 'https://doi.org/10.48539/HBM564.WKNG.249'],
      ['humanatlas.io/3d-reference-library', 'https://humanatlas.io/3d-reference-library'],
    ],
  },
  {
    parts: {
      en: 'Coronary arteries, cardiac veins, great vessels',
      fr: 'Artères coronaires, veines cardiaques, gros vaisseaux',
    },
    mention:
      'BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International.',
    links: [
      [
        'dbarchive.biosciencedbc.jp/en/bodyparts3d',
        'https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html',
      ],
    ],
  },
];

const TEXT = {
  en: {
    title: 'About this app',
    close: 'Close',
    intro:
      'Human Anatomy Visualizer shows the human heart in 3D, in the browser, without installing anything. Select a structure to read what it does.',
    notice:
      'Educational use only. This is not a medical tool and must not be used for diagnosis or treatment.',
    howTo: 'How to use it',
    gestures: [
      'Rotate: drag with the mouse or one finger.',
      'Zoom: mouse wheel or pinch with two fingers.',
      'Move: right-click drag, or drag with two fingers.',
      'Select a structure: click or tap it. The panel shows its function, location and key facts.',
      'Layers: show or hide each group of structures.',
    ],
    modelsTitle: '3D models',
    modelsNote: 'Modified by the team: aligned, cleaned, simplified and renamed.',
    textsTitle: 'Educational texts',
    texts:
      'Written by the team in its own words (English and French). Drafts, not yet reviewed by a medical reader.',
    softwareTitle: 'Software',
    software: 'Three.js r187 (MIT licence). App source code under the MIT licence:',
    privacy:
      'No account, no tracking: no personal data is collected. Only your language choice is saved on this device.',
  },
  fr: {
    title: 'À propos',
    close: 'Fermer',
    intro:
      'Human Anatomy Visualizer montre le cœur humain en 3D, dans le navigateur, sans rien installer. Sélectionnez une structure pour lire son rôle.',
    notice:
      "Usage pédagogique uniquement. Ce n'est pas un outil médical : il ne doit pas servir au diagnostic ni au traitement.",
    howTo: 'Utilisation',
    gestures: [
      'Tourner : faites glisser avec la souris ou un doigt.',
      'Zoomer : molette de la souris ou pincement à deux doigts.',
      'Déplacer : glisser avec le clic droit, ou glisser à deux doigts.',
      'Sélectionner une structure : cliquez ou touchez-la. Le panneau affiche sa fonction, sa localisation et les points à retenir.',
      'Calques : affichez ou masquez chaque groupe de structures.',
    ],
    modelsTitle: 'Modèles 3D',
    modelsNote: "Modifiés par l'équipe : recalés, nettoyés, simplifiés et renommés.",
    textsTitle: 'Textes pédagogiques',
    texts:
      "Rédigés par l'équipe avec ses propres mots (anglais et français). Brouillons, pas encore relus par un spécialiste.",
    softwareTitle: 'Logiciels',
    software: "Three.js r187 (licence MIT). Code source de l'application sous licence MIT :",
    privacy:
      'Aucun compte, aucun suivi : aucune donnée personnelle n’est collectée. Seul votre choix de langue est enregistré sur cet appareil.',
  },
};

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
};

const link = (text, href) => {
  const a = el('a', null, text);
  a.href = href;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  return a;
};

/** Creates the dialog. Returns `open()`, to call from a button. */
export function createAboutDialog() {
  const dialog = el('dialog', 'ui-about');
  dialog.id = 'about-dialog';
  document.body.append(dialog);

  // Clicking the dark backdrop (outside the box) closes the window.
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });

  function render() {
    const lang = getLanguage();
    const t = TEXT[lang];
    dialog.setAttribute('aria-label', t.title);
    const close = el('button', 'ui-about-close', '×');
    close.type = 'button';
    close.setAttribute('aria-label', t.close);
    close.addEventListener('click', () => dialog.close());

    const header = el('div', 'ui-about-header');
    header.append(el('h2', null, t.title), close);

    const howTo = el('ul');
    t.gestures.forEach((g) => howTo.append(el('li', null, g)));

    const models = el('ul', 'ui-credits');
    for (const credit of MODEL_CREDITS) {
      const item = el('li');
      item.append(
        el('strong', null, credit.parts[lang]),
        el('br'),
        document.createTextNode(credit.mention),
        el('br'),
      );
      credit.links.forEach(([text, href], i) => {
        if (i) item.append(' · ');
        item.append(link(text, href));
      });
      models.append(item);
    }

    const software = el('p', null, `${t.software} `);
    software.append(link('GitHub', REPO_URL));

    dialog.replaceChildren(
      header,
      el('p', null, t.intro),
      el('p', 'ui-notice', t.notice),
      el('h3', null, t.howTo),
      howTo,
      el('h3', null, t.modelsTitle),
      models,
      el('p', 'ui-muted', t.modelsNote),
      el('h3', null, t.textsTitle),
      el('p', null, t.texts),
      el('h3', null, t.softwareTitle),
      software,
      el('p', 'ui-muted', t.privacy),
    );
  }

  render();
  onLanguageChange(render);
  return {
    open() {
      render();
      dialog.showModal(); // modal: keeps keyboard focus inside, Escape closes it
    },
  };
}
