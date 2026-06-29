(function () {
  function text(el) { return (el && el.textContent ? el.textContent : '').trim(); }
  function isSettingsPage() { return Array.from(document.querySelectorAll('.page-header h1')).some((h) => text(h) === 'Settings'); }
  function getCompanyId() {
    const select = document.querySelector('.company-switcher select');
    return select && select.value ? select.value : '1';
  }
  async function api(url, options) {
    const response = await fetch(url, Object.assign({ credentials: 'include' }, options || {}, { headers: Object.assign({ 'Content-Type': 'application/json' }, (options && options.headers) || {}) }));
    const raw = await response.text();
    let data = {};
    try { data = raw ? JSON.parse(raw) : {}; } catch {}
    if (!response.ok) throw new Error(data.message || `Request failed: ${response.status}`);
    return data;
  }
  function toast(message, danger) {
    let box = document.getElementById('phase10-toast');
    if (!box) { box = document.createElement('div'); box.id = 'phase10-toast'; document.body.appendChild(box); }
    box.className = danger ? 'phase10-toast danger' : 'phase10-toast';
    box.textContent = message;
    clearTimeout(box.__hideTimer);
    box.__hideTimer = setTimeout(() => box.remove(), 6500);
  }
  function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(reader.error || new Error('Could not read file'));
      reader.readAsDataURL(file);
    });
  }
  function escapeHtml(value) {
    return String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'","&#039;");
  }
  function formatSize(size) {
    const n = Number(size || 0);
    if (!n) return '';
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  }
  function renderUploads(uploads) {
    const tbody = document.querySelector('#phase10-upload-table tbody');
    if (!tbody) return;
    const rows = Array.isArray(uploads) ? uploads : [];
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="phase10-empty">No medical PDFs uploaded yet.</td></tr>';
      return;
    }
    tbody.innerHTML = rows.map((row) => `
      <tr>
        <td>${escapeHtml(row.fileName || '')}</td>
        <td>${formatSize(row.fileSize)}</td>
        <td><span class="phase10-status ${escapeHtml(row.scanStatus || '')}">${escapeHtml(row.scanStatus || '')}</span></td>
        <td>${escapeHtml(row.extractedExpirationDate || '')}</td>
        <td>${escapeHtml(row.extractedFileNumber || '')}</td>
        <td>${escapeHtml(row.extractedApplicantName || '')}</td>
        <td>${escapeHtml(row.scanMessage || '')}</td>
      </tr>
    `).join('');
  }
  async function refreshUploads() {
    const companyId = getCompanyId();
    const data = await api(`/api/pdf-medical?companyId=${encodeURIComponent(companyId)}`);
    renderUploads(data.uploads || []);
  }
  async function uploadPdfs() {
    const input = document.getElementById('phase10-files');
    const files = Array.from(input && input.files ? input.files : []);
    if (!files.length) return toast('Choose one or more PDF files first.', true);
    const payloadFiles = [];
    for (const file of files) {
      if (!/pdf/i.test(file.type) && !/\.pdf$/i.test(file.name)) { toast(`${file.name} skipped. Only PDF files are supported.`, true); continue; }
      if (file.size > 6 * 1024 * 1024) { toast(`${file.name} skipped. File is larger than 6MB.`, true); continue; }
      payloadFiles.push({ fileName: file.name, mimeType: file.type || 'application/pdf', base64: await readFileAsBase64(file) });
    }
    if (!payloadFiles.length) return;
    const button = document.getElementById('phase10-upload');
    button.disabled = true; button.textContent = 'Uploading...';
    try {
      const data = await api('/api/pdf-medical?action=upload', { method: 'POST', body: JSON.stringify({ companyId: getCompanyId(), files: payloadFiles }) });
      renderUploads(data.uploads || []);
      input.value = '';
      toast(`Uploaded ${data.uploaded} PDF file(s).`);
    } catch (error) { toast(error.message || 'PDF upload failed.', true); }
    finally { button.disabled = false; button.textContent = 'Upload PDFs'; }
  }
  async function scanPdfs(scanAll, createMissing) {
    const buttons = ['phase10-scan','phase10-scan-create','phase10-scan-all'].map((id) => document.getElementById(id)).filter(Boolean);
    buttons.forEach((b) => b.disabled = true);
    const primary = document.getElementById(createMissing ? 'phase10-scan-create' : 'phase10-scan');
    if (primary) primary.textContent = 'Scanning...';
    try {
      const data = await api('/api/pdf-medical?action=scan', { method: 'POST', body: JSON.stringify({ companyId: getCompanyId(), scanAll: Boolean(scanAll), createMissing: Boolean(createMissing) }) });
      renderUploads(data.uploads || []);
      const s = data.summary || {};
      toast(`Scan complete. Updated ${s.updated || 0}. Created ${s.created || 0}. No match ${s.noMatch || 0}. No date ${s.noDate || 0}. Errors ${s.errors || 0}.`);
    } catch (error) { toast(error.message || 'PDF scan failed.', true); }
    finally {
      buttons.forEach((b) => b.disabled = false);
      const scan = document.getElementById('phase10-scan');
      const create = document.getElementById('phase10-scan-create');
      if (scan) scan.textContent = 'Update Existing Only';
      if (create) create.textContent = 'Create/Update Monitoring from PDFs';
    }
  }
  function panelHtml() {
    return `
      <h2>Medical PDF Upload & Scan</h2>
      <p class="muted">Admin only. Upload medical PDFs into the database, then scan them for medical expiration dates and Monitoring records.</p>
      <div class="phase10-warning">
        For new records, the scan needs a <b>file number</b> and <b>applicant name</b>. Best practice: name files like <b>5060-Julian-Ballesteros-medical-card.pdf</b>.
      </div>
      <div class="phase10-actions">
        <input id="phase10-files" type="file" accept="application/pdf,.pdf" multiple />
        <button id="phase10-upload" class="primary-inline" type="button">Upload PDFs</button>
        <button id="phase10-scan" class="secondary-btn" type="button">Update Existing Only</button>
        <button id="phase10-scan-create" class="secondary-btn phase10-create-btn" type="button">Create/Update Monitoring from PDFs</button>
        <button id="phase10-scan-all" class="secondary-btn" type="button">Rescan All</button>
        <button id="phase10-refresh" class="secondary-btn" type="button">Refresh PDF List</button>
      </div>
      <p class="phase10-note"><b>Update Existing Only</b> updates Med Expire for matched applicants. <b>Create/Update Monitoring from PDFs</b> creates a new Monitoring row when no matching record exists and the PDF has enough information.</p>
      <div class="phase10-table-wrap">
        <table id="phase10-upload-table">
          <thead>
            <tr><th>PDF</th><th>Size</th><th>Status</th><th>Medical Expire</th><th>File #</th><th>Name</th><th>Message</th></tr>
          </thead>
          <tbody><tr><td colspan="7" class="phase10-empty">Loading...</td></tr></tbody>
        </table>
      </div>
    `;
  }
  function ensurePanel() {
    if (!isSettingsPage() || document.getElementById('phase10-panel')) return;
    const anchor = Array.from(document.querySelectorAll('section.card')).find((section) => text(section).includes('Import Monitoring CSV'));
    const panel = document.createElement('section');
    panel.id = 'phase10-panel';
    panel.className = 'card wide-card settings-card phase10-panel';
    panel.innerHTML = panelHtml();
    if (anchor) anchor.insertAdjacentElement('afterend', panel);
    else document.querySelector('.main-panel').appendChild(panel);
    document.getElementById('phase10-upload').addEventListener('click', uploadPdfs);
    document.getElementById('phase10-scan').addEventListener('click', () => scanPdfs(false, false));
    document.getElementById('phase10-scan-create').addEventListener('click', () => scanPdfs(false, true));
    document.getElementById('phase10-scan-all').addEventListener('click', () => scanPdfs(true, true));
    document.getElementById('phase10-refresh').addEventListener('click', () => refreshUploads().catch((error) => toast(error.message, true)));
    refreshUploads().catch((error) => { renderUploads([]); toast(error.message || 'Could not load medical PDF uploads.', true); });
  }
  function addStyles() {
    if (document.getElementById('phase10-style')) return;
    const style = document.createElement('style');
    style.id = 'phase10-style';
    style.textContent = `
      .phase10-panel { border-left: 5px solid #10b981; }
      .phase10-warning { background: #ecfdf5; border: 1px solid #bbf7d0; color: #166534; border-radius: 12px; padding: 10px 12px; margin: 10px 0 14px; }
      .phase10-actions { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-bottom: 10px; }
      .phase10-actions input[type=file] { width: min(420px, 100%); }
      .phase10-create-btn { background: #065f46 !important; }
      .phase10-note { color: #64748b; font-size: 13px; margin: 0 0 14px; }
      .phase10-table-wrap { overflow: auto; border: 1px solid #e5e7eb; border-radius: 14px; }
      #phase10-upload-table { width: 100%; border-collapse: collapse; }
      #phase10-upload-table th, #phase10-upload-table td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px; vertical-align: top; }
      #phase10-upload-table th { background: #f8fafc; text-transform: uppercase; font-size: 12px; color: #475569; }
      .phase10-empty { text-align: center; color: #64748b; padding: 28px !important; }
      .phase10-status.created { background:#dcfce7; color:#166534; padding:3px 7px; border-radius:999px; font-weight:800; }
      .phase10-status.updated { background:#dbeafe; color:#1d4ed8; padding:3px 7px; border-radius:999px; font-weight:800; }
      .phase10-status.no_match, .phase10-status.no_date, .phase10-status.error { background:#fee2e2; color:#991b1b; padding:3px 7px; border-radius:999px; font-weight:800; }
      .phase10-toast { position: fixed; right: 18px; bottom: 18px; z-index: 10020; background: #111827; color: #fff; border-radius: 12px; padding: 12px 14px; box-shadow: 0 18px 45px rgba(15,23,42,.25); font-size: 14px; max-width: 460px; }
      .phase10-toast.danger { background: #991b1b; }
    `;
    document.head.appendChild(style);
  }
  function refresh() { addStyles(); ensurePanel(); }
  setInterval(refresh, 1400);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', refresh);
  else refresh();
})();
