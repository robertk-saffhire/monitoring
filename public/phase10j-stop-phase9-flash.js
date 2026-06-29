(function () {
  function text(el) {
    return (el && el.textContent ? el.textContent : '').trim();
  }

  function pageTitle() {
    const h1 = document.querySelector('.page-header h1');
    return text(h1);
  }

  function isMonitoringPage() {
    return pageTitle() === 'Monitoring';
  }

  function addStyles() {
    if (document.getElementById('phase10j-style')) return;

    const style = document.createElement('style');
    style.id = 'phase10j-style';
    style.textContent = `
      body.phase10j-monitoring-page #phase9-permission-panel {
        display: none !important;
        height: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
        border: 0 !important;
        overflow: hidden !important;
      }

      body.phase10j-monitoring-page section.card:has(h2),
      body.phase10j-monitoring-page .wide-card:has(h2) {
        --phase10j-watch: 1;
      }
    `;
    document.head.appendChild(style);
  }

  function hidePanelImmediately() {
    const panel = document.getElementById('phase9-permission-panel');
    if (panel) {
      panel.style.display = 'none';
      panel.style.height = '0';
      panel.style.margin = '0';
      panel.style.padding = '0';
      panel.style.border = '0';
      panel.style.overflow = 'hidden';
      panel.setAttribute('aria-hidden', 'true');
    }

    // Some earlier scripts may recreate the card without the id for a split second.
    const cards = Array.from(document.querySelectorAll('section.card, div.card, .wide-card'));
    cards.forEach((card) => {
      if (text(card).includes('Phase 9 Permissions')) {
        card.style.display = 'none';
        card.style.height = '0';
        card.style.margin = '0';
        card.style.padding = '0';
        card.style.border = '0';
        card.style.overflow = 'hidden';
        card.setAttribute('aria-hidden', 'true');
      }
    });
  }

  function removePanelWhenStable() {
    const panel = document.getElementById('phase9-permission-panel');
    if (panel) panel.remove();

    Array.from(document.querySelectorAll('section.card, div.card, .wide-card')).forEach((card) => {
      if (text(card).includes('Phase 9 Permissions')) card.remove();
    });
  }

  function apply() {
    addStyles();

    const monitoring = isMonitoringPage();
    document.body.classList.toggle('phase10j-monitoring-page', monitoring);

    if (monitoring) {
      hidePanelImmediately();
      setTimeout(removePanelWhenStable, 50);
    }
  }

  const observer = new MutationObserver(() => {
    if (isMonitoringPage()) hidePanelImmediately();
  });

  function boot() {
    addStyles();
    observer.observe(document.body, { childList: true, subtree: true });
    apply();
  }

  setInterval(apply, 250);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
