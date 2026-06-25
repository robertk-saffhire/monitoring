import pg from 'pg';
import bcrypt from 'bcryptjs';
import { jwtVerify, SignJWT } from 'jose';

const { Pool } = pg;
let pool: any;
const SESSION_COOKIE = 'saffhire_session';

function json(res: any, statusCode: number, payload: any) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function getPool() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is missing');
  if (!pool) pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  return pool;
}

async function query(text: string, params: any[] = []) {
  return getPool().query(text, params);
}

async function readBody(req: any) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string' && req.body.trim()) {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  const chunks: any[] = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  if (!chunks.length) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return {}; }
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

function setSessionCookie(res: any, token: string, maxAgeSeconds: number) {
  res.setHeader('Set-Cookie', [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Secure',
    `Max-Age=${maxAgeSeconds}`,
  ].join('; '));
}

function clearSessionCookie(res: any) {
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0`);
}

function publicUser(user: any) {
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName || user.username,
    role: user.role,
    companyId: user.companyId ?? null,
    mustChangePassword: user.mustChangePassword || false,
  };
}

async function getUserFromRequest(req: any) {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    const id = Number(payload.sub);
    const result = await query('select id, username, "displayName", role, "companyId", "isActive", "mustChangePassword" from local_users where id=$1 limit 1', [id]);
    const user = result.rows[0] || null;
    if (!user || !user.isActive) return null;
    return user;
  } catch {
    return null;
  }
}

async function requireUser(req: any, res: any) {
  const user = await getUserFromRequest(req);
  if (!user) {
    json(res, 401, { status: 'error', message: 'Login required' });
    return null;
  }
  return user;
}

function getRoute(req: any) {
  const url = new URL(req.url || '/', 'https://local.test');
  return url.searchParams.get('path') || url.pathname.replace(/^\/api\/?/, '').replace(/^\//, '');
}

async function auth(req: any, res: any, route: string) {
  if (route === 'auth/setup-status' && req.method === 'GET') {
    const result = await query("select count(*)::int as count from local_users where role='admin'");
    return json(res, 200, { status: 'ok', hasAdmin: Number(result.rows[0]?.count || 0) > 0 });
  }

  if (route === 'auth/setup-admin' && req.method === 'POST') {
    const count = await query("select count(*)::int as count from local_users where role='admin'");
    if (Number(count.rows[0]?.count || 0) > 0) return json(res, 400, { status: 'error', message: 'Admin already exists' });
    const body = await readBody(req);
    const username = String(body.username || '').trim().toLowerCase();
    const password = String(body.password || '');
    if (username.length < 3 || password.length < 6) return json(res, 400, { status: 'error', message: 'Username and password are required' });
    const company = await query("select id from companies where slug='driver-pipeline' limit 1");
    const companyId = company.rows[0]?.id || null;
    const passwordHash = await bcrypt.hash(password, 12);
    const result = await query('insert into local_users (username, "passwordHash", "displayName", role, "companyId", "isActive") values ($1,$2,$3,$4,$5,true) returning id, username, "displayName", role, "companyId", "mustChangePassword"', [username, passwordHash, username, 'admin', companyId]);
    const user = result.rows[0];
    const token = await new SignJWT({ sub: String(user.id), role: user.role, name: user.displayName || user.username }).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('30d').sign(secret());
    setSessionCookie(res, token, 60 * 60 * 24 * 30);
    return json(res, 200, { status: 'ok', user: publicUser(user) });
  }

  if (route === 'auth/login' && req.method === 'POST') {
    const body = await readBody(req);
    const username = String(body.username || '').trim().toLowerCase();
    const password = String(body.password || '');
    const result = await query('select id, username, "passwordHash", "displayName", role, "companyId", "isActive", "mustChangePassword" from local_users where lower(username)=lower($1) limit 1', [username]);
    const user = result.rows[0];
    if (!user || !user.isActive || !(await bcrypt.compare(password, user.passwordHash))) return json(res, 401, { status: 'error', message: 'Invalid username or password' });
    await query('update local_users set "lastSignedIn"=now() where id=$1', [user.id]);
    const token = await new SignJWT({ sub: String(user.id), role: user.role, name: user.displayName || user.username }).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime(body.rememberMe ? '30d' : '1d').sign(secret());
    setSessionCookie(res, token, body.rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24);
    return json(res, 200, { status: 'ok', user: publicUser(user) });
  }

  if (route === 'auth/me' && req.method === 'GET') {
    const user = await getUserFromRequest(req);
    return json(res, 200, { status: 'ok', user: publicUser(user) });
  }

  if (route === 'auth/logout' && req.method === 'POST') {
    clearSessionCookie(res);
    return json(res, 200, { status: 'ok' });
  }

  return false;
}

export default async function handler(req: any, res: any) {
  try {
    const route = getRoute(req);
    const authResult = await auth(req, res, route);
    if (authResult !== false) return;

    const user = await requireUser(req, res);
    if (!user) return;

    if (route === 'companies' && req.method === 'GET') {
      const result = await query('select id, name, slug, "isActive" from companies where "isActive"=true order by name');
      return json(res, 200, { status: 'ok', companies: result.rows });
    }

    return json(res, 404, { status: 'error', message: 'Route not found' });
  } catch (error: any) {
    return json(res, 500, { status: 'error', message: error?.message || 'Server error' });
  }
}
