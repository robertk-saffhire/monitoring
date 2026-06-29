import pg from 'pg';
import { jwtVerify } from 'jose';

const { Pool } = pg;
let pool: any;

const BOOL_FIELDS = new Set([
  'vehicleStraightTruck','vehicleTractorSemitrailer','vehicleBus','vehicleCargoTank','vehicleDoublesTriples','vehicleOther',
  'dotAlcoholTestPositive','dotDrugTestPositive','dotRefusedTest','dotOtherViolations'
]);

const TEXT_FIELDS = [
  'employedByCompany','jobTitle','fromDate','toDate','droveMotorVehicle',
  'accidentHistory','accidentDate1','accidentLocation1','accidentInjuries1','accidentFatalities1',
  'accidentDate2','accidentLocation2','accidentInjuries2','accidentFatalities2',
  'accidentDate3','accidentLocation3','accidentInjuries3','accidentFatalities3',
  'otherAccidents','infoReceivedFrom','infoReceivedDate'
];

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

async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, secret());
  if (payload.type !== 'safety_response') throw new Error('Invalid response link');
  return payload as any;
}

function clean(value: any) {
  return String(value ?? '').trim();
}

function bool(value: any) {
  return value === true || String(value || '').toLowerCase() === 'true' || String(value || '').toLowerCase() === 'on';
}

function publicReport(row: any) {
  const allowed = [
    'id','fileNumber','applicantName','prevEmployerName',
    'employedByCompany','jobTitle','fromDate','toDate','droveMotorVehicle',
    'vehicleStraightTruck','vehicleTractorSemitrailer','vehicleBus','vehicleCargoTank','vehicleDoublesTriples','vehicleOther',
    'accidentHistory','accidentDate1','accidentLocation1','accidentInjuries1','accidentFatalities1',
    'accidentDate2','accidentLocation2','accidentInjuries2','accidentFatalities2',
    'accidentDate3','accidentLocation3','accidentInjuries3','accidentFatalities3',
    'otherAccidents','dotAlcoholTestPositive','dotDrugTestPositive','dotRefusedTest','dotOtherViolations',
    'infoReceivedFrom','infoReceivedDate'
  ];
  const out: any = {};
  allowed.forEach((key) => out[key] = row[key]);
  return out;
}

export default async function handler(req: any, res: any) {
  try {
    const url = new URL(req.url || '/', 'https://local.test');

    if (req.method === 'GET') {
      const token = String(url.searchParams.get('token') || '');
      if (!token) return json(res, 400, { status: 'error', message: 'Missing response token' });
      const payload = await verifyToken(token);
      const r = await query('select * from safety_reports where id=$1 and "companyId"=$2 limit 1', [Number(payload.reportId), Number(payload.companyId)]);
      const row = r.rows[0];
      if (!row) return json(res, 404, { status: 'error', message: 'Safety report not found' });
      return json(res, 200, { status: 'ok', report: publicReport(row) });
    }

    if (req.method === 'POST') {
      const body = await readBody(req);
      const token = String(body.token || '');
      if (!token) return json(res, 400, { status: 'error', message: 'Missing response token' });
      const payload = await verifyToken(token);

      const values: any[] = [];
      const assignments: string[] = [];

      TEXT_FIELDS.forEach((field) => {
        values.push(clean(body[field]));
        assignments.push(`"${field}"=$${values.length}`);
      });

      BOOL_FIELDS.forEach((field) => {
        values.push(bool(body[field]));
        assignments.push(`"${field}"=$${values.length}`);
      });

      const extraNotes = clean(body.notes);
      const completedBy = clean(body.infoReceivedFrom);
      const completedDate = clean(body.infoReceivedDate) || new Date().toISOString().slice(0, 10);
      values.push(`Employer response form submitted ${completedDate}${completedBy ? ` by ${completedBy}` : ''}.${extraNotes ? ` Notes: ${extraNotes}` : ''}`);
      const noteParam = values.length;

      values.push(Number(payload.reportId));
      const reportParam = values.length;
      values.push(Number(payload.companyId));
      const companyParam = values.length;

      const sql = `
        update safety_reports
        set ${assignments.join(',')},
            status='Emp Complete',
            "followUpDate"='',
            notes=trim(both E'\n' from concat(coalesce(notes,''), E'\n', $${noteParam})),
            "updatedAt"=now()
        where id=$${reportParam} and "companyId"=$${companyParam}
        returning *
      `;

      const r = await query(sql, values);
      const row = r.rows[0];
      if (!row) return json(res, 404, { status: 'error', message: 'Safety report not found' });
      return json(res, 200, { status: 'ok', saved: true });
    }

    return json(res, 405, { status: 'error', message: 'Method not allowed' });
  } catch (error: any) {
    return json(res, 500, { status: 'error', message: error?.message || 'Could not save response' });
  }
}
