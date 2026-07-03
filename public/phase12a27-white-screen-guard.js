(function () {
  // Emergency guard: if an older cached Phase 12A-26 script was loaded, keep the app root visible.
  function keepRootVisible() {
    const root = document.getElementById('root');
    if (root) {
      root.style.display = '';
      root.style.visibility = '';
      root.style.height = '';
      root.style.minHeight = '';
      root.style.overflow = '';
    }

    document.body.style.display = '';
    document.body.style.visibility = '';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', keepRootVisible);
  } else {
    keepRootVisible();
  }

  setInterval(keepRootVisible, 500);
})();
