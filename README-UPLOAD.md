# Phase 12A-145 — Permanent Recent Safety PDF Downloads

Upload only:

- `public/client-portal.html`

## What changed

- The Download PDF buttons in Dashboard → Recent Safety Reports now work.
- A single delegated click handler manages every client Safety PDF button.
- Newly synced or newly displayed completed reports automatically use the same handler.
- The Safety Reports page continues using the same working download action.
- A clear warning appears if the browser blocks the PDF pop-up.

## Deployment

- SQL migration: No
- Vercel environment variables: No changes
