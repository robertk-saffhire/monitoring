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

