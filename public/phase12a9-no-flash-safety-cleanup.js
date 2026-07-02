(function () {
  const REMOVE_TITLES = [
    'Phase 5A Gmail Workflow',
    'Phase 6 Employer Response Form',
    'Phase 7 Completed Packet',
    'Phase 7A FMCSA PDF Mapping'
  ];

  const REMOVE_IDS = [
    'phase5a-panel',
    'phase6-panel',
    'phase7-panel',
    'phase7a-panel'
  ];

  function text(el) {
    return (el && el.textContent ? el.textContent : '').trim();
  }

  function isSafetyPage() {
    return Array.from(document.querySelectorAll('.page-header h1')).some((h) => text(h) === 'Safety Performance Reports');
  }

  function hardHide(el) {
    if (!el) return;
    el.style.setProperty('display', 'none', 'important');
    el.style.setProperty('visibility', 'hidden', 'important');
    el.style.setProperty('height', '0', 'important');
    el.style.setProperty('min-height', '0', 'important');
    el.style.setProperty('margin', '0', 'important');
    el.style.setProperty('padding', '0', 'important');
    el.style.setProperty('border', '0', 'important');
    el.style.setProperty('overflow', 'hidden', 'important');
    el.setAttribute('aria-hidden', 'true');
  }

  function shouldRemove(el) {
    if (!el || el === document.body || el === document.documentElement) return false;

    if (REMOVE_IDS.includes(el.id)) return true;

    const classText = String(el.className || '');
    if (/phase(5a|6|7|7a).*panel/i.test(classText)) return true;

    const t = text(el);
    return REMOVE_TITLES.some((title) => t.includes(title));
  }

  function findCards(root) {
    const found = [];

    if (root && root.nodeType === 1 && shouldRemove(root)) {
      found.push(root);
    }

    if (root && root.querySelectorAll) {
      REMOVE_IDS.forEach((id) => {
        const el = root.querySelector(`#${id}`);
        if (el) found.push(el);
      });

      root.querySelectorAll('section.card, div.card, .wide-card, [id*="phase5a"], [id*="phase6"], [id*="phase7"], [class*="phase5a"], [class*="phase6"], [class*="phase7"]').forEach((el) => {
        if (shouldRemove(el)) found.push(el);
      });
    }

    return Array.from(new Set(found));
  }

  function removeCards() {
    if (!isSafetyPage()) return;

    findCards(document).forEach((el) => {
      hardHide(el);
      setTimeout(() => {
        if (el && el.parentNode) el.remove();
      }, 10);
    });
  }

  // Hide immediately as nodes are added, before the interval cleanup.
  const observer = new MutationObserver((mutations) => {
    if (!isSafetyPage()) return;

    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        findCards(node).forEach((el) => {
          hardHide(el);
          setTimeout(() => {
            if (el && el.parentNode) el.remove();
          }, 10);
        });
      });
    }
  });

  function boot() {
    const startObserver = () => {
      if (document.body) {
        observer.observe(document.body, { childList: true, subtree: true });
      }
    };

    startObserver();
    removeCards();
    setInterval(removeCards, 300);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
