// sidebar.js — Renders the sidebar shell and wires collapse / mobile toggle behavior.

const NAV_ITEMS = [
  { section: 'Overview', items: [
    { href: '/pages/dashboard.html', icon: 'fa-gauge-high', label: 'Dashboard', key: 'dashboard' },
  ] },
  { section: 'Children', items: [
    { href: '/pages/children.html', icon: 'fa-child-reaching', label: 'All Children', key: 'children' },
    { href: '/pages/appointments-calendar.html', icon: 'fa-calendar-days', label: 'Appointments Calendar', key: 'calendar' },
    { href: '/pages/compare.html', icon: 'fa-people-arrows', label: 'Compare Siblings', key: 'compare' },
    { href: '/pages/reports.html', icon: 'fa-file-lines', label: 'Reports', key: 'reports' },
    { href: '/pages/emergency-card.html', icon: 'fa-id-card', label: 'Emergency Card', key: 'emergency' },
  ] },
  { section: 'Account', items: [
    { href: '/pages/profile.html', icon: 'fa-user-gear', label: 'Profile & Settings', key: 'profile' },
  ] },
];

const ADMIN_ITEM = { href: '/pages/admin.html', icon: 'fa-shield-halved', label: 'Admin Panel', key: 'admin' };

/** Renders the sidebar into #sidebar-root. `activeKey` highlights the current page. */
export function renderSidebar(activeKey, user) {
  const root = document.getElementById('sidebar-root');
  if (!root) return;

  const sections = [...NAV_ITEMS];
  if (user?.role === 'admin') {
    sections.push({ section: 'Administration', items: [ADMIN_ITEM] });
  }

  root.innerHTML = `
    <aside class="sidebar" aria-label="Main navigation">
      <div class="sidebar__brand">
        <svg class="sidebar__brand-mark" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <circle cx="20" cy="20" r="19" fill="var(--color-primary-soft)"/>
          <path d="M6 26 L14 18 L19 23 L26 12 L34 20" stroke="var(--color-primary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        </svg>
        <span class="sidebar__brand-name">GrowthTracker</span>
      </div>
      <nav class="sidebar__nav">
        ${sections.map((s) => `
          <div class="sidebar__section-label">${s.section}</div>
          ${s.items.map((item) => `
            <a href="${item.href}" class="nav-link ${item.key === activeKey ? 'active' : ''}">
              <i class="fa-solid ${item.icon}" aria-hidden="true"></i>
              <span class="nav-link__label">${item.label}</span>
            </a>
          `).join('')}
        `).join('')}
      </nav>
      <div class="sidebar__footer">
        <button class="sidebar__collapse-btn mobile-hidden" id="sidebarCollapseBtn" aria-label="Collapse sidebar">
          <i class="fa-solid fa-angles-left"></i>
        </button>
      </div>
    </aside>
    <div class="sidebar-backdrop" id="sidebarBackdrop"></div>
  `;

  const shell = document.querySelector('.app-shell');
  document.getElementById('sidebarCollapseBtn')?.addEventListener('click', () => {
    shell.classList.toggle('sidebar-collapsed');
    localStorage.setItem('cgt_sidebar_collapsed', shell.classList.contains('sidebar-collapsed'));
  });
  document.getElementById('sidebarBackdrop')?.addEventListener('click', () => {
    shell.classList.remove('sidebar-open');
  });

  if (localStorage.getItem('cgt_sidebar_collapsed') === 'true') {
    shell?.classList.add('sidebar-collapsed');
  }
}

export function toggleMobileSidebar() {
  document.querySelector('.app-shell')?.classList.toggle('sidebar-open');
}
