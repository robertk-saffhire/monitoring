import { json } from '../lib/db.js';
import { getUserFromRequest, publicUser } from '../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { status: 'error', message: 'Method not allowed' });
  const user = await getUserFromRequest(req);
  return json(res, 200, { status: 'ok', user: publicUser(user) });
}
