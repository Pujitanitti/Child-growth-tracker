// growth.js — Growth record CRUD and the "add measurement" modal.

import { api } from './api.js';
import { openModal, closeModal } from './components/modal.js';
import { showToast } from './components/toast.js';
import { validateForm, rules } from './validators.js';

export async function fetchGrowthRecords(childId) {
  const res = await api.get(`/children/${childId}/growth`);
  return res.data.records;
}

export async function fetchGrowthInsights(childId) {
  const res = await api.get(`/children/${childId}/growth/insights`);
  return res.data;
}

export async function deleteGrowthRecord(id) {
  await api.delete(`/growth/${id}`);
}

export function openAddGrowthModal(childId, onSaved) {
  openModal({
    title: 'Add Growth Measurement',
    bodyHtml: `
      <form id="growthForm">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="gf-date">Date<span class="required">*</span></label>
            <input class="input" type="date" id="gf-date" value="${new Date().toISOString().slice(0, 10)}" max="${new Date().toISOString().slice(0, 10)}">
          </div>
          <div class="form-group">
            <label class="form-label" for="gf-height">Height (cm)<span class="required">*</span></label>
            <input class="input" type="number" step="0.1" id="gf-height" placeholder="e.g. 85.5">
            <div class="form-error hidden" id="err-height"></div>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="gf-weight">Weight (kg)<span class="required">*</span></label>
            <input class="input" type="number" step="0.01" id="gf-weight" placeholder="e.g. 12.4">
            <div class="form-error hidden" id="err-weight"></div>
          </div>
          <div class="form-group">
            <label class="form-label" for="gf-head">Head circumference (cm)</label>
            <input class="input" type="number" step="0.1" id="gf-head" placeholder="Optional">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="gf-notes">Notes</label>
          <textarea class="textarea" id="gf-notes" placeholder="Optional notes about this measurement"></textarea>
        </div>
      </form>
    `,
    footerHtml: `
      <button class="btn btn-secondary" data-modal-close>Cancel</button>
      <button class="btn btn-primary" id="saveGrowthBtn">Save Measurement</button>
    `,
  });

  document.getElementById('saveGrowthBtn').addEventListener('click', async () => {
    const data = {
      date: document.getElementById('gf-date').value,
      heightCm: document.getElementById('gf-height').value,
      weightKg: document.getElementById('gf-weight').value,
      headCircumferenceCm: document.getElementById('gf-head').value || null,
      notes: document.getElementById('gf-notes').value || null,
    };

    const errors = validateForm(data, {
      heightCm: [(v) => rules.positiveNumber(v, 'Height')],
      weightKg: [(v) => rules.positiveNumber(v, 'Weight')],
    });
    document.querySelectorAll('.form-error').forEach((el) => el.classList.add('hidden'));
    if (Object.keys(errors).length) {
      Object.entries(errors).forEach(([field, msg]) => {
        const el = document.getElementById(`err-${field.replace('Cm', '').replace('Kg', '')}`);
        if (el) { el.textContent = msg; el.classList.remove('hidden'); }
      });
      return;
    }

    const btn = document.getElementById('saveGrowthBtn');
    btn.disabled = true;
    btn.textContent = 'Saving...';
    try {
      const res = await api.post(`/children/${childId}/growth`, data);
      showToast('Growth measurement recorded', 'success');
      closeModal();
      onSaved?.(res.data.record);
    } catch (err) {
      showToast(err.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Save Measurement';
    }
  });
}

export function alertBannerHtml(alerts) {
  if (!alerts?.length) return '';
  return alerts.map((msg) => `
    <div class="card mb-3" style="border-left:4px solid var(--color-warning); background: var(--color-warning-soft);">
      <div class="flex items-center gap-3">
        <i class="fa-solid fa-triangle-exclamation text-warning"></i>
        <span class="text-sm">${msg}</span>
      </div>
    </div>
  `).join('');
}
