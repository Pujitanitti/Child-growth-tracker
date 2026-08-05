// dragReorder.js — Makes the direct children of a container (each marked
// with data-widget-id) drag-reorderable via the native HTML5 DnD API, and
// persists the resulting order to localStorage so it survives reloads.
// No library dependency; works within a single container at a time.

/**
 * @param {HTMLElement} container - parent whose direct children are the widgets
 * @param {string} storageKey - localStorage key to persist order under
 */
export function initDragReorder(container, storageKey) {
  const widgets = () => Array.from(container.children).filter((el) => el.dataset.widgetId);

  widgets().forEach((el) => {
    el.setAttribute('draggable', 'true');
    el.classList.add('draggable-widget');

    // A small grip handle so it's discoverable, rather than the whole card being a drag target
    if (!el.querySelector('.widget-drag-handle')) {
      const handle = document.createElement('div');
      handle.className = 'widget-drag-handle';
      handle.innerHTML = '<i class="fa-solid fa-grip-lines" aria-hidden="true"></i>';
      handle.title = 'Drag to reorder';
      el.style.position = 'relative';
      el.appendChild(handle);
    }
  });

  let dragged = null;

  container.addEventListener('dragstart', (e) => {
    const el = e.target.closest('[data-widget-id]');
    if (!el) return;
    dragged = el;
    el.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  });

  container.addEventListener('dragend', (e) => {
    const el = e.target.closest('[data-widget-id]');
    el?.classList.remove('dragging');
    dragged = null;
    saveOrder();
  });

  container.addEventListener('dragover', (e) => {
    e.preventDefault();
    const after = getDragAfterElement(container, e.clientY);
    if (!dragged) return;
    if (after == null) container.appendChild(dragged);
    else container.insertBefore(dragged, after);
  });

  function getDragAfterElement(cont, y) {
    const els = widgets().filter((el) => el !== dragged);
    return els.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) return { offset, element: child };
      return closest;
    }, { offset: -Infinity, element: null }).element;
  }

  function saveOrder() {
    const order = widgets().map((el) => el.dataset.widgetId);
    localStorage.setItem(storageKey, JSON.stringify(order));
  }

  function applySavedOrder() {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return;
    try {
      const order = JSON.parse(saved);
      order.forEach((id) => {
        const el = container.querySelector(`[data-widget-id="${id}"]`);
        if (el) container.appendChild(el);
      });
    } catch {
      // ignore malformed saved order, fall back to default DOM order
    }
  }

  applySavedOrder();
}
