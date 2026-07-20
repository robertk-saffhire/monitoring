(function () {
  let activeUser = null;
  let readOnlyGuardInstalled = false;

  function text(el) { return (el && el.textContent ? el.textContent : '').trim(); }
  function role() { return String(activeUser?.role || ''); }
  function isAdmin() { return role() === 'admin'; }
  function isViewer() { return role() === 'viewer'; }
  function normalizeInternalAccess() {
    const source = activeUser?.internalAccess && typeof activeUser.internalAccess === 'object' ? activeUser.internalAccess : {};
    return {
      monitoring: Object.prototype.hasOwnProperty.call(source, 'monitoring') ? source.monitoring === true : true,
      safetyReports: Object.prototype.hasOwnProperty.call(source, 'safetyReports') ? source.safetyReports === true : true,
    };
  }
  async function getActiveUser() {
    const response = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || 'Could not read active session');
    activeUser = data.user || null;
  }
  function escapeHtml(value) {
    return String(value || '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  }
  function displayName() { return activeUser?.displayName || activeUser?.username || 'Unknown user'; }
  function addStyles() {
    if (document.getElementById('phase9b-style')) return;
    const style = document.createElement('style');
    style.id = 'phase9b-style';
    style.textContent = '.phase9b-hidden{display:none!important}.phase9b-disabled{opacity:.45!important;pointer-events:none!important}.phase9b-readonly-banner{background:#eff6ff;border:1px solid #bfdbfe;color:#1d4ed8;border-radius:12px;padding:10px 12px;margin:0 0 14px;font-weight:800}.phase9b-role-pill{display:inline-flex;align-items:center;border-radius:999px;padding:4px 9px;background:#1fff00;color:#0f172a;font-weight:900;font-size:12px;margin-top:6px}.phase9b-role-card-inner{color:#e2e8f0;font-size:13px}.phase9b-role-card-inner strong{display:block;margin-top:2px}';
    document.head.appendChild(style);
  }
  function syncRoleCard() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar || !activeUser) return;
    let card = document.getElementById('phase9-role-card');
    if (!card) {
      card = document.createElement('div');
      card.id = 'phase9-role-card';
      card.className = 'phase9-role-card';
      const title = sidebar.querySelector('.side-title');
      if (title) title.insertAdjacentElement('afterend', card); else sidebar.prepend(card);
    }
    const access = normalizeInternalAccess();
    const rights = isAdmin() ? 'All reports' : role() === 'user'
      ? [access.monitoring ? 'Monitoring Admin' : '', access.safetyReports ? 'Safety Admin' : ''].filter(Boolean).join(' · ')
      : role() === 'viewer' ? 'Read only' : '';
    card.innerHTML = `<div class="phase9b-role-card-inner"><div>Signed in as</div><strong>${escapeHtml(displayName())} · ${escapeHtml(role())}</strong><span class="phase9b-role-pill">${escapeHtml(rights || role())}</span></div>`;
  }
  function hideSettingsIfNeeded() {
    const access = normalizeInternalAccess();
    document.querySelectorAll('.nav-btn, [data-phase12a80-email-settings-nav]').forEach((button) => {
      const label = text(button).toLowerCase();
      if (label === 'settings' || (label.includes('settings') && !label.includes('email'))) {
        button.classList.toggle('phase9b-hidden', !isAdmin());
      }
      if (label.includes('email settings')) {
        button.classList.toggle('phase9b-hidden', !(isAdmin() || (role() === 'user' && access.safetyReports)));
      }
    });
  }
  function pageTitle() { return text(document.querySelector('.page-header h1')); }
  function ensureViewerBanner() {
    const existing = document.getElementById('phase9b-readonly-banner');
    if (!isViewer() || !['Monitoring','Safety Performance Reports'].includes(pageTitle())) { if (existing) existing.remove(); return; }
    if (existing) return;
    const header = document.querySelector('.page-header');
    if (!header) return;
    const banner = document.createElement('div');
    banner.id = 'phase9b-readonly-banner';
    banner.className = 'phase9b-readonly-banner';
    banner.textContent = 'Viewer mode: this page is read-only.';
    header.insertAdjacentElement('afterend', banner);
  }
  function applyViewerReadOnly() {
    if (!isViewer()) return;
    document.querySelectorAll('input,select,textarea').forEach((el) => {
      if (el.closest('.login-card,.search-box,.company-switcher')) return;
      el.disabled = true;
      el.classList.add('phase9b-disabled');
    });
    document.querySelectorAll('button').forEach((button) => {
      if (button.closest('nav') || /refresh|copy|download|pdf|summary|total|expired|expiring|mvr/i.test(text(button))) return;
      if (/save|delete|add|new|send|gmail|mark|complete|response link|import|data sync/i.test(text(button))) button.classList.add('phase9b-hidden');
    });
  }
  function installViewerGuard() {
    if (readOnlyGuardInstalled) return;
    readOnlyGuardInstalled = true;
    document.addEventListener('click', function (event) {
      if (!isViewer()) return;
      const button = event.target?.closest?.('button');
      if (!button) return;
      if (/save|delete|add|new|send|gmail|mark|complete|response link|import|data sync/i.test(text(button))) {
        event.preventDefault();
        event.stopPropagation();
      }
    }, true);
  }
  function syncPermissionPanel() {
    const panel = document.getElementById('phase9-permission-panel');
    if (!panel || !activeUser) return;
    const access = normalizeInternalAccess();
    const rows = isAdmin()
      ? [['Monitoring','Full admin'],['Safety Performance','Full admin'],['Settings','Full admin']]
      : role() === 'user'
        ? [['Monitoring',access.monitoring ? 'Full report admin' : 'No access'],['Safety Performance',access.safetyReports ? 'Full report admin' : 'No access'],['Settings','No access']]
        : [['Monitoring','Read only'],['Safety Performance','Read only'],['Settings','No access']];
    panel.innerHTML = `<h2>Permissions</h2><p>Current role: <b>${escapeHtml(role())}</b></p><div class="phase9-permission-grid">${rows.map(([area,value])=>`<span><b>${area}</b>${value}</span>`).join('')}</div>`;
  }
  function applyAll() {
    if (!activeUser) return;
    addStyles();
    syncRoleCard();
    hideSettingsIfNeeded();
    ensureViewerBanner();
    applyViewerReadOnly();
    installViewerGuard();
    syncPermissionPanel();
  }
  async function poll() {
    try { await getActiveUser(); applyAll(); } catch { activeUser = null; }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', poll); else poll();
  setInterval(poll, 1500);
})();
