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


// Phase 12A-41: MVR order buttons
(function () {
  const MVR_BASE = 'https://saffhiresecure.com/app/client/driverpipeline/mvr/';

  function text(el) {
    return (el && el.textContent ? el.textContent : '').trim();
  }

  function normalize(value) {
    return String(value || '').replace(/[↕↑↓]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
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

  function findMonitoringTables() {
    if (!isMonitoringContext()) return [];

    return Array.from(document.querySelectorAll('table')).filter((table) => {
      const headers = Array.from(table.querySelectorAll('thead th')).map((th) => normalize(text(th)));
      return headers.includes('file #') &&
        (headers.includes('mvr status') || headers.includes('mvr')) &&
        (headers.includes('monitoring') || headers.includes('monitor status')) &&
        !headers.includes('order mvr');
    });
  }

  function fileNumberFromRow(row, fileIndex) {
    const cell = row.children[fileIndex];
    const raw = text(cell);
    const match = raw.match(/[0-9]+/);
    return match ? match[0] : '';
  }

  function addMvrButtonsToTable(table) {
    if (!table || table.dataset.phase12a41MvrButtons === '1') return;

    const headers = Array.from(table.querySelectorAll('thead th'));
    const normalizedHeaders = headers.map((th) => normalize(text(th)));
    const fileIndex = normalizedHeaders.indexOf('file #');

    if (fileIndex < 0) return;

    const headerRow = table.querySelector('thead tr');
    if (!headerRow) return;

    const th = document.createElement('th');
    th.textContent = 'Order MVR';
    th.className = 'phase12a41-mvr-header';
    headerRow.appendChild(th);

    Array.from(table.querySelectorAll('tbody tr')).forEach((row) => {
      const fileNumber = fileNumberFromRow(row, fileIndex);
      const td = document.createElement('td');
      td.className = 'phase12a41-mvr-cell';

      if (fileNumber) {
        const a = document.createElement('a');
        a.href = MVR_BASE + encodeURIComponent(fileNumber);
        a.target = '_blank';
        a.rel = 'noopener';
        a.className = 'phase12a41-mvr-button';
        a.textContent = 'Order MVR';
        a.title = 'Order MVR for file ' + fileNumber;
        td.appendChild(a);
      } else {
        const span = document.createElement('span');
        span.className = 'phase12a41-mvr-missing';
        span.textContent = 'No file #';
        td.appendChild(span);
      }

      row.appendChild(td);
    });

    table.dataset.phase12a41MvrButtons = '1';
  }

  function refreshTables() {
    findMonitoringTables().forEach(addMvrButtonsToTable);
  }

  function addStyles() {
    if (document.getElementById('phase12a41-mvr-style')) return;
    const style = document.createElement('style');
    style.id = 'phase12a41-mvr-style';
    style.textContent = `
      .phase12a41-mvr-header,
      .phase12a41-mvr-cell {
        white-space: nowrap;
      }

      .phase12a41-mvr-button {
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

      .phase12a41-mvr-button:hover {
        background: rgba(31, 255, 0, .18);
        border-color: #1fff00;
      }

      .phase12a41-mvr-missing {
        color: #94a3b8;
        font-size: 12px;
        font-weight: 800;
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

