// medicines.js — Medicine reminders: list, add, mark taken.

import { api } from './api.js';
import { openModal, closeModal } from './components/modal.js';
import { showToast } from './components/toast.js';
import { timeAgo } from './utils.js';

export async function fetchMedicines(childId, activeOnly = true) {
  const res = await api.get(`/children/${childId}/medicines?active=${activeOnly}`);
  return res.data.medicines;
}

export async function markMedicineTaken(id) {
  return api.patch(`/medicines/${id}/taken`);
}

export async function deleteMedicine(id) {
  await api.delete(`/medicines/${id}`);
}

export function medicineCardHtml(m) {
  return `
    <div class="card mb-3" data-id="${m._id}">
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-start gap-3">
          <div class="stat-card__icon accent"><i class="fa-solid fa-pills"></i></div>
          <div>
            <div class="font-semibold text-sm">${m.medicineName}</div>
            <div class="text-xs text-muted">${m.dosage || 'No dosage noted'} · ${m.frequency}${m.timeOfDay ? ` · ${m.timeOfDay}` : ''}</div>
            <div class="text-xs text-muted mt-1">${m.lastTakenAt ? `Last taken ${timeAgo(m.lastTakenAt)}` : 'Not marked as taken yet'}</div>
          </div>
        </div>
        <button class="btn btn-sm btn-secondary" data-action="taken" data-id="${m._id}"><i class="fa-solid fa-check"></i> Taken</button>
      </div>
    </div>
  `;
}

export function openAddMedicineModal(childId, onSaved) {
  openModal({
    title: 'Add Medicine Reminder',
    bodyHtml: `
      <form id="medForm">
        <div class="form-group">
          <label class="form-label" for="mf-name">Medicine name<span class="required">*</span></label>
          <input class="input" id="mf-name" placeholder="e.g. Paracetamol syrup">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="mf-dosage">Dosage</label>
            <input class="input" id="mf-dosage" placeholder="e.g. 5ml">
          </div>
          <div class="form-group">
            <label class="form-label" for="mf-frequency">Frequency</label>
            <select class="select" id="mf-frequency">
              <option value="once">Once</option>
              <option value="daily" selected>Daily</option>
              <option value="twice-daily">Twice daily</option>
              <option value="thrice-daily">Thrice daily</option>
              <option value="weekly">Weekly</option>
              <option value="as-needed">As needed</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="mf-time">Time(s) of day</label>
          <input class="input" id="mf-time" placeholder="e.g. 08:00, 20:00">
        </div>
      </form>
    `,
    footerHtml: `
      <button class="btn btn-secondary" data-modal-close>Cancel</button>
      <button class="btn btn-primary" id="saveMedBtn">Add Reminder</button>
    `,
  });

  document.getElementById('saveMedBtn').addEventListener('click', async () => {
    const medicineName = document.getElementById('mf-name').value.trim();
    if (!medicineName) { showToast('Medicine name is required', 'error'); return; }

    try {
      const res = await api.post(`/children/${childId}/medicines`, {
        medicineName,
        dosage: document.getElementById('mf-dosage').value.trim() || null,
        frequency: document.getElementById('mf-frequency').value,
        timeOfDay: document.getElementById('mf-time').value.trim() || null,
      });
      showToast('Medicine reminder added', 'success');
      closeModal();
      onSaved?.(res.data.medicine);
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}
