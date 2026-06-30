SAFFHIRE MONITORING - PHASE 10P HEADER SORT FIX

Problem:
The arrows were showing in the Monitoring table headers, but clicking them did not sort.

Fix:
This phase adds a stronger delegated header-click sorter that directly reorders the table body rows.

What it does:
- Keeps sorting only in the table headers.
- Removes sort buttons from the Monitoring Alerts card.
- Makes these headers clickable:
  - File #
  - Name
  - Order Date
  - Med Expire
- Toggles ascending/descending each click.
- Reapplies sorting if the table refreshes.

Files included:
- index.html
- public/phase10p-header-sort-fix.js
- README_PHASE_10P_HEADER_SORT_FIX.txt

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
6. Confirm rows reorder.
