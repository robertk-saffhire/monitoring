(function () {
  let currentSort = { key: '', dir: 'asc' };
  let isSorting = false;

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

  function getCellValue(row, index) {
    const cell = row.querySelectorAll('td')[index];
    if (!cell) return '';
    const input = cell.querySelector('input');
    if (input) return String(input.value || '').trim();
    const select = cell.querySelector('select');
    if (select) return String(select.value || '').trim();
    return text(cell);
  }

  function parseDate(value) {
    const raw = String(value || '').trim();
    if (!raw) return 0;

    const iso = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (iso) {
      return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3])).getTime();
    }

    const us = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/);
    if (us) {
      const year = us[3].length === 2 ? Number('20' + us[3]) : Number(us[3]);
      return new Date(year, Number(us[1]) - 1, Number(us[2])).getTime();
    }

    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? 0 : d.getTime();
  }

  function numeric(value) {
    const n = Number(String(value || '').replace(/[^0-9.-]/g, ''));
    return Number.isFinite(n) ? n : 0;
  }

  function sortValue(row, key) {
    if (key === 'file') return numeric(getCellValue(row, 0));
    if (key === 'name') return getCellValue(row, 1).toLowerCase();
    if (key === 'order') return parseDate(getCellValue(row, 2));
    if (key === 'med') return parseDate(getCellValue(row, 5));
    return '';
  }

  function sortRows(key, forceDir) {
    const table = getMonitoringTable();
    if (!table) return;

    const tbody = table.querySelector('tbody');
    if (!tbody) return;

    const rows = Array.from(tbody.querySelectorAll('tr')).filter((row) => row.querySelectorAll('td').length >= 7);
    if (!rows.length) return;

    const nextDir = forceDir || (currentSort.key === key && currentSort.dir === 'asc' ? 'desc' : 'asc');
    currentSort = { key, dir: nextDir };

    isSorting = true;

    rows.sort((a, b) => {
      const av = sortValue(a, key);
      const bv = sortValue(b, key);

      if (typeof av === 'number' && typeof bv === 'number') {
        return nextDir === 'asc' ? av - bv : bv - av;
      }

      const result = String(av).localeCompare(String(bv), undefined, { sensitivity: 'base', numeric: true });
      return nextDir === 'asc' ? result : -result;
    });

    rows.forEach((row) => tbody.appendChild(row));

    updateSortIndicators();

    setTimeout(() => {
      isSorting = false;
    }, 100);
  }

  function updateSortIndicators() {
    const table = getMonitoringTable();
    if (!table) return;

    const headers = Array.from(table.querySelectorAll('thead th'));
    const map = { file: 0, name: 1, order: 2, med: 5 };

    Object.entries(map).forEach(([key, index]) => {
      const th = headers[index];
      if (!th) return;

      const label = th.getAttribute('data-phase10i-label') || text(th).replace(/[↕↑↓]/g, '').trim();
      th.setAttribute('data-phase10i-label', label);

      if (currentSort.key === key) {
        th.innerHTML = `${label} <span class="phase10i-sort-arrow">${currentSort.dir === 'asc' ? '↑' : '↓'}</span>`;
      } else {
        th.innerHTML = `${label} <span class="phase10i-sort-arrow muted">↕</span>`;
      }
    });
  }

  function addHeaderSorting() {
    const table = getMonitoringTable();
    if (!table) return;

    const headers = Array.from(table.querySelectorAll('thead th'));
    const mappings = [
      ['file', 0],
      ['name', 1],
      ['order', 2],
      ['med', 5],
    ];

    mappings.forEach(([key, index]) => {
      const th = headers[index];
      if (!th || th.dataset.phase10iSortable === 'true') return;

      th.dataset.phase10iSortable = 'true';
      th.dataset.phase10iKey = key;
      th.classList.add('phase10i-sortable');
      th.title = 'Click to sort';
      th.addEventListener('click', () => sortRows(key));
    });

    updateSortIndicators();
  }

  function removePhase9FromMonitoring() {
    if (!isMonitoringPage()) return;

    const panel = document.getElementById('phase9-permission-panel');
    if (panel) panel.remove();

    Array.from(document.querySelectorAll('section.card, div.card, .wide-card')).forEach((card) => {
      if (text(card).includes('Phase 9 Permissions')) card.remove();
    });
  }

  function renameMonitoringAlerts() {
    if (!isMonitoringPage()) return;

    const title = document.querySelector('#phase8-panel .phase8-title');
    if (title && text(title).includes('Phase 8')) {
      title.textContent = 'Monitoring Alerts';
    }

    Array.from(document.querySelectorAll('section.card, div.card, .wide-card')).forEach((card) => {
      const h2 = card.querySelector('h2');
      if (h2 && text(h2).includes('Phase 8 Monitoring Alerts')) {
        h2.textContent = 'Monitoring Alerts';
      }
    });
  }

  function addSortControls() {
    if (!isMonitoringPage()) return;

    const table = getMonitoringTable();
    if (!table) return;

    let controls = document.getElementById('phase10i-sort-controls');
    if (controls) return;

    const toolbar = Array.from(document.querySelectorAll('section.card')).find((section) => {
      return Boolean(section.querySelector('.search-box')) && Boolean(section.querySelector('select'));
    });

    controls = document.createElement('div');
    controls.id = 'phase10i-sort-controls';
    controls.className = 'phase10i-sort-controls';
    controls.innerHTML = `
      <span>Sort:</span>
      <button type="button" data-phase10i-sort="file">File #</button>
      <button type="button" data-phase10i-sort="name">Name</button>
      <button type="button" data-phase10i-sort="order">Order Date</button>
      <button type="button" data-phase10i-sort="med">Med Expire</button>
    `;

    if (toolbar) toolbar.insertAdjacentElement('afterend', controls);
    else table.insertAdjacentElement('beforebegin', controls);
  }

  function addStyles() {
    if (document.getElementById('phase10i-style')) return;

    const style = document.createElement('style');
    style.id = 'phase10i-style';
    style.textContent = `
      .phase10i-sortable { cursor: pointer; user-select: none; white-space: nowrap; }
      .phase10i-sortable:hover { background: #eef6ff !important; color: #0f172a; }
      .phase10i-sort-arrow { font-weight: 900; margin-left: 4px; color: #0ea5e9; }
      .phase10i-sort-arrow.muted { color: #94a3b8; }
      .phase10i-sort-controls {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
        margin: -2px 0 14px;
        padding: 0 4px;
        color: #64748b;
        font-size: 13px;
        font-weight: 800;
      }
      .phase10i-sort-controls button {
        border: 1px solid #0ea5e9;
        background: #f0f9ff;
        color: #0369a1;
        border-radius: 999px;
        padding: 7px 10px;
        font-size: 12px;
        font-weight: 900;
      }
      .phase10i-sort-controls button:hover {
        background: #e0f2fe;
      }
    `;
    document.head.appendChild(style);
  }

  document.addEventListener('click', function (event) {
    const button = event.target && event.target.closest ? event.target.closest('[data-phase10i-sort]') : null;
    if (!button) return;
    sortRows(button.dataset.phase10iSort);
  });

  function run() {
    if (!isMonitoringPage()) return;

    addStyles();
    removePhase9FromMonitoring();
    renameMonitoringAlerts();
    addHeaderSorting();
    addSortControls();

    if (currentSort.key && !isSorting) {
      sortRows(currentSort.key, currentSort.dir);
    }
  }

  setInterval(run, 700);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
