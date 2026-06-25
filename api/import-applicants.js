import { json, query, readBody } from './lib/db.js';
import { requireUser } from './lib/auth.js';

function normalizeStatus(value) {
  const v = String(value || '').trim().toLowerCase();
  return v === 'on' ? 'On' : 'Off';
}

function pick(row, keys) {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') return row[key];
  }
  return '';
}

export default async function handler(req, res) {
  const user = await requireUser(req, res, json);
  if (!user) return;
  if (user.role !== 'admin') return json(res, 403, { status: 'error', message: 'Admin access required' });
  if (req.method !== 'POST') return json(res, 405, { status: 'error', message: 'Method not allowed' });

  try {
    const body = await readBody(req);
    const companyId = Number(body.companyId || user.companyId || 1);
    const rows = Array.isArray(body.rows) ? body.rows : [];
    if (!rows.length) return json(res, 400, { status: 'error', message: 'No import rows found' });

    let imported = 0;
    let skipped = 0;
    for (const row of rows) {
      const fileNumber = String(pick(row, ['fileNumber', 'File Number', 'File #', 'FileNumber', 'file_number'])).trim();
      if (!fileNumber) { skipped++; continue; }
      const applicantName = String(pick(row, ['name', 'Name', 'Applicant Name', 'applicantName'])).trim();
      const orderDate = String(pick(row, ['orderDate', 'Order Date', 'Created', 'created'])).trim();
      const monitorStatus = normalizeStatus(pick(row, ['monitorStatus', 'Monitor Status', 'Monitoring', 'monitoring']));
      const mvrStatus = String(pick(row, ['mvrStatus', 'MVR Status', 'Status'])).trim();
      const medExpire = String(pick(row, ['medExpire', 'Med Expire', 'Medical Expiration', 'medicalExpiration'])).trim() || null;
      const notes = String(pick(row, ['notes', 'Notes'])).trim();

      await query(
        `insert into applicants ("companyId", "fileNumber", "applicantName", "orderDate", "monitorStatus", "mvrStatus", "medExpire", "medExpireOverridden", notes)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         on conflict ("fileNumber", "companyId") do update set
           "applicantName"=excluded."applicantName",
           "orderDate"=excluded."orderDate",
           "monitorStatus"=excluded."monitorStatus",
           "mvrStatus"=excluded."mvrStatus",
           "medExpire"=excluded."medExpire",
           "medExpireOverridden"=excluded."medExpireOverridden",
           notes=excluded.notes,
           "updatedAt"=now()`,
        [companyId, fileNumber, applicantName, orderDate, monitorStatus, mvrStatus, medExpire, Boolean(medExpire), notes]
      );
      imported++;
    }

    return json(res, 200, { status: 'ok', imported, skipped });
  } catch (error) {
    return json(res, 500, { status: 'error', message: error.message || 'Could not import applicants' });
  }
}
