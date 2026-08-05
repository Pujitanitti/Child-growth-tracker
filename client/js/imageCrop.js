// imageCrop.js — Lightweight square-crop tool. Opens a modal with the
// selected image, lets the user drag/resize a crop box, and resolves with
// a cropped Blob ready to upload. No external library needed.

import { openModal, closeModal } from './components/modal.js';

/**
 * @param {File} file - the raw file the user picked
 * @returns {Promise<Blob>} resolves with the cropped image as a JPEG blob,
 *   or rejects if the user cancels.
 */
export function openCropModal(file) {
  return new Promise((resolve, reject) => {
    const imageUrl = URL.createObjectURL(file);
    let settled = false;

    openModal({
      title: 'Adjust Photo',
      bodyHtml: `
        <div class="crop-stage" id="cropStage">
          <img id="cropImage" src="${imageUrl}" alt="Photo to crop" draggable="false">
          <div class="crop-box" id="cropBox"><div class="crop-box__handle" id="cropHandle"></div></div>
        </div>
        <p class="text-xs text-muted mt-3">Drag the box to reposition. Drag the bottom-right handle to resize.</p>
      `,
      footerHtml: `
        <button class="btn btn-secondary" data-modal-close>Cancel</button>
        <button class="btn btn-primary" id="confirmCropBtn">Use This Photo</button>
      `,
      onClose: () => {
        URL.revokeObjectURL(imageUrl);
        if (!settled) { settled = true; reject(new Error('cancelled')); }
      },
    });

    const stage = document.getElementById('cropStage');
    const img = document.getElementById('cropImage');
    const box = document.getElementById('cropBox');
    const handle = document.getElementById('cropHandle');

    let boxState = { x: 20, y: 20, size: 160 };

    function paintBox() {
      box.style.left = `${boxState.x}px`;
      box.style.top = `${boxState.y}px`;
      box.style.width = `${boxState.size}px`;
      box.style.height = `${boxState.size}px`;
    }

    function clamp(state) {
      const stageRect = stage.getBoundingClientRect();
      const maxSize = Math.min(stageRect.width, stageRect.height);
      const size = Math.max(40, Math.min(state.size, maxSize));
      const x = Math.max(0, Math.min(state.x, stageRect.width - size));
      const y = Math.max(0, Math.min(state.y, stageRect.height - size));
      return { x, y, size };
    }

    img.addEventListener('load', () => {
      const stageRect = stage.getBoundingClientRect();
      const size = Math.min(stageRect.width, stageRect.height) * 0.7;
      boxState = clamp({ x: (stageRect.width - size) / 2, y: (stageRect.height - size) / 2, size });
      paintBox();
    }, { once: true });

    // If the image is already cached/loaded synchronously, 'load' may not fire.
    if (img.complete && img.naturalWidth) img.dispatchEvent(new Event('load'));

    let drag = null; // { mode: 'move'|'resize', startX, startY, origin: {x,y,size} }

    box.addEventListener('mousedown', (e) => {
      if (e.target === handle) return; // handled separately below
      drag = { mode: 'move', startX: e.clientX, startY: e.clientY, origin: { ...boxState } };
      e.preventDefault();
    });
    handle.addEventListener('mousedown', (e) => {
      drag = { mode: 'resize', startX: e.clientX, startY: e.clientY, origin: { ...boxState } };
      e.preventDefault();
      e.stopPropagation();
    });

    document.addEventListener('mousemove', (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      if (drag.mode === 'move') {
        boxState = clamp({ size: drag.origin.size, x: drag.origin.x + dx, y: drag.origin.y + dy });
      } else {
        boxState = clamp({ size: drag.origin.size + Math.max(dx, dy), x: drag.origin.x, y: drag.origin.y });
      }
      paintBox();
    });
    document.addEventListener('mouseup', () => { drag = null; });

    document.getElementById('confirmCropBtn').addEventListener('click', () => {
      const stageRect = stage.getBoundingClientRect();
      const scaleX = img.naturalWidth / stageRect.width;
      const scaleY = img.naturalHeight / stageRect.height;

      const canvas = document.createElement('canvas');
      const outputSize = 400;
      canvas.width = outputSize;
      canvas.height = outputSize;
      canvas.getContext('2d').drawImage(
        img,
        boxState.x * scaleX, boxState.y * scaleY, boxState.size * scaleX, boxState.size * scaleY,
        0, 0, outputSize, outputSize
      );

      canvas.toBlob((blob) => {
        settled = true;
        closeModal();
        resolve(blob);
      }, 'image/jpeg', 0.9);
    });
  });
}
