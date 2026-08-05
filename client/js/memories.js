// memories.js — Memory timeline: milestones, photos, and notes over time.

import { api } from './api.js';
import { openModal, closeModal } from './components/modal.js';
import { showToast } from './components/toast.js';
import { formatDate, resolveUploadUrl } from './utils.js';

export async function fetchMemories(childId) {
  const res = await api.get(`/children/${childId}/memories`);
  return res.data.memories;
}

export async function deleteMemory(id) {
  await api.delete(`/memories/${id}`);
}

const TYPE_ICON = {
  'first-steps': 'fa-shoe-prints', 'first-words': 'fa-comment-dots', birthday: 'fa-cake-candles',
  photo: 'fa-image', note: 'fa-note-sticky', other: 'fa-star',
};

export function memoryItemHtml(m) {
  return `
    <div class="timeline-item" data-id="${m._id}">
      <div class="card">
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-start gap-3">
            <div class="stat-card__icon accent"><i class="fa-solid ${TYPE_ICON[m.type] || 'fa-star'}"></i></div>
            <div>
              <div class="font-semibold text-sm">${m.title}</div>
              <div class="text-xs text-muted">${formatDate(m.date)}</div>
              ${m.description ? `<p class="text-sm mt-2 mb-0">${m.description}</p>` : ''}
            </div>
          </div>
          <button class="btn btn-sm btn-ghost" data-action="delete" data-id="${m._id}" aria-label="Delete memory"><i class="fa-solid fa-trash"></i></button>
        </div>
        ${m.photo ? `<img src="${resolveUploadUrl(m.photo)}" alt="${m.title}" style="width:100%; border-radius:var(--radius-md); margin-top:var(--space-3); max-height:280px; object-fit:cover;">` : ''}
      </div>
    </div>
  `;
}

export function openAddMemoryModal(childId, onSaved) {
  openModal({
    title: 'Add a Memory',
    bodyHtml: `
      <form id="memoryForm">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="mmf-type">Type</label>
            <select class="select" id="mmf-type">
              <option value="first-steps">First steps</option>
              <option value="first-words">First words</option>
              <option value="birthday">Birthday</option>
              <option value="photo">Photo</option>
              <option value="note" selected>Note</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="mmf-date">Date</label>
            <input class="input" type="date" id="mmf-date" value="${new Date().toISOString().slice(0, 10)}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="mmf-title">Title<span class="required">*</span></label>
          <input class="input" id="mmf-title" placeholder="e.g. First steps in the garden">
        </div>
        <div class="form-group">
          <label class="form-label" for="mmf-desc">Description</label>
          <textarea class="textarea" id="mmf-desc" placeholder="Optional details"></textarea>
        </div>
        <div class="form-group">
          <label class="form-label" for="mmf-photo">Photo (optional)</label>
          <input class="input" type="file" id="mmf-photo" accept="image/*">
        </div>
      </form>
    `,
    footerHtml: `
      <button class="btn btn-secondary" data-modal-close>Cancel</button>
      <button class="btn btn-primary" id="saveMemoryBtn">Save Memory</button>
    `,
  });

  document.getElementById('saveMemoryBtn').addEventListener('click', async () => {
    const title = document.getElementById('mmf-title').value.trim();
    if (!title) { showToast('Title is required', 'error'); return; }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('type', document.getElementById('mmf-type').value);
    formData.append('date', document.getElementById('mmf-date').value);
    const desc = document.getElementById('mmf-desc').value.trim();
    if (desc) formData.append('description', desc);
    const file = document.getElementById('mmf-photo').files[0];
    if (file) formData.append('photo', file);

    try {
      const res = await api.post(`/children/${childId}/memories`, formData);
      showToast('Memory added', 'success');
      closeModal();
      onSaved?.(res.data.memory);
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}
