(function () {
  let activeSort = { key: '', dir: 'asc' };
  let lastRowSignature = '';

  function text(el) {
    return (el && el.textContent ? el.textContent : '').trim();
  }

  function isMonitoringPage() {
    const h1 = document.querySelector('.page-header h1');
    return text(h1) === 'Monitoring';
  }

  function baseHeaderText(th) {
    return text(th).replace(/[↕↑↓]/g, '').trim();
  }

  function getMonitoringTable() {
    const tables = Array.from(document.querySelectorAll('table'));
    return tables.find((table) => {
      const headers = Array.from(table.querySelectorAll('thead th')).map((th) => baseHeaderText(th).toLowerCase());
      return headers.includes('file #') &&
        headers.includes('name') &&
        headers.includes('order date') &&
        headers.includes('monitoring') &&
        headers.includes('med expire');
    }) || null;
  }

  function rows() {
    const table = getMonitoringTable();
    if (!table) return [];
    const tbody = table.querySelector('tbody');
    if (!tbody) return [];
    return Array.from(tbody.querySelectorAll(':scope > tr')).filter((row) => row.querySelectorAll('td').length >= 7);
  }

  function cells(row) {
    return Array.from(row.querySelectorAll('td'));
  }

  function cellValue(row, index) {
    const cell = cells(row)[index];
    if (!cell) return '';
    const input = cell.querySelector('input');
    if (input) return String(input.value || '').trim();
    const select = cell.querySelector('select');
    if (select) return String(select.value || '').trim();
    const textarea = cell.querySelector('textarea');
    if (textarea) return String(textarea.value || '').trim();
    return text(cell);
  }

  function parseDate(raw) {
    const value = String(raw || '').trim();
    if (!value) return 0;
    let m = value.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).getTime();
    m = value.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/);
    if (m) {
      const year = m[3].length === 2 ? Number('20' + m[3]) : Number(m[3]);
      return new Date(year, Number(m[1]) - 1, Number(m[2])).getTime();
    }
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? 0 : d.getTime();
  }

  function parseFileNumber(value) {
    const n = Number(String(value || '').replace(/[^0-9.-]/g, ''));
    return Number.isFinite(n) ? n : 0;
  }

  function sortValue(row, key) {
    if (key === 'file') return parseFileNumber(cellValue(row, 0));
    if (key === 'name') return cellValue(row, 1).toLowerCase();
    if (key === 'order') return parseDate(cellValue(row, 2));
    if (key === 'med') return parseDate(cellValue(row, 5));
    return '';
  }

  function compareRows(a, b, key, dir) {
    const av = sortValue(a, key);
    const bv = sortValue(b, key);
    let result = 0;
    if (typeof av === 'number' && typeof bv === 'number') result = av - bv;
    else result = String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: 'base' });
    return dir === 'asc' ? result : -result;
  }

  function sortTable(key, explicitDir) {
    const table = getMonitoringTable();
    if (!table) return;
    const tbody = table.querySelector('tbody');
    if (!tbody) return;

    const dir = explicitDir || (activeSort.key === key && activeSort.dir === 'asc' ? 'desc' : 'asc');
    activeSort = { key, dir };

    const sorted = rows()
      .map((row, originalIndex) => ({ row, originalIndex }))
      .sort((a, b) => compareRows(a.row, b.row, key, dir) || a.originalIndex - b.originalIndex)
      .map((item) => item.row);

    const fragment = document.createDocumentFragment();
    sorted.forEach((row) => fragment.appendChild(row));
    tbody.appendChild(fragment);

    markHeaders();
    lastRowSignature = rowSignature();
  }

  function headerMap() {
    return [
      { key: 'file', index: 0, label: 'FILE #' },
      { key: 'name', index: 1, label: 'NAME' },
      { key: 'order', index: 2, label: 'ORDER DATE' },
      { key: 'med', index: 5, label: 'MED EXPIRE' }
    ];
  }

  function markHeaders() {
    const table = getMonitoringTable();
    if (!table) return;
    const headers = Array.from(table.querySelectorAll('thead th'));
    headerMap().forEach(({ key, index, label }) => {
      const th = headers[index];
      if (!th) return;
      th.dataset.sortKey = key;
      th.dataset.sortLabel = label;
      th.classList.add('phase10p-sortable-header');
      const arrow = activeSort.key === key ? (activeSort.dir === 'asc' ? '↑' : '↓') : '↕';
      const muted = activeSort.key === key ? '' : ' muted';
      th.innerHTML = `${label} <span class="phase10p-arrow${muted}">${arrow}</span>`;
      th.title = `Sort by ${label}`;
    });
  }

  function rowSignature() {
    return rows().map((row) => [cellValue(row, 0), cellValue(row, 1), cellValue(row, 2), cellValue(row, 3), cellValue(row, 5)].join('|')).join('~').slice(0, 60000);
  }

  function addStyles() {
    if (document.getElementById('phase10p-style')) return;
    const style = document.createElement('style');
    style.id = 'phase10p-style';
    style.textContent = `
      .phase10p-sortable-header { cursor: pointer !important; user-select: none; white-space: nowrap; }
      .phase10p-sortable-header:hover { background: #e0f2fe !important; color: #0f172a !important; }
      .phase10p-arrow { display: inline-block; margin-left: 5px; font-weight: 900; color: #0ea5e9; }
      .phase10p-arrow.muted { color: #94a3b8; }
    `;
    document.head.appendChild(style);
  }

  function removeSortButtonsFromCards() {
    if (!isMonitoringPage()) return;
    document.querySelectorAll('[data-monitoring-sort], [data-mf-sort], [data-stable-sort], [data-phase10i-sort]').forEach((button) => button.remove());
    Array.from(document.querySelectorAll('.monitoring-alert-actions, .mf-actions, .stable-monitoring-actions, .phase10i-sort-controls')).forEach((holder) => {
      Array.from(holder.querySelectorAll('button')).forEach((button) => {
        if (/sort/i.test(text(button))) button.remove();
      });
      if (!holder.querySelector('button') && holder.classList.contains('phase10i-sort-controls')) holder.remove();
    });
  }

  document.addEventListener('click', function (event) {
    if (!isMonitoringPage()) return;
    const th = event.target && event.target.closest ? event.target.closest('th[data-sort-key]') : null;
    if (!th) return;
    const key = th.dataset.sortKey;
    if (!key) return;
    event.preventDefault();
    event.stopPropagation();
    sortTable(key);
  }, true);

  function refresh() {
    if (!isMonitoringPage()) return;
    addStyles();
    removeSortButtonsFromCards();
    markHeaders();
    const sig = rowSignature();
    if (activeSort.key && sig !== lastRowSignature) sortTable(activeSort.key, activeSort.dir);
    else lastRowSignature = sig;
  }

  const observer = new MutationObserver(() => {
    if (isMonitoringPage()) refresh();
  });

  function boot() {
    addStyles();
    observer.observe(document.body, { childList: true, subtree: true });
    refresh();
    setInterval(refresh, 800);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
