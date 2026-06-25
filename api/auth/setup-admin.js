import { json, query, readBody } from '../lib/db.js';
import { hashPassword, publicUser, setSessionCookie, signSession } from '../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { status: 'error', message: 'Method not allowed' });
  try {
    const admins = await query(`select id from local_users where role = 'admin' and "isActive" = true limit 1`);
    if (admins.rows.length > 0) return json(res, 403, { status: 'error', message: 'Admin setup is already complete' });

    const body = await readBody(req);
    const username = String(body.username || '').trim().toLowerCase();
    const password = String(body.password || '');
    if (username.length < 3) return json(res, 400, { status: 'error', message: 'Username must be at least 3 characters' });
    if (password.length < 6) return json(res, 400, { status: 'error', message: 'Password must be at least 6 characters' });

    const passwordHash = await hashPassword(password);
    const result = await query(
      `insert into local_users (username, "passwordHash", "displayName", role, "isActive", "mustChangePassword")
       values ($1, $2, $3, 'admin', true, false)
       on conflict (username) do update set
         "passwordHash" = excluded."passwordHash",
         "displayName" = excluded."displayName",
         role = 'admin',
         "isActive" = true,
         "mustChangePassword" = false,
         "updatedAt" = now()
       returning id, username, "displayName", role, "companyId", "isActive", "mustChangePassword"`,
      [username, passwordHash, username]
    );
    const user = result.rows[0];
    const token = await signSession(user, false);
    setSessionCookie(res, token, 24 * 60 * 60);
    return json(res, 200, { status: 'ok', success: true, user: publicUser(user) });
  } catch (error) {
    return json(res, 500, { status: 'error', message: error.message || 'Could not create admin account' });
  }
}
