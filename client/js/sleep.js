// sleep.js — Sleep log CRUD and the "log sleep" modal.

import { api } from './api.js';
import { openModal, closeModal } from './components/modal.js';
import { showToast } from './components/toast.js';
import { formatDate } from './utils.js';

export async function fetchSleepLogs(childId, limit = 30) {
  const res = await api.get(`/children/${childId}/sleep?limit=${limit}`);
  return res.data.logs;
}

export async function deleteSleepLog(id) {
  await api.delete(`/sleep/${id}`);
}

const QUALITY_BADGE = { poor: 'badge-danger', fair: 'badge-warning', good: 'badge-info', excellent: 'badge-success' };

export function sleepRowHtml(log) {
  return `
    <tr data-id="${log._id}">
      <td data-label="Date" class="cell-primary">${formatDate(log.date)}</td>
      <td data-label="Hours slept">${log.hoursSlept}h</td>
      <td data-label="Nap">${log.napHours || 0}h</td>
      <td data-label="Quality"><span class="badge ${QUALITY_BADGE[log.quality]}">${log.quality}</span></td>
      <td data-label="Actions" class="cell-actions">
        <button class="btn btn-sm btn-ghost" data-action="delete" data-id="${log._id}" aria-label="Delete"><i class="fa-solid fa-trash"></i></button>
      </td>
    </tr>
  `;
}

export function openAddSleepModal(childId, onSaved) {
  openModal({
    title: 'Log Sleep',
    bodyHtml: `
      <form id="sleepForm">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="sf-date">Date</label>
            <input class="input" type="date" id="sf-date" value="${new Date().toISOString().slice(0, 10)}">
          </div>
          <div class="form-group">
            <label class="form-label" for="sf-hours">Hours slept<span class="required">*</span></label>
            <input class="input" type="number" step="0.1" id="sf-hours" placeholder="e.g. 10.5">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="sf-nap">Nap time (hours)</label>
            <input class="input" type="number" step="0.1" id="sf-nap" placeholder="0">
          </div>
          <div class="form-group">
            <label class="form-label" for="sf-quality">Sleep quality</label>
            <select class="select" id="sf-quality">
              <option value="excellent">Excellent</option>
              <option value="good" selected>Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </select>
          </div>
        </div>
      </form>
    `,
    footerHtml: `
      <button class="btn btn-secondary" data-modal-close>Cancel</button>
      <button class="btn btn-primary" id="saveSleepBtn">Save</button>
    `,
  });

  document.getElementById('saveSleepBtn').addEventListener('click', async () => {
    const hoursSlept = document.getElementById('sf-hours').value;
    if (!hoursSlept) { showToast('Hours slept is required', 'error'); return; }
    try {
      const res = await api.post(`/children/${childId}/sleep`, {
        date: document.getElementById('sf-date').value,
        hoursSlept: Number(hoursSlept),
        napHours: Number(document.getElementById('sf-nap').value) || 0,
        quality: document.getElementById('sf-quality').value,
      });
      showToast('Sleep logged', 'success');
      closeModal();
      onSaved?.(res.data.log);
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}
