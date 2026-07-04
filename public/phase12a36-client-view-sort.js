(function(){
  let sort={index:-1,direction:'asc',type:'text'};
  const HEADERS=[['File #','number'],['Name','text'],['Order Date','date'],['Monitoring','text'],['MVR Status','text'],['Med Expire','date'],['Notes','text']];
  function text(el){return(el&&el.textContent?el.textContent:'').trim()}
  function norm(v){return String(v||'').replace(/[↕↑↓]/g,'').replace(/\s+/g,' ').trim().toLowerCase()}
  function pageTitle(){return text(document.querySelector('.page-header h1'))}
  function isClientView(){return pageTitle()==='Client View'}
  function getTable(){if(!isClientView())return null;return [...document.querySelectorAll('table')].find(t=>{const h=[...t.querySelectorAll('thead th')].map(th=>norm(text(th)));return h.includes('file #')&&h.includes('monitoring')&&h.includes('med expire')})||null}
  function val(row,i,type){const c=row.children[i];if(!c)return'';const s=c.querySelector('select');if(s)return s.value||'';const ta=c.querySelector('textarea');if(ta)return ta.value||'';const raw=text(c);if(type==='number'){const n=Number(raw.replace(/[^0-9.-]/g,''));return Number.isNaN(n)?raw.toLowerCase():n}if(type==='date'){if(!raw)return 0;const d=new Date(raw);return Number.isNaN(d.getTime())?raw.toLowerCase():d.getTime()}return raw.toLowerCase()}
  function cmp(a,b){if(typeof a==='number'&&typeof b==='number')return a-b;return String(a).localeCompare(String(b),undefined,{numeric:true,sensitivity:'base'})}
  function icons(t){[...t.querySelectorAll('[data-phase12a36-admin-icon]')].forEach((ic,idx)=>{ic.textContent=idx===sort.index?(sort.direction==='asc'?'↑':'↓'):'↕';ic.classList.toggle('active',idx===sort.index)})}
  function sortTable(t,i,type){const tb=t.querySelector('tbody');if(!tb)return;const rows=[...tb.querySelectorAll('tr')].filter(r=>r.children.length>i);sort={index:i,type,direction:sort.index===i&&sort.direction==='asc'?'desc':'asc'};rows.sort((a,b)=>{const r=cmp(val(a,i,type),val(b,i,type));return sort.direction==='asc'?r:-r});rows.forEach(r=>tb.appendChild(r));icons(t)}
  function enhance(){const t=getTable();if(!t||t.dataset.phase12a36AdminSort==='1')return;[...t.querySelectorAll('thead th')].forEach((th,i)=>{const clean=norm(text(th));const cfg=HEADERS.find(h=>h[0].toLowerCase()===clean);if(!cfg)return;th.innerHTML='<button type="button" class="phase12a36-admin-sort-head"><span>'+cfg[0]+'</span><span data-phase12a36-admin-icon>↕</span></button>';th.querySelector('button').onclick=e=>{e.preventDefault();e.stopPropagation();sortTable(t,i,cfg[1])}});t.dataset.phase12a36AdminSort='1'}
  function style(){if(document.getElementById('phase12a36-admin-sort-style'))return;const s=document.createElement('style');s.id='phase12a36-admin-sort-style';s.textContent='.phase12a36-admin-sort-head{width:100%;border:0;background:transparent;color:inherit;display:flex;justify-content:space-between;gap:8px;padding:0;font:inherit;font-weight:1000;cursor:pointer}.phase12a36-admin-sort-head:hover{color:#166534}[data-phase12a36-admin-icon]{color:#94a3b8}[data-phase12a36-admin-icon].active{color:#16a34a;font-weight:1000}';document.head.appendChild(s)}
  function boot(){style();enhance();setInterval(enhance,700)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();


// Phase 12A-42: place Order MVR button inside the MVR Status column
(function () {
  const MVR_BASE = 'https://saffhiresecure.com/app/client/driverpipeline/mvr/';

  function text(el) {
    return (el && el.textContent ? el.textContent : '').trim();
  }

  function normalize(value) {
    return String(value || '')
      .replace(/[↕↑↓▲▼]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  function currentTitle() {
    return text(document.querySelector('.page-header h1')) || text(document.querySelector('.head h2'));
  }

  function activePortalPage() {
    const active = Array.from(document.querySelectorAll('nav button')).find((button) => button.classList.contains('active'));
    return active ? active.dataset.p : '';
  }

  function isMonitoringContext() {
    const title = currentTitle();
    return title === 'Monitoring' || activePortalPage() === 'mon' || title === 'Client View';
  }

  function getMonitoringTables() {
    if (!isMonitoringContext()) return [];

    return Array.from(document.querySelectorAll('table')).filter((table) => {
      const headers = Array.from(table.querySelectorAll('thead th')).map((th) => normalize(text(th)));
      return headers.includes('file #') &&
        (headers.includes('mvr status') || headers.includes('mvr') || headers.includes('order mvr')) &&
        (headers.includes('monitoring') || headers.includes('monitor status'));
    });
  }

  function headerIndexes(table) {
    const headers = Array.from(table.querySelectorAll('thead th')).map((th) => normalize(text(th)));

    return {
      headers,
      fileIndex: headers.indexOf('file #'),
      mvrIndex: headers.includes('mvr status') ? headers.indexOf('mvr status') : headers.indexOf('mvr'),
      orderMvrIndex: headers.indexOf('order mvr')
    };
  }

  function removeOldSeparateOrderMvrColumn(table) {
    const indexes = headerIndexes(table);

    // If Order MVR is already the renamed MVR column, do not remove it.
    if (indexes.orderMvrIndex < 0 || indexes.mvrIndex < 0) return;

    const oldOrderIndex = indexes.orderMvrIndex;

    const headerRow = table.querySelector('thead tr');
    if (headerRow && headerRow.children[oldOrderIndex]) {
      headerRow.children[oldOrderIndex].remove();
    }

    Array.from(table.querySelectorAll('tbody tr')).forEach((row) => {
      if (row.children[oldOrderIndex]) row.children[oldOrderIndex].remove();
    });
  }

  function fileNumberFromRow(row, fileIndex) {
    const cell = row.children[fileIndex];
    const raw = text(cell);
    const match = raw.match(/[0-9]+/);
    return match ? match[0] : '';
  }

  function makeMvrButton(fileNumber) {
    const a = document.createElement('a');
    a.href = MVR_BASE + encodeURIComponent(fileNumber);
    a.target = '_blank';
    a.rel = 'noopener';
    a.className = 'phase12a42-mvr-button';
    a.textContent = 'Order MVR';
    a.title = 'Order MVR for file ' + fileNumber;
    return a;
  }

  function enhanceTable(table) {
    if (!table) return;

    // Remove the old extra column from Phase 12A-41 if it exists.
    removeOldSeparateOrderMvrColumn(table);

    const indexes = headerIndexes(table);
    const fileIndex = indexes.fileIndex;
    let mvrIndex = indexes.mvrIndex;

    // If it has already been changed to Order MVR, use that same column.
    if (mvrIndex < 0 && indexes.orderMvrIndex >= 0) {
      mvrIndex = indexes.orderMvrIndex;
    }

    if (fileIndex < 0 || mvrIndex < 0) return;

    const header = table.querySelectorAll('thead th')[mvrIndex];
    if (header && normalize(text(header)) !== 'order mvr') {
      header.textContent = 'Order MVR';
    }

    Array.from(table.querySelectorAll('tbody tr')).forEach((row) => {
      const fileNumber = fileNumberFromRow(row, fileIndex);
      const cell = row.children[mvrIndex];

      if (!cell || !fileNumber) return;

      const existing = cell.querySelector('.phase12a42-mvr-button');
      if (existing && existing.href.includes('/' + encodeURIComponent(fileNumber))) return;

      cell.innerHTML = '';
      cell.classList.add('phase12a42-mvr-cell');
      cell.appendChild(makeMvrButton(fileNumber));
    });

    table.dataset.phase12a42MvrPosition = '1';
  }

  function refreshTables() {
    getMonitoringTables().forEach(enhanceTable);
  }

  function addStyles() {
    if (document.getElementById('phase12a42-mvr-style')) return;

    const style = document.createElement('style');
    style.id = 'phase12a42-mvr-style';
    style.textContent = `
      .phase12a42-mvr-cell {
        white-space: nowrap;
      }

      .phase12a42-mvr-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 1px solid #16a34a;
        background: #ecfdf5;
        color: #166534;
        border-radius: 999px;
        padding: 7px 10px;
        font-size: 12px;
        font-weight: 1000;
        text-decoration: none;
        white-space: nowrap;
      }

      .phase12a42-mvr-button:hover {
        background: rgba(31, 255, 0, .18);
        border-color: #1fff00;
      }
    `;

    document.head.appendChild(style);
  }

  function boot() {
    addStyles();
    refreshTables();
    setInterval(refreshTables, 800);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();




// Phase 12A-44: Stable Monitoring search by file number or name
(function () {
  let searchValue = '';

  function text(el) {
    return (el && el.textContent ? el.textContent : '').trim();
  }

  function currentTitle() {
    return text(document.querySelector('.page-header h1')) || text(document.querySelector('.head h2'));
  }

  function activePortalPage() {
    const active = Array.from(document.querySelectorAll('nav button')).find((button) => button.classList.contains('active'));
    return active ? active.dataset.p : '';
  }

  function isMonitoringContext() {
    const title = currentTitle();
    return title === 'Monitoring' || activePortalPage() === 'mon' || title === 'Client View';
  }

  function normalizeHeader(value) {
    return String(value || '')
      .replace(/[↕↑↓▲▼]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  function findMonitoringTables() {
    if (!isMonitoringContext()) return [];

    return Array.from(document.querySelectorAll('table')).filter((table) => {
      const headers = Array.from(table.querySelectorAll('thead th')).map((th) => normalizeHeader(text(th)));
      return headers.includes('file #') &&
        headers.includes('name') &&
        (headers.includes('monitoring') || headers.includes('monitor status')) &&
        headers.includes('med expire');
    });
  }

  function getIndexes(table) {
    const headers = Array.from(table.querySelectorAll('thead th')).map((th) => normalizeHeader(text(th)));
    return {
      file: headers.indexOf('file #'),
      name: headers.includes('name') ? headers.indexOf('name') : headers.indexOf('applicant name')
    };
  }

  function rowSearchText(row, indexes) {
    const fileText = indexes.file >= 0 && row.children[indexes.file] ? text(row.children[indexes.file]) : '';
    const nameText = indexes.name >= 0 && row.children[indexes.name] ? text(row.children[indexes.name]) : '';
    return `${fileText} ${nameText}`.toLowerCase();
  }

  function applyFilter(table) {
    const indexes = getIndexes(table);
    const query = searchValue.trim().toLowerCase();
    let visible = 0;

    Array.from(table.querySelectorAll('tbody tr')).forEach((row) => {
      const show = !query || rowSearchText(row, indexes).includes(query);

      if (show) {
        row.removeAttribute('data-phase12a44-search-hidden');
        visible++;
      } else {
        row.setAttribute('data-phase12a44-search-hidden', '1');
      }
    });

    const count = document.querySelector('[data-phase12a44-count]');
    if (count) count.textContent = `${visible} visible`;
  }

  function applyAllFilters() {
    findMonitoringTables().forEach(applyFilter);
  }

  function ensureSearchBox() {
    const tables = findMonitoringTables();

    if (!tables.length) {
      document.querySelectorAll('[data-phase12a44-search-wrap]').forEach((el) => el.remove());
      return;
    }

    const table = tables[0];

    if (document.querySelector('[data-phase12a44-search-wrap]')) {
      applyAllFilters();
      return;
    }

    const container = table.closest('.table-wrap, .phase12a24-table-wrap, .card, section') || table.parentElement;
    if (!container || !container.parentElement) return;

    const wrap = document.createElement('div');
    wrap.className = 'phase12a44-search-wrap';
    wrap.setAttribute('data-phase12a44-search-wrap', '1');
    wrap.innerHTML = `
      <div class="phase12a44-search-box">
        <strong>Search</strong>
        <input data-phase12a44-search type="search" placeholder="Search by file number or name..." />
        <button type="button" data-phase12a44-clear>Clear</button>
        <span data-phase12a44-count></span>
      </div>
    `;

    container.parentElement.insertBefore(wrap, container);

    const input = wrap.querySelector('[data-phase12a44-search]');
    const clear = wrap.querySelector('[data-phase12a44-clear]');

    input.value = searchValue;

    input.addEventListener('input', () => {
      searchValue = input.value || '';
      applyAllFilters();
    });

    clear.addEventListener('click', () => {
      searchValue = '';
      input.value = '';
      applyAllFilters();
      input.focus();
    });

    applyAllFilters();
  }

  function addStyles() {
    if (document.getElementById('phase12a44-search-style')) return;

    const style = document.createElement('style');
    style.id = 'phase12a44-search-style';
    style.textContent = `
      tr[data-phase12a44-search-hidden="1"] {
        display: none !important;
      }

      .phase12a44-search-wrap {
        margin: 0 0 12px;
      }

      .phase12a44-search-box {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
        border: 1px solid #dbe3ef;
        background: #fff;
        border-radius: 16px;
        padding: 12px;
      }

      .phase12a44-search-box strong {
        color: #475569;
        font-weight: 1000;
      }

      .phase12a44-search-box input {
        flex: 1;
        min-width: 240px;
        border: 1px solid #cbd5e1;
        border-radius: 12px;
        padding: 10px 12px;
        font: inherit;
      }

      .phase12a44-search-box button {
        border: 1px solid #38bdf8;
        background: #f0f9ff;
        color: #075985;
        border-radius: 999px;
        padding: 8px 11px;
        font-weight: 1000;
        cursor: pointer;
      }

      .phase12a44-search-box span {
        color: #166534;
        font-size: 13px;
        font-weight: 900;
      }
    `;

    document.head.appendChild(style);
  }

  function boot() {
    addStyles();
    ensureSearchBox();

    // Only ensure the search box exists on page/table changes.
    // The hidden row state is controlled by CSS, so it will not flash.
    setInterval(() => {
      ensureSearchBox();
      applyAllFilters();
    }, 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();




// Phase 12A-45: Terminated checkbox column
(function () {
  let applicantMap = new Map();
  let lastFetchAt = 0;

  function text(el) {
    return (el && el.textContent ? el.textContent : '').trim();
  }

  function normalize(value) {
    return String(value || '')
      .replace(/[↕↑↓▲▼]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  function currentTitle() {
    return text(document.querySelector('.page-header h1')) || text(document.querySelector('.head h2'));
  }

  function activePortalPage() {
    const active = Array.from(document.querySelectorAll('nav button')).find((button) => button.classList.contains('active'));
    return active ? active.dataset.p : '';
  }

  function isPortal() {
    return location.pathname.includes('client-portal');
  }

  function isMonitoringContext() {
    const title = currentTitle();
    return title === 'Monitoring' || activePortalPage() === 'mon' || title === 'Client View';
  }

  function endpoint(path) {
    return '/api/index?path=' + encodeURIComponent(path);
  }

  async function refreshApplicantMap(force) {
    const now = Date.now();
    if (!force && now - lastFetchAt < 5000 && applicantMap.size) return;
    lastFetchAt = now;

    try {
      const path = isPortal() ? 'client-dashboard' : 'applicants';
      const res = await fetch(endpoint(path), { credentials: 'include' });
      const raw = await res.text();
      let data = {};
      try { data = raw ? JSON.parse(raw) : {}; } catch {}
      if (!res.ok) return;

      const rows = isPortal() ? (data.recentApplicants || []) : (data.applicants || []);
      applicantMap = new Map();
      rows.forEach((row) => {
        const file = String(row.fileNumber || '').trim();
        if (!file) return;
        applicantMap.set(file, {
          id: row.id,
          terminated: Boolean(row.terminated)
        });
      });
    } catch {}
  }

  function findMonitoringTables() {
    if (!isMonitoringContext()) return [];
    return Array.from(document.querySelectorAll('table')).filter((table) => {
      const headers = Array.from(table.querySelectorAll('thead th')).map((th) => normalize(text(th)));
      return headers.includes('file #') &&
        headers.includes('notes') &&
        (headers.includes('monitoring') || headers.includes('monitor status')) &&
        headers.includes('med expire');
    });
  }

  function indexes(table) {
    const headers = Array.from(table.querySelectorAll('thead th')).map((th) => normalize(text(th)));
    return {
      file: headers.indexOf('file #'),
      notes: headers.indexOf('notes'),
      save: headers.indexOf('save'),
      terminated: headers.indexOf('terminated')
    };
  }

  function fileNumber(row, fileIndex) {
    const raw = fileIndex >= 0 && row.children[fileIndex] ? text(row.children[fileIndex]) : '';
    const match = raw.match(/[0-9]+/);
    return match ? match[0] : '';
  }

  function insertCell(row, index, cell) {
    if (index >= row.children.length) row.appendChild(cell);
    else row.insertBefore(cell, row.children[index]);
  }

  async function saveTerminated(file, checked, checkbox) {
    const found = applicantMap.get(file);
    if (!found || !found.id) {
      await refreshApplicantMap(true);
    }

    const row = applicantMap.get(file);
    if (!row || !row.id) {
      alert('Could not find applicant id for file ' + file);
      checkbox.checked = !checked;
      return;
    }

    checkbox.disabled = true;

    try {
      const path = isPortal() ? 'client-applicant' : 'applicants';
      const res = await fetch(endpoint(path), {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id, terminated: checked })
      });

      const raw = await res.text();
      let data = {};
      try { data = raw ? JSON.parse(raw) : {}; } catch {}
      if (!res.ok) throw new Error(data.message || raw || 'Could not save terminated flag');

      row.terminated = checked;
      applicantMap.set(file, row);
      checkbox.closest('tr')?.classList.toggle('phase12a45-terminated-row', checked);
    } catch (error) {
      alert(error.message || 'Could not save terminated flag');
      checkbox.checked = !checked;
    } finally {
      checkbox.disabled = false;
    }
  }

  function enhanceTable(table) {
    const idx = indexes(table);
    if (idx.file < 0 || idx.notes < 0) return;

    let insertIndex = idx.notes + 1;

    if (idx.terminated < 0) {
      const headerRow = table.querySelector('thead tr');
      const th = document.createElement('th');
      th.textContent = 'Terminated';
      th.className = 'phase12a45-terminated-header';
      insertCell(headerRow, insertIndex, th);
    } else {
      insertIndex = idx.terminated;
    }

    const fresh = indexes(table);

    Array.from(table.querySelectorAll('tbody tr')).forEach((row) => {
      const file = fileNumber(row, fresh.file);
      if (!file) return;

      if (row.querySelector('[data-phase12a45-terminated]')) {
        const cb = row.querySelector('[data-phase12a45-terminated]');
        const found = applicantMap.get(file);
        if (found) {
          cb.checked = Boolean(found.terminated);
          row.classList.toggle('phase12a45-terminated-row', Boolean(found.terminated));
        }
        return;
      }

      const td = document.createElement('td');
      td.className = 'phase12a45-terminated-cell';

      const label = document.createElement('label');
      label.className = 'phase12a45-terminated-label';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.setAttribute('data-phase12a45-terminated', '1');

      const found = applicantMap.get(file);
      checkbox.checked = Boolean(found?.terminated);
      row.classList.toggle('phase12a45-terminated-row', Boolean(found?.terminated));

      const span = document.createElement('span');
      span.textContent = 'Terminated';

      label.appendChild(checkbox);
      label.appendChild(span);
      td.appendChild(label);

      checkbox.addEventListener('change', () => {
        saveTerminated(file, checkbox.checked, checkbox);
      });

      insertCell(row, fresh.terminated >= 0 ? fresh.terminated : insertIndex, td);
    });
  }

  async function refresh() {
    const tables = findMonitoringTables();
    if (!tables.length) return;
    await refreshApplicantMap(false);
    tables.forEach(enhanceTable);
  }

  function addStyles() {
    if (document.getElementById('phase12a45-terminated-style')) return;

    const style = document.createElement('style');
    style.id = 'phase12a45-terminated-style';
    style.textContent = `
      .phase12a45-terminated-header,
      .phase12a45-terminated-cell {
        white-space: nowrap;
        text-align: center;
      }

      .phase12a45-terminated-label {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        border: 1px solid #cbd5e1;
        border-radius: 999px;
        padding: 6px 9px;
        font-size: 12px;
        font-weight: 900;
        color: #475569;
        background: #fff;
        cursor: pointer;
      }

      .phase12a45-terminated-label input {
        width: auto !important;
        margin: 0;
      }

      .phase12a45-terminated-row td {
        background: #fff7ed !important;
      }

      .phase12a45-terminated-row .phase12a45-terminated-label {
        border-color: #f97316;
        background: #ffedd5;
        color: #9a3412;
      }
    `;

    document.head.appendChild(style);
  }

  function boot() {
    addStyles();
    refresh();
    setInterval(refresh, 1000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();




// Phase 12A-46: Terminated Monitoring page for admin
(function () {
  const MVR_BASE = 'https://saffhiresecure.com/app/client/driverpipeline/mvr/';
  let terminatedRows = [];
  let allRows = [];
  let loadedAt = 0;

  function text(el) { return (el && el.textContent ? el.textContent : '').trim(); }
  function mainPanel() { return document.querySelector('.main-panel') || document.querySelector('main') || document.body; }
  function currentTitle() { return text(document.querySelector('.page-header h1')) || text(document.querySelector('.head h2')); }
  function isAdminMonitoring() { return currentTitle() === 'Monitoring'; }
  function isTerminatedPage() { return document.body.dataset.phase12a46TerminatedPage === '1'; }
  function endpoint(path) { return '/api/index?path=' + encodeURIComponent(path); }

  async function api(path, options) {
    const res = await fetch(endpoint(path), Object.assign({ credentials: 'include' }, options || {}, {
      headers: Object.assign({ 'Content-Type': 'application/json' }, (options && options.headers) || {})
    }));
    const raw = await res.text();
    let data = {};
    try { data = raw ? JSON.parse(raw) : {}; } catch {}
    if (!res.ok) throw new Error(data.message || raw || 'Request failed');
    return data;
  }

  function esc(value) {
    return String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'","&#039;");
  }

  function fmt(value) {
    if (!value) return '';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString();
  }

  async function loadRows(force) {
    if (!force && Date.now() - loadedAt < 3500 && allRows.length) return;
    loadedAt = Date.now();
    const data = await api('applicants');
    allRows = data.applicants || [];
    terminatedRows = allRows.filter((row) => Boolean(row.terminated));
  }

  function addSidebarButton() {
    if (document.getElementById('phase12a46-admin-terminated-nav')) return;

    const monitoringButton = Array.from(document.querySelectorAll('button, a')).find((el) => text(el) === 'Monitoring');
    const parent = monitoringButton ? monitoringButton.parentElement : (document.querySelector('aside') || document.querySelector('nav'));

    if (!parent) return;

    const button = document.createElement('button');
    button.id = 'phase12a46-admin-terminated-nav';
    button.type = 'button';
    button.className = 'phase12a46-nav-button';
    button.innerHTML = '<span>☑</span><span>Terminated</span>';
    button.addEventListener('click', renderTerminatedPage);

    if (monitoringButton && monitoringButton.nextSibling) parent.insertBefore(button, monitoringButton.nextSibling);
    else parent.appendChild(button);
  }

  function monitoringFileFromRow(row) {
    const cell = row.children[0];
    const match = text(cell).match(/[0-9]+/);
    return match ? match[0] : '';
  }

  async function hideTerminatedFromAdminMonitoring() {
    if (!isAdminMonitoring() || isTerminatedPage()) return;
    await loadRows(false);
    const terminatedFiles = new Set(terminatedRows.map((row) => String(row.fileNumber)));

    Array.from(document.querySelectorAll('table tbody tr')).forEach((row) => {
      const file = monitoringFileFromRow(row);
      if (!file) return;

      const hidden = terminatedFiles.has(file);
      row.toggleAttribute('data-phase12a46-monitoring-hidden', hidden);
    });
  }

  function mvrButton(fileNumber) {
    return `<a class="phase12a46-btn" href="${MVR_BASE}${encodeURIComponent(fileNumber || '')}" target="_blank" rel="noopener">Order MVR</a>`;
  }

  function terminatedTable(rows) {
    if (!rows.length) return '<div class="phase12a46-empty">No terminated people found.</div>';

    return `
      <div class="phase12a46-table-wrap">
        <table class="phase12a46-table">
          <thead>
            <tr>
              <th>File #</th>
              <th>Name</th>
              <th>Order Date</th>
              <th>Monitoring</th>
              <th>Order MVR</th>
              <th>Med Expire</th>
              <th>Notes</th>
              <th>Terminated</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map((row) => `
              <tr data-applicant-id="${esc(row.id)}">
                <td><b>${esc(row.fileNumber)}</b></td>
                <td>${esc(row.name)}</td>
                <td>${esc(fmt(row.orderDate))}</td>
                <td>${esc(row.monitorStatus)}</td>
                <td>${mvrButton(row.fileNumber)}</td>
                <td>${esc(row.medExpire || '')}</td>
                <td>${esc(row.notes || '')}</td>
                <td>
                  <label class="phase12a46-check">
                    <input type="checkbox" checked data-phase12a46-unterminate />
                    <span>Terminated</span>
                  </label>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  async function renderTerminatedPage() {
    document.body.dataset.phase12a46TerminatedPage = '1';
    const panel = mainPanel();
    panel.innerHTML = `
      <div class="page-header">
        <div>
          <h1>Terminated</h1>
          <p>People removed from active Monitoring</p>
        </div>
        <button type="button" class="phase12a46-btn" id="phase12a46-refresh-terminated">Refresh</button>
      </div>
      <section class="card phase12a46-card">
        <div class="phase12a46-toolbar">
          <input id="phase12a46-search" type="search" placeholder="Search file number or name..." />
          <span id="phase12a46-count"></span>
        </div>
        <div id="phase12a46-table">Loading terminated people...</div>
      </section>
    `;

    document.getElementById('phase12a46-refresh-terminated').onclick = () => renderTerminatedPage();

    await loadRows(true);
    document.getElementById('phase12a46-table').innerHTML = terminatedTable(terminatedRows);
    bindTerminatedPage();
    filterTerminatedRows();
  }

  function bindTerminatedPage() {
    document.getElementById('phase12a46-search')?.addEventListener('input', filterTerminatedRows);

    Array.from(document.querySelectorAll('[data-phase12a46-unterminate]')).forEach((checkbox) => {
      checkbox.addEventListener('change', async () => {
        if (checkbox.checked) return;
        const row = checkbox.closest('tr');
        const id = Number(row?.dataset.applicantId || 0);
        if (!id) return;

        checkbox.disabled = true;
        try {
          await api('applicants', { method: 'PATCH', body: JSON.stringify({ id, terminated: false }) });
          row.remove();
          await loadRows(true);
          filterTerminatedRows();
        } catch (error) {
          alert(error.message || 'Could not move person back to Monitoring');
          checkbox.checked = true;
          checkbox.disabled = false;
        }
      });
    });
  }

  function filterTerminatedRows() {
    const input = document.getElementById('phase12a46-search');
    const q = String(input?.value || '').toLowerCase().trim();
    let visible = 0;

    Array.from(document.querySelectorAll('.phase12a46-table tbody tr')).forEach((row) => {
      const haystack = `${text(row.children[0])} ${text(row.children[1])}`.toLowerCase();
      const show = !q || haystack.includes(q);
      row.style.display = show ? '' : 'none';
      if (show) visible++;
    });

    const count = document.getElementById('phase12a46-count');
    if (count) count.textContent = `${visible} visible`;
  }

  function watchTerminatedCheckboxes() {
    if (!isAdminMonitoring()) return;

    Array.from(document.querySelectorAll('[data-phase12a45-terminated]')).forEach((checkbox) => {
      if (checkbox.dataset.phase12a46Bound === '1') return;
      checkbox.dataset.phase12a46Bound = '1';

      checkbox.addEventListener('change', () => {
        if (!checkbox.checked) return;
        const row = checkbox.closest('tr');
        setTimeout(() => {
          row?.setAttribute('data-phase12a46-monitoring-hidden', '');
          loadRows(true);
        }, 250);
      });
    });
  }

  function leaveTerminatedWhenOtherNavClicked() {
    document.addEventListener('click', (event) => {
      const target = event.target && event.target.closest ? event.target.closest('button, a') : null;
      if (!target) return;
      if (target.id === 'phase12a46-admin-terminated-nav') return;
      if (['Dashboard','Monitoring','Safety Performance','Settings','Client View','Client Admin'].includes(text(target))) {
        document.body.dataset.phase12a46TerminatedPage = '0';
      }
    }, true);
  }

  function addStyles() {
    if (document.getElementById('phase12a46-style')) return;
    const style = document.createElement('style');
    style.id = 'phase12a46-style';
    style.textContent = `
      tr[data-phase12a46-monitoring-hidden] {
        display: none !important;
      }
      .phase12a46-nav-button {
        width: calc(100% - 24px);
        margin: 4px 12px;
        border: 0;
        border-radius: 12px;
        padding: 10px 12px;
        background: transparent;
        color: inherit;
        display: flex;
        gap: 10px;
        align-items: center;
        font-weight: 800;
        cursor: pointer;
        text-align: left;
      }
      .phase12a46-nav-button:hover {
        background: rgba(31,255,0,.14);
        box-shadow: inset 4px 0 0 #1fff00;
      }
      .phase12a46-card {
        margin-top: 14px;
      }
      .phase12a46-toolbar {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
      }
      .phase12a46-toolbar input {
        flex: 1;
        min-width: 240px;
        border: 1px solid #cbd5e1;
        border-radius: 12px;
        padding: 10px 12px;
        font: inherit;
      }
      .phase12a46-table-wrap {
        overflow: auto;
        border: 1px solid #dbe3ef;
        border-radius: 14px;
      }
      .phase12a46-table {
        width: 100%;
        border-collapse: collapse;
        background: #fff;
      }
      .phase12a46-table th,
      .phase12a46-table td {
        padding: 10px;
        border-bottom: 1px solid #e2e8f0;
        text-align: left;
      }
      .phase12a46-table th {
        background: #f8fafc;
        color: #475569;
        text-transform: uppercase;
        font-size: 12px;
      }
      .phase12a46-btn {
        border: 1px solid #16a34a;
        background: #ecfdf5;
        color: #166534;
        border-radius: 999px;
        padding: 8px 11px;
        font-weight: 1000;
        text-decoration: none;
        cursor: pointer;
        display: inline-flex;
      }
      .phase12a46-check {
        display: inline-flex;
        gap: 7px;
        align-items: center;
        font-weight: 900;
      }
      .phase12a46-empty {
        color: #64748b;
        font-weight: 900;
        padding: 14px;
      }
    `;
    document.head.appendChild(style);
  }

  function boot() {
    addStyles();
    addSidebarButton();
    leaveTerminatedWhenOtherNavClicked();

    setInterval(() => {
      addSidebarButton();
      hideTerminatedFromAdminMonitoring();
      watchTerminatedCheckboxes();
    }, 1000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();



// Phase 12A-51: Save notes when terminated changes without touching alert totals
(function () {
  function text(el) {
    return (el && el.textContent ? el.textContent : '').trim();
  }

  function isPortal() {
    return location.pathname.includes('client-portal');
  }

  function endpoint(path) {
    return '/api/index?path=' + encodeURIComponent(path);
  }

  function normalizeHeader(value) {
    return String(value || '')
      .replace(/[↕↑↓▲▼]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  function indexes(table) {
    const headers = Array.from(table.querySelectorAll('thead th')).map((th) => normalizeHeader(text(th)));
    return {
      file: headers.indexOf('file #'),
      notes: headers.indexOf('notes')
    };
  }

  function cellValue(row, index) {
    if (index < 0 || !row.children[index]) return '';
    const cell = row.children[index];
    const textarea = cell.querySelector('textarea');
    if (textarea) return textarea.value || '';
    const input = cell.querySelector('input:not([type="checkbox"])');
    if (input) return input.value || '';
    const select = cell.querySelector('select');
    if (select) return select.value || '';
    return text(cell);
  }

  function fileNumberFromRow(row, index) {
    const raw = cellValue(row, index);
    const match = raw.match(/[0-9]+/);
    return match ? match[0] : '';
  }

  async function readJsonResponse(res) {
    const raw = await res.text();
    let data = {};
    try { data = raw ? JSON.parse(raw) : {}; } catch {}
    if (!res.ok) throw new Error(data.message || raw || 'Request failed');
    return data;
  }

  async function api(path, options) {
    const res = await fetch(endpoint(path), Object.assign({ credentials: 'include' }, options || {}, {
      headers: Object.assign({ 'Content-Type': 'application/json' }, (options && options.headers) || {})
    }));
    return readJsonResponse(res);
  }

  async function findApplicantId(fileNumber) {
    const data = await api(isPortal() ? 'client-dashboard' : 'applicants');
    const rows = isPortal() ? (data.recentApplicants || []) : (data.applicants || []);
    const found = rows.find((item) => String(item.fileNumber) === String(fileNumber));
    return Number(found && found.id ? found.id : 0);
  }

  async function saveTerminatedAndNotes(row, checked) {
    const table = row.closest('table');
    if (!table) throw new Error('Could not find monitoring table');

    const idx = indexes(table);
    const fileNumber = fileNumberFromRow(row, idx.file);
    const notes = cellValue(row, idx.notes);

    let id = Number(row.dataset.applicantId || row.dataset.id || 0);
    if (!id) id = await findApplicantId(fileNumber);
    if (!id) throw new Error('Could not find applicant id for file ' + fileNumber);

    await api(isPortal() ? 'client-applicant' : 'applicants', {
      method: 'PATCH',
      body: JSON.stringify({ id, terminated: checked, notes })
    });

    row.toggleAttribute(isPortal() ? 'data-phase12a46-client-monitoring-hidden' : 'data-phase12a46-monitoring-hidden', checked);
  }

  document.addEventListener('change', async function (event) {
    const checkbox = event.target && event.target.closest ? event.target.closest('[data-phase12a45-terminated]') : null;
    if (!checkbox) return;

    // Stop the older terminated handler so it does not save a second request without notes.
    event.preventDefault();
    event.stopImmediatePropagation();

    const row = checkbox.closest('tr');
    if (!row) return;

    const checked = checkbox.checked;
    checkbox.disabled = true;

    try {
      await saveTerminatedAndNotes(row, checked);
    } catch (error) {
      alert(error.message || 'Could not save terminated status');
      checkbox.checked = !checked;
    } finally {
      checkbox.disabled = false;
    }
  }, true);
})();




// Phase 12A-52: Admin monthly invoices
(function () {
  let invoiceState = { invoices: [], currentMvrOnCount: 0, editingId: null };

  function text(el) {
    return (el && el.textContent ? el.textContent : '').trim();
  }

  function mainPanel() {
    return document.querySelector('.main-panel') || document.querySelector('main') || document.body;
  }

  function endpoint(path) {
    return '/api/index?path=' + encodeURIComponent(path);
  }

  async function api(path, options) {
    const res = await fetch(endpoint(path), Object.assign({ credentials: 'include' }, options || {}, {
      headers: Object.assign({ 'Content-Type': 'application/json' }, (options && options.headers) || {})
    }));
    const raw = await res.text();
    let data = {};
    try { data = raw ? JSON.parse(raw) : {}; } catch {}
    if (!res.ok) throw new Error(data.message || raw || 'Request failed');
    return data;
  }

  function esc(value) {
    return String(value ?? '')
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;')
      .replaceAll('"','&quot;')
      .replaceAll("'","&#039;");
  }

  function dateOnly(value) {
    const raw = String(value || '').trim();
    return raw ? raw.slice(0, 10) : '';
  }

  function money(value) {
    const n = Number(value || 0);
    return '$' + (Number.isFinite(n) ? n : 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function pct(value) {
    const n = Number(value || 0) * 100;
    return (Number.isFinite(n) ? n : 0).toFixed(3).replace(/0+$/,'').replace(/\.$/,'') + '%';
  }

  function addNavButton() {
    if (document.getElementById('phase12a52-invoices-nav')) return;

    const monitoringButton = Array.from(document.querySelectorAll('button, a')).find((el) => text(el) === 'Monitoring');
    const parent = monitoringButton ? monitoringButton.parentElement : (document.querySelector('aside') || document.querySelector('nav'));
    if (!parent) return;

    const button = document.createElement('button');
    button.id = 'phase12a52-invoices-nav';
    button.type = 'button';
    button.className = 'phase12a52-nav-button';
    button.innerHTML = '<span>$</span><span>Invoices</span>';
    button.addEventListener('click', renderInvoicesPage);

    if (monitoringButton && monitoringButton.nextSibling) parent.insertBefore(button, monitoringButton.nextSibling);
    else parent.appendChild(button);
  }

  async function loadInvoices() {
    const data = await api('invoices');
    invoiceState.invoices = data.invoices || [];
    invoiceState.currentMvrOnCount = Number(data.currentMvrOnCount || 0);
    return data;
  }

  function pageShell(content) {
    return `
      <div class="page-header phase12a52-header">
        <div>
          <h1>Invoices</h1>
          <p>Monthly MVR continuous monitoring invoices</p>
        </div>
        <div class="phase12a52-header-actions">
          <button type="button" class="phase12a52-btn" id="phase12a52-create-current">Create Current Month</button>
          <button type="button" class="phase12a52-btn" id="phase12a52-refresh">Refresh</button>
        </div>
      </div>
      <section class="card phase12a52-card">
        <div class="phase12a52-summary">
          <div><b>${esc(invoiceState.currentMvrOnCount)}</b><span>Current MVR On Count</span></div>
          <div><b>${esc(invoiceState.invoices.length)}</b><span>Invoices</span></div>
        </div>
        ${content}
      </section>
    `;
  }

  function listHtml() {
    if (!invoiceState.invoices.length) {
      return '<p class="phase12a52-muted">No invoices found.</p>';
    }

    return `
      <div class="phase12a52-table-wrap">
        <table class="phase12a52-table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Month</th>
              <th>Status</th>
              <th>Qty</th>
              <th>Subtotal</th>
              <th>Tax</th>
              <th>Total</th>
              <th>Due</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${invoiceState.invoices.map((invoice) => `
              <tr>
                <td><b>${esc(invoice.invoiceNumber)}</b></td>
                <td>${esc(invoice.serviceMonthLabel || dateOnly(invoice.invoiceMonth))}</td>
                <td><span class="phase12a52-status ${invoice.status === 'Approved' ? 'approved' : 'draft'}">${esc(invoice.status)}</span></td>
                <td>${esc(invoice.quantity)}</td>
                <td>${esc(money(invoice.subtotal))}</td>
                <td>${esc(money(invoice.salesTax))}</td>
                <td><b>${esc(money(invoice.total))}</b></td>
                <td>${esc(dateOnly(invoice.dueDate))}</td>
                <td class="phase12a52-actions">
                  <button type="button" data-phase12a52-edit="${esc(invoice.id)}">Edit</button>
                  ${invoice.status === 'Approved'
                    ? `<button type="button" data-phase12a52-pdf="${esc(invoice.id)}">Download PDF</button><button type="button" data-phase12a52-reopen="${esc(invoice.id)}">Reopen</button>`
                    : `<button type="button" data-phase12a52-approve="${esc(invoice.id)}">Approve</button>`}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function invoiceById(id) {
    return invoiceState.invoices.find((invoice) => Number(invoice.id) === Number(id));
  }

  function editHtml(invoice) {
    if (!invoice) return '';

    const locked = invoice.status === 'Approved';

    return `
      <div class="phase12a52-editor">
        <h3>${locked ? 'View Approved Invoice' : 'Edit Draft Invoice'}</h3>
        ${locked ? '<p class="phase12a52-warn">Approved invoices are locked. Reopen before editing.</p>' : ''}
        <form id="phase12a52-form">
          <input type="hidden" name="id" value="${esc(invoice.id)}" />
          <div class="phase12a52-grid">
            <label>Invoice #<input name="invoiceNumber" value="${esc(invoice.invoiceNumber)}" ${locked ? 'disabled' : ''} /></label>
            <label>Invoice Date<input type="date" name="invoiceDate" value="${esc(dateOnly(invoice.invoiceDate))}" ${locked ? 'disabled' : ''} /></label>
            <label>Due Date<input type="date" name="dueDate" value="${esc(dateOnly(invoice.dueDate))}" ${locked ? 'disabled' : ''} /></label>
            <label>Service Month<input name="serviceMonthLabel" value="${esc(invoice.serviceMonthLabel || '')}" ${locked ? 'disabled' : ''} /></label>
            <label>Description<input name="description" value="${esc(invoice.description || 'MVR Continuous Monitoring')}" ${locked ? 'disabled' : ''} /></label>
            <label>Quantity<input type="number" min="0" step="1" name="quantity" value="${esc(invoice.quantity)}" ${locked ? 'disabled' : ''} /></label>
            <label>Unit Price<input type="number" min="0" step="0.01" name="unitPrice" value="${esc(invoice.unitPrice)}" ${locked ? 'disabled' : ''} /></label>
            <label>Sales Tax Rate<input type="number" min="0" step="0.0001" name="salesTaxRate" value="${esc(invoice.salesTaxRate)}" ${locked ? 'disabled' : ''} /></label>
            <label>Bill To Name<input name="billToName" value="${esc(invoice.billToName || '')}" ${locked ? 'disabled' : ''} /></label>
            <label>Bill To Address 1<input name="billToAddress1" value="${esc(invoice.billToAddress1 || '')}" ${locked ? 'disabled' : ''} /></label>
            <label>Bill To Address 2<input name="billToAddress2" value="${esc(invoice.billToAddress2 || '')}" ${locked ? 'disabled' : ''} /></label>
            <label>Bill To Phone<input name="billToPhone" value="${esc(invoice.billToPhone || '')}" ${locked ? 'disabled' : ''} /></label>
          </div>
          <label class="phase12a52-wide">Internal Notes<textarea name="notes" ${locked ? 'disabled' : ''}>${esc(invoice.notes || '')}</textarea></label>
          <div class="phase12a52-totals">
            <span>Subtotal: <b>${esc(money(invoice.subtotal))}</b></span>
            <span>Tax: <b>${esc(money(invoice.salesTax))}</b></span>
            <span>Total: <b>${esc(money(invoice.total))}</b></span>
            <span>Tax rate: <b>${esc(pct(invoice.salesTaxRate))}</b></span>
          </div>
          <div class="phase12a52-form-actions">
            ${locked ? '' : '<button type="submit" class="phase12a52-btn">Save Draft</button><button type="button" class="phase12a52-btn" id="phase12a52-recalc">Use Current MVR Count</button>'}
            ${locked ? `<button type="button" class="phase12a52-btn" data-phase12a52-pdf="${esc(invoice.id)}">Download PDF</button>` : `<button type="button" class="phase12a52-btn" data-phase12a52-approve="${esc(invoice.id)}">Approve Invoice</button>`}
            <button type="button" class="phase12a52-btn secondary" id="phase12a52-close-editor">Close</button>
          </div>
        </form>
      </div>
    `;
  }

  function bindList() {
    document.getElementById('phase12a52-create-current')?.addEventListener('click', async () => {
      await api('invoices', { method: 'POST', body: JSON.stringify({ action: 'create-current' }) });
      await renderInvoicesPage();
    });

    document.getElementById('phase12a52-refresh')?.addEventListener('click', renderInvoicesPage);

    document.querySelectorAll('[data-phase12a52-edit]').forEach((button) => {
      button.addEventListener('click', () => {
        invoiceState.editingId = Number(button.dataset.phase12a52Edit);
        renderInvoicesPage(false);
      });
    });

    document.querySelectorAll('[data-phase12a52-approve]').forEach((button) => {
      button.addEventListener('click', async () => {
        if (!confirm('Approve this invoice and unlock PDF download?')) return;
        await api('invoices', { method: 'POST', body: JSON.stringify({ action: 'approve', id: Number(button.dataset.phase12a52Approve) }) });
        await renderInvoicesPage();
      });
    });

    document.querySelectorAll('[data-phase12a52-reopen]').forEach((button) => {
      button.addEventListener('click', async () => {
        if (!confirm('Reopen this approved invoice for editing?')) return;
        await api('invoices', { method: 'POST', body: JSON.stringify({ action: 'reopen', id: Number(button.dataset.phase12a52Reopen) }) });
        await renderInvoicesPage();
      });
    });

    document.querySelectorAll('[data-phase12a52-pdf]').forEach((button) => {
      button.addEventListener('click', () => {
        const id = Number(button.dataset.phase12a52Pdf);
        window.open(endpoint('invoices/pdf') + '&id=' + encodeURIComponent(id), '_blank', 'noopener');
      });
    });

    const close = document.getElementById('phase12a52-close-editor');
    if (close) {
      close.addEventListener('click', () => {
        invoiceState.editingId = null;
        renderInvoicesPage(false);
      });
    }

    const form = document.getElementById('phase12a52-form');
    if (form) {
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const fd = new FormData(form);
        const payload = Object.fromEntries(fd.entries());
        payload.id = Number(payload.id);
        payload.quantity = Number(payload.quantity || 0);
        payload.unitPrice = Number(payload.unitPrice || 0);
        payload.salesTaxRate = Number(payload.salesTaxRate || 0);

        await api('invoices', { method: 'PATCH', body: JSON.stringify(payload) });
        invoiceState.editingId = payload.id;
        await renderInvoicesPage();
      });
    }

    const recalc = document.getElementById('phase12a52-recalc');
    if (recalc && form) {
      recalc.addEventListener('click', async () => {
        const fd = new FormData(form);
        const id = Number(fd.get('id') || 0);
        await api('invoices', { method: 'POST', body: JSON.stringify({ action: 'recalculate-count', id }) });
        invoiceState.editingId = id;
        await renderInvoicesPage();
      });
    }
  }

  async function renderInvoicesPage(reload = true) {
    document.body.dataset.phase12a52InvoicePage = '1';

    const panel = mainPanel();
    panel.innerHTML = `
      <div class="page-header">
        <div>
          <h1>Invoices</h1>
          <p>Loading monthly invoices...</p>
        </div>
      </div>
      <section class="card">Loading...</section>
    `;

    try {
      if (reload || !invoiceState.invoices.length) await loadInvoices();
      const editor = invoiceState.editingId ? editHtml(invoiceById(invoiceState.editingId)) : '';
      panel.innerHTML = pageShell(editor + listHtml());
      bindList();
    } catch (error) {
      panel.innerHTML = `
        <div class="page-header"><div><h1>Invoices</h1><p>Could not load invoices</p></div></div>
        <section class="card"><p class="phase12a52-warn">${esc(error.message || 'Unknown error')}</p></section>
      `;
    }
  }

  function clearInvoicePageOnOtherNav() {
    document.addEventListener('click', (event) => {
      const target = event.target && event.target.closest ? event.target.closest('button, a') : null;
      if (!target) return;
      if (target.id === 'phase12a52-invoices-nav') return;
      if (['Dashboard','Monitoring','Safety Performance','Settings','Client View','Client Admin','Terminated'].includes(text(target))) {
        document.body.dataset.phase12a52InvoicePage = '0';
      }
    }, true);
  }

  function addStyles() {
    if (document.getElementById('phase12a52-style')) return;

    const style = document.createElement('style');
    style.id = 'phase12a52-style';
    style.textContent = `
      .phase12a52-nav-button {
        width: calc(100% - 24px);
        margin: 4px 12px;
        border: 0;
        border-radius: 12px;
        padding: 10px 12px;
        background: transparent;
        color: inherit;
        display: flex;
        gap: 10px;
        align-items: center;
        font-weight: 800;
        cursor: pointer;
        text-align: left;
      }

      .phase12a52-nav-button:hover {
        background: rgba(31,255,0,.14);
        box-shadow: inset 4px 0 0 #1fff00;
      }

      .phase12a52-header-actions,
      .phase12a52-actions,
      .phase12a52-form-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .phase12a52-btn,
      .phase12a52-actions button {
        border: 1px solid #16a34a;
        background: #ecfdf5;
        color: #166534;
        border-radius: 999px;
        padding: 8px 11px;
        font-weight: 1000;
        cursor: pointer;
        text-decoration: none;
      }

      .phase12a52-btn.secondary {
        border-color: #cbd5e1;
        background: #fff;
        color: #475569;
      }

      .phase12a52-summary {
        display: grid;
        grid-template-columns: repeat(2, minmax(180px, 1fr));
        gap: 10px;
        margin-bottom: 14px;
      }

      .phase12a52-summary div {
        border: 1px solid #dbe3ef;
        border-radius: 14px;
        padding: 12px;
        background: #fff;
      }

      .phase12a52-summary b {
        display: block;
        font-size: 28px;
        line-height: 1;
      }

      .phase12a52-summary span {
        display: block;
        margin-top: 5px;
        color: #475569;
        font-weight: 900;
      }

      .phase12a52-table-wrap {
        overflow: auto;
        border: 1px solid #dbe3ef;
        border-radius: 14px;
      }

      .phase12a52-table {
        width: 100%;
        border-collapse: collapse;
        background: #fff;
      }

      .phase12a52-table th,
      .phase12a52-table td {
        padding: 10px;
        border-bottom: 1px solid #e2e8f0;
        text-align: left;
        white-space: nowrap;
      }

      .phase12a52-table th {
        background: #f8fafc;
        color: #475569;
        text-transform: uppercase;
        font-size: 12px;
      }

      .phase12a52-status {
        border-radius: 999px;
        padding: 5px 8px;
        font-size: 12px;
        font-weight: 1000;
      }

      .phase12a52-status.approved {
        background: #dcfce7;
        color: #166534;
      }

      .phase12a52-status.draft {
        background: #fef3c7;
        color: #92400e;
      }

      .phase12a52-editor {
        border: 1px solid #dbe3ef;
        border-radius: 16px;
        padding: 14px;
        margin-bottom: 14px;
        background: #f8fafc;
      }

      .phase12a52-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(160px, 1fr));
        gap: 10px;
      }

      .phase12a52-grid label,
      .phase12a52-wide {
        display: flex;
        flex-direction: column;
        gap: 5px;
        font-size: 12px;
        font-weight: 900;
        color: #475569;
      }

      .phase12a52-grid input,
      .phase12a52-wide textarea {
        border: 1px solid #cbd5e1;
        border-radius: 12px;
        padding: 9px 10px;
        font: inherit;
        background: #fff;
        color: #0f172a;
      }

      .phase12a52-wide {
        margin-top: 10px;
      }

      .phase12a52-wide textarea {
        min-height: 70px;
      }

      .phase12a52-totals {
        display: flex;
        gap: 14px;
        flex-wrap: wrap;
        margin: 12px 0;
      }

      .phase12a52-muted {
        color: #64748b;
        font-weight: 800;
      }

      .phase12a52-warn {
        color: #b45309;
        font-weight: 900;
      }

      @media(max-width: 1000px) {
        .phase12a52-grid {
          grid-template-columns: repeat(2, minmax(160px, 1fr));
        }
      }

      @media(max-width: 700px) {
        .phase12a52-grid,
        .phase12a52-summary {
          grid-template-columns: 1fr;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function boot() {
    addStyles();
    addNavButton();
    clearInvoicePageOnOtherNav();

    setInterval(addNavButton, 1000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

