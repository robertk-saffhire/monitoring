import pg from 'pg';
import { jwtVerify } from 'jose';

const { Pool } = pg;
let pool: any;
const SESSION_COOKIE = 'saffhire_session';

function json(res: any, statusCode: number, payload: any) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function safeMessage(errorText: string, statusCode?: number) {
  const text = String(errorText || '');
  if (statusCode === 401 || statusCode === 403 || /NOT_AUTHORIZED|NOT_AUTHENTICATED|not authorized|unauthorized/i.test(text)) {
    return 'Order access could not be verified.';
  }
  return 'The order connection is currently unavailable.';
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
    const r = await query('select id, username, "displayName", role, "isActive", "companyId" from local_users where id=$1 limit 1', [id]);
    const user = r.rows[0] || null;
    if (!user || !user.isActive) return null;
    return user;
  } catch {
    return null;
  }
}

function getEnv() {
  const baseUrl = String(process.env.TAZWORKS_PROXY_BASE_URL || '').replace(/\/+$/, '');
  const proxySecret = String(process.env.TAZWORKS_PROXY_SECRET || '');
  const clientGuid = String(process.env.TAZWORKS_CLIENT_GUID || '');

  if (!baseUrl) throw new Error('TAZWORKS_PROXY_BASE_URL is missing');
  if (!proxySecret) throw new Error('TAZWORKS_PROXY_SECRET is missing');
  if (!clientGuid) throw new Error('TAZWORKS_CLIENT_GUID is missing');

  return { baseUrl, proxySecret, clientGuid };
}

async function requireUser(req: any, res: any) {
  const user = await getUser(req);
  if (!user) {
    json(res, 401, { status: 'error', message: 'Login required' });
    return null;
  }
  return user;
}

function extractArray(payload: any) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.orders)) return payload.orders;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.searches)) return payload.searches;
  return [];
}

function normalizeDate(value: any) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toISOString();
}

function safeOrder(row: any) {
  return {
    orderGuid: row.orderGuid || row.guid || row.id || '',
    fileNumber: row.fileNumber || row.fileNo || row.orderNumber || '',
    orderStatus: row.orderStatus || row.status || '',
    orderType: row.orderType || row.type || '',
    orderedDate: normalizeDate(row.orderedDate || row.orderDate),
    completedDate: normalizeDate(row.completedDate),
    applicantName: row.applicantName || row.subjectName || row.name || '',
    clientName: row.clientName || '',
    clientCode: row.clientCode || '',
    productName: row.productName || row.packageName || '',
    requestedBy: row.requestedBy || row.requestor || '',
    searchFlagged: Boolean(row.searchFlagged || row.flagged),
    createdDate: normalizeDate(row.createdDate || row.createdAt),
    modifiedDate: normalizeDate(row.modifiedDate || row.updatedAt),
  };
}

function safeSearch(row: any) {
  return {
    searchGuid: row.searchGuid || row.guid || row.id || '',
    searchName: row.searchName || row.name || row.type || '',
    searchType: row.searchType || row.type || '',
    status: row.status || row.searchStatus || '',
    resultType: row.resultType || '',
    createdDate: normalizeDate(row.createdDate || row.createdAt),
    modifiedDate: normalizeDate(row.modifiedDate || row.updatedAt),
    flagged: Boolean(row.flagged || row.searchFlagged),
  };
}

async function proxyGet(path: string) {
  const env = getEnv();
  const response = await fetch(`${env.baseUrl}${path}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${env.proxySecret}`,
      Accept: 'application/json',
    },
  });

  const raw = await response.text();
  let payload: any = {};
  try { payload = raw ? JSON.parse(raw) : {}; } catch { payload = { raw }; }

  if (!response.ok) {
    const msg = payload?.message || payload?.error || raw || `Proxy returned ${response.status}`;
    const safe = safeMessage(msg, response.status);
    const err: any = new Error(safe);
    err.statusCode = safe === 'Order access could not be verified.' ? 403 : 503;
    throw err;
  }

  return payload;
}

function getQuery(req: any) {
  return new URL(req.url || '/', 'https://local.test').searchParams;
}

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'GET') return json(res, 405, { status: 'error', message: 'Read-only endpoint. Method not allowed.' });

    const user = await requireUser(req, res);
    if (!user) return;

    const env = getEnv();
    const q = getQuery(req);
    const page = Math.max(0, Math.min(50, Number(q.get('page') || '0') || 0));
    const size = Math.max(1, Math.min(50, Number(q.get('size') || '10') || 10));
    const fileNumber = String(q.get('fileNumber') || '').trim().toLowerCase();

    const payload = await proxyGet(`/tazworks/orders?page=${page}&size=${size}&clientGuid=${encodeURIComponent(env.clientGuid)}`);
    let orders = extractArray(payload).map(safeOrder);

    if (fileNumber) {
      orders = orders.filter((order: any) => String(order.fileNumber || '').toLowerCase().includes(fileNumber));
    }

    return json(res, 200, {
      status: 'ok',
      page,
      size,
      filtered: Boolean(fileNumber),
      orders,
      count: orders.length,
    });
  } catch (error: any) {
    return json(res, error.statusCode || 503, { status: 'error', message: error.message || 'The order connection is currently unavailable.' });
  }
}
