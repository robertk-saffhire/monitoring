import { json } from '../lib/db.js';
import { clearSessionCookie } from '../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { status: 'error', message: 'Method not allowed' });
  clearSessionCookie(res);
  return json(res, 200, { status: 'ok', success: true });
}
