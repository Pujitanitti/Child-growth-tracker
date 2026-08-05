// modal.js — Accessible modal dialog: focus trap, Escape to close, backdrop click to close.

let activeModal = null;

/**
 * @param {{title: string, bodyHtml: string, footerHtml?: string, onClose?: Function}} opts
 * @returns {{close: Function, el: HTMLElement}}
 */
export function openModal({ title, bodyHtml, footerHtml = '', onClose }) {
  closeModal(); // only one modal at a time

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal animate-scale-in" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div class="modal__header">
        <h3 id="modal-title">${title}</h3>
        <button class="icon-btn" data-modal-close aria-label="Close dialog"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="modal__body">${bodyHtml}</div>
      ${footerHtml ? `<div class="modal__footer">${footerHtml}</div>` : ''}
    </div>
  `;

  document.body.appendChild(backdrop);
  document.body.style.overflow = 'hidden';

  const previouslyFocused = document.activeElement;
  const modalEl = backdrop.querySelector('.modal');

  const focusables = () => modalEl.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  focusables()[0]?.focus();

  function handleKeydown(e) {
    if (e.key === 'Escape') close();
    if (e.key === 'Tab') {
      const items = Array.from(focusables());
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }

  function close() {
    document.removeEventListener('keydown', handleKeydown);
    backdrop.remove();
    document.body.style.overflow = '';
    previouslyFocused?.focus();
    activeModal = null;
    onClose?.();
  }

  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });
  backdrop.querySelector('[data-modal-close]').addEventListener('click', close);
  document.addEventListener('keydown', handleKeydown);

  activeModal = { close, el: modalEl };
  return activeModal;
}

export function closeModal() {
  activeModal?.close();
}
