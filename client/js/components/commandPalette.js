// commandPalette.js — A Ctrl/Cmd+K command palette for fast navigation and
// actions, in the spirit of Notion/Linear/Raycast. Pure vanilla JS, no
// dependency, opens as a centered modal-like overlay.

import { fetchChildren } from '../children.js';

const STATIC_COMMANDS = [
  { icon: 'fa-gauge-high', label: 'Go to Dashboard', href: '/pages/dashboard.html', keywords: 'home overview' },
  { icon: 'fa-child-reaching', label: 'Go to Children', href: '/pages/children.html', keywords: 'kids family' },
  { icon: 'fa-people-arrows', label: 'Compare Siblings', href: '/pages/compare.html', keywords: 'growth chart compare' },
  { icon: 'fa-calendar-days', label: 'Go to Appointments Calendar', href: '/pages/appointments-calendar.html', keywords: 'schedule doctor visit' },
  { icon: 'fa-file-lines', label: 'Go to Reports', href: '/pages/reports.html', keywords: 'pdf csv download' },
  { icon: 'fa-id-card', label: 'Go to Emergency Card', href: '/pages/emergency-card.html', keywords: 'qr blood group allergy' },
  { icon: 'fa-user-gear', label: 'Go to Profile & Settings', href: '/pages/profile.html', keywords: 'account password avatar' },
];

let paletteEl = null;

function buildPalette() {
  const backdrop = document.createElement('div');
  backdrop.className = 'cmdk-backdrop hidden';
  backdrop.innerHTML = `
    <div class="cmdk-panel animate-scale-in" role="dialog" aria-label="Command palette">
      <div class="cmdk-input-row">
        <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
        <input type="text" class="cmdk-input" id="cmdkInput" placeholder="Search pages, children, actions..." autocomplete="off">
        <kbd class="cmdk-kbd">Esc</kbd>
      </div>
      <div class="cmdk-results" id="cmdkResults"></div>
    </div>
  `;
  document.body.appendChild(backdrop);
  return backdrop;
}

async function getAllCommands() {
  let childCommands = [];
  try {
    const { children } = await fetchChildren();
    childCommands = children.map((c) => ({
      icon: 'fa-child', label: `Open ${c.name}'s profile`, href: `/pages/children.html#${c._id}`, keywords: c.name,
    }));
  } catch {
    // not fatal — palette still works with static commands if children can't be fetched
  }
  return [...STATIC_COMMANDS, ...childCommands];
}

function renderResults(resultsEl, commands, query) {
  const q = query.trim().toLowerCase();
  const filtered = q
    ? commands.filter((c) => `${c.label} ${c.keywords}`.toLowerCase().includes(q))
    : commands;

  resultsEl.innerHTML = filtered.length
    ? filtered.map((c, i) => `
        <a href="${c.href}" class="cmdk-item ${i === 0 ? 'active' : ''}" data-index="${i}">
          <i class="fa-solid ${c.icon}" aria-hidden="true"></i>
          <span>${c.label}</span>
          <i class="fa-solid fa-arrow-right cmdk-item__go" aria-hidden="true"></i>
        </a>
      `).join('')
    : '<div class="cmdk-empty">No matches. Try a different search.</div>';
}

export function initCommandPalette() {
  let commands = [];
  let activeIndex = 0;

  document.addEventListener('keydown', async (e) => {
    const isShortcut = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k';
    if (!isShortcut) return;
    e.preventDefault();

    if (!paletteEl) paletteEl = buildPalette();
    const input = document.getElementById('cmdkInput');
    const resultsEl = document.getElementById('cmdkResults');

    if (commands.length === 0) commands = await getAllCommands();
    activeIndex = 0;
    renderResults(resultsEl, commands, '');

    paletteEl.classList.remove('hidden');
    input.value = '';
    input.focus();

    input.oninput = () => { activeIndex = 0; renderResults(resultsEl, commands, input.value); };
    input.onkeydown = (ke) => {
      const items = resultsEl.querySelectorAll('.cmdk-item');
      if (ke.key === 'ArrowDown') { ke.preventDefault(); activeIndex = Math.min(activeIndex + 1, items.length - 1); }
      if (ke.key === 'ArrowUp') { ke.preventDefault(); activeIndex = Math.max(activeIndex - 1, 0); }
      if (ke.key === 'Enter') { items[activeIndex]?.click(); }
      items.forEach((item, i) => item.classList.toggle('active', i === activeIndex));
      if (ke.key === 'ArrowDown' || ke.key === 'ArrowUp') items[activeIndex]?.scrollIntoView({ block: 'nearest' });
    };

    paletteEl.onclick = (e2) => { if (e2.target === paletteEl) paletteEl.classList.add('hidden'); };
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && paletteEl && !paletteEl.classList.contains('hidden')) {
      paletteEl.classList.add('hidden');
    }
  });
}
