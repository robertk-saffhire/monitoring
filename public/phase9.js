/* Phase 12A-140: retired legacy role patch.
   Native React navigation, API permission enforcement, and phase9b-role-sync.js
   now own internal user permissions. Keeping this file as a no-op prevents
   cached index.html references from restoring the old "SaffHire Users cannot
   delete" restriction. */
(function () {})();
