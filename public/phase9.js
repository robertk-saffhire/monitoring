(function () {
  let currentUser = null;
  let lastRole = '';

  function text(el) {
    return (el && el.textContent ? el.textContent : '').trim();
  }

  async function api(url, options) {
    const response = await fetch(url, Object.assign({ credentials: 'include' }, options || {}, {
      headers: Object.assign({ 'Content-Type': 'application/json' }, (options && options.headers) || {})
    }));
    const raw = await response.text();
    let data = {};
    try { data = raw ? JSON.parse(raw) : {}; } catch {}
    if (!response.ok) throw new Error(data.message || `Request failed: ${response.status}`);
    return data;
  }

  async function loadUser() {
    try {
      const data = await api('/api/auth/me');
      currentUser = data.user || null;
      return currentUser;
    } catch {
      currentUser = null;
      return null;
    }
  }

  function role() {
    return (currentUser && currentUser.role) || '';
  }

  function isAdmin() {
    return role() === 'admin';
  }

  function isViewer() {
    return role() === 'viewer';
  }

  function isUser() {
    return role() === 'user';
  }

  function activePageTitle() {
    const h1 = document.querySelector('.page-header h1');
    return text(h1);
  }

  function toast(message, danger) {
    let box = document.getElementById('phase9-toast');
    if (!box) {
      box = document.createElement('div');
      box.id = 'phase9-toast';
      document.body.appendChild(box);
    }
    box.className = danger ? 'phase9-toast danger' : 'phase9-toast';
    box.textContent = message;
    clearTimeout(box.__hideTimer);
    box.__hideTimer = setTimeout(() => box.remove(), 5000);
  }

  function roleLabel() {
    if (!currentUser) return '';
    const display = currentUser.displayName || currentUser.username || 'User';
    const label = role() === 'admin' ? 'Admin' : role() === 'user' ? 'User' : role() === 'viewer' ? 'Viewer' : role();
    return `${display} · ${label}`;
  }

  function addStyles() {
    if (document.getElementById('phase9-style')) return;
    const style = document.createElement('style');
    style.id = 'phase9-style';
    style.textContent = `
      .phase9-role-card { background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.12); border-radius: 14px; padding: 10px; margin: 12px 0; color: #e2e8f0; font-size: 13px; }
      .phase9-role-pill { display: inline-flex; align-items: center; border-radius: 999px; padding: 4px 9px; background: #1fff00; color: #0f172a; font-weight: 900; font-size: 12px; margin-top: 6px; }
      .phase9-permission-panel { margin-bottom: 16px; padding: 16px; border-left: 5px solid #111827; }
      .phase9-permission-panel h2 { margin: 0 0 8px; }
      .phase9-permission-grid { display: grid; grid-template-columns: repeat(4, minmax(130px, 1fr)); gap: 8px; margin-top: 10px; }
      .phase9-permission-grid span { border: 1px solid #e2e8f0; background: #f8fafc; border-radius: 12px; padding: 9px; font-size: 12px; font-weight: 800; color: #475569; }
      .phase9-permission-grid b { display: block; color: #111827; font-size: 14px; margin-bottom: 3px; }
      .phase9-readonly-banner { background: #eff6ff; border: 1px solid #bfdbfe; color: #1d4ed8; border-radius: 12px; padding: 10px 12px; margin: 0 0 14px; font-weight: 800; }
      .phase9-hidden { display: none !important; }
      .phase9-disabled { opacity: .45 !important; pointer-events: none !important; }
      .phase9-disabled-input { background: #f8fafc !important; color: #64748b !important; cursor: not-allowed !important; }
      .phase9-toast { position: fixed; right: 18px; bottom: 18px; z-index: 10010; background: #111827; color: #fff; border-radius: 12px; padding: 12px 14px; box-shadow: 0 18px 45px rgba(15,23,42,.25); font-size: 14px; max-width: 420px; }
      .phase9-toast.danger { background: #991b1b; }
      @media(max-width: 900px) { .phase9-permission-grid { grid-template-columns: 1fr 1fr; } }
      @media(max-width: 620px) { .phase9-permission-grid { grid-template-columns: 1fr; } }
    `;
    document.head.appendChild(style);
  }

  function ensureRoleCard() {
    if (!currentUser) return;
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;
    let card = document.getElementById('phase9-role-card');
    if (!card) {
      card = document.createElement('div');
      card.id = 'phase9-role-card';
      card.className = 'phase9-role-card';
      const sideTitle = sidebar.querySelector('.side-title');
      if (sideTitle) sideTitle.insertAdjacentElement('afterend', card);
      else sidebar.prepend(card);
    }
    card.innerHTML = `<div>Signed in as</div><strong>${roleLabel()}</strong><br/><span class="phase9-role-pill">${role() || 'unknown'}</span>`;
  }

  function hideSettingsForNonAdmin() {
    const navButtons = Array.from(document.querySelectorAll('.nav-btn'));
    const settingsButton = navButtons.find((button) => text(button).includes('Settings'));
    if (settingsButton) settingsButton.classList.toggle('phase9-hidden', !isAdmin());
  }

  function ensurePermissionPanel() {
    const title = activePageTitle();
    if (!title || title === 'Settings') return;

    const pageHeader = document.querySelector('.page-header');
    if (!pageHeader) return;

    let panel = document.getElementById('phase9-permission-panel');
    if (!panel) {
      panel = document.createElement('section');
      panel.id = 'phase9-permission-panel';
      panel.className = 'card wide-card phase9-permission-panel';
      pageHeader.insertAdjacentElement('afterend', panel);
    }

    let permissions = [];
    if (isAdmin()) {
      permissions = [
        ['Dashboard', 'Full access'],
        ['Monitoring', 'Edit'],
        ['Safety Performance', 'Edit / Delete'],
        ['Settings', 'Admin']
      ];
    } else if (isUser()) {
      permissions = [
        ['Dashboard', 'View'],
        ['Monitoring', 'Edit'],
        ['Safety Performance', 'Edit'],
        ['Settings', 'Hidden']
      ];
    } else if (isViewer()) {
      permissions = [
        ['Dashboard', 'View'],
        ['Monitoring', 'Read only'],
        ['Safety Performance', 'Read only'],
        ['Settings', 'Hidden']
      ];
    } else {
      permissions = [
        ['Dashboard', 'Limited'],
        ['Monitoring', 'Limited'],
        ['Safety Performance', 'Limited'],
        ['Settings', 'Hidden']
      ];
    }

    panel.innerHTML = `
      <h2>Phase 9 Permissions</h2>
      <p>Current role: <b>${role() || 'unknown'}</b>. Permissions are applied to the visible app controls.</p>
      <div class="phase9-permission-grid">
        ${permissions.map(([area, access]) => `<span><b>${area}</b>${access}</span>`).join('')}
      </div>
    `;
  }

  function ensureReadOnlyBanner() {
    const title = activePageTitle();
    if (!isViewer() || !['Monitoring', 'Safety Performance Reports'].includes(title)) {
      const existing = document.getElementById('phase9-readonly-banner');
      if (existing) existing.remove();
      return;
    }
    const header = document.querySelector('.page-header');
    if (!header || document.getElementById('phase9-readonly-banner')) return;
    const banner = document.createElement('div');
    banner.id = 'phase9-readonly-banner';
    banner.className = 'phase9-readonly-banner';
    banner.textContent = 'Viewer mode: this page is read-only. Editing, saving, sending, deleting, and status changes are disabled.';
    header.insertAdjacentElement('afterend', banner);
  }

  function buttonText(button) {
    return text(button).replace(/\s+/g, ' ').trim().toLowerCase();
  }

  function isSafeReadOnlyButton(button) {
    const label = buttonText(button);
    return (
      label.includes('refresh') ||
      label.includes('copy') ||
      label.includes('summary') ||
      label.includes('download') ||
      label.includes('pdf') ||
      label.includes('final packet') ||
      label.includes('reset view') ||
      label === 'all' ||
      label.includes('missing') ||
      label.includes('expired') ||
      label.includes('expiring') ||
      label.includes('mvr') ||
      label.includes('on monitoring') ||
      label.includes('off monitoring') ||
      label.includes('total') ||
      label.includes('due') ||
      label.includes('overdue') ||
      label.includes('completed') && button.closest('#phase4c-command-center')
    );
  }

  function applyViewerReadOnly() {
    const title = activePageTitle();
    if (!isViewer()) return;

    if (title === 'Monitoring') {
      document.querySelectorAll('table input, table select, table textarea').forEach((el) => {
        el.disabled = true;
        el.classList.add('phase9-disabled-input');
      });
      document.querySelectorAll('table button').forEach((button) => {
        if (!isSafeReadOnlyButton(button)) button.classList.add('phase9-hidden');
      });
    }

    if (title === 'Safety Performance Reports') {
      document.querySelectorAll('button').forEach((button) => {
        const label = buttonText(button);
        const shouldHide =
          label.includes('new report') ||
          label === 'new' ||
          label.includes('edit') ||
          label.includes('delete') ||
          label.includes('send direct') ||
          label.includes('open gmail') ||
          label.includes('mark sent') ||
          label.includes('+5 days') ||
          label.includes('emp complete') ||
          label === 'completed' ||
          label.includes('mark completed') ||
          label.includes('response link') ||
          label.includes('client gmail');
        if (shouldHide) button.classList.add('phase9-hidden');
      });
    }
  }

  function applyUserRestrictions() {
    const title = activePageTitle();
    if (!isUser()) return;

    if (title === 'Safety Performance Reports') {
      document.querySelectorAll('button').forEach((button) => {
        const label = buttonText(button);
        if (label.includes('delete')) button.classList.add('phase9-hidden');
      });
    }
  }

  function blockForbiddenClicks() {
    if (document.__phase9ClickGuard) return;
    document.__phase9ClickGuard = true;
    document.addEventListener('click', function (event) {
      const button = event.target && event.target.closest ? event.target.closest('button') : null;
      if (!button || !currentUser) return;
      const label = buttonText(button);

      if (isViewer()) {
        const forbidden =
          label.includes('save') ||
          label.includes('delete') ||
          label.includes('new') ||
          label.includes('send direct') ||
          label.includes('open gmail') ||
          label.includes('mark sent') ||
          label.includes('+5 days') ||
          label.includes('emp complete') ||
          label.includes('response link') ||
          label.includes('mark completed') ||
          label.includes('client gmail');
        if (forbidden) {
          event.preventDefault();
          event.stopPropagation();
          toast('Viewer role is read-only.', true);
        }
      }

      if (isUser() && label.includes('delete')) {
        event.preventDefault();
        event.stopPropagation();
        toast('Only admins can delete records.', true);
      }
    }, true);
  }

  function refresh() {
    if (!currentUser) return;
    addStyles();
    ensureRoleCard();
    hideSettingsForNonAdmin();
    ensurePermissionPanel();
    ensureReadOnlyBanner();
    applyViewerReadOnly();
    applyUserRestrictions();
    blockForbiddenClicks();
  }

  async function boot() {
    await loadUser();
    lastRole = role();
    refresh();
    setInterval(async () => {
      if (!currentUser) await loadUser();
      if (role() !== lastRole) {
        lastRole = role();
      }
      refresh();
    }, 1300);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
