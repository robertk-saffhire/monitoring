# Phase 12A-129 — Client Portal Terminated Visibility Fix

Upload only this file:

- public/client-portal.html

What changed:

- Client Portal sidebar now labels the page as **User Admin / Access**.
- In Client Portal > User Admin / Access, **Terminated Records** is now its own table column instead of being buried in the access checkbox group.
- On the Monitoring page, if Terminated access is enabled, the client sees a clear notice that Terminated Records access is ON.
- Added a **Show Terminated Only** button on the Monitoring page when Terminated access is enabled.

No SQL migration needed.
No Vercel ENV changes needed.
