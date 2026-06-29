import pg from 'pg';
import { jwtVerify, SignJWT } from 'jose';

const { Pool } = pg;
let pool: any;
const SESSION_COOKIE = 'saffhire_session';

function json(res: any, statusCode: number, payload: any) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

async function readBody(req: any) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string' && req.body.trim()) { try { return JSON.parse(req.body); } catch { return {}; } }
  const chunks: any[] = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  if (!chunks.length) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return {}; }
}

function getPool() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is missing');
  if (!pool) pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  return pool;
}

async function query(text: string, params: any[] = []) {
  return getPool().query(text, params);
}

function secret() {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is missing');
  return new TextEncoder().encode(process.env.JWT_SECRET);
}

function parseCookies(req: any) {
  const header = req.headers?.cookie || '';
  const out: any = {};
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (!key) continue;
    try { out[key] = decodeURIComponent(val); } catch { out[key] = val; }
  }
  return out;
}

async function getUser(req: any) {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    const id = Number(payload.sub);
    const r = await query('select id, username, role, "isActive" from local_users where id=$1 limit 1', [id]);
    const user = r.rows[0] || null;
    if (!user || !user.isActive) return null;
    return user;
  } catch { return null; }
}

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'POST') return json(res, 405, { status: 'error', message: 'Method not allowed' });
    const user = await getUser(req);
    if (!user) return json(res, 401, { status: 'error', message: 'Login required' });

    const body = await readBody(req);
    const companyId = Number(body.companyId || 1);
    const fileNumber = String(body.fileNumber || '').trim();
    if (!fileNumber) return json(res, 400, { status: 'error', message: 'File number is required' });

    const report = await query('select id, "companyId", "fileNumber", "applicantName", "prevEmployerName" from safety_reports where "companyId"=$1 and "fileNumber"=$2 order by id asc limit 1', [companyId, fileNumber]);
    const row = report.rows[0];
    if (!row) return json(res, 404, { status: 'error', message: 'Safety report not found' });

    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const token = await new SignJWT({ type: 'safety_response', reportId: row.id, companyId: row.companyId, fileNumber: row.fileNumber })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('14d')
      .sign(secret());

    const origin = req.headers.origin || `https://${req.headers.host}`;
    const formUrl = `${origin}/employer-response.html?token=${encodeURIComponent(token)}`;
    return json(res, 200, { status: 'ok', formUrl, expiresAt: expiresAt.toISOString(), report: row });
  } catch (error: any) {
    return json(res, 500, { status: 'error', message: error?.message || 'Could not create response link' });
  }
}
