import pg from 'pg';
import { jwtVerify } from 'jose';
import coreHandler from './index';

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
    const result = await query('select id, username, "displayName", role, "companyId", "isActive" from local_users where id=$1 limit 1', [id]);
    const user = result.rows[0] || null;
    if (!user || !user.isActive) return null;
    return user;
  } catch {
    return null;
  }
}

function pathName(req: any) {
  const url = new URL(req.url || '/', 'https://local.test');
  return url.pathname.replace(/^\/api\/?/, '').replace(/^\//, '');
}

function env() {
  const baseUrl = String(process.env.TAZWORKS_PROXY_BASE_URL || '').replace(/\/+$/, '');
  const proxySecret = String(process.env.TAZWORKS_PROXY_SECRET || '');
  const clientGuid = String(process.env.TAZWORKS_CLIENT_GUID || '');
  if (!baseUrl) throw new Error('TAZWORKS_PROXY_BASE_URL is missing');
  if (!proxySecret) throw new Error('TAZWORKS_PROXY_SECRET is missing');
  if (!clientGuid) throw new Error('TAZWORKS_CLIENT_GUID is missing');
  return { baseUrl, proxySecret, clientGuid };
}

function safeMessage(errorText: string, statusCode?: number) {
  const value = String(errorText || '');
  if (statusCode === 401 || statusCode === 403 || /NOT_AUTHORIZED|NOT_AUTHENTICATED|not authorized|unauthorized/i.test(value)) {
    return 'Order access could not be verified.';
  }
  return 'The order connection is currently unavailable.';
}

function arr(payload: any) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.orders)) return payload.orders;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.searches)) return payload.searches;
  return [];
}

function dt(value: any) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toISOString();
}

function order(row: any) {
  return {
    orderGuid: row.orderGuid || row.guid || row.id || '',
    fileNumber: row.fileNumber || row.fileNo || row.orderNumber || '',
    orderStatus: row.orderStatus || row.status || '',
    orderType: row.orderType || row.type || '',
    orderedDate: dt(row.orderedDate || row.orderDate),
    completedDate: dt(row.completedDate),
    applicantName: row.applicantName || row.subjectName || row.name || '',
    clientName: row.clientName || '',
    clientCode: row.clientCode || '',
    productName: row.productName || row.packageName || '',
    requestedBy: row.requestedBy || row.requestor || '',
    searchFlagged: Boolean(row.searchFlagged || row.flagged),
    createdDate: dt(row.createdDate || row.createdAt),
    modifiedDate: dt(row.modifiedDate || row.updatedAt),
  };
}

function search(row: any) {
  return {
    searchGuid: row.searchGuid || row.guid || row.id || '',
    searchName: row.searchName || row.name || row.type || '',
    searchType: row.searchType || row.type || '',
    status: row.status || row.searchStatus || '',
    resultType: row.resultType || '',
    createdDate: dt(row.createdDate || row.createdAt),
    modifiedDate: dt(row.modifiedDate || row.updatedAt),
    flagged: Boolean(row.flagged || row.searchFlagged),
  };
}

function strip(value: any): any {
  if (Array.isArray(value)) return value.map(strip);
  if (value && typeof value === 'object') {
    const out: any = {};
    for (const [key, val] of Object.entries(value)) {
      if (/token|secret|authorization|password|bearer/i.test(key)) continue;
      out[key] = strip(val);
    }
    return out;
  }
  return value;
}

async function proxyGet(proxyPath: string) {
  const e = env();
  const response = await fetch(`${e.baseUrl}${proxyPath}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${e.proxySecret}`,
      Accept: 'application/json',
    },
  });

  const raw = await response.text();
  let payload: any = {};
  try { payload = raw ? JSON.parse(raw) : {}; } catch { payload = { raw }; }

  if (!response.ok) {
    const msg = payload?.message || payload?.error || raw || `Proxy returned ${response.status}`;
    const err: any = new Error(safeMessage(msg, response.status));
    err.statusCode = err.message === 'Order access could not be verified.' ? 403 : 503;
    throw err;
  }

  return payload;
}

async function handleOrders(req: any, res: any, route: string, url: URL) {
  if (req.method !== 'GET') {
    return json(res, 405, { status: 'error', message: 'Read-only endpoint. Method not allowed.' });
  }

  const e = env();

  if (route === 'orders') {
    const page = Math.max(0, Math.min(50, Number(url.searchParams.get('page') || '0') || 0));
    const size = Math.max(1, Math.min(50, Number(url.searchParams.get('size') || '10') || 10));
    const fileNumber = String(url.searchParams.get('fileNumber') || '').trim().toLowerCase();

    const payload = await proxyGet(`/tazworks/orders?page=${page}&size=${size}&clientGuid=${encodeURIComponent(e.clientGuid)}`);
    let orders = arr(payload).map(order);

    if (fileNumber) {
      orders = orders.filter((o: any) => String(o.fileNumber || '').toLowerCase().includes(fileNumber));
    }

    return json(res, 200, { status: 'ok', page, size, filtered: Boolean(fileNumber), orders, count: orders.length });
  }

  const searchesMatch = route.match(/^orders\/([^/]+)\/searches$/);
  if (searchesMatch) {
    const orderGuid = decodeURIComponent(searchesMatch[1]);
    const payload = await proxyGet(`/tazworks/orders/${encodeURIComponent(orderGuid)}/searches?clientGuid=${encodeURIComponent(e.clientGuid)}`);
    return json(res, 200, { status: 'ok', orderGuid, searches: arr(payload).map(search), count: arr(payload).length });
  }

  const resultMatch = route.match(/^orders\/([^/]+)\/searches\/([^/]+)\/results$/);
  if (resultMatch) {
    const orderGuid = decodeURIComponent(resultMatch[1]);
    const searchGuid = decodeURIComponent(resultMatch[2]);
    const resultType = String(url.searchParams.get('resultType') || 'EDITOR').trim() || 'EDITOR';
    const payload = await proxyGet(`/tazworks/orders/${encodeURIComponent(orderGuid)}/searches/${encodeURIComponent(searchGuid)}/results?resultType=${encodeURIComponent(resultType)}&clientGuid=${encodeURIComponent(e.clientGuid)}`);
    return json(res, 200, { status: 'ok', orderGuid, searchGuid, resultType, result: strip(payload) });
  }

  return json(res, 404, { status: 'error', message: 'Order route not found.' });
}

export default async function handler(req: any, res: any) {
  const url = new URL(req.url || '/', 'https://local.test');
  const route = pathName(req);

  if (!route.startsWith('orders')) {
    return coreHandler(req, res);
  }

  try {
    const user = await getUser(req);
    if (!user) return json(res, 401, { status: 'error', message: 'Login required' });
    return await handleOrders(req, res, route, url);
  } catch (error: any) {
    return json(res, error?.statusCode || 503, {
      status: 'error',
      message: error?.message || 'The order connection is currently unavailable.',
    });
  }
}
