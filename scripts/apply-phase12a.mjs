import fs from 'fs';

const file = 'api/index.ts';
let src = fs.readFileSync(file, 'utf8');

const marker = 'PHASE12A_TAZWORKS_SYNC';

if (!src.includes(marker)) {
  const helpers = `

// ${marker} START
function tazworksSyncEnv() {
  const baseUrl = String(process.env.TAZWORKS_PROXY_BASE_URL || '').replace(/\\/+$/, '');
  const proxySecret = String(process.env.TAZWORKS_PROXY_SECRET || '');
  const clientGuid = String(process.env.TAZWORKS_CLIENT_GUID || '');
  if (!baseUrl) throw new Error('TAZWORKS_PROXY_BASE_URL is missing');
  if (!proxySecret) throw new Error('TAZWORKS_PROXY_SECRET is missing');
  if (!clientGuid) throw new Error('TAZWORKS_CLIENT_GUID is missing');
  return { baseUrl, proxySecret, clientGuid };
}

function tazworksSafeMessage(errorText: string, statusCode?: number) {
  const text = String(errorText || '');
  if (statusCode === 401 || statusCode === 403 || /NOT_AUTHORIZED|NOT_AUTHENTICATED|not authorized|unauthorized/i.test(text)) {
    return 'Order access could not be verified.';
  }
  return 'The order connection is currently unavailable.';
}

function tazworksArray(payload: any) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.orders)) return payload.orders;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
}

function tazworksDate(value: any) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function tazworksDateOnly(value: any) {
  const iso = tazworksDate(value);
  return iso ? iso.slice(0, 10) : null;
}

function tazworksOrder(row: any) {
  return {
    orderGuid: row.orderGuid || row.guid || row.id || '',
    fileNumber: row.fileNumber || row.fileNo || row.orderNumber || '',
    orderStatus: row.orderStatus || row.status || '',
    orderType: row.orderType || row.type || '',
    orderedDate: tazworksDate(row.orderedDate || row.orderDate),
    completedDate: tazworksDate(row.completedDate),
    applicantName: row.applicantName || row.subjectName || row.name || '',
    clientName: row.clientName || '',
    clientCode: row.clientCode || '',
    productName: row.productName || row.packageName || '',
    requestedBy: row.requestedBy || row.requestor || '',
    searchFlagged: Boolean(row.searchFlagged || row.flagged),
    createdDate: tazworksDate(row.createdDate || row.createdAt),
    modifiedDate: tazworksDate(row.modifiedDate || row.updatedAt),
    raw: row,
  };
}

async function tazworksProxyGet(proxyPath: string) {
  const env = tazworksSyncEnv();
  const response = await fetch(\`\${env.baseUrl}\${proxyPath}\`, {
    method: 'GET',
    headers: {
      Authorization: \`Bearer \${env.proxySecret}\`,
      Accept: 'application/json',
    },
  });

  const raw = await response.text();
  let payload: any = {};
  try { payload = raw ? JSON.parse(raw) : {}; } catch { payload = { raw }; }

  if (!response.ok) {
    const msg = payload?.message || payload?.error || raw || \`Proxy returned \${response.status}\`;
    const err: any = new Error(tazworksSafeMessage(msg, response.status));
    err.statusCode = err.message === 'Order access could not be verified.' ? 403 : 503;
    throw err;
  }

  return payload;
}

async function tazworksSyncRuns(req: any, res: any, user: any) {
  if (req.method !== 'GET') return json(res, 405, { status: 'error', message: 'Method not allowed' });
  if (!requireAdmin(user, res)) return;
  const result = await query('select * from tazworks_sync_runs order by started_at desc limit 25');
  return json(res, 200, { status: 'ok', runs: result.rows });
}

async function tazworksSyncRun(req: any, res: any, user: any) {
  if (req.method !== 'POST') return json(res, 405, { status: 'error', message: 'Method not allowed' });
  if (!requireAdmin(user, res)) return;

  const companyId = Number(user.companyId || 1);
  const startedBy = user.username || user.displayName || 'admin';
  const runInsert = await query('insert into tazworks_sync_runs (status, triggered_by, message) values ($1,$2,$3) returning id', ['running', startedBy, 'Manual sync started']);
  const runId = runInsert.rows[0].id;

  let ordersPulled = 0;
  let applicantsUpserted = 0;
  let safetyReportsUpdated = 0;
  let errorsCount = 0;
  const errors: string[] = [];

  try {
    const env = tazworksSyncEnv();
    const payload = await tazworksProxyGet(\`/tazworks/orders?page=0&size=50&clientGuid=\${encodeURIComponent(env.clientGuid)}\`);
    const orders = tazworksArray(payload).map(tazworksOrder).filter((order: any) => order.orderGuid || order.fileNumber);
    ordersPulled = orders.length;

    for (const order of orders) {
      try {
        await query(
          \`insert into tazworks_order_cache
            (company_id, order_guid, file_number, applicant_name, order_status, order_type, ordered_date, completed_date, client_name, client_code, product_name, requested_by, search_flagged, source_modified_date, raw_order, last_seen_at, last_sync_run_id)
            values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,now(),$16)
            on conflict (order_guid) do update set
              company_id=excluded.company_id,
              file_number=excluded.file_number,
              applicant_name=excluded.applicant_name,
              order_status=excluded.order_status,
              order_type=excluded.order_type,
              ordered_date=excluded.ordered_date,
              completed_date=excluded.completed_date,
              client_name=excluded.client_name,
              client_code=excluded.client_code,
              product_name=excluded.product_name,
              requested_by=excluded.requested_by,
              search_flagged=excluded.search_flagged,
              source_modified_date=excluded.source_modified_date,
              raw_order=excluded.raw_order,
              last_seen_at=now(),
              last_sync_run_id=excluded.last_sync_run_id\`,
          [
            companyId,
            order.orderGuid || \`file-\${order.fileNumber}\`,
            order.fileNumber || null,
            order.applicantName || null,
            order.orderStatus || null,
            order.orderType || null,
            order.orderedDate,
            order.completedDate,
            order.clientName || null,
            order.clientCode || null,
            order.productName || null,
            order.requestedBy || null,
            Boolean(order.searchFlagged),
            order.modifiedDate || order.createdDate || null,
            JSON.stringify(order.raw || {}),
            runId,
          ]
        );

        if (order.fileNumber) {
          await query(
            \`insert into applicants ("companyId","fileNumber","applicantName","orderDate","monitorStatus","mvrStatus",notes)
              values ($1,$2,$3,$4,$5,$6,$7)
              on conflict ("fileNumber","companyId") do update set
                "applicantName" = case when excluded."applicantName" <> '' then excluded."applicantName" else applicants."applicantName" end,
                "orderDate" = coalesce(excluded."orderDate", applicants."orderDate"),
                "mvrStatus" = coalesce(excluded."mvrStatus", applicants."mvrStatus"),
                "updatedAt" = now()\`,
            [
              companyId,
              String(order.fileNumber),
              String(order.applicantName || 'REVIEW NAME NEEDED'),
              tazworksDateOnly(order.orderedDate || order.createdDate),
              'On',
              String(order.orderStatus || ''),
              '',
            ]
          );
          applicantsUpserted++;

          const safetyUpdate = await query(
            'update safety_reports set "applicantName"=case when $1 <> \\'\\' then $1 else "applicantName" end where "companyId"=$2 and "fileNumber"=$3 returning id',
            [String(order.applicantName || ''), companyId, String(order.fileNumber)]
          );
          safetyReportsUpdated += safetyUpdate.rowCount || 0;
        }
      } catch (orderError: any) {
        errorsCount++;
        errors.push(String(orderError?.message || orderError));
      }
    }

    const status = errorsCount ? 'completed_with_errors' : 'completed';
    const message = errorsCount
      ? \`Sync completed with \${errorsCount} record error(s).\`
      : \`Sync completed. Pulled \${ordersPulled} orders.\`;

    await query(
      'update tazworks_sync_runs set status=$1, completed_at=now(), orders_pulled=$2, applicants_upserted=$3, safety_reports_updated=$4, errors_count=$5, message=$6, raw_summary=$7 where id=$8',
      [status, ordersPulled, applicantsUpserted, safetyReportsUpdated, errorsCount, message, JSON.stringify({ errors: errors.slice(0, 10) }), runId]
    );

    return json(res, 200, { status: 'ok', runId, ordersPulled, applicantsUpserted, safetyReportsUpdated, errorsCount, message });
  } catch (error: any) {
    const safe = error?.message || 'The order connection is currently unavailable.';
    await query(
      'update tazworks_sync_runs set status=$1, completed_at=now(), errors_count=$2, message=$3, raw_summary=$4 where id=$5',
      ['failed', errorsCount + 1, safe, JSON.stringify({ error: safe }), runId]
    );
    return json(res, error?.statusCode || 503, { status: 'error', message: safe, runId });
  }
}
// ${marker} END
`;

  const helperAnchor = '\\nasync function auth';
  if (!src.includes(helperAnchor)) {
    throw new Error('Could not find async function auth anchor in api/index.ts');
  }
  src = src.replace(helperAnchor, helpers + helperAnchor);
}

if (!src.includes("route === 'tazworks-sync/run'")) {
  const routeLine = "    if (route === 'system-check') return systemCheck(req, res, user);";
  const routeInsert = "    if (route === 'tazworks-sync/run') return tazworksSyncRun(req, res, user);\\n    if (route === 'tazworks-sync/runs') return tazworksSyncRuns(req, res, user);\\n" + routeLine;
  if (!src.includes(routeLine)) {
    throw new Error('Could not find system-check route anchor in api/index.ts');
  }
  src = src.replace(routeLine, routeInsert);
}

fs.writeFileSync(file, src);
console.log('Phase 12A TazWorks sync patch applied to api/index.ts');
