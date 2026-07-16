Phase 12A-68 - Response Link Popup Fix

Issue found:
- public/phase12a25-remove-rogue-employer-response-panel.js was removing the new valid Response Link popup.
- It was originally built to remove an old broken/leaked employer response panel.
- The current popup used similar words, so the cleanup script deleted it.

Files:
- public/phase12a25-remove-rogue-employer-response-panel.js
- public/phase6.js

SQL needed:
- No

ENV needed:
- No
