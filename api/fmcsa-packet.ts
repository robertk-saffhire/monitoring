import pg from 'pg';
import { jwtVerify } from 'jose';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

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
async function query(text: string, params: any[] = []) { return getPool().query(text, params); }
function secret() { if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is missing'); return new TextEncoder().encode(process.env.JWT_SECRET); }
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
function clean(value: any) { return String(value ?? '').trim(); }
function same(value: any, expected: string) { return clean(value).toLowerCase() === expected.toLowerCase(); }
function bool(value: any) { return value === true || clean(value).toLowerCase() === 'true' || clean(value).toLowerCase() === 'yes' || clean(value).toLowerCase() === 'on'; }
function shortDate(value: any) { return clean(value).slice(0, 10); }
function splitText(value: any, maxLen = 82, maxLines = 4) {
  const text = clean(value).replace(/\s+/g, ' ');
  const lines: string[] = [];
  let current = '';
  for (const word of text.split(' ')) {
    if (!word) continue;
    if ((current + ' ' + word).trim().length > maxLen) {
      lines.push(current.trim());
      current = word;
      if (lines.length >= maxLines) break;
    } else current = (current + ' ' + word).trim();
  }
  if (current && lines.length < maxLines) lines.push(current.trim());
  while (lines.length < maxLines) lines.push('');
  return lines;
}

async function getReport(companyId: number, fileNumber: string) {
  const r = await query('select * from safety_reports where "companyId"=$1 and "fileNumber"=$2 order by id asc limit 1', [companyId, fileNumber]);
  return r.rows[0] || null;
}

function safeSetText(form: any, name: string, value: any) {
  try { form.getTextField(name).setText(clean(value)); } catch {}
}
function safeCheck(form: any, name: string, shouldCheck: any) {
  try {
    const cb = form.getCheckBox(name);
    if (shouldCheck) cb.check(); else cb.uncheck();
  } catch {}
}

function setAccidentRows(form: any, report: any) {
  safeSetText(form, 'Date_4', report.accidentDate1);
  safeSetText(form, 'Location 1', report.accidentLocation1);
  safeSetText(form, 'No of Injuries No of Fatalities', report.accidentInjuries1);
  safeSetText(form, '1_2', report.accidentFatalities1);
  safeSetText(form, 'Hazmat Spill 1', report.accidentHazmat1);
  safeSetText(form, '2', report.accidentDate2);
  safeSetText(form, 'Location 2', report.accidentLocation2);
  safeSetText(form, '1', report.accidentInjuries2);
  safeSetText(form, '2_3', report.accidentFatalities2);
  safeSetText(form, 'Hazmat Spill 2', report.accidentHazmat2);
  safeSetText(form, '3', report.accidentDate3);
  safeSetText(form, 'Location 3', report.accidentLocation3);
  safeSetText(form, '2_2', report.accidentInjuries3);
  safeSetText(form, '3_2', report.accidentFatalities3);
  safeSetText(form, 'Hazmat Spill 3', report.accidentHazmat3);
  const lines = splitText(report.otherAccidents, 88, 4);
  safeSetText(form, 'Please provide information concerning any other commercial motor vehicle accidents involving the applicant that were reported', lines[0]);
  safeSetText(form, 'to government agencies or insurers or retained under internal company policies 1', lines[1]);
  safeSetText(form, 'to government agencies or insurers or retained under internal company policies 2', lines[2]);
  safeSetText(form, 'to government agencies or insurers or retained under internal company policies 3', lines[3]);
}

async function buildPdf(report: any) {
  const templatePath = path.join(process.cwd(), 'public', 'fmcsa-safety-performance-template.pdf');
  const templateBytes = fs.readFileSync(templatePath);
  const pdfDoc = await PDFDocument.load(templateBytes);
  const form = pdfDoc.getForm();

  // Section 1 - applicant authorization and employer details
  safeSetText(form, 'I Print Name', report.applicantName);
  safeSetText(form, 'Previous Employer 1', report.prevEmployerName);
  safeSetText(form, 'Previous Employer 2', report.prevEmployerStreet);
  safeSetText(form, 'Email', report.prevEmployerEmail);
  safeSetText(form, 'Telephone', report.prevEmployerPhone);
  safeSetText(form, 'City State Zip', report.prevEmployerCityStateZip);
  safeSetText(form, 'Fax No', report.prevEmployerFax);
  safeSetText(form, 'records within the previous 3 years from', shortDate(report.created));
  safeSetText(form, 'Prospective Employer 1', report.employerName || 'Driver Pipeline');
  safeSetText(form, 'Prospective Employer 2', report.employerAttention);
  safeSetText(form, 'Telephone_2', report.employerPhone);
  safeSetText(form, 'Prospective Employer 3', report.employerStreet);
  safeSetText(form, 'City State Zip_2', report.employerCityStateZip);
  safeSetText(form, 'Prospective employers confidential fax number', report.confFax || report.employerFax);
  safeSetText(form, 'Prospective employers confidential email address', report.confEmail || report.employerEmail);
  safeSetText(form, 'Date', shortDate(report.created));

  // Section 2 - previous employer response
  safeCheck(form, 'The applicant named above was or is employed or used by us Yes', same(report.employedByCompany, 'Yes'));
  safeSetText(form, 'Employed as job title', report.jobTitle);
  safeSetText(form, 'from my', report.fromDate);
  safeSetText(form, 'to my', report.toDate);
  safeCheck(form, 'Did heshe drive a motor vehicle for you  Yes', same(report.droveMotorVehicle, 'Yes'));
  safeCheck(form, 'No_2', same(report.droveMotorVehicle, 'No'));
  safeCheck(form, 'Straight Truck', report.vehicleStraightTruck);
  safeCheck(form, 'TractorSemitrailer', report.vehicleTractorSemitrailer);
  safeCheck(form, 'Bus', report.vehicleBus);
  safeCheck(form, 'Cargo Tank', report.vehicleCargoTank);
  safeCheck(form, 'DoublesTriples', report.vehicleDoublesTriples);
  safeSetText(form, 'Other Specify', report.vehicleOther ? 'Other' : '');
  safeSetText(form, 'Completed by', report.infoReceivedFrom);
  safeSetText(form, 'Company 1', report.prevEmployerName);
  safeSetText(form, 'Company 2', report.prevEmployerStreet);
  safeSetText(form, 'City State Zip_3', report.prevEmployerCityStateZip);
  safeSetText(form, 'Telephone_3', report.prevEmployerPhone);
  safeSetText(form, 'Date_2', report.infoReceivedDate || shortDate(report.created));
  const noSafetyHistory = same(report.accidentHistory, 'No accidents reported') && !report.dotAlcoholTestPositive && !report.dotDrugTestPositive && !report.dotRefusedTest && !report.dotOtherViolations;
  safeCheck(form, 'If there is no safety performance history to report check here', noSafetyHistory);

  // Page 2 header and sections 3-5
  safeSetText(form, 'Employee Name', report.applicantName);
  safeSetText(form, 'Date_3', report.infoReceivedDate || shortDate(report.created));
  safeCheck(form, '3 years prior to the application date shown on SIDE 1 or check here', same(report.accidentHistory, 'No accidents reported'));
  setAccidentRows(form, report);

  const anyDotViolation = Boolean(report.dotAlcoholTestPositive || report.dotDrugTestPositive || report.dotRefusedTest || report.dotOtherViolations);
  safeCheck(form, 'Yes', anyDotViolation);
  // The PDF reuses some ambiguous 'No' field names, so we avoid checking the general No fields.
  safeSetText(form, 'to', report.fromDate);
  safeSetText(form, 'undefined', report.toDate);

  // Section 5a - how sent to previous employer
  safeCheck(form, 'Check Box3', true); // Emailed
  safeSetText(form, 'This form was check one', 'Emailed to previous employer');
  safeSetText(form, 'undefined_7', report.infoReceivedFrom);
  safeSetText(form, 'Date_5', report.infoReceivedDate || shortDate(report.created));
  safeSetText(form, 'Subsequent attempts to contact previous employer 39123c1 1', clean(report.followUpDate) ? `Follow-up date: ${report.followUpDate}` : '');

  // Section 5b - receipt details
  safeSetText(form, 'Information received from', report.infoReceivedFrom);
  safeCheck(form, 'Check Box7', true); // Email method
  safeSetText(form, 'Recorded by', report.employerName || 'SaffHire');
  safeSetText(form, 'undefined_8', report.infoReceivedDate || shortDate(report.created));

  form.flatten();
  return await pdfDoc.save();
}

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'POST') return json(res, 405, { status: 'error', message: 'Method not allowed' });
    const user = await getUser(req);
    if (!user) return json(res, 401, { status: 'error', message: 'Login required' });
    const body = await readBody(req);
    const companyId = Number(body.companyId || 1);
    const fileNumber = clean(body.fileNumber);
    if (!fileNumber) return json(res, 400, { status: 'error', message: 'File number is required' });
    const report = await getReport(companyId, fileNumber);
    if (!report) return json(res, 404, { status: 'error', message: 'Safety report not found' });
    const bytes = await buildPdf(report);
    const safeFile = fileNumber.replace(/[^0-9A-Za-z_-]/g, '') || 'safety-performance';
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="fmcsa-safety-performance-${safeFile}.pdf"`);
    res.end(Buffer.from(bytes));
  } catch (error: any) {
    return json(res, 500, { status: 'error', message: error?.message || 'Could not generate FMCSA packet' });
  }
}
