// tabs.js — A reusable tab controller used by any page with a `.tabs`
// button row and matching `[data-panel]` elements (children.html, admin.html).
//
// What this solves, concretely:
//   1. Abrupt switching  → panels crossfade + slide instead of instant show/hide
//   2. Re-render flicker → each panel's `onActivate` callback fires ONCE per
//      page load (first visit to that tab), not on every click; callers that
//      need to force a refresh after a mutation (e.g. adding a growth record)
//      call their loader function directly, same as before — this only
//      removes the *redundant* refetch that happened just from clicking back
//      to a tab you'd already loaded
//   3. Lost scroll position → each tab's scroll offset is remembered and
//      restored when you switch back to it
//   4. Accessibility → full WAI-ARIA tabs pattern: roles, aria-selected,
//      roving tabindex, Arrow/Home/End keyboard navigation
//
// Respects prefers-reduced-motion automatically via the global rule in
// base.css (it collapses all transition/animation durations to ~0), so no
// special-casing is needed here.

/**
 * @param {HTMLElement} tabsContainer - the `.tabs` element holding `.tab-btn`s
 * @param {HTMLElement} panelsRoot - ancestor containing all `[data-panel]` elements
 * @param {{ onActivate?: (key: string, panel: HTMLElement) => void|Promise<void>, defaultTab?: string, autoActivate?: boolean }} opts
 *   `autoActivate` (default true): activates `defaultTab` immediately on setup.
 *   Set to false for pages where the tabs' data depends on something not yet
 *   available at setup time (e.g. children.html's tabs need a child to be
 *   selected first) — call `.activate(key, { force: true })` manually once
 *   that dependency is ready.
 * @returns {{ activate: Function, invalidate: (key: string) => void, invalidateAll: Function, refresh: () => void }}
 */
export function initTabs(tabsContainer, panelsRoot, { onActivate, defaultTab, autoActivate = true } = {}) {
  const tabButtons = Array.from(tabsContainer.querySelectorAll('.tab-btn'));
  const loaded = new Set();
  const scrollPositions = new Map();
  let currentKey = null;

  const getPanel = (key) => panelsRoot.querySelector(`[data-panel="${key}"]`);

  // --- One-time ARIA + DOM wiring -------------------------------------------------
  tabsContainer.setAttribute('role', 'tablist');
  tabsContainer.style.position = tabsContainer.style.position || 'relative';

  const indicator = document.createElement('span');
  indicator.className = 'tab-indicator';
  tabsContainer.appendChild(indicator);

  tabButtons.forEach((btn) => {
    const key = btn.dataset.tab;
    btn.setAttribute('role', 'tab');
    btn.id = btn.id || `tab-${key}`;
    btn.setAttribute('aria-controls', `panel-${key}`);
    btn.tabIndex = -1;

    const panel = getPanel(key);
    if (panel) {
      panel.setAttribute('role', 'tabpanel');
      panel.id = panel.id || `panel-${key}`;
      panel.setAttribute('aria-labelledby', btn.id);
      panel.tabIndex = 0;
      panel.classList.remove('hidden'); // dataset.state now owns visibility
      panel.dataset.state = 'hidden';
    }
  });

  function moveIndicatorTo(btn) {
    if (!btn) return;
    const containerRect = tabsContainer.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    indicator.style.width = `${btnRect.width}px`;
    indicator.style.transform = `translateX(${btnRect.left - containerRect.left}px)`;
  }

  // --- Core activation ------------------------------------------------------------
  async function activate(key, { skipScrollSave = false, force = false } = {}) {
    const nextPanel = getPanel(key);
    if (!nextPanel) return;

    const sameTabAlreadyActive = key === currentKey;
    if (sameTabAlreadyActive && !force) return;

    // Same panel is already the one showing (e.g. the underlying data source
    // changed — a different child was opened — while still "on" this same
    // tab). Nothing needs to visually swap, just refresh the content in place.
    if (sameTabAlreadyActive && force) {
      loaded.add(key);
      await onActivate?.(key, nextPanel);
      return;
    }

    if (currentKey && !skipScrollSave) scrollPositions.set(currentKey, window.scrollY);
    const prevPanel = currentKey ? getPanel(currentKey) : null;

    tabButtons.forEach((btn) => {
      const isActive = btn.dataset.tab === key;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', String(isActive));
      btn.tabIndex = isActive ? 0 : -1;
    });
    moveIndicatorTo(tabsContainer.querySelector(`.tab-btn[data-tab="${key}"]`));

    // Fade the old panel out, then hide it once the transition finishes
    // (with a timeout fallback in case transitionend never fires, e.g. no
    // layout change triggered a transition).
    if (prevPanel && prevPanel !== nextPanel) {
      prevPanel.dataset.state = 'leaving';
      const finishLeave = () => { prevPanel.dataset.state = 'hidden'; };
      prevPanel.addEventListener('transitionend', finishLeave, { once: true });
      setTimeout(finishLeave, 260);
    }

    // Fade the new panel in. Setting 'entering' then flipping to 'active' is
    // what makes the browser animate from the entering state rather than
    // snapping straight to active — but the browser only picks that up if a
    // style read forces it to actually commit the 'entering' layout first.
    // (A double requestAnimationFrame usually works for this but can
    // occasionally get batched away; reading offsetHeight forces a
    // synchronous reflow and is the more reliable technique.)
    nextPanel.dataset.state = 'entering';
    void nextPanel.offsetHeight; // eslint-disable-line no-unused-expressions
    nextPanel.dataset.state = 'active';

    currentKey = key;

    if (!loaded.has(key)) {
      loaded.add(key);
      await onActivate?.(key, nextPanel);
    }

    // Restore this tab's remembered scroll position (0 on first visit).
    requestAnimationFrame(() => {
      window.scrollTo({ top: scrollPositions.get(key) || 0, behavior: 'auto' });
    });
  }

  function focusAndActivate(index) {
    const wrapped = (index + tabButtons.length) % tabButtons.length;
    const btn = tabButtons[wrapped];
    btn.focus();
    activate(btn.dataset.tab);
  }

  tabButtons.forEach((btn, i) => {
    btn.addEventListener('click', () => activate(btn.dataset.tab));
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); focusAndActivate(i + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); focusAndActivate(i - 1); }
      else if (e.key === 'Home') { e.preventDefault(); focusAndActivate(0); }
      else if (e.key === 'End') { e.preventDefault(); focusAndActivate(tabButtons.length - 1); }
    });
  });

  window.addEventListener('resize', () => moveIndicatorTo(tabsContainer.querySelector('.tab-btn.active')));

  if (autoActivate) activate(defaultTab || tabButtons[0]?.dataset.tab, { skipScrollSave: true });

  return {
    activate,
    /** Forces the next visit to this tab to re-run onActivate (e.g. after a mutation elsewhere invalidates its data). */
    invalidate: (key) => loaded.delete(key),
    /** Clears every tab's loaded/scroll state at once — use when the underlying data source changes entirely (e.g. a different child was opened), not just one tab's data. */
    invalidateAll: () => { loaded.clear(); scrollPositions.clear(); },
    /** Re-runs onActivate for the currently active tab right now, without a full switch animation. */
    refresh: () => { if (currentKey) onActivate?.(currentKey, getPanel(currentKey)); },
  };
}
