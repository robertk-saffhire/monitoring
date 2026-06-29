(function () {
  const CONTACT_EMAIL = 'support@saffhire.com';
  const COMPANY_NAME = 'SaffHire Background Screening';

  function text(el) {
    return (el && el.textContent ? el.textContent : '').trim();
  }

  function getRows() {
    return Array.from(document.querySelectorAll('table tbody tr')).filter((row) => row.querySelectorAll('td').length >= 8);
  }

  function getCells(row) {
    return Array.from(row.querySelectorAll('td'));
  }

  function rowData(row) {
    const cells = getCells(row);
    const employerCell = cells[5];
    const employerText = text(employerCell);
    const emailMatch = employerText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    const notes = text(cells[6]);
    const lastEmailMatch =
      notes.match(/Marked employer request sent\s+(\d{4}-\d{2}-\d{2})/i) ||
      notes.match(/Employer email draft opened\s+(\d{4}-\d{2}-\d{2})/i) ||
      notes.match(/request sent\s+(\d{4}-\d{2}-\d{2})/i);
    return {
      fileNumber: text(cells[0]).replace(/[^0-9A-Za-z\-_.]/g, ''),
      applicant: text(cells[1]),
      created: text(cells[2]),
      status: text(cells[3]),
      followUp: text(cells[4]),
      employer: employerText.split('\n')[0] || '',
      employerEmail: emailMatch ? emailMatch[0] : '',
      notes,
      lastEmail: lastEmailMatch ? lastEmailMatch[1] : ''
    };
  }

  function toast(message) {
    let box = document.getElementById('phase4d-toast');
    if (!box) {
      box = document.createElement('div');
      box.id = 'phase4d-toast';
      box.className = 'phase4d-toast';
      document.body.appendChild(box);
    }
    box.textContent = message;
    clearTimeout(box.__hideTimer);
    box.__hideTimer = setTimeout(() => box.remove(), 4500);
  }

  async function copyText(value, successMessage) {
    try {
      await navigator.clipboard.writeText(value);
      toast(successMessage || 'Copied.');
    } catch {
      window.prompt('Copy this:', value);
    }
  }

  function buildImprovedEmail(row) {
    const data = rowData(row);
    const subject = `Safety Performance Information Request${data.fileNumber ? ` - File #${data.fileNumber}` : ''}`;
    const body = [
      'Hello,',
      '',
      `${COMPANY_NAME} is requesting Safety Performance information for the applicant listed below.`,
      '',
      `Applicant: ${data.applicant || '[Applicant Name]'}`,
      data.fileNumber ? `File Number: ${data.fileNumber}` : '',
      data.employer ? `Previous Employer Listed: ${data.employer}` : '',
      '',
      'Please reply with any available information for:',
      '1. Employment dates',
      '2. Job title / position',
      '3. Whether the applicant drove a motor vehicle',
      '4. Vehicle type(s), if applicable',
      '5. Accident history, if applicable',
      '6. DOT drug and alcohol testing information, if applicable',
      '7. Name/title of the person providing the information',
      '8. Date completed',
      '',
      'If this request should be sent to a different department, please reply with the correct contact information.',
      '',
      'Thank you,',
      COMPANY_NAME,
      CONTACT_EMAIL
    ].filter(Boolean).join('\n');
    return {
      to: data.employerEmail,
      subject,
      body,
      full: `To: ${data.employerEmail || '[enter employer email]'}\nSubject: ${subject}\n\n${body}`
    };
  }

  function openImprovedEmail(row) {
    const draft = buildImprovedEmail(row);
    copyText(draft.full, 'Improved email draft copied.');
    if (!draft.to) {
      toast('No employer email found. Draft copied so you can paste it manually.');
      return;
    }
    const url = `mailto:${encodeURIComponent(draft.to)}?subject=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(draft.body)}`;
    const mailWindow = window.open(url, '_blank', 'noopener,noreferrer');
    if (!mailWindow) window.location.href = url;
  }

  function addBadges(row) {
    const cells = getCells(row);
    if (cells.length < 8) return;

    const data = rowData(row);
    row.classList.toggle('phase4d-missing-email-row', !data.employerEmail && data.status !== 'Completed');
    row.classList.toggle('phase4d-no-employer-row', !data.employer && data.status !== 'Completed');

    let badgeBox = cells[5].querySelector('.phase4d-badges');
    if (!badgeBox) {
      badgeBox = document.createElement('div');
      badgeBox.className = 'phase4d-badges';
      cells[5].appendChild(badgeBox);
    }

    const badges = [];
    if (!data.employer) badges.push('<span class="phase4d-badge danger">No employer name</span>');
    if (!data.employerEmail) badges.push('<span class="phase4d-badge warn">Missing email</span>');
    if (data.lastEmail) badges.push(`<span class="phase4d-badge ok">Last emailed ${data.lastEmail}</span>`);
    if (data.followUp && data.status !== 'Completed') badges.push(`<span class="phase4d-badge info">Follow up ${data.followUp}</span>`);
    badgeBox.innerHTML = badges.join('');
  }

  function addTools(row) {
    const cells = getCells(row);
    if (cells.length < 8 || cells[7].querySelector('.phase4d-tools')) return;
    const tools = document.createElement('div');
    tools.className = 'phase4d-tools';
    tools.innerHTML = `
      <button type="button" data-phase4d-action="copy-email">Copy Email</button>
      <button type="button" data-phase4d-action="better-draft">Better Draft</button>
      <button type="button" data-phase4d-action="copy-summary">Copy Summary</button>
    `;
    cells[7].appendChild(tools);
  }

  function copyRowSummary(row) {
    const data = rowData(row);
    const summary = [
      `File #: ${data.fileNumber || ''}`,
      `Applicant: ${data.applicant || ''}`,
      `Status: ${data.status || ''}`,
      `Follow Up: ${data.followUp || ''}`,
      `Previous Employer: ${data.employer || ''}`,
      `Employer Email: ${data.employerEmail || ''}`,
      `Last Emailed: ${data.lastEmail || ''}`
    ].join('\n');
    copyText(summary, 'Report summary copied.');
  }

  function countExtra() {
    const counts = { missingEmail: 0, noEmployer: 0, lastEmailed: 0, needsFollowUp: 0 };
    getRows().forEach((row) => {
      const data = rowData(row);
      if (!data.employerEmail && data.status !== 'Completed') counts.missingEmail += 1;
      if (!data.employer && data.status !== 'Completed') counts.noEmployer += 1;
      if (data.lastEmail) counts.lastEmailed += 1;
      if (data.status === 'Emp Sent' && !data.followUp) counts.needsFollowUp += 1;
    });
    return counts;
  }

  function ensurePanel() {
    const safetyHeader = Array.from(document.querySelectorAll('.page-header h1')).find((h) => text(h) === 'Safety Performance Reports');
    if (!safetyHeader) return null;
    const existing = document.getElementById('phase4d-panel');
    if (existing) return existing;

    const phase4c = document.getElementById('phase4c-command-center');
    const panel = document.createElement('section');
    panel.id = 'phase4d-panel';
    panel.className = 'card wide-card phase4d-panel';
    if (phase4c) phase4c.insertAdjacentElement('afterend', panel);
    else safetyHeader.closest('.page-header').insertAdjacentElement('afterend', panel);
    return panel;
  }

  function applyPhase4DFilter(kind) {
    getRows().forEach((row) => {
      const data = rowData(row);
      let show = true;
      if (kind === 'missing-email') show = !data.employerEmail && data.status !== 'Completed';
      if (kind === 'no-employer') show = !data.employer && data.status !== 'Completed';
      if (kind === 'last-emailed') show = Boolean(data.lastEmail);
      if (kind === 'needs-follow-up') show = data.status === 'Emp Sent' && !data.followUp;
      if (kind === 'all') show = true;
      row.style.display = show ? '' : 'none';
    });
  }

  function refreshPanel() {
    const panel = ensurePanel();
    if (!panel) return;
    const counts = countExtra();
    panel.innerHTML = `
      <div class="phase4d-title">Phase 4D Daily Cleanup</div>
      <div class="phase4d-metrics">
        <button type="button" data-phase4d-filter="missing-email"><b>${counts.missingEmail}</b> Missing Email</button>
        <button type="button" data-phase4d-filter="no-employer"><b>${counts.noEmployer}</b> No Employer Name</button>
        <button type="button" data-phase4d-filter="last-emailed"><b>${counts.lastEmailed}</b> Last Emailed Found</button>
        <button type="button" data-phase4d-filter="needs-follow-up"><b>${counts.needsFollowUp}</b> Sent / No Follow-Up</button>
        <button type="button" data-phase4d-filter="all"><b>All</b> Reset View</button>
      </div>
      <p class="phase4d-note">Use these checks before sending requests: find missing employer emails, copy cleaner drafts, and copy a quick report summary.</p>
    `;
  }

  function addStyles() {
    if (document.getElementById('phase4d-style')) return;
    const style = document.createElement('style');
    style.id = 'phase4d-style';
    style.textContent = `
      .phase4d-panel { margin-bottom: 16px; padding: 16px; border-left: 5px solid #1fff00; }
      .phase4d-title { font-weight: 900; margin-bottom: 10px; font-size: 16px; }
      .phase4d-metrics { display: flex; flex-wrap: wrap; gap: 8px; }
      .phase4d-metrics button { border: 1px solid #cbd5e1; background: #fff; border-radius: 12px; padding: 9px 12px; font-weight: 800; color: #0f172a; }
      .phase4d-metrics button:hover { background: #ecfdf5; border-color: #22c55e; }
      .phase4d-metrics b { display: block; font-size: 20px; }
      .phase4d-note { margin: 10px 0 0; color: #64748b; font-size: 13px; }
      .phase4d-badges { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 5px; }
      .phase4d-badge { border-radius: 999px; padding: 3px 7px; font-size: 11px; font-weight: 800; display: inline-flex; }
      .phase4d-badge.warn { background: #fef3c7; color: #92400e; }
      .phase4d-badge.danger { background: #fee2e2; color: #991b1b; }
      .phase4d-badge.ok { background: #dcfce7; color: #166534; }
      .phase4d-badge.info { background: #dbeafe; color: #1d4ed8; }
      .phase4d-tools { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
      .phase4d-tools button { border: 1px solid #d1d5db; background: #fff; border-radius: 999px; padding: 6px 9px; font-size: 12px; font-weight: 800; }
      .phase4d-tools button:hover { background: #f0fdf4; border-color: #22c55e; }
      .phase4d-missing-email-row td { box-shadow: inset 4px 0 0 #f59e0b; }
      .phase4d-no-employer-row td { box-shadow: inset 4px 0 0 #ef4444; }
      .phase4d-toast { position: fixed; right: 18px; bottom: 18px; z-index: 10000; background: #111827; color: #fff; border-radius: 12px; padding: 12px 14px; box-shadow: 0 18px 45px rgba(15,23,42,.25); font-size: 14px; max-width: 380px; }
    `;
    document.head.appendChild(style);
  }

  function refresh() {
    const onSafetyPage = Array.from(document.querySelectorAll('.page-header h1')).some((h) => text(h) === 'Safety Performance Reports');
    if (!onSafetyPage) return;
    addStyles();
    getRows().forEach((row) => {
      addBadges(row);
      addTools(row);
    });
    refreshPanel();
  }

  document.addEventListener('click', function (event) {
    const actionButton = event.target && event.target.closest ? event.target.closest('[data-phase4d-action]') : null;
    if (actionButton) {
      const row = actionButton.closest('tr');
      if (!row) return;
      const action = actionButton.dataset.phase4dAction;
      const data = rowData(row);
      if (action === 'copy-email') {
        if (!data.employerEmail) return toast('No employer email found on this report.');
        return copyText(data.employerEmail, 'Employer email copied.');
      }
      if (action === 'better-draft') return openImprovedEmail(row);
      if (action === 'copy-summary') return copyRowSummary(row);
    }

    const filterButton = event.target && event.target.closest ? event.target.closest('[data-phase4d-filter]') : null;
    if (filterButton) {
      applyPhase4DFilter(filterButton.dataset.phase4dFilter || 'all');
    }
  });

  let lastSignature = '';
  setInterval(() => {
    const signature = getRows().map((row) => text(row)).join('|').slice(0, 6000);
    if (signature !== lastSignature) {
      lastSignature = signature;
      refresh();
    }
  }, 1500);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', refresh);
  else refresh();
})();
