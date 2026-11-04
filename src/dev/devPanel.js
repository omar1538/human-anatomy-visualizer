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

  document.body.append(panel);
}
