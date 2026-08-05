// nutrition.js — Daily nutrition log: meals, calories, protein, water intake.

import { api } from './api.js';
import { openModal, closeModal } from './components/modal.js';
import { showToast } from './components/toast.js';

export async function fetchDailyNutrition(childId, date) {
  const query = date ? `?date=${date}` : '';
  const res = await api.get(`/children/${childId}/nutrition${query}`);
  return res.data; // { log, suggestions }
}

export async function updateWaterIntake(logId, waterIntakeMl) {
  return api.patch(`/nutrition/${logId}/water`, { waterIntakeMl });
}

export function mealRowHtml(meal) {
  const icons = { breakfast: 'fa-mug-hot', lunch: 'fa-bowl-food', dinner: 'fa-utensils', snack: 'fa-apple-whole' };
  return `
    <div class="activity-item">
      <div class="activity-item__icon"><i class="fa-solid ${icons[meal.type]}"></i></div>
      <div class="flex-1">
        <div class="activity-item__title">${meal.name}</div>
        <div class="activity-item__meta">${meal.type} · ${meal.calories} kcal · ${meal.proteinG}g protein</div>
      </div>
    </div>
  `;
}

export function openAddMealModal(childId, onSaved) {
  openModal({
    title: 'Log a Meal',
    bodyHtml: `
      <form id="mealForm">
        <div class="form-group">
          <label class="form-label" for="mf-name">Meal / food<span class="required">*</span></label>
          <input class="input" id="mf-name" placeholder="e.g. Dal, rice, vegetables">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="mf-type">Meal type</label>
            <select class="select" id="mf-type">
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snack</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="mf-cal">Calories</label>
            <input class="input" type="number" id="mf-cal" placeholder="0">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="mf-protein">Protein (g)</label>
          <input class="input" type="number" id="mf-protein" placeholder="0">
        </div>
      </form>
    `,
    footerHtml: `
      <button class="btn btn-secondary" data-modal-close>Cancel</button>
      <button class="btn btn-primary" id="saveMealBtn">Log Meal</button>
    `,
  });

  document.getElementById('saveMealBtn').addEventListener('click', async () => {
    const name = document.getElementById('mf-name').value.trim();
    if (!name) { showToast('Meal name is required', 'error'); return; }
    try {
      const res = await api.post(`/children/${childId}/nutrition/meals`, {
        name,
        type: document.getElementById('mf-type').value,
        calories: Number(document.getElementById('mf-cal').value) || 0,
        proteinG: Number(document.getElementById('mf-protein').value) || 0,
      });
      showToast('Meal logged', 'success');
      closeModal();
      onSaved?.(res.data.log);
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}
