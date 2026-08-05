// vaccination.js — Vaccination schedule rendering and actions.

import { api } from './api.js';
import { openModal, closeModal } from './components/modal.js';
import { showToast } from './components/toast.js';
import { formatDate } from './utils.js';

export async function fetchVaccinations(childId, status) {
  const query = status ? `?status=${status}` : '';
  const res = await api.get(`/children/${childId}/vaccinations${query}`);
  return res.data.vaccinations;
}

export async function markVaccinationComplete(id, administeredBy = '') {
  return api.patch(`/vaccinations/${id}/complete`, { administeredBy });
}

export async function deleteVaccination(id) {
  await api.delete(`/vaccinations/${id}`);
}

const STATUS_BADGE = { upcoming: 'badge-info', completed: 'badge-success', missed: 'badge-danger' };

export function vaccinationRowHtml(v) {
  return `
    <tr data-id="${v._id}">
      <td data-label="Vaccine" class="cell-primary">${v.vaccine}</td>
      <td data-label="Dose">${v.doseLabel || '—'}</td>
      <td data-label="Due date">${formatDate(v.dueDate)}</td>
      <td data-label="Status"><span class="badge ${STATUS_BADGE[v.status]}">${v.status}</span></td>
      <td data-label="Actions" class="cell-actions">
        ${v.status === 'upcoming' ? `<button class="btn btn-sm btn-secondary" data-action="complete" data-id="${v._id}"><i class="fa-solid fa-check"></i> Mark done</button>` : ''}
        <button class="btn btn-sm btn-ghost" data-action="delete" data-id="${v._id}" aria-label="Delete"><i class="fa-solid fa-trash"></i></button>
      </td>
    </tr>
  `;
}

export function openAddVaccineModal(childId, onSaved) {
  openModal({
    title: 'Add Vaccine to Schedule',
    bodyHtml: `
      <form id="vaxForm">
        <div class="form-group">
          <label class="form-label" for="vf-name">Vaccine name<span class="required">*</span></label>
          <input class="input" id="vf-name" placeholder="e.g. Influenza">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="vf-dose">Dose label</label>
            <input class="input" id="vf-dose" placeholder="e.g. Annual">
          </div>
          <div class="form-group">
            <label class="form-label" for="vf-due">Due date<span class="required">*</span></label>
            <input class="input" type="date" id="vf-due">
          </div>
        </div>
      </form>
    `,
    footerHtml: `
      <button class="btn btn-secondary" data-modal-close>Cancel</button>
      <button class="btn btn-primary" id="saveVaxBtn">Add Vaccine</button>
    `,
  });

  document.getElementById('saveVaxBtn').addEventListener('click', async () => {
    const vaccine = document.getElementById('vf-name').value.trim();
    const dueDate = document.getElementById('vf-due').value;
    if (!vaccine || !dueDate) { showToast('Vaccine name and due date are required', 'error'); return; }

    try {
      const res = await api.post(`/children/${childId}/vaccinations`, {
        vaccine, doseLabel: document.getElementById('vf-dose').value.trim() || null, dueDate,
      });
      showToast('Vaccine added to schedule', 'success');
      closeModal();
      onSaved?.(res.data.vaccination);
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}
