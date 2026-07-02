(function () {
  const REMOVE_TITLES = [
    'Phase 5A Gmail Workflow',
    'Phase 6 Employer Response Form',
    'Phase 7 Completed Packet',
    'Phase 7A FMCSA PDF Mapping'
  ];

  function text(el) {
    return (el && el.textContent ? el.textContent : '').trim();
  }

  function isSafetyPerformancePage() {
    return Array.from(document.querySelectorAll('.page-header h1')).some((h) => text(h) === 'Safety Performance Reports');
  }

  function shouldRemoveCard(card) {
    const cardText = text(card);
    return REMOVE_TITLES.some((title) => cardText.includes(title));
  }

  function removePhaseCards() {
    if (!isSafetyPerformancePage()) return;

    Array.from(document.querySelectorAll('section.card, div.card, .wide-card')).forEach((card) => {
      if (shouldRemoveCard(card)) {
        card.remove();
      }
    });
  }

  function boot() {
    removePhaseCards();
    setInterval(removePhaseCards, 600);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
