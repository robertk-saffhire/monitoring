# Phase 12A-148 — SaffHire Admin DOB Format

Upload only:

- `index.html`
- `public/phase12a148-admin-dob-format.js`

What changed:

- DOB values on the SaffHire admin side display as `MM/DD/YYYY`.
- Example: `2026-07-05` displays as `07/05/2026`.
- Existing DOB inputs are reformatted when they load.
- Typed DOB values are normalized when leaving the field or saving.
- Future rows added after refresh or sync are formatted automatically.
- Client portal pages are not changed.

SQL migration: No
Vercel environment variables: No
