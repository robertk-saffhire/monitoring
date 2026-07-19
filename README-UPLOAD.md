# Phase 12A-128 — Client Portal Terminated Checkbox Visibility

Upload only:

- `public/client-portal.html`

What changed:

- Makes the `Terminated Records` option visible in the Client Portal User Admin screen.
- Splits Client Access into two visible groups:
  - Portal Sections
  - Monitoring Controls
- Adds a highlighted `Terminated Records` checkbox so it is easy to find.
- Updates helper text to explain that Terminated Records controls whether client users can see terminated applicants and the Terminated field.

SQL migration needed: No.
Vercel ENV changes: No.
