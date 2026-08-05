// children.js — Child list rendering + the add/edit child modal form.
// Used by children.html (list) and referenced by dashboard.html (child picker).

import { api } from './api.js';
import { openModal, closeModal } from './components/modal.js';
import { showToast } from './components/toast.js';
import { formatAge, resolveUploadUrl, initials, debounce } from './utils.js';
import { validateForm, rules } from './validators.js';

export async function fetchChildren(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await api.get(`/children${query ? `?${query}` : ''}`);
  return res.data;
}

export function childCardHtml(child) {
  const photo = child.photo
    ? `<img src="${resolveUploadUrl(child.photo)}" class="child-card__photo" alt="${child.name}">`
    : `<div class="avatar avatar-lg child-card__photo" style="margin:0 auto;">${initials(child.name)}</div>`;

  return `
    <div class="card card--interactive tilt-card child-card hover-lift" data-child-id="${child._id}" tabindex="0" role="button">
      ${photo}
      <div>
        <div class="child-card__name">${child.name}</div>
        <div class="child-card__meta">${formatAge(child.dateOfBirth)} old · ${child.gender}</div>
      </div>
      <div class="child-card__stats">
        <div>
          <div class="child-card__stat-value">${child.bloodGroup || '—'}</div>
          <div class="child-card__stat-label">Blood group</div>
        </div>
      </div>
    </div>
  `;
}

export function bindChildSearch(inputEl, onResults) {
  inputEl.addEventListener('input', debounce(async (e) => {
    const { children } = await fetchChildren({ search: e.target.value });
    onResults(children);
  }, 350));
}

function childFormFields(child = {}) {
  return `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label" for="cf-name">Full name<span class="required">*</span></label>
        <input class="input" id="cf-name" value="${child.name || ''}" required>
        <div class="form-error hidden" id="err-name"></div>
      </div>
      <div class="form-group">
        <label class="form-label" for="cf-gender">Gender<span class="required">*</span></label>
        <select class="select" id="cf-gender" required>
          <option value="male" ${child.gender === 'male' ? 'selected' : ''}>Male</option>
          <option value="female" ${child.gender === 'female' ? 'selected' : ''}>Female</option>
          <option value="other" ${child.gender === 'other' ? 'selected' : ''}>Other</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label" for="cf-dob">Date of birth<span class="required">*</span></label>
        <input class="input" type="date" id="cf-dob" value="${child.dateOfBirth ? child.dateOfBirth.slice(0, 10) : ''}" required>
        <div class="form-error hidden" id="err-dob"></div>
      </div>
      <div class="form-group">
        <label class="form-label" for="cf-blood">Blood group</label>
        <select class="select" id="cf-blood">
          ${['Unknown', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) =>
            `<option value="${bg}" ${child.bloodGroup === bg ? 'selected' : ''}>${bg}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label" for="cf-birthweight">Birth weight (kg)</label>
        <input class="input" type="number" step="0.01" id="cf-birthweight" value="${child.birthWeightKg ?? ''}">
      </div>
      <div class="form-group">
        <label class="form-label" for="cf-birthheight">Birth height (cm)</label>
        <input class="input" type="number" step="0.1" id="cf-birthheight" value="${child.birthHeightCm ?? ''}">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label" for="cf-allergies">Allergies (comma separated)</label>
      <input class="input" id="cf-allergies" value="${(child.allergies || []).join(', ')}">
    </div>
    <div class="form-group">
      <label class="form-label" for="cf-conditions">Medical conditions (comma separated)</label>
      <input class="input" id="cf-conditions" value="${(child.medicalConditions || []).join(', ')}">
    </div>
    <fieldset>
      <legend>Emergency Contact</legend>
      <div class="form-row">
        <input class="input" id="cf-ec-name" placeholder="Name" value="${child.emergencyContact?.name || ''}">
        <input class="input" id="cf-ec-phone" placeholder="Phone" value="${child.emergencyContact?.phone || ''}">
      </div>
    </fieldset>
    <fieldset>
      <legend>Doctor Details</legend>
      <div class="form-row">
        <input class="input" id="cf-doc-name" placeholder="Doctor name" value="${child.doctor?.name || ''}">
        <input class="input" id="cf-doc-phone" placeholder="Phone" value="${child.doctor?.phone || ''}">
      </div>
    </fieldset>
  `;
}

function readChildForm() {
  return {
    name: document.getElementById('cf-name').value.trim(),
    gender: document.getElementById('cf-gender').value,
    dateOfBirth: document.getElementById('cf-dob').value,
    bloodGroup: document.getElementById('cf-blood').value,
    birthWeightKg: document.getElementById('cf-birthweight').value || null,
    birthHeightCm: document.getElementById('cf-birthheight').value || null,
    allergies: document.getElementById('cf-allergies').value.split(',').map((s) => s.trim()).filter(Boolean),
    medicalConditions: document.getElementById('cf-conditions').value.split(',').map((s) => s.trim()).filter(Boolean),
    emergencyContact: {
      name: document.getElementById('cf-ec-name').value.trim(),
      phone: document.getElementById('cf-ec-phone').value.trim(),
    },
    doctor: {
      name: document.getElementById('cf-doc-name').value.trim(),
      phone: document.getElementById('cf-doc-phone').value.trim(),
    },
  };
}

/** Opens the add/edit child modal. Calls onSaved(child) after a successful save. */
export function openChildFormModal(child = null, onSaved) {
  const isEdit = Boolean(child);

  openModal({
    title: isEdit ? 'Edit Child' : 'Add Child',
    bodyHtml: `<form id="childForm">${childFormFields(child || {})}</form>`,
    footerHtml: `
      <button class="btn btn-secondary" data-modal-close>Cancel</button>
      <button class="btn btn-primary" id="saveChildBtn">${isEdit ? 'Save Changes' : 'Add Child'}</button>
    `,
  });

  document.getElementById('saveChildBtn').addEventListener('click', async () => {
    const data = readChildForm();
    const errors = validateForm(data, {
      name: [(v) => rules.required(v, 'Name')],
      dateOfBirth: [(v) => rules.required(v, 'Date of birth')],
    });

    document.querySelectorAll('.form-error').forEach((el) => el.classList.add('hidden'));
    if (Object.keys(errors).length) {
      Object.entries(errors).forEach(([field, msg]) => {
        const el = document.getElementById(`err-${field === 'dateOfBirth' ? 'dob' : field}`);
        if (el) { el.textContent = msg; el.classList.remove('hidden'); }
      });
      return;
    }

    const btn = document.getElementById('saveChildBtn');
    btn.disabled = true;
    btn.textContent = 'Saving...';

    try {
      const res = isEdit
        ? await api.patch(`/children/${child._id}`, data)
        : await api.post('/children', data);
      showToast(isEdit ? 'Child updated' : 'Child added', 'success');
      closeModal();
      onSaved?.(res.data.child);
    } catch (err) {
      showToast(err.message, 'error');
      btn.disabled = false;
      btn.textContent = isEdit ? 'Save Changes' : 'Add Child';
    }
  });
}

export async function deleteChild(childId) {
  await api.delete(`/children/${childId}`);
}

export async function uploadChildPhoto(childId, file) {
  const formData = new FormData();
  formData.append('photo', file);
  const res = await api.post(`/children/${childId}/photo`, formData);
  return res.data.child;
}
