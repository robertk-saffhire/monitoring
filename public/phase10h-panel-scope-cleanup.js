(function () {
  function text(el) {
    return (el && el.textContent ? el.textContent : '').trim();
  }

  function pageTitle() {
    const h1 = document.querySelector('.page-header h1');
    return text(h1);
  }

  function removeElement(el) {
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  function removeById(id) {
    removeElement(document.getElementById(id));
  }

  function removeCardsByTitle(titles) {
    const cards = Array.from(document.querySelectorAll('section.card, div.card, .wide-card'));
    cards.forEach((card) => {
      const cardText = text(card);
      if (titles.some((title) => cardText.includes(title))) {
        removeElement(card);
      }
    });
  }

  function cleanupMonitoringPage() {
    // Monitoring should only show Monitoring-specific panels.
    removeById('phase5a-panel');
    removeById('phase6-panel');
    removeById('phase7-panel');
    removeById('phase7a-panel');
    removeById('phase10-panel');

    removeCardsByTitle([
      'Phase 5A Gmail Workflow',
      'Phase 6 Employer Response Form',
      'Phase 7 Completed Packet',
      'Phase 7A FMCSA PDF Mapping',
      'PDF Import to Applicant Database',
      'Medical PDF Upload & Scan'
    ]);
  }

  function cleanupSafetyPage() {
    // Safety page should not show Monitoring import/PDF applicant import card.
    removeById('phase10-panel');
    removeCardsByTitle([
      'PDF Import to Applicant Database',
      'Medical PDF Upload & Scan'
    ]);
  }

  function cleanupSettingsPage() {
    // Settings page should not show Safety Performance workflow cards.
    removeById('phase5a-panel');
    removeById('phase6-panel');
    removeById('phase7-panel');
    removeById('phase7a-panel');

    removeCardsByTitle([
      'Phase 5A Gmail Workflow',
      'Phase 6 Employer Response Form',
      'Phase 7 Completed Packet',
      'Phase 7A FMCSA PDF Mapping'
    ]);
  }

  function cleanupDashboardPage() {
    // Dashboard should not show workflow panels from other pages.
    removeById('phase5a-panel');
    removeById('phase6-panel');
    removeById('phase7-panel');
    removeById('phase7a-panel');
    removeById('phase10-panel');

    removeCardsByTitle([
      'Phase 5A Gmail Workflow',
      'Phase 6 Employer Response Form',
      'Phase 7 Completed Packet',
      'Phase 7A FMCSA PDF Mapping',
      'PDF Import to Applicant Database',
      'Medical PDF Upload & Scan'
    ]);
  }

  function cleanup() {
    const title = pageTitle();

    if (title === 'Monitoring') cleanupMonitoringPage();
    else if (title === 'Safety Performance Reports') cleanupSafetyPage();
    else if (title === 'Settings') cleanupSettingsPage();
    else if (title === 'Dashboard') cleanupDashboardPage();
  }

  function addStyles() {
    if (document.getElementById('phase10h-style')) return;
    const style = document.createElement('style');
    style.id = 'phase10h-style';
    style.textContent = `
      body.phase10h-monitoring-clean #phase5a-panel,
      body.phase10h-monitoring-clean #phase6-panel,
      body.phase10h-monitoring-clean #phase7-panel,
      body.phase10h-monitoring-clean #phase7a-panel,
      body.phase10h-monitoring-clean #phase10-panel {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  function setBodyClass() {
    document.body.classList.toggle('phase10h-monitoring-clean', pageTitle() === 'Monitoring');
  }

  function run() {
    addStyles();
    setBodyClass();
    cleanup();
  }

  setInterval(run, 500);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
