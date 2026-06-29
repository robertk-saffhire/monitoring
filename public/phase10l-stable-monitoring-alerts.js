(function () {
  const FILTER_KEY = 'saffhire_stable_monitoring_filter';
  let currentSort = { key: '', dir: 'asc' };
  let lastSignature = '';

  function text(el) {
    return (el && el.textContent ? el.textContent : '').trim();
  }

  function pageTitle() {
    const h1 = document.querySelector('.page-header h1');
    return text(h1);
  }

  function isMonitoringPage() {
    return pageTitle() === 'Monitoring';
  }

  function getMonitoringTable() {
    const tables = Array.from(document.querySelectorAll('table'));
    return tables.find((table) => {
      const headers = Array.from(table.querySelectorAll('thead th')).map((th) => text(th).toLowerCase());
      return headers.includes('file #') &&
        headers.includes('name') &&
        headers.includes('order date') &&
        headers.includes('monitoring') &&
        headers.includes('med expire');
    }) || null;
  }

  function getRows() {
    const table = getMonitoringTable();
    if (!table) return [];
    return Array.from(table.querySelectorAll('tbody tr')).filter((row) => row.querySelectorAll('td').length >= 7);
  }

  function cells(row) {
    return Array.from(row.querySelectorAll('td'));
  }

  function controlValue(cell) {
    if (!cell) return '';
    const input = cell.querySelector('input');
    if (input) return String(input.value || '').trim();
    const select = cell.querySelector('select');
    if (select) return String(select.value || '').trim();
    const textarea = cell.querySelector('textarea');
    if (textarea) return String(textarea.value || '').trim();
    return text(cell);
  }

  function parseDate(value) {
    const raw = String(value || '').trim();
    if (!raw || raw === '—') return null;

    const iso = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));

    const us = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/);
    if (us) {
      const year = us[3].length === 2 ? Number('20' + us[3]) : Number(us[3]);
      return new Date(year, Number(us[1]) - 1, Number(us[2]));
    }

    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  function todayOnly() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  function daysUntil(date) {
    if (!date) return null;
    return Math.ceil((date.getTime() - todayOnly().getTime()) / 86400000);
  }

  function rowData(row) {
    const c = cells(row);
    const medExpire = controlValue(c[5]);
    const medDate = parseDate(medExpire);
    return {
      fileNumber: text(c[0]),
      name: text(c[1]),
      orderDate: text(c[2]),
      monitoring: controlValue(c[3]),
      mvrStatus: text(c[4]),
      medExpire,
      medDate,
      medDays: daysUntil(medDate),
      notes: controlValue(c[6])
    };
  }

  function rowState(row) {
    const data = rowData(row);
    if (data.monitoring !== 'On') return 'off';
    if (!data.medDate) return 'blank-med';
    if (data.medDays < 0) return 'expired-med';
    if (data.medDays <= 30) return 'expiring-30';
    if (data.medDays <= 60) return 'expiring-60';
    if (/pending|review|needed|expired|attention/i.test(data.mvrStatus || '')) return 'mvr-attention';
    return 'ok';
  }

  function counts() {
    const out = {
      total: 0,
      on: 0,
      off: 0,
      expired: 0,
      exp30: 0,
      exp60: 0,
      blankMed: 0,
      mvr: 0
    };

    getRows().forEach((row) => {
      const data = rowData(row);
      const state = rowState(row);
      out.total += 1;
      if (data.monitoring === 'On') out.on += 1;
      else out.off += 1;
      if (state === 'expired-med') out.expired += 1;
      if (state === 'expiring-30') out.exp30 += 1;
      if (state === 'expiring-60') out.exp60 += 1;
      if (state === 'blank-med') out.blankMed += 1;
      if (state === 'mvr-attention') out.mvr += 1;
    });

    return out;
  }

  function shouldShow(row, filter) {
    const data = rowData(row);
    const state = rowState(row);
    if (filter === 'all') return true;
    if (filter === 'on') return data.monitoring === 'On';
    if (filter === 'off') return data.monitoring !== 'On';
    if (filter === 'expired') return state === 'expired-med';
    if (filter === 'exp30') return state === 'expiring-30';
    if (filter === 'exp60') return state === 'expiring-60';
    if (filter === 'blankMed') return state === 'blank-med';
    if (filter === 'mvr') return state === 'mvr-attention';
    return true;
  }

  function applyFilter(filter) {
    localStorage.setItem(FILTER_KEY, filter);
    getRows().forEach((row) => {
      row.style.display = shouldShow(row, filter) ? '' : 'none';
    });
    document.querySelectorAll('[data-stable-monitoring-filter]').forEach((button) => {
      button.classList.toggle('active', button.dataset.stableMonitoringFilter === filter);
    });
  }

  function numeric(value) {
    const n = Number(String(value || '').replace(/[^0-9.-]/g, ''));
    return Number.isFinite(n) ? n : 0;
  }

  function sortValue(row, key) {
    const data = rowData(row);
    if (key === 'file') return numeric(data.fileNumber);
    if (key === 'name') return data.name.toLowerCase();
    if (key === 'order') return data.orderDate ? (parseDate(data.orderDate)?.getTime() || 0) : 0;
    if (key === 'med') return data.medDate ? data.medDate.getTime() : 0;
    return '';
  }

  function sortRows(key, forceDir) {
    const table = getMonitoringTable();
    if (!table) return;
    const tbody = table.querySelector('tbody');
    if (!tbody) return;

    const rows = getRows();
    const dir = forceDir || (currentSort.key === key && currentSort.dir === 'asc' ? 'desc' : 'asc');
    currentSort = { key, dir };

    rows.sort((a, b) => {
      const av = sortValue(a, key);
      const bv = sortValue(b, key);
      if (typeof av === 'number' && typeof bv === 'number') return dir === 'asc' ? av - bv : bv - av;
      const result = String(av).localeCompare(String(bv), undefined, { sensitivity: 'base', numeric: true });
      return dir === 'asc' ? result : -result;
    });

    rows.forEach((row) => tbody.appendChild(row));
    updateSortIndicators();
    applyFilter(localStorage.getItem(FILTER_KEY) || 'all');
  }

  function updateSortIndicators() {
    const table = getMonitoringTable();
    if (!table) return;
    const heads = Array.from(table.querySelectorAll('thead th'));
    const map = { file: 0, name: 1, order: 2, med: 5 };
    Object.entries(map).forEach(([key, index]) => {
      const th = heads[index];
      if (!th) return;
      const label = th.dataset.stableLabel || text(th).replace(/[↕↑↓]/g, '').trim();
      th.dataset.stableLabel = label;
      th.innerHTML = currentSort.key === key
        ? `${label} <span class="stable-sort-arrow">${currentSort.dir === 'asc' ? '↑' : '↓'}</span>`
        : `${label} <span class="stable-sort-arrow muted">↕</span>`;
      th.classList.add('stable-sortable');
      if (!th.dataset.stableSortReady) {
        th.dataset.stableSortReady = 'true';
        th.addEventListener('click', () => sortRows(key));
      }
    });
  }

  function cleanOldPanels() {
    if (!isMonitoringPage()) return;

    const ids = [
      'phase8-panel',
      'phase9-permission-panel',
      'phase5a-panel',
      'phase6-panel',
      'phase7-panel',
      'phase7a-panel',
      'phase10-panel'
    ];

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.remove();
    });

    Array.from(document.querySelectorAll('section.card, div.card, .wide-card')).forEach((card) => {
      const t = text(card);
      if (
        t.includes('Phase 9 Permissions') ||
        t.includes('Phase 8 Monitoring Alerts') ||
        t.includes('Phase 5A Gmail Workflow') ||
        t.includes('Phase 6 Employer Response Form') ||
        t.includes('Phase 7 Completed Packet') ||
        t.includes('Phase 7A FMCSA PDF Mapping') ||
        t.includes('PDF Import to Applicant Database')
      ) {
        card.remove();
      }
    });
  }

  function ensurePanel() {
    const header = Array.from(document.querySelectorAll('.page-header h1')).find((h) => text(h) === 'Monitoring');
    if (!header) return null;

    let panel = document.getElementById('stable-monitoring-alerts-panel');
    if (!panel) {
      panel = document.createElement('section');
      panel.id = 'stable-monitoring-alerts-panel';
      panel.className = 'card wide-card stable-monitoring-panel';
      header.closest('.page-header').insertAdjacentElement('afterend', panel);
    }
    return panel;
  }

  function panelHtml(c) {
    return `
      <div class="stable-monitoring-title">Monitoring Alerts</div>
      <div class="stable-monitoring-metrics">
        <button type="button" data-stable-monitoring-filter="all"><b>${c.total}</b>Total</button>
        <button type="button" data-stable-monitoring-filter="on"><b>${c.on}</b>On Monitoring</button>
        <button type="button" data-stable-monitoring-filter="off"><b>${c.off}</b>Off Monitoring</button>
        <button type="button" data-stable-monitoring-filter="expired"><b>${c.expired}</b>Expired Medical</button>
        <button type="button" data-stable-monitoring-filter="exp30"><b>${c.exp30}</b>Expiring 30 Days</button>
        <button type="button" data-stable-monitoring-filter="exp60"><b>${c.exp60}</b>Expiring 60 Days</button>
        <button type="button" data-stable-monitoring-filter="blankMed"><b>${c.blankMed}</b>Blank Med Expire</button>
        <button type="button" data-stable-monitoring-filter="mvr"><b>${c.mvr}</b>MVR Attention</button>
      </div>
      <div class="stable-monitoring-actions">
        <button type="button" data-stable-sort="file">Sort File #</button>
        <button type="button" data-stable-sort="name">Sort Name</button>
        <button type="button" data-stable-sort="order">Sort Order Date</button>
        <button type="button" data-stable-sort="med">Sort Med Expire</button>
        <button type="button" data-stable-recalculate>Recalculate Alerts</button>
      </div>
    `;
  }

  function decorateRows() {
    getRows().forEach((row) => {
      const c = cells(row);
      const state = rowState(row);
      row.classList.toggle('stable-row-expired', state === 'expired-med');
      row.classList.toggle('stable-row-warning', state === 'expiring-30');
      row.classList.toggle('stable-row-info', state === 'expiring-60');

      if (c[5]) {
        let badges = c[5].querySelector('.stable-med-badges');
        if (!badges) {
          badges = document.createElement('div');
          badges.className = 'stable-med-badges';
          c[5].appendChild(badges);
        }
        const data = rowData(row);
        if (state === 'expired-med') badges.innerHTML = '<span class="stable-badge danger">Medical expired</span>';
        else if (state === 'expiring-30') badges.innerHTML = `<span class="stable-badge warn">Medical expires ${data.medDays} days</span>`;
        else if (state === 'expiring-60') badges.innerHTML = `<span class="stable-badge info">Medical expires ${data.medDays} days</span>`;
        else badges.innerHTML = '';
      }
    });
  }

  function renderPanel() {
    const panel = ensurePanel();
    if (!panel) return;
    panel.innerHTML = panelHtml(counts());
    applyFilter(localStorage.getItem(FILTER_KEY) || 'all');
  }

  function addStyles() {
    if (document.getElementById('stable-monitoring-style')) return;
    const style = document.createElement('style');
    style.id = 'stable-monitoring-style';
    style.textContent = `
      body.stable-monitoring-page #phase9-permission-panel,
      body.stable-monitoring-page #phase8-panel,
      body.stable-monitoring-page #phase5a-panel,
      body.stable-monitoring-page #phase6-panel,
      body.stable-monitoring-page #phase7-panel,
      body.stable-monitoring-page #phase7a-panel,
      body.stable-monitoring-page #phase10-panel { display: none !important; }
      .stable-monitoring-panel { margin-bottom: 16px; padding: 16px; border-left: 5px solid #0ea5e9; }
      .stable-monitoring-title { font-weight: 900; margin-bottom: 10px; font-size: 17px; }
      .stable-monitoring-metrics { display: grid; grid-template-columns: repeat(4, minmax(130px, 1fr)); gap: 9px; }
      .stable-monitoring-metrics button { border: 1px solid #cbd5e1; background: #fff; color: #0f172a; border-radius: 12px; padding: 9px 12px; text-align: left; font-weight: 900; }
      .stable-monitoring-metrics button:hover, .stable-monitoring-metrics button.active { background: #e0f2fe; border-color: #0ea5e9; }
      .stable-monitoring-metrics b { display: block; font-size: 23px; line-height: 1.1; }
      .stable-monitoring-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
      .stable-monitoring-actions button { border: 1px solid #0ea5e9; background: #f0f9ff; color: #0369a1; border-radius: 999px; padding: 7px 10px; font-size: 12px; font-weight: 900; }
      .stable-monitoring-actions button:hover { background: #e0f2fe; }
      .stable-sortable { cursor: pointer; user-select: none; white-space: nowrap; }
      .stable-sortable:hover { background: #eef6ff !important; }
      .stable-sort-arrow { color: #0ea5e9; font-weight: 900; margin-left: 4px; }
      .stable-sort-arrow.muted { color: #94a3b8; }
      .stable-med-badges { margin-top: 5px; display: flex; flex-wrap: wrap; gap: 4px; }
      .stable-badge { border-radius: 999px; padding: 3px 7px; font-size: 11px; font-weight: 900; display: inline-flex; }
      .stable-badge.danger { background: #fee2e2; color: #991b1b; }
      .stable-badge.warn { background: #fef3c7; color: #92400e; }
      .stable-badge.info { background: #dbeafe; color: #1d4ed8; }
      .stable-row-expired td { box-shadow: inset 4px 0 0 #dc2626; }
      .stable-row-warning td { box-shadow: inset 4px 0 0 #f59e0b; }
      .stable-row-info td { box-shadow: inset 4px 0 0 #3b82f6; }
      @media(max-width: 1100px) { .stable-monitoring-metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
      @media(max-width: 680px) { .stable-monitoring-metrics { grid-template-columns: 1fr; } }
    `;
    document.head.appendChild(style);
  }

  document.addEventListener('click', function (event) {
    const filter = event.target && event.target.closest ? event.target.closest('[data-stable-monitoring-filter]') : null;
    if (filter) {
      applyFilter(filter.dataset.stableMonitoringFilter || 'all');
      return;
    }

    const sort = event.target && event.target.closest ? event.target.closest('[data-stable-sort]') : null;
    if (sort) {
      sortRows(sort.dataset.stableSort);
      return;
    }

    if (event.target && event.target.closest && event.target.closest('[data-stable-recalculate]')) {
      refresh(true);
    }
  });

  function signature() {
    return getRows().map((row) => {
      const d = rowData(row);
      return [d.fileNumber, d.name, d.orderDate, d.monitoring, d.medExpire, d.mvrStatus, d.notes].join('|');
    }).join('~').slice(0, 30000);
  }

  function refresh(force) {
    const monitoring = isMonitoringPage();
    document.body.classList.toggle('stable-monitoring-page', monitoring);
    if (!monitoring) return;

    addStyles();
    cleanOldPanels();
    decorateRows();
    updateSortIndicators();

    const sig = signature();
    if (force || sig !== lastSignature) {
      lastSignature = sig;
      renderPanel();
      if (currentSort.key) sortRows(currentSort.key, currentSort.dir);
    }
  }

  const observer = new MutationObserver(() => {
    if (isMonitoringPage()) {
      cleanOldPanels();
    }
  });

  function boot() {
    addStyles();
    observer.observe(document.body, { childList: true, subtree: true });
    refresh(true);
    setInterval(() => refresh(false), 700);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
