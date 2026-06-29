(function () {
  const COMPANY_NAME = 'SaffHire Background Screening';
  const SUPPORT_EMAIL = 'support@saffhire.com';
  const LOGO = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663368468239/3wvjutsFdcEUnRywyqJHNV/SaffhireLogoShirtStyle_0449b2e9.webp';

  function text(el) {
    return (el && el.textContent ? el.textContent : '').trim();
  }

  function getRows() {
    return Array.from(document.querySelectorAll('table tbody tr')).filter((row) => row.querySelectorAll('td').length >= 8);
  }

  function getCells(row) {
    return Array.from(row.querySelectorAll('td'));
  }

  function getCompanyId() {
    const select = document.querySelector('.company-switcher select');
    return select && select.value ? select.value : '1';
  }

  function rowData(row) {
    const cells = getCells(row);
    const employerText = text(cells[5]);
    const emailMatch = employerText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    return {
      fileNumber: text(cells[0]).replace(/[^0-9A-Za-z\-_.]/g, ''),
      applicant: text(cells[1]),
      created: text(cells[2]),
      status: text(cells[3]),
      followUp: text(cells[4]),
      employer: employerText.split('\n')[0] || '',
      employerEmail: emailMatch ? emailMatch[0] : '',
      notes: text(cells[6])
    };
  }

  async function api(url, options) {
    const response = await fetch(url, Object.assign({ credentials: 'include' }, options || {}, {
      headers: Object.assign({ 'Content-Type': 'application/json' }, (options && options.headers) || {})
    }));
    const raw = await response.text();
    let data = {};
    try { data = raw ? JSON.parse(raw) : {}; } catch {}
    if (!response.ok) throw new Error(data.message || `Request failed: ${response.status}`);
    return data;
  }

  async function getReports() {
    const companyId = getCompanyId();
    const data = await api(`/api/safety-reports?companyId=${encodeURIComponent(companyId)}`);
    return Array.isArray(data.reports) ? data.reports : [];
  }

  async function findReport(fileNumber) {
    const reports = await getReports();
    return reports.find((report) => String(report.fileNumber || '').trim() === String(fileNumber || '').trim());
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function value(report, key, fallback) {
    const val = report && report[key] != null ? String(report[key]).trim() : '';
    return val || fallback || '—';
  }

  function yesNo(value) {
    return value ? 'Yes' : 'No';
  }

  function todayIso() {
    return new Date().toISOString().slice(0, 10);
  }

  function appendNote(notes, line) {
    const current = String(notes || '').trim();
    if (current.includes(line)) return current;
    return [current, line].filter(Boolean).join('\n');
  }

  function vehicleSummary(report) {
    const map = [
      ['vehicleStraightTruck', 'Straight Truck'],
      ['vehicleTractorSemitrailer', 'Tractor/Semitrailer'],
      ['vehicleBus', 'Bus'],
      ['vehicleCargoTank', 'Cargo Tank'],
      ['vehicleDoublesTriples', 'Doubles/Triples'],
      ['vehicleOther', 'Other']
    ];
    const selected = map.filter(([key]) => Boolean(report && report[key])).map(([, label]) => label);
    return selected.length ? selected.join(', ') : 'None listed';
  }

  function reportPackageHtml(report) {
    const safe = (key, fallback) => escapeHtml(value(report, key, fallback));
    const title = `Safety Performance Completed Packet - ${value(report, 'fileNumber', value(report, 'applicantName', 'Report'))}`;
    const accidentRows = [1, 2, 3].map((n) => ({
      n,
      date: value(report, `accidentDate${n}`, ''),
      location: value(report, `accidentLocation${n}`, ''),
      injuries: value(report, `accidentInjuries${n}`, ''),
      fatalities: value(report, `accidentFatalities${n}`, ''),
      hazmat: value(report, `accidentHazmat${n}`, '')
    }));

    return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; background: #f3f4f6; color: #111827; font-family: Arial, Helvetica, sans-serif; }
  .page { width: 8.5in; min-height: 11in; margin: 20px auto; background: #fff; border: 1px solid #d1d5db; padding: .45in; }
  .top { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 4px solid #111827; padding-bottom: 14px; margin-bottom: 18px; }
  .logo { max-width: 185px; max-height: 58px; object-fit: contain; }
  h1 { margin: 0; font-size: 24px; }
  h2 { background: #f8fafc; border: 1px solid #d1d5db; padding: 8px 10px; font-size: 15px; margin: 18px 0 10px; }
  h3 { margin: 12px 0 6px; font-size: 13px; }
  .meta { color: #4b5563; font-size: 12px; margin-top: 5px; }
  .status { display: inline-block; background: #dcfce7; color: #166534; border-radius: 999px; padding: 5px 10px; font-size: 12px; font-weight: 700; margin-top: 8px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; }
  .field { border-bottom: 1px solid #d1d5db; min-height: 25px; padding: 4px 0; font-size: 12px; }
  .field b { display: inline-block; min-width: 160px; color: #374151; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 8px; }
  th, td { border: 1px solid #d1d5db; padding: 6px; text-align: left; vertical-align: top; }
  th { background: #f9fafb; color: #374151; }
  .notes { border: 1px solid #d1d5db; min-height: 55px; padding: 8px; white-space: pre-wrap; font-size: 12px; }
  .cover-box { border: 1px solid #d1d5db; background: #f9fafb; padding: 12px; margin-top: 12px; font-size: 13px; line-height: 1.45; }
  .signature { display: grid; grid-template-columns: 1.5fr 1fr; gap: 20px; margin-top: 26px; font-size: 12px; }
  .line { border-bottom: 1px solid #111827; height: 30px; }
  .page-break { break-before: page; page-break-before: always; }
  @media print {
    body { background: #fff; }
    .page { margin: 0; width: auto; min-height: auto; border: 0; padding: .35in; }
    .no-print { display: none; }
  }
</style>
</head>
<body>
  <section class="page">
    <div class="top">
      <div>
        <h1>Safety Performance Completed Packet</h1>
        <div class="meta">Generated by ${COMPANY_NAME} on ${todayIso()}</div>
        <div class="status">${safe('status')}</div>
      </div>
      <img src="${LOGO}" class="logo" alt="SaffHire" />
    </div>

    <div class="cover-box">
      This packet summarizes the Safety Performance request and response currently saved in the SaffHire Monitoring database.
      Review the details before sending the completed packet to the client.
    </div>

    <h2>Report Summary</h2>
    <div class="grid">
      <div class="field"><b>File Number:</b> ${safe('fileNumber')}</div>
      <div class="field"><b>Applicant:</b> ${safe('applicantName')}</div>
      <div class="field"><b>Created:</b> ${safe('created')}</div>
      <div class="field"><b>Status:</b> ${safe('status')}</div>
      <div class="field"><b>Previous Employer:</b> ${safe('prevEmployerName')}</div>
      <div class="field"><b>Previous Employer Email:</b> ${safe('prevEmployerEmail')}</div>
      <div class="field"><b>Previous Employer Phone:</b> ${safe('prevEmployerPhone')}</div>
      <div class="field"><b>Previous Employer Fax:</b> ${safe('prevEmployerFax')}</div>
      <div class="field"><b>Previous Employer Address:</b> ${safe('prevEmployerStreet')} ${safe('prevEmployerCityStateZip', '')}</div>
      <div class="field"><b>Client / Prospective Employer:</b> ${safe('employerName')}</div>
    </div>

    <h2>Completion Details</h2>
    <div class="grid">
      <div class="field"><b>Information Received From:</b> ${safe('infoReceivedFrom')}</div>
      <div class="field"><b>Date Received:</b> ${safe('infoReceivedDate')}</div>
      <div class="field"><b>Employed by Company:</b> ${safe('employedByCompany')}</div>
      <div class="field"><b>Job Title:</b> ${safe('jobTitle')}</div>
      <div class="field"><b>From Date:</b> ${safe('fromDate')}</div>
      <div class="field"><b>To Date:</b> ${safe('toDate')}</div>
      <div class="field"><b>Drove Motor Vehicle:</b> ${safe('droveMotorVehicle')}</div>
      <div class="field"><b>Vehicle Types:</b> ${escapeHtml(vehicleSummary(report))}</div>
    </div>
  </section>

  <section class="page page-break">
    <h1>Safety Performance Details</h1>

    <h2>Accident History</h2>
    <div class="field"><b>Accident History Summary:</b> ${safe('accidentHistory')}</div>
    <table>
      <thead><tr><th>#</th><th>Date</th><th>Location</th><th>Injuries</th><th>Fatalities</th><th>Hazmat</th></tr></thead>
      <tbody>
        ${accidentRows.map((row) => `<tr><td>${row.n}</td><td>${escapeHtml(row.date || '—')}</td><td>${escapeHtml(row.location || '—')}</td><td>${escapeHtml(row.injuries || '—')}</td><td>${escapeHtml(row.fatalities || '—')}</td><td>${escapeHtml(row.hazmat || '—')}</td></tr>`).join('')}
      </tbody>
    </table>
    <h3>Other Accident Details</h3>
    <div class="notes">${escapeHtml(value(report, 'otherAccidents'))}</div>

    <h2>DOT Drug and Alcohol Information</h2>
    <div class="grid">
      <div class="field"><b>Alcohol Test Positive:</b> ${yesNo(report.dotAlcoholTestPositive)}</div>
      <div class="field"><b>Drug Test Positive:</b> ${yesNo(report.dotDrugTestPositive)}</div>
      <div class="field"><b>Refused Test:</b> ${yesNo(report.dotRefusedTest)}</div>
      <div class="field"><b>Other DOT Violations:</b> ${yesNo(report.dotOtherViolations)}</div>
      <div class="field"><b>Company Representative:</b> ${safe('dotCompany')}</div>
      <div class="field"><b>Employee:</b> ${safe('dotEmployee')}</div>
    </div>

    <h2>Internal Notes / Submission Notes</h2>
    <div class="notes">${escapeHtml(value(report, 'notes'))}</div>

    <div class="signature">
      <div><div class="line"></div> Reviewed By</div>
      <div><div class="line"></div> Date</div>
    </div>

    <p class="meta no-print">Use your browser print window and choose “Save as PDF” to save this completed packet.</p>
  </section>
</body>
</html>`;
  }

  function toast(message, danger) {
    let box = document.getElementById('phase7-toast');
    if (!box) {
      box = document.createElement('div');
      box.id = 'phase7-toast';
      document.body.appendChild(box);
    }
    box.className = danger ? 'phase7-toast danger' : 'phase7-toast';
    box.textContent = message;
    clearTimeout(box.__hideTimer);
    box.__hideTimer = setTimeout(() => box.remove(), 6500);
  }

  async function copyText(value, message) {
    try {
      await navigator.clipboard.writeText(value);
      toast(message || 'Copied.');
    } catch {
      window.prompt('Copy this:', value);
    }
  }

  function openPacket(report) {
    const win = window.open('', '_blank');
    if (!win) return toast('Popup blocked. Allow popups and try again.', true);
    win.document.open();
    win.document.write(reportPackageHtml(report));
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 450);
  }

  function clientDraft(report) {
    const clientEmail = value(report, 'employerEmail', '');
    const subject = `Completed Safety Performance Report${value(report, 'fileNumber', '') ? ` - File #${value(report, 'fileNumber', '')}` : ''}`;
    const body = [
      'Hello,',
      '',
      `The Safety Performance report has been completed for ${value(report, 'applicantName', 'the applicant')}.`,
      '',
      `File Number: ${value(report, 'fileNumber', '')}`,
      `Applicant: ${value(report, 'applicantName', '')}`,
      `Previous Employer: ${value(report, 'prevEmployerName', '')}`,
      `Information Received From: ${value(report, 'infoReceivedFrom', '')}`,
      `Date Received: ${value(report, 'infoReceivedDate', '')}`,
      '',
      'The completed packet is ready. Please attach the saved PDF packet before sending this email.',
      '',
      'Thank you,',
      COMPANY_NAME,
      SUPPORT_EMAIL
    ].filter(Boolean).join('\n');
    return {
      to: clientEmail,
      subject,
      body,
      full: `To: ${clientEmail || '[enter client email]'}\nSubject: ${subject}\n\n${body}`,
      gmailUrl: 'https://mail.google.com/mail/?view=cm&fs=1'
        + `&to=${encodeURIComponent(clientEmail || '')}`
        + `&su=${encodeURIComponent(subject)}`
        + `&body=${encodeURIComponent(body)}`
    };
  }

  async function markCompleted(row, report) {
    const updated = Object.assign({}, report, {
      status: 'Completed',
      followUpDate: '',
      notes: appendNote(report.notes, `Completed packet prepared ${todayIso()}.`)
    });

    const companyId = getCompanyId();
    const saved = await api(`/api/safety-reports?companyId=${encodeURIComponent(companyId)}`, {
      method: 'PATCH',
      body: JSON.stringify(updated)
    });

    const cells = getCells(row);
    if (cells[3]) cells[3].innerHTML = '<span class="status-chip completed">Completed</span>';
    if (cells[4]) cells[4].textContent = '';
    if (cells[6]) cells[6].textContent = (saved.report && saved.report.notes) || updated.notes || '';
    row.classList.add('phase7-completed-row');
    setTimeout(() => row.classList.remove('phase7-completed-row'), 2400);
  }

  async function withReport(row, handler) {
    const data = rowData(row);
    if (!data.fileNumber) return toast('Could not read file number for this row.', true);
    const report = await findReport(data.fileNumber);
    if (!report || !report.id) return toast(`Could not find file #${data.fileNumber} in the database.`, true);
    return handler(report, data);
  }

  function addTools(row) {
    const cells = getCells(row);
    if (!cells[7] || cells[7].querySelector('.phase7-tools')) return;
    const holder = document.createElement('div');
    holder.className = 'phase7-tools';
    holder.innerHTML = `
      <button type="button" data-phase7-action="packet">Final Packet</button>
      <button type="button" data-phase7-action="client-gmail">Client Gmail</button>
      <button type="button" data-phase7-action="copy-client">Copy Client Draft</button>
      <button type="button" data-phase7-action="complete">Mark Completed</button>
    `;
    cells[7].appendChild(holder);
  }

  function addPanel() {
    const safetyHeader = Array.from(document.querySelectorAll('.page-header h1')).find((h) => text(h) === 'Safety Performance Reports');
    if (!safetyHeader || document.getElementById('phase7-panel')) return;
    const after = document.getElementById('phase6-panel') || document.getElementById('phase5a-panel') || document.getElementById('phase4d-panel') || document.getElementById('phase4c-command-center') || safetyHeader.closest('.page-header');
    const panel = document.createElement('section');
    panel.id = 'phase7-panel';
    panel.className = 'card wide-card phase7-panel';
    panel.innerHTML = `
      <h2>Phase 7 Completed Packet</h2>
      <p>Use <b>Final Packet</b> to review and save the completed Safety Performance packet as a PDF. Use <b>Client Gmail</b> to open a client-ready email draft after saving the PDF.</p>
      <p class="phase7-small">This phase does not attach files automatically. Save the packet as PDF, then attach it in Gmail before sending.</p>
    `;
    after.insertAdjacentElement('afterend', panel);
  }

  function addStyles() {
    if (document.getElementById('phase7-style')) return;
    const style = document.createElement('style');
    style.id = 'phase7-style';
    style.textContent = `
      .phase7-panel { margin-bottom: 16px; padding: 16px; border-left: 5px solid #7c3aed; }
      .phase7-panel h2 { margin: 0 0 8px; }
      .phase7-small { color: #64748b; font-size: 13px; }
      .phase7-tools { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
      .phase7-tools button { border: 1px solid #7c3aed; background: #f5f3ff; color: #5b21b6; border-radius: 999px; padding: 7px 10px; font-size: 12px; font-weight: 900; }
      .phase7-tools button:hover { background: #ede9fe; }
      .phase7-completed-row td { background: #dcfce7 !important; }
      .phase7-toast { position: fixed; right: 18px; bottom: 18px; z-index: 10006; background: #111827; color: #fff; border-radius: 12px; padding: 12px 14px; box-shadow: 0 18px 45px rgba(15,23,42,.25); font-size: 14px; max-width: 440px; }
      .phase7-toast.danger { background: #991b1b; }
    `;
    document.head.appendChild(style);
  }

  document.addEventListener('click', function (event) {
    const button = event.target && event.target.closest ? event.target.closest('[data-phase7-action]') : null;
    if (!button) return;
    const row = button.closest('tr');
    if (!row) return;

    const action = button.dataset.phase7Action;
    withReport(row, async (report) => {
      if (action === 'packet') return openPacket(report);
      if (action === 'client-gmail') {
        const draft = clientDraft(report);
        await copyText(draft.full, 'Client email draft copied. Attach the saved PDF before sending.');
        window.open(draft.gmailUrl, '_blank', 'noopener,noreferrer');
        return;
      }
      if (action === 'copy-client') {
        const draft = clientDraft(report);
        return copyText(draft.full, 'Client email draft copied.');
      }
      if (action === 'complete') {
        await markCompleted(row, report);
        toast('Report marked Completed.');
      }
    }).catch((error) => toast(error.message || 'Phase 7 action failed.', true));
  });

  function refresh() {
    const onSafetyPage = Array.from(document.querySelectorAll('.page-header h1')).some((h) => text(h) === 'Safety Performance Reports');
    if (!onSafetyPage) return;
    addStyles();
    addPanel();
    getRows().forEach(addTools);
  }

  setInterval(refresh, 1500);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', refresh);
  else refresh();
})();
