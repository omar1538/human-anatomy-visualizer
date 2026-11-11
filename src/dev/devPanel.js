// Temporary developer panel to exercise the viewer API.
// Track C replaces this with the real interface (src/ui/). Safe to delete then.

/** @param {Awaited<ReturnType<typeof import('../render/index.js').createViewer>>} viewer */
export function mountDevPanel(viewer) {
  const panel = document.createElement('div');
  panel.style.cssText =
    'position:fixed;top:12px;left:12px;padding:12px 14px;background:rgba(15,21,32,.85);border:1px solid #2e75b6;border-radius:8px;font-size:14px;min-width:190px';

  const backend = document.createElement('div');
  backend.id = 'backend';
  backend.textContent = `Renderer: ${viewer.backend}`;
  backend.style.fontWeight = '600';
  panel.append(backend);

  viewer.systems().forEach((system) => {
    const label = document.createElement('label');
    label.style.cssText = 'display:block;margin-top:6px;cursor:pointer';
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = viewer.isSystemVisible(system);
    box.dataset.system = system;
    box.addEventListener('change', () => viewer.setSystemVisible(system, box.checked));
    // Selects the whole layer as a group, as the data contract allows (for example all valves).
    const pick = document.createElement('button');
    pick.textContent = 'select';
    pick.dataset.selectGroup = system;
    pick.style.cssText = 'margin-left:6px;font-size:11px;padding:0 4px';
    pick.addEventListener('click', (e) => {
      e.preventDefault(); // the button sits inside the label: do not toggle the checkbox
      viewer.select(system);
    });
    label.append(box, ` ${system}`, pick);
    panel.append(label);
  });

  const selected = document.createElement('div');
  selected.id = 'selected';
  selected.style.marginTop = '10px';
  selected.textContent = 'Selected: none';
  panel.append(selected);
  viewer.onSelect((id) => (selected.textContent = `Selected: ${id ?? 'none'}`));

  panel.append(createInfoSection(viewer));

  const reset = document.createElement('button');
  reset.textContent = 'Reset view';
  reset.style.marginTop = '10px';
  reset.addEventListener('click', () => viewer.resetView());
  panel.append(reset);

  panel.append(createARSection(viewer));
  viewer.onARChange((active) => {
    panel.style.display = active ? 'none' : 'block';
  });

  document.body.append(panel);
}

/** A field may be plain text or `{ en, fr }`, as `name` and `function` are in organs.json. */
function localized(value, lang) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  return value[lang] ?? value.en ?? '';
}

// Shows the selected structure's metadata from organs.json in English or French.
// Early version of Learn mode: Track C builds the real one in src/learn/.
function createInfoSection(viewer) {
  let lang = 'en';
  let currentId = null;

  const section = document.createElement('div');
  section.id = 'organ-info';
  section.style.cssText = 'margin-top:8px;max-width:260px;font-size:13px;line-height:1.35';

  const switcher = document.createElement('div');
  const buttons = ['en', 'fr'].map((code) => {
    const button = document.createElement('button');
    button.textContent = code.toUpperCase();
    button.dataset.lang = code;
    button.style.cssText = 'margin-right:4px;font-size:11px;padding:0 6px';
    button.addEventListener('click', () => {
      lang = code;
      render();
    });
    return button;
  });
  switcher.append(...buttons);

  const body = document.createElement('div');
  body.style.marginTop = '6px';
  section.append(switcher, body);

  const line = (text, style = '') => {
    const div = document.createElement('div');
    div.textContent = text;
    div.style.cssText = style;
    return div;
  };

  function render() {
    buttons.forEach((b) => (b.style.fontWeight = b.dataset.lang === lang ? '700' : '400'));
    body.replaceChildren();
    if (!currentId) return;
    const organ = viewer.organ(currentId);
    if (!organ) {
      body.append(
        line(
          lang === 'fr'
            ? 'Pas encore de fiche pour cette structure (organs.json).'
            : 'No details for this structure yet (organs.json).',
          'opacity:.7',
        ),
      );
      return;
    }
    body.append(line(localized(organ.name, lang) || currentId, 'font-weight:600;font-size:14px'));
    const fn = localized(organ.function, lang);
    if (fn) body.append(line(fn, 'margin-top:4px'));
    const location = localized(organ.location, lang);
    if (location) body.append(line(location, 'margin-top:4px;opacity:.8'));
    for (const fact of organ.facts ?? []) {
      const text = localized(fact, lang);
      if (text) body.append(line(`• ${text}`, 'margin-top:2px'));
    }
  }

  viewer.onSelect((id) => {
    currentId = id;
    render();
  });
  render();
  return section;
}

function createARSection(viewer) {
  const section = document.createElement('div');
  section.style.marginTop = '10px';
  if (!viewer.arSupported) {
    section.id = 'ar-status';
    section.textContent = 'AR: not available here';
    return section;
  }

  // Shown over the camera image during the session.
  const overlay = document.createElement('div');
  overlay.id = 'ar-overlay';
  overlay.style.cssText =
    'display:none;position:fixed;top:0;left:0;z-index:2147483647;padding:12px;font-size:16px;text-shadow:0 1px 2px #000';
  const hint = document.createElement('div');
  hint.textContent = 'Point at a surface and tap to place. Tap again to move.';
  const exit = document.createElement('button');
  exit.textContent = 'Exit AR';
  exit.style.marginTop = '10px';
  // Without this, tapping the button would also place the organ.
  exit.addEventListener('beforexrselect', (e) => e.preventDefault());
  exit.addEventListener('click', () => viewer.exitAR());
  overlay.append(hint, exit);
  document.body.append(overlay);

  const enter = document.createElement('button');
  enter.id = 'enter-ar';
  enter.textContent = 'Enter AR';
  const status = document.createElement('div');
  enter.addEventListener('click', () => {
    status.textContent = '';
    viewer.enterAR({ overlay }).catch((error) => {
      status.textContent = `AR failed: ${error.message}`;
    });
  });
  viewer.onARChange((active) => {
    overlay.style.display = active ? 'block' : 'none';
  });
  section.append(enter, status);
  return section;
}
