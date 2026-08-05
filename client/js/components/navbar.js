// navbar.js — Renders the topbar: mobile menu button, global search, theme toggle,
// notification bell, and user menu with logout.

import { initials, resolveUploadUrl } from '../utils.js';
import { toggleMobileSidebar } from './sidebar.js';
import { toggleTheme, getTheme } from '../theme.js';
import { logout } from '../auth.js';

export function renderNavbar(user, { onSearch } = {}) {
  const root = document.getElementById('topbar-root');
  if (!root) return;

  root.innerHTML = `
    <header class="topbar">
      <div class="flex items-center gap-3">
        <button class="icon-btn mobile-menu-btn" id="mobileMenuBtn" aria-label="Open menu">
          <i class="fa-solid fa-bars"></i>
        </button>
        <div class="topbar__search input-group mobile-hidden">
          <i class="fa-solid fa-magnifying-glass input-group__icon" aria-hidden="true"></i>
          <input type="search" class="input" id="globalSearch" placeholder="Search children, records..." aria-label="Global search">
          <kbd class="input-group__action" style="pointer-events:none; font-size:var(--fs-xs); background:var(--color-primary-softer); padding:2px 6px; border-radius:6px; color:var(--color-muted);">⌘K</kbd>
        </div>
      </div>
      <div class="topbar__actions">
        <button class="icon-btn theme-toggle" id="themeToggleBtn" aria-label="Toggle dark mode" data-tooltip="Toggle theme">
          <i class="fa-solid ${getTheme() === 'dark' ? 'fa-sun' : 'fa-moon'}"></i>
        </button>
        <button class="icon-btn" id="notifBtn" aria-label="Notifications" data-tooltip="Notifications">
          <i class="fa-solid fa-bell"></i>
          <span class="icon-btn__badge hidden" id="notifBadge"></span>
        </button>
        <div class="relative">
          <button class="user-menu" id="userMenuBtn" aria-haspopup="true" aria-expanded="false">
            ${user?.avatar
              ? `<img src="${resolveUploadUrl(user.avatar)}" class="user-menu__avatar" alt="${user.name}">`
              : `<span class="avatar avatar-sm">${initials(user?.name)}</span>`}
            <span class="user-menu__name text-sm font-medium mobile-hidden">${user?.name || ''}</span>
            <i class="fa-solid fa-chevron-down text-xs mobile-hidden" aria-hidden="true"></i>
          </button>
        </div>
      </div>
    </header>
  `;

  document.getElementById('mobileMenuBtn')?.addEventListener('click', toggleMobileSidebar);
  document.getElementById('themeToggleBtn')?.addEventListener('click', (e) => {
    toggleTheme();
    e.currentTarget.querySelector('i').className = `fa-solid ${getTheme() === 'dark' ? 'fa-sun' : 'fa-moon'}`;
  });

  if (onSearch) {
    document.getElementById('globalSearch')?.addEventListener('input', (e) => onSearch(e.target.value));
  }

  document.getElementById('notifBtn')?.addEventListener('click', () => {
    window.location.href = '/pages/dashboard.html#notifications';
  });

  document.getElementById('userMenuBtn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    openUserMenu(e.currentTarget);
  });
}

function openUserMenu(anchor) {
  const existing = document.getElementById('userMenuDropdown');
  if (existing) { existing.remove(); return; }

  const rect = anchor.getBoundingClientRect();
  const menu = document.createElement('div');
  menu.id = 'userMenuDropdown';
  menu.className = 'card animate-scale-in';
  menu.style.cssText = `position:fixed; top:${rect.bottom + 8}px; right:16px; z-index:var(--z-dropdown); min-width:200px; padding:var(--space-2);`;
  menu.innerHTML = `
    <a href="/pages/profile.html" class="nav-link"><i class="fa-solid fa-user"></i><span>My Profile</span></a>
    <a href="/pages/profile.html#settings" class="nav-link"><i class="fa-solid fa-gear"></i><span>Settings</span></a>
    <hr class="divider" style="margin: var(--space-2) 0;">
    <button class="nav-link w-full" id="logoutBtn" style="text-align:left;"><i class="fa-solid fa-right-from-bracket"></i><span>Log out</span></button>
  `;
  document.body.appendChild(menu);

  document.getElementById('logoutBtn').addEventListener('click', logout);

  const closeOnOutsideClick = (e) => {
    if (!menu.contains(e.target)) {
      menu.remove();
      document.removeEventListener('click', closeOnOutsideClick);
    }
  };
  setTimeout(() => document.addEventListener('click', closeOnOutsideClick), 0);
}
