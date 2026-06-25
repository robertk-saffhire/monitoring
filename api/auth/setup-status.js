import { json, query } from '../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { status: 'error', message: 'Method not allowed' });
  try {
    const result = await query(`select id from local_users where role = 'admin' and "isActive" = true limit 1`);
    return json(res, 200, { status: 'ok', hasAdmin: result.rows.length > 0 });
  } catch (error) {
    return json(res, 500, { status: 'error', message: error.message || 'Could not check setup status' });
  }
}
