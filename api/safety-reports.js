import { json, query, readBody } from './lib/db.js';
import { requireUser } from './lib/auth.js';

const STATUSES = new Set(['S1 Complete', 'Emp Sent', 'Emp Complete', 'Completed']);

function clean(body, companyId) {
  return {
    companyId,
    applicantName: String(body.applicantName || '').trim(),
    fileNumber: String(body.fileNumber || '').trim(),
    created: String(body.created || new Date().toISOString().slice(0, 10)).trim(),
    status: STATUSES.has(body.status) ? body.status : 'S1 Complete',
    followUpDate: String(body.followUpDate || '').trim(),
    notes: String(body.notes || '').trim(),
    prevEmployerName: String(body.prevEmployerName || '').trim(),
    prevEmployerEmail: String(body.prevEmployerEmail || '').trim(),
    prevEmployerStreet: String(body.prevEmployerStreet || '').trim(),
    prevEmployerPhone: String(body.prevEmployerPhone || '').trim(),
    prevEmployerFax: String(body.prevEmployerFax || '').trim(),
    prevEmployerCityStateZip: String(body.prevEmployerCityStateZip || '').trim(),
    employerName: String(body.employerName || 'Driver Pipeline').trim(),
    employerAttention: String(body.employerAttention || '').trim(),
    employerStreet: String(body.employerStreet || '1200 N. Union Bower Road').trim(),
    employerCityStateZip: String(body.employerCityStateZip || 'Irving, TX 75061').trim(),
    employerPhone: String(body.employerPhone || '972-573-2301').trim(),
    employerFax: String(body.employerFax || '').trim(),
    employerEmail: String(body.employerEmail || 'lmercado@driverpipeline.com').trim(),
    confFax: String(body.confFax || '').trim(),
    confEmail: String(body.confEmail || '').trim(),
    employedByCompany: String(body.employedByCompany || '').trim(),
    jobTitle: String(body.jobTitle || '').trim(),
    fromDate: String(body.fromDate || '').trim(),
    toDate: String(body.toDate || '').trim(),
    droveMotorVehicle: String(body.droveMotorVehicle || '').trim(),
    vehicleStraightTruck: Boolean(body.vehicleStraightTruck),
    vehicleTractorSemitrailer: Boolean(body.vehicleTractorSemitrailer),
    vehicleBus: Boolean(body.vehicleBus),
    vehicleCargoTank: Boolean(body.vehicleCargoTank),
    vehicleDoublesTriples: Boolean(body.vehicleDoublesTriples),
    vehicleOther: Boolean(body.vehicleOther),
    accidentHistory: String(body.accidentHistory || '').trim(),
    accidentDate1: String(body.accidentDate1 || '').trim(),
    accidentLocation1: String(body.accidentLocation1 || '').trim(),
    accidentInjuries1: String(body.accidentInjuries1 || '').trim(),
    accidentFatalities1: String(body.accidentFatalities1 || '').trim(),
    accidentHazmat1: String(body.accidentHazmat1 || '').trim(),
    accidentDate2: String(body.accidentDate2 || '').trim(),
    accidentLocation2: String(body.accidentLocation2 || '').trim(),
    accidentInjuries2: String(body.accidentInjuries2 || '').trim(),
    accidentFatalities2: String(body.accidentFatalities2 || '').trim(),
    accidentHazmat2: String(body.accidentHazmat2 || '').trim(),
    accidentDate3: String(body.accidentDate3 || '').trim(),
    accidentLocation3: String(body.accidentLocation3 || '').trim(),
    accidentInjuries3: String(body.accidentInjuries3 || '').trim(),
    accidentFatalities3: String(body.accidentFatalities3 || '').trim(),
    accidentHazmat3: String(body.accidentHazmat3 || '').trim(),
    otherAccidents: String(body.otherAccidents || '').trim(),
    dotCompany: String(body.dotCompany || '').trim(),
    dotEmployee: String(body.dotEmployee || '').trim(),
    dotAlcoholTestPositive: Boolean(body.dotAlcoholTestPositive),
    dotDrugTestPositive: Boolean(body.dotDrugTestPositive),
    dotRefusedTest: Boolean(body.dotRefusedTest),
    dotOtherViolations: Boolean(body.dotOtherViolations),
    infoReceivedFrom: String(body.infoReceivedFrom || '').trim(),
    infoReceivedDate: String(body.infoReceivedDate || '').trim(),
  };
}

const selectSql = 'select * from safety_reports where "companyId" = $1 order by id desc limit 500';

const insertSql = `insert into safety_reports (
  "companyId", "applicantName", "fileNumber", created, status, "followUpDate", notes,
  "prevEmployerName", "prevEmployerEmail", "prevEmployerStreet", "prevEmployerPhone", "prevEmployerFax", "prevEmployerCityStateZip",
  "employerName", "employerAttention", "employerStreet", "employerCityStateZip", "employerPhone", "employerFax", "employerEmail", "confFax", "confEmail",
  "employedByCompany", "jobTitle", "fromDate", "toDate", "droveMotorVehicle",
  "vehicleStraightTruck", "vehicleTractorSemitrailer", "vehicleBus", "vehicleCargoTank", "vehicleDoublesTriples", "vehicleOther",
  "accidentHistory", "accidentDate1", "accidentLocation1", "accidentInjuries1", "accidentFatalities1", "accidentHazmat1",
  "accidentDate2", "accidentLocation2", "accidentInjuries2", "accidentFatalities2", "accidentHazmat2",
  "accidentDate3", "accidentLocation3", "accidentInjuries3", "accidentFatalities3", "accidentHazmat3", "otherAccidents",
  "dotCompany", "dotEmployee", "dotAlcoholTestPositive", "dotDrugTestPositive", "dotRefusedTest", "dotOtherViolations",
  "infoReceivedFrom", "infoReceivedDate"
) values (
  $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38,$39,$40,$41,$42,$43,$44,$45,$46,$47,$48,$49,$50,$51,$52,$53,$54,$55,$56,$57,$58
) returning *`;

const updateSql = `update safety_reports set
  "applicantName"=$1, "fileNumber"=$2, created=$3, status=$4, "followUpDate"=$5, notes=$6,
  "prevEmployerName"=$7, "prevEmployerEmail"=$8, "prevEmployerStreet"=$9, "prevEmployerPhone"=$10, "prevEmployerFax"=$11, "prevEmployerCityStateZip"=$12,
  "employerName"=$13, "employerAttention"=$14, "employerStreet"=$15, "employerCityStateZip"=$16, "employerPhone"=$17, "employerFax"=$18, "employerEmail"=$19, "confFax"=$20, "confEmail"=$21,
  "employedByCompany"=$22, "jobTitle"=$23, "fromDate"=$24, "toDate"=$25, "droveMotorVehicle"=$26,
  "vehicleStraightTruck"=$27, "vehicleTractorSemitrailer"=$28, "vehicleBus"=$29, "vehicleCargoTank"=$30, "vehicleDoublesTriples"=$31, "vehicleOther"=$32,
  "accidentHistory"=$33, "accidentDate1"=$34, "accidentLocation1"=$35, "accidentInjuries1"=$36, "accidentFatalities1"=$37, "accidentHazmat1"=$38,
  "accidentDate2"=$39, "accidentLocation2"=$40, "accidentInjuries2"=$41, "accidentFatalities2"=$42, "accidentHazmat2"=$43,
  "accidentDate3"=$44, "accidentLocation3"=$45, "accidentInjuries3"=$46, "accidentFatalities3"=$47, "accidentHazmat3"=$48, "otherAccidents"=$49,
  "dotCompany"=$50, "dotEmployee"=$51, "dotAlcoholTestPositive"=$52, "dotDrugTestPositive"=$53, "dotRefusedTest"=$54, "dotOtherViolations"=$55,
  "infoReceivedFrom"=$56, "infoReceivedDate"=$57, "updatedAt"=now()
where id=$58 and "companyId"=$59 returning *`;

function insertValues(v) {
  return [v.companyId, v.applicantName, v.fileNumber, v.created, v.status, v.followUpDate, v.notes, v.prevEmployerName, v.prevEmployerEmail, v.prevEmployerStreet, v.prevEmployerPhone, v.prevEmployerFax, v.prevEmployerCityStateZip, v.employerName, v.employerAttention, v.employerStreet, v.employerCityStateZip, v.employerPhone, v.employerFax, v.employerEmail, v.confFax, v.confEmail, v.employedByCompany, v.jobTitle, v.fromDate, v.toDate, v.droveMotorVehicle, v.vehicleStraightTruck, v.vehicleTractorSemitrailer, v.vehicleBus, v.vehicleCargoTank, v.vehicleDoublesTriples, v.vehicleOther, v.accidentHistory, v.accidentDate1, v.accidentLocation1, v.accidentInjuries1, v.accidentFatalities1, v.accidentHazmat1, v.accidentDate2, v.accidentLocation2, v.accidentInjuries2, v.accidentFatalities2, v.accidentHazmat2, v.accidentDate3, v.accidentLocation3, v.accidentInjuries3, v.accidentFatalities3, v.accidentHazmat3, v.otherAccidents, v.dotCompany, v.dotEmployee, v.dotAlcoholTestPositive, v.dotDrugTestPositive, v.dotRefusedTest, v.dotOtherViolations, v.infoReceivedFrom, v.infoReceivedDate];
}

function updateValues(v, id) {
  const values = insertValues(v).slice(1);
  values.push(id, v.companyId);
  return values;
}

export default async function handler(req, res) {
  const user = await requireUser(req, res, json);
  if (!user) return;
  try {
    const companyId = Number(req.query.companyId || user.companyId || 1);
    if (req.method === 'GET') {
      const result = await query(selectSql, [companyId]);
      return json(res, 200, { status: 'ok', reports: result.rows });
    }
    if (req.method === 'POST') {
      const body = await readBody(req);
      const values = clean(body, companyId);
      if (!values.fileNumber && !values.applicantName) return json(res, 400, { status: 'error', message: 'File number or applicant name is required' });
      const result = await query(insertSql, insertValues(values));
      return json(res, 200, { status: 'ok', report: result.rows[0] });
    }
    if (req.method === 'PATCH') {
      const body = await readBody(req);
      const id = Number(body.id);
      if (!id) return json(res, 400, { status: 'error', message: 'Report id is required' });
      const values = clean(body, companyId);
      const result = await query(updateSql, updateValues(values, id));
      if (!result.rows[0]) return json(res, 404, { status: 'error', message: 'Safety report not found' });
      return json(res, 200, { status: 'ok', report: result.rows[0] });
    }
    if (req.method === 'DELETE') {
      const id = Number(req.query.id);
      if (!id) return json(res, 400, { status: 'error', message: 'Report id is required' });
      await query('delete from safety_reports where id = $1 and "companyId" = $2', [id, companyId]);
      return json(res, 200, { status: 'ok', success: true });
    }
    return json(res, 405, { status: 'error', message: 'Method not allowed' });
  } catch (error) {
    return json(res, 500, { status: 'error', message: error.message || 'Could not save safety report' });
  }
}
