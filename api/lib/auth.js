import bcrypt from 'bcryptjs';
import { jwtVerify, SignJWT } from 'jose';
import { query } from './db.js';

export const SESSION_COOKIE = 'saffhire_session';

function secret() {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is missing');
  return new TextEncoder().encode(process.env.JWT_SECRET);
}

export function parseCookies(req) {
  const header = req.headers?.cookie || '';
  const out = {};
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

export function setSessionCookie(res, token, maxAgeSeconds) {
  res.setHeader('Set-Cookie', [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Secure',
    `Max-Age=${maxAgeSeconds}`,
  ].join('; '));
}

export function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0`);
}

export function publicUser(user) {
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

export async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export async function signSession(user, rememberMe = false) {
  return new SignJWT({ sub: String(user.id), role: user.role, name: user.displayName || user.username })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(rememberMe ? '30d' : '1d')
    .sign(secret());
}

export async function getUserByUsername(username) {
  const result = await query(
    `select id, username, "passwordHash", "displayName", role, "companyId", "isActive", "mustChangePassword"
     from local_users
     where lower(username) = lower($1)
     limit 1`,
    [username]
  );
  return result.rows[0] || null;
}

export async function getUserFromRequest(req) {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    const id = Number(payload.sub);
    if (!Number.isFinite(id)) return null;
    const result = await query(
      `select id, username, "displayName", role, "companyId", "isActive", "mustChangePassword"
       from local_users where id = $1 limit 1`,
      [id]
    );
    const user = result.rows[0] || null;
    if (!user || !user.isActive) return null;
    return user;
  } catch {
    return null;
  }
}

export async function requireUser(req, res, json) {
  const user = await getUserFromRequest(req);
  if (!user) {
    json(res, 401, { status: 'error', message: 'Login required' });
    return null;
  }
  return user;
}
