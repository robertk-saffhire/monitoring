(function () {
  const ROGUE_TITLES = [
    'Employer Response Form Link',
    'Secure Form Link'
  ];

  const ROGUE_BUTTONS = [
    'Copy Link',
    'Copy Email Draft',
    'Open Form',
    'Open Gmail'
  ];

  function text(el) {
    return (el && el.textContent ? el.textContent : '').trim();
  }

  function isCurrentResponseLinkUi(el) {
    if (!el || !el.closest) return false;

    // PHASE12A68_RESPONSE_LINK_MODAL_EXEMPTION:
    // Do not remove the current working Response Link UI.
    // This cleanup file is only supposed to remove the old leaked rogue panel.
    return Boolean(
      el.closest('#phase6-modal') ||
      el.closest('.phase6-modal') ||
      el.closest('.phase6-modal-card') ||
      el.closest('#phase6-panel') ||
      el.closest('.phase6-panel')
    );
  }

  function looksLikeRogueEmployerPanel(el) {
    if (!el || el === document.body || el === document.documentElement) return false;
    if (isCurrentResponseLinkUi(el)) return false;


    const t = text(el);
    if (!t) return false;

    const hasTitle = ROGUE_TITLES.some((title) => t.includes(title));
    const hasButtons = ROGUE_BUTTONS.filter((label) => t.includes(label)).length >= 2;
    const hasOldCopy = t.includes('The employer can complete this form without logging in');

    return hasTitle && (hasButtons || hasOldCopy);
  }

  function closestPanel(el) {
    if (!el || !el.closest) return el;

    return el.closest(
      '[role="dialog"], .modal, .dialog, .popup, .overlay, section.card, div.card, .wide-card, .settings-card, form, div'
    ) || el;
  }

  function removeRogueEmployerPanels() {
    const candidates = Array.from(document.querySelectorAll('h1, h2, h3, div, section, form, [role="dialog"]'));

    candidates.forEach((el) => {
      if (!looksLikeRogueEmployerPanel(el)) return;

      const panel = closestPanel(el);

      if (panel && panel.parentNode && panel !== document.body && panel !== document.documentElement) {
        panel.remove();
      } else {
        el.remove();
      }
    });

    // Extra cleanup for the exact bottom page leak. It often appears as raw elements after the app root.
    Array.from(document.body.children).forEach((child) => {
      if (child.id === 'root') return;
      if (isCurrentResponseLinkUi(child)) return;
      if (looksLikeRogueEmployerPanel(child)) child.remove();
    });
  }

  function addStyles() {
    if (document.getElementById('phase12a25-style')) return;

    const style = document.createElement('style');
    style.id = 'phase12a25-style';
    style.textContent = `
      body > h1,
      body > h2,
      body > form {
        /* Most app content should live under #root. This prevents old leaked raw widgets from showing. */
      }

      body > h1:has(+ button),
      body > h2:has(+ button) {
        display: none !important;
      }

      [data-phase6-response-panel],
      #phase6-response-panel,
      #employer-response-form-link,
      .employer-response-form-link {
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

  const observer = new MutationObserver(() => {
    removeRogueEmployerPanels();
  });

  function boot() {
    addStyles();

    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    }

    removeRogueEmployerPanels();
    setInterval(removeRogueEmployerPanels, 500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
