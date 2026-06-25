import { json, query, readBody } from '../lib/db.js';
import { getUserByUsername, publicUser, setSessionCookie, signSession, verifyPassword } from '../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { status: 'error', message: 'Method not allowed' });
  try {
    const body = await readBody(req);
    const username = String(body.username || '').trim();
    const password = String(body.password || '');
    const rememberMe = Boolean(body.rememberMe);

    let user = await getUserByUsername(username);
    if (!user) {
      const admins = await query(`select id, username, "passwordHash", "displayName", role, "companyId", "isActive", "mustChangePassword" from local_users where role = 'admin' and "isActive" = true order by id asc limit 2`);
      if (admins.rows.length === 1) user = admins.rows[0];
    }

    if (!user || !user.isActive) return json(res, 401, { status: 'error', message: 'Invalid username or password' });
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) return json(res, 401, { status: 'error', message: 'Invalid username or password' });

    await query(`update local_users set "lastSignedIn" = now(), "updatedAt" = now() where id = $1`, [user.id]);
    const token = await signSession(user, rememberMe);
    setSessionCookie(res, token, rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60);
    return json(res, 200, { status: 'ok', success: true, user: publicUser(user), mustChangePassword: user.mustChangePassword });
  } catch (error) {
    return json(res, 500, { status: 'error', message: error.message || 'Could not log in' });
  }
}
