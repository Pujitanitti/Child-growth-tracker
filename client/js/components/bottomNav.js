// bottomNav.js — Mobile bottom navigation bar (🏠 Home, 👶 Children, 📈 Growth,
// 🩺 Health, 👤 Profile). Hidden on desktop via CSS; auto-injected by app.js
// so individual pages don't need to add markup for it.

const ITEMS = [
  { href: '/pages/dashboard.html', icon: 'fa-house', label: 'Home', key: 'dashboard' },
  { href: '/pages/children.html', icon: 'fa-child-reaching', label: 'Children', key: 'children' },
  { href: '/pages/compare.html', icon: 'fa-chart-line', label: 'Growth', key: 'compare' },
  { href: '/pages/emergency-card.html', icon: 'fa-notes-medical', label: 'Health', key: 'emergency' },
  { href: '/pages/profile.html', icon: 'fa-user', label: 'Profile', key: 'profile' },
];

export function renderBottomNav(activeKey) {
  if (document.querySelector('.bottom-nav')) return; // avoid double-mounting

  const nav = document.createElement('nav');
  nav.className = 'bottom-nav';
  nav.setAttribute('aria-label', 'Mobile navigation');
  nav.innerHTML = ITEMS.map((item) => `
    <a href="${item.href}" class="bottom-nav__item ${item.key === activeKey ? 'active' : ''}">
      <i class="fa-solid ${item.icon}" aria-hidden="true"></i>
      <span>${item.label}</span>
    </a>
  `).join('');

  document.body.appendChild(nav);
}
