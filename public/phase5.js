(function () {
  const COMPANY_NAME = 'SaffHire Background Screening';
  const SUPPORT_EMAIL = 'support@saffhire.com';
  function text(el) { return (el && el.textContent ? el.textContent : '').trim(); }
  function getRows() { return Array.from(document.querySelectorAll('table tbody tr')).filter((row) => row.querySelectorAll('td').length >= 8); }
  function getCells(row) { return Array.from(row.querySelectorAll('td')); }
  function getCompanyId() { const select = document.querySelector('.company-switcher select'); return select && select.value ? select.value : '1'; }
  async function api(url, options) {
    const response = await fetch(url, Object.assign({ credentials: 'include' }, options || {}, { headers: Object.assign({ 'Content-Type': 'application/json' }, (options && options.headers) || {}) }));
    const raw = await response.text(); let data = {}; try { data = raw ? JSON.parse(raw) : {}; } catch {}
    if (!response.ok) throw new Error(data.message || `Request failed: ${response.status}`);
    return data;
  }
  async function getReports() { const data = await api(`/api/safety-reports?companyId=${encodeURIComponent(getCompanyId())}`); return Array.isArray(data.reports) ? data.reports : []; }
  async function findReport(fileNumber) { const reports = await getReports(); return reports.find((r) => String(r.fileNumber || '').trim() === String(fileNumber || '').trim()); }
  function rowData(row) {
    const cells = getCells(row); const employerText = text(cells[5]); const emailMatch = employerText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    return { fileNumber: text(cells[0]).replace(/[^0-9A-Za-z\-_.]/g, ''), applicant: text(cells[1]), status: text(cells[3]), followUp: text(cells[4]), employer: employerText.split('\n')[0] || '', employerEmail: emailMatch ? emailMatch[0] : '', notes: text(cells[6]) };
  }
  function buildEmail(row) {
    const d = rowData(row);
    const subject = `Safety Performance Information Request${d.fileNumber ? ` - File #${d.fileNumber}` : ''}`;
    const message = ['Hello,','',`${COMPANY_NAME} is requesting Safety Performance information for the applicant listed below.`,'',`Applicant: ${d.applicant || '[Applicant Name]'}`,d.fileNumber ? `File Number: ${d.fileNumber}` : '',d.employer ? `Previous Employer Listed: ${d.employer}` : '','Please reply with any available information for:','1. Employment dates','2. Job title / position','3. Whether the applicant drove a motor vehicle','4. Vehicle type(s), if applicable','5. Accident history, if applicable','6. DOT drug and alcohol testing information, if applicable','7. Name/title of the person providing the information','8. Date completed','','If this request should be sent to a different department, please reply with the correct contact information.','','Thank you,',COMPANY_NAME,SUPPORT_EMAIL].filter(Boolean).join('\n');
    return { to: d.employerEmail, subject, message, fileNumber: d.fileNumber };
  }
  function toast(message, danger) {
    let box = document.getElementById('phase5-toast'); if (!box) { box = document.createElement('div'); box.id = 'phase5-toast'; document.body.appendChild(box); }
    box.className = danger ? 'phase5-toast danger' : 'phase5-toast'; box.textContent = message; clearTimeout(box.__hideTimer); box.__hideTimer = setTimeout(() => box.remove(), 6500);
  }
  function setRowSent(row) {
    const cells = getCells(row); if (cells[3]) cells[3].innerHTML = '<span class="status-chip emp-sent">Emp Sent</span>';
    if (cells[4] && !text(cells[4])) { const d = new Date(); d.setDate(d.getDate() + 5); cells[4].textContent = d.toISOString().slice(0, 10); }
    row.classList.add('phase5-sent-row'); setTimeout(() => row.classList.remove('phase5-sent-row'), 2500);
  }
  function getModal() {
    let modal = document.getElementById('phase5-modal'); if (modal) return modal;
    modal = document.createElement('div'); modal.id = 'phase5-modal'; modal.className = 'phase5-modal hidden';
    modal.innerHTML = '<div class="phase5-modal-card"><div class="phase5-modal-head"><h2>Send Safety Performance Email</h2><button type="button" data-phase5-close>×</button></div><div class="phase5-field"><span>To</span><input data-phase5-to /></div><div class="phase5-field"><span>Subject</span><input data-phase5-subject /></div><div class="phase5-field"><span>Message</span><textarea data-phase5-message rows="14"></textarea></div><div class="phase5-warning">This sends a real email if RESEND_API_KEY and SAFETY_FROM_EMAIL are set in Vercel.</div><div class="phase5-modal-actions"><button type="button" data-phase5-copy>Copy Draft</button><button type="button" data-phase5-send>Send Email</button></div></div>';
    document.body.appendChild(modal); return modal;
  }
  function openModal(row) { const modal = getModal(); const draft = buildEmail(row); modal.__row = row; modal.__draft = draft; modal.querySelector('[data-phase5-to]').value = draft.to || ''; modal.querySelector('[data-phase5-subject]').value = draft.subject || ''; modal.querySelector('[data-phase5-message]').value = draft.message || ''; modal.classList.remove('hidden'); }
  function closeModal() { getModal().classList.add('hidden'); }
  async function copyDraft() { const m = getModal(); const full = `To: ${m.querySelector('[data-phase5-to]').value.trim() || '[enter email]'}\nSubject: ${m.querySelector('[data-phase5-subject]').value.trim()}\n\n${m.querySelector('[data-phase5-message]').value.trim()}`; try { await navigator.clipboard.writeText(full); toast('Email draft copied.'); } catch { window.prompt('Copy this email draft:', full); } }
  async function sendEmail() {
    const m = getModal(); const row = m.__row; const draft = m.__draft || {}; const report = await findReport(draft.fileNumber);
    const to = m.querySelector('[data-phase5-to]').value.trim(); const subject = m.querySelector('[data-phase5-subject]').value.trim(); const message = m.querySelector('[data-phase5-message]').value.trim();
    if (!to) return toast('Recipient email is required.', true); if (!subject) return toast('Subject is required.', true); if (!message) return toast('Message is required.', true);
    const btn = m.querySelector('[data-phase5-send]'); btn.disabled = true; btn.textContent = 'Sending...';
    try { await api('/api/send-safety-email', { method: 'POST', body: JSON.stringify({ to, subject, message, reportId: report && report.id, fileNumber: draft.fileNumber }) }); setRowSent(row); closeModal(); toast('Email sent and report marked Emp Sent.'); }
    catch (error) { toast(error.message || 'Could not send email.', true); }
    finally { btn.disabled = false; btn.textContent = 'Send Email'; }
  }
  function addSendButtons() { getRows().forEach((row) => { const cells = getCells(row); if (!cells[7] || cells[7].querySelector('.phase5-send-direct')) return; const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'phase5-send-direct'; btn.textContent = 'Send Direct'; btn.addEventListener('click', () => openModal(row)); cells[7].appendChild(btn); }); }
  function addPanel() { const h = Array.from(document.querySelectorAll('.page-header h1')).find((x) => text(x) === 'Safety Performance Reports'); if (!h || document.getElementById('phase5-panel')) return; const after = document.getElementById('phase4d-panel') || document.getElementById('phase4c-command-center') || h.closest('.page-header'); const panel = document.createElement('section'); panel.id = 'phase5-panel'; panel.className = 'card wide-card phase5-panel'; panel.innerHTML = '<h2>Phase 5 Direct Email Sending</h2><p>Use <b>Send Direct</b> to send the Safety Performance request from the app. If email ENV keys are missing, the app will show the missing setting instead of sending.</p><div class="phase5-env-list">Required: <code>RESEND_API_KEY</code>, <code>SAFETY_FROM_EMAIL</code>. Optional: <code>SAFETY_REPLY_TO_EMAIL</code>.</div>'; after.insertAdjacentElement('afterend', panel); }
  function addStyles() { if (document.getElementById('phase5-style')) return; const s = document.createElement('style'); s.id = 'phase5-style'; s.textContent = '.phase5-panel{margin-bottom:16px;padding:16px;border-left:5px solid #2563eb}.phase5-env-list{color:#475569;font-size:13px}.phase5-env-list code{background:#f1f5f9;border:1px solid #e2e8f0;border-radius:6px;padding:2px 5px}.phase5-send-direct{border:1px solid #2563eb;background:#eff6ff;color:#1d4ed8;border-radius:999px;padding:7px 10px;font-size:12px;font-weight:900;margin-top:8px}.phase5-send-direct:hover{background:#dbeafe}.phase5-sent-row td{background:#dcfce7!important}.phase5-toast{position:fixed;right:18px;bottom:18px;z-index:10002;background:#111827;color:#fff;border-radius:12px;padding:12px 14px;box-shadow:0 18px 45px rgba(15,23,42,.25);font-size:14px;max-width:420px}.phase5-toast.danger{background:#991b1b}.phase5-modal{position:fixed;inset:0;z-index:10001;background:rgba(15,23,42,.55);display:flex;align-items:center;justify-content:center;padding:18px}.phase5-modal.hidden{display:none}.phase5-modal-card{width:min(760px,96vw);max-height:92vh;overflow:auto;background:#fff;border-radius:18px;box-shadow:0 30px 80px rgba(15,23,42,.35);padding:18px}.phase5-modal-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px}.phase5-modal-head h2{margin:0}.phase5-modal-head button{border:0;background:#f1f5f9;width:34px;height:34px;border-radius:999px;font-size:22px}.phase5-field span{display:block;font-size:12px;font-weight:900;color:#475569;margin:10px 0 5px}.phase5-field input,.phase5-field textarea{width:100%;border:1px solid #cbd5e1;border-radius:10px;padding:10px 12px;font:inherit}.phase5-warning{background:#fff7ed;border:1px solid #fed7aa;color:#9a3412;border-radius:12px;padding:10px;margin-top:12px;font-size:13px}.phase5-modal-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:14px}.phase5-modal-actions button{border:0;border-radius:12px;padding:10px 14px;font-weight:900}[data-phase5-copy]{background:#111827;color:#fff}[data-phase5-send]{background:#1fff00;color:#0f172a}[data-phase5-send]:disabled{opacity:.55;cursor:not-allowed}'; document.head.appendChild(s); }
  function refresh() { const ok = Array.from(document.querySelectorAll('.page-header h1')).some((h) => text(h) === 'Safety Performance Reports'); if (!ok) return; addStyles(); addPanel(); addSendButtons(); }
  document.addEventListener('click', (e) => { if (e.target.closest && e.target.closest('[data-phase5-close]')) closeModal(); if (e.target.closest && e.target.closest('[data-phase5-copy]')) copyDraft(); if (e.target.closest && e.target.closest('[data-phase5-send]')) sendEmail(); });
  setInterval(refresh, 1600); if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', refresh); else refresh();
})();
