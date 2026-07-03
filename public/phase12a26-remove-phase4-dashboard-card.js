(function () {
  const PHASE4_TEXT = [
    'Phase 4 Build',
    'This build adds Safety Performance print/PDF output',
    'S1 Complete',
    'Emp Sent',
    'Emp Complete',
    'Completed'
  ];

  function text(el) {
    return (el && el.textContent ? el.textContent : '').trim();
  }

  function isDashboardPage() {
    return Array.from(document.querySelectorAll('.page-header h1')).some((h) => text(h) === 'Dashboard');
  }

  function looksLikePhase4Card(el) {
    if (!el || el === document.body || el === document.documentElement) return false;

    const t = text(el);
    if (!t) return false;

    const hasTitle = t.includes('Phase 4 Build');
    const hasOldCopy = t.includes('This build adds Safety Performance print/PDF output');
    const hasStatusLabels =
      t.includes('S1 Complete') &&
      t.includes('Emp Sent') &&
      t.includes('Emp Complete') &&
      t.includes('Completed');

    return hasTitle && (hasOldCopy || hasStatusLabels);
  }

  function closestCard(el) {
    if (!el || !el.closest) return el;

    return el.closest('section.card, div.card, .wide-card, [class*="card"], section, div') || el;
  }

  function removePhase4Card() {
    if (!isDashboardPage()) return;

    Array.from(document.querySelectorAll('section.card, div.card, .wide-card, [class*="card"], section, div, h1, h2, h3')).forEach((el) => {
      if (!looksLikePhase4Card(el)) return;

      const card = closestCard(el);
      if (card && card.parentNode && card !== document.body && card !== document.documentElement) {
        card.remove();
      } else {
        el.remove();
      }
    });
  }

  function addStyles() {
    if (document.getElementById('phase12a26-style')) return;

    const style = document.createElement('style');
    style.id = 'phase12a26-style';
    style.textContent = `
      #phase4-build-card,
      .phase4-build-card,
      [data-phase4-build-card] {
        display: none !important;
        visibility: hidden !important;
        height: 0 !important;
        min-height: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
        border: 0 !important;
        overflow: hidden !important;
      }
    `;
    document.head.appendChild(style);
  }

  const observer = new MutationObserver(() => removePhase4Card());

  function boot() {
    addStyles();

    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    }

    removePhase4Card();
    setInterval(removePhase4Card, 500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
