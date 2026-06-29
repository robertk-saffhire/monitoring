SAFFHIRE MONITORING - PHASE 9 USER PERMISSIONS CLEANUP

What this phase adds:
- Role card in the sidebar showing current user and role
- Phase 9 Permissions panel on app pages
- Hides Settings for non-admin users
- Viewer mode read-only controls
- User role can edit, but cannot delete
- Admin role keeps full access

Roles:
1. Admin
   - Dashboard: View
   - Monitoring: Edit
   - Safety Performance: Edit / delete
   - Settings: Full admin

2. User
   - Dashboard: View
   - Monitoring: Edit
   - Safety Performance: Edit
   - Settings: Hidden
   - Delete buttons hidden

3. Viewer
   - Dashboard: View
   - Monitoring: Read only
   - Safety Performance: Read only
   - Settings: Hidden
   - Save/send/delete/status-change buttons hidden or blocked

Files included:
- index.html
- public/phase9.js
- README_PHASE_9.txt

SQL needed:
No.

Vercel ENV needed:
No.

Important:
This phase applies permissions at the visible app/UI level. It does not rewrite the database schema.

Install:
1. Upload these files over the existing project.
2. Redeploy Vercel.
3. Log in as admin and confirm full access.
4. Create or edit a test user with role viewer.
5. Log in as viewer and confirm editing controls are hidden/blocked.
6. Create or edit a test user with role user.
7. Confirm delete buttons are hidden for user role.

Recommended future hardening:
Phase 9B can add server-side API permission enforcement so UI rules and API rules match exactly.
