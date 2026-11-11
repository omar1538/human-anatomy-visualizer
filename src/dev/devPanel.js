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
    label.append(box, ` ${system}`);
    panel.append(label);
  });

  const selected = document.createElement('div');
  selected.id = 'selected';
  selected.style.marginTop = '10px';
  selected.textContent = 'Selected: none';
  panel.append(selected);
  viewer.onSelect((id) => (selected.textContent = `Selected: ${id ?? 'none'}`));

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
