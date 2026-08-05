// appointments.js — Doctor appointment scheduling: list, create, complete/cancel.

import { api } from './api.js';
import { openModal, closeModal } from './components/modal.js';
import { showToast } from './components/toast.js';

export async function fetchAppointments(childId, status) {
  const query = status ? `?status=${status}` : '';
  const res = await api.get(`/children/${childId}/appointments${query}`);
  return res.data.appointments;
}

export async function updateAppointmentStatus(id, status) {
  return api.patch(`/appointments/${id}`, { status });
}

export async function deleteAppointment(id) {
  await api.delete(`/appointments/${id}`);
}

const STATUS_BADGE = { scheduled: 'badge-info', completed: 'badge-success', cancelled: 'badge-danger' };

export function appointmentCardHtml(a) {
  const dt = new Date(a.dateTime);
  return `
    <div class="card mb-3" data-id="${a._id}">
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-start gap-3">
          <div class="stat-card__icon info"><i class="fa-solid fa-calendar-check"></i></div>
          <div>
            <div class="font-semibold text-sm">${a.title}</div>
            <div class="text-xs text-muted">${dt.toLocaleDateString()} at ${dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            ${a.doctorName ? `<div class="text-xs text-muted">Dr. ${a.doctorName}${a.location ? ` · ${a.location}` : ''}</div>` : ''}
          </div>
        </div>
        <span class="badge ${STATUS_BADGE[a.status]}">${a.status}</span>
      </div>
      ${a.status === 'scheduled' ? `
        <div class="flex gap-2 mt-3">
          <button class="btn btn-sm btn-secondary" data-action="complete" data-id="${a._id}"><i class="fa-solid fa-check"></i> Mark done</button>
          <button class="btn btn-sm btn-ghost" data-action="cancel" data-id="${a._id}"><i class="fa-solid fa-xmark"></i> Cancel</button>
        </div>
      ` : ''}
    </div>
  `;
}

export function openAddAppointmentModal(childId, onSaved) {
  openModal({
    title: 'Schedule Appointment',
    bodyHtml: `
      <form id="apptForm">
        <div class="form-group">
          <label class="form-label" for="af-title">Title<span class="required">*</span></label>
          <input class="input" id="af-title" placeholder="e.g. Well-child checkup">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="af-date">Date &amp; time<span class="required">*</span></label>
            <input class="input" type="datetime-local" id="af-date">
          </div>
          <div class="form-group">
            <label class="form-label" for="af-doctor">Doctor name</label>
            <input class="input" id="af-doctor" placeholder="Optional">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="af-location">Location</label>
          <input class="input" id="af-location" placeholder="Clinic / hospital name">
        </div>
        <div class="form-group">
          <label class="form-label" for="af-reason">Reason for visit</label>
          <textarea class="textarea" id="af-reason" placeholder="Optional"></textarea>
        </div>
      </form>
    `,
    footerHtml: `
      <button class="btn btn-secondary" data-modal-close>Cancel</button>
      <button class="btn btn-primary" id="saveApptBtn">Schedule</button>
    `,
  });

  document.getElementById('saveApptBtn').addEventListener('click', async () => {
    const title = document.getElementById('af-title').value.trim();
    const dateTime = document.getElementById('af-date').value;
    if (!title || !dateTime) { showToast('Title and date/time are required', 'error'); return; }

    try {
      const res = await api.post(`/children/${childId}/appointments`, {
        title, dateTime,
        doctorName: document.getElementById('af-doctor').value.trim() || null,
        location: document.getElementById('af-location').value.trim() || null,
        reason: document.getElementById('af-reason').value.trim() || null,
      });
      showToast('Appointment scheduled', 'success');
      closeModal();
      onSaved?.(res.data.appointment);
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}
