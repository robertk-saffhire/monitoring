import { json, query, readBody } from './lib/db.js';
import { hashPassword, requireUser } from './lib/auth.js';

const ROLES = new Set(['admin', 'user', 'viewer']);

function requireAdmin(user, res) {
  if (user.role !== 'admin') {
    json(res, 403, { status: 'error', message: 'Admin access required' });
    return false;
  }
  return true;
}

function publicUser(row) {
  return {
    id: row.id,
    username: row.username,
    displayName: row.displayName || row.username,
    role: row.role,
    companyId: row.companyId,
    isActive: row.isActive,
    mustChangePassword: row.mustChangePassword,
    lastSignedIn: row.lastSignedIn,
  };
}

export default async function handler(req, res) {
  const user = await requireUser(req, res, json);
  if (!user) return;
  if (!requireAdmin(user, res)) return;

  try {
    if (req.method === 'GET') {
      const result = await query(
        `select id, username, "displayName", role, "companyId", "isActive", "mustChangePassword", "lastSignedIn"
         from local_users
         order by id asc`
      );
      return json(res, 200, { status: 'ok', users: result.rows.map(publicUser) });
    }

    if (req.method === 'POST') {
      const body = await readBody(req);
      const username = String(body.username || '').trim().toLowerCase();
      const password = String(body.password || '');
      const role = ROLES.has(body.role) ? body.role : 'user';
      const displayName = String(body.displayName || username).trim();
      const companyId = body.companyId ? Number(body.companyId) : null;

      if (username.length < 3) return json(res, 400, { status: 'error', message: 'Username must be at least 3 characters' });
      if (password.length < 6) return json(res, 400, { status: 'error', message: 'Password must be at least 6 characters' });

      const passwordHash = await hashPassword(password);
      const result = await query(
        `insert into local_users (username, "passwordHash", "displayName", role, "companyId", "isActive", "mustChangePassword")
         values ($1, $2, $3, $4, $5, true, false)
         returning id, username, "displayName", role, "companyId", "isActive", "mustChangePassword", "lastSignedIn"`,
        [username, passwordHash, displayName, role, companyId]
      );
      return json(res, 200, { status: 'ok', user: publicUser(result.rows[0]) });
    }

    if (req.method === 'PATCH') {
      const body = await readBody(req);
      const id = Number(body.id);
      if (!id) return json(res, 400, { status: 'error', message: 'User id is required' });

      const role = ROLES.has(body.role) ? body.role : 'user';
      const displayName = String(body.displayName || '').trim();
      const companyId = body.companyId ? Number(body.companyId) : null;
      const isActive = body.isActive !== false;
      const fields = ['"displayName"=$1', 'role=$2', '"companyId"=$3', '"isActive"=$4', '"updatedAt"=now()'];
      const params = [displayName, role, companyId, isActive];

      if (body.password) {
        params.push(await hashPassword(String(body.password)));
        fields.push(`"passwordHash"=$${params.length}`);
        fields.push('"mustChangePassword"=false');
      }
      params.push(id);
      const result = await query(
        `update local_users set ${fields.join(', ')} where id=$${params.length} returning id, username, "displayName", role, "companyId", "isActive", "mustChangePassword", "lastSignedIn"`,
        params
      );
      if (!result.rows[0]) return json(res, 404, { status: 'error', message: 'User not found' });
      return json(res, 200, { status: 'ok', user: publicUser(result.rows[0]) });
    }

    if (req.method === 'DELETE') {
      const id = Number(req.query.id);
      if (!id) return json(res, 400, { status: 'error', message: 'User id is required' });
      if (id === user.id) return json(res, 400, { status: 'error', message: 'You cannot delete your own account' });
      await query('delete from local_users where id=$1', [id]);
      return json(res, 200, { status: 'ok', success: true });
    }

    return json(res, 405, { status: 'error', message: 'Method not allowed' });
  } catch (error) {
    return json(res, 500, { status: 'error', message: error.message || 'Could not save user' });
  }
}
