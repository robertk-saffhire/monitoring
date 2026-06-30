SAFFHIRE MONITORING - PHASE 10R SAFE HEADER SORT

This rebuilds sorting without the page observer loop that froze Monitoring.

What changed:
- Sorting is header-only.
- No sort buttons are added to the Monitoring Alerts card.
- No MutationObserver is used.
- The script only attaches a simple click handler to the Monitoring table.
- Rows are sorted once per header click.

Sortable headers:
- File #
- Name
- Order Date
- Med Expire

Files included:
- index.html
- public/phase10r-safe-header-sort.js
- disabled no-op copies of risky older sort scripts
- README_PHASE_10R_SAFE_HEADER_SORT.txt

SQL needed:
No.

Vercel ENV needed:
No.

Install:
1. Upload these files over the project.
2. Redeploy Vercel.
3. Hard refresh browser.
4. Go to Monitoring.
5. Click File #, Name, Order Date, and Med Expire headers.
6. Confirm rows sort and the page does not freeze.
