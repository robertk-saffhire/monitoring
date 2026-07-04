(function () {
  const SORTABLE_HEADERS = [
    { label: 'File #', type: 'number' },
    { label: 'Name', type: 'text' },
    { label: 'Order Date', type: 'date' },
    { label: 'Monitoring', type: 'text' },
    { label: 'MVR Status', type: 'text' },
    { label: 'Med Expire', type: 'date' },
    { label: 'Notes', type: 'text' }
  ];

  let currentSort = { index: -1, direction: 'asc' };

  function text(el) {
    return (el && el.textContent ? el.textContent : '').trim();
  }

  function normalizeHeader(value) {
    return String(value || '')
      .replace(/[↕↑↓▲▼]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  function pageTitle() {
    return text(document.querySelector('.page-header h1'));
  }

  function isMonitoringPage() {
    return pageTitle() === 'Monitoring';
  }

  function getMonitoringTable() {
    if (!isMonitoringPage()) return null;

    const tables = Array.from(document.querySelectorAll('table'));
    return tables.find((table) => {
      const headers = Array.from(table.querySelectorAll('thead th')).map((th) => normalizeHeader(text(th)));
      return headers.includes('file #') &&
        headers.includes('name') &&
        headers.includes('order date') &&
        headers.includes('monitoring') &&
        headers.includes('mvr status') &&
        headers.includes('med expire');
    }) || null;
  }

  function cellValue(row, index, type) {
    const cell = row.children[index];
    if (!cell) return '';

    const select = cell.querySelector('select');
    if (select) return select.value || '';

    const input = cell.querySelector('input');
    if (input) return input.value || '';

    const textarea = cell.querySelector('textarea');
    if (textarea) return textarea.value || '';

    const raw = text(cell);

    if (type === 'number') {
      const number = Number(String(raw).replace(/[^0-9.-]/g, ''));
      return Number.isNaN(number) ? raw.toLowerCase() : number;
    }

    if (type === 'date') {
      if (!raw) return 0;
      const date = new Date(raw);
      return Number.isNaN(date.getTime()) ? raw.toLowerCase() : date.getTime();
    }

    return raw.toLowerCase();
  }

  function compareValues(a, b) {
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
  }

  function sortTable(table, columnIndex, type) {
    const tbody = table.querySelector('tbody');
    if (!tbody) return;

    const rows = Array.from(tbody.querySelectorAll('tr')).filter((row) => row.children.length > columnIndex);
    if (!rows.length) return;

    const direction = currentSort.index === columnIndex && currentSort.direction === 'asc' ? 'desc' : 'asc';
    currentSort = { index: columnIndex, direction };

    rows.sort((ra, rb) => {
      const av = cellValue(ra, columnIndex, type);
      const bv = cellValue(rb, columnIndex, type);
      const result = compareValues(av, bv);
      return direction === 'asc' ? result : -result;
    });

    const fragment = document.createDocumentFragment();
    rows.forEach((row) => fragment.appendChild(row));
    tbody.appendChild(fragment);

    updateHeaderIcons(table, columnIndex, direction);
  }

  function updateHeaderIcons(table, activeIndex, direction) {
    Array.from(table.querySelectorAll('thead th')).forEach((th, index) => {
      const button = th.querySelector('[data-phase12a35-sort-button]');
      if (!button) return;

      const icon = button.querySelector('.phase12a35-sort-icon');
      if (icon) {
        icon.textContent = index === activeIndex ? (direction === 'asc' ? '↑' : '↓') : '↕';
        icon.classList.toggle('active', index === activeIndex);
      }

      button.setAttribute('aria-sort', index === activeIndex ? (direction === 'asc' ? 'ascending' : 'descending') : 'none');
    });
  }

  function enhanceTable() {
    const table = getMonitoringTable();
    if (!table || table.dataset.phase12a35Enhanced === '1') return;

    const headers = Array.from(table.querySelectorAll('thead th'));

    headers.forEach((th, index) => {
      const clean = normalizeHeader(text(th));
      const config = SORTABLE_HEADERS.find((h) => clean === h.label.toLowerCase());
      if (!config) return;

      th.dataset.phase12a35Sortable = '1';
      th.innerHTML = '';

      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.phase12a35SortButton = '1';
      button.className = 'phase12a35-sort-header';
      button.title = 'Sort by ' + config.label;
      button.innerHTML = '<span>' + config.label + '</span><span class="phase12a35-sort-icon">↕</span>';

      button.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        sortTable(table, index, config.type);
      });

      th.appendChild(button);
    });

    table.dataset.phase12a35Enhanced = '1';
  }

  function addStyles() {
    if (document.getElementById('phase12a35-style')) return;

    const style = document.createElement('style');
    style.id = 'phase12a35-style';
    style.textContent = `
      .phase12a35-sort-header {
        width: 100%;
        border: 0;
        background: transparent;
        color: inherit;
        display: inline-flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 0;
        font: inherit;
        font-weight: 900;
        text-transform: inherit;
        letter-spacing: inherit;
        cursor: pointer;
      }
      .phase12a35-sort-header:hover { color: #166534; }
      .phase12a35-sort-icon { color: #94a3b8; font-size: 13px; line-height: 1; }
      .phase12a35-sort-icon.active { color: #16a34a; font-weight: 1000; }
    `;

    document.head.appendChild(style);
  }

  function resetWhenLeavingPage() {
    if (!isMonitoringPage()) {
      currentSort = { index: -1, direction: 'asc' };
    }
  }

  function boot() {
    addStyles();
    enhanceTable();
    resetWhenLeavingPage();
    setInterval(() => {
      enhanceTable();
      resetWhenLeavingPage();
    }, 700);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
