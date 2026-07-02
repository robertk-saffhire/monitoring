type Ctx = {
  query: (text: string, params?: any[]) => Promise<any>;
  json: (res: any, statusCode: number, payload: any) => void;
  requireAdmin: (user: any, res: any) => boolean;
};

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
  const text = String(errorText || '');
  if (statusCode === 401 || statusCode === 403 || /NOT_AUTHORIZED|NOT_AUTHENTICATED|not authorized|unauthorized/i.test(text)) {
    return 'Order access could not be verified.';
  }
  return 'The order connection is currently unavailable.';
}

function asArray(payload: any) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.orders)) return payload.orders;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
}

function toIso(value: any) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function dateOnly(value: any) {
  const iso = toIso(value);
  return iso ? iso.slice(0, 10) : null;
}

function normalizeOrder(row: any) {
  return {
    orderGuid: row.orderGuid || row.guid || row.id || '',
    fileNumber: row.fileNumber || row.fileNo || row.orderNumber || '',
    orderStatus: row.orderStatus || row.status || '',
    orderType: row.orderType || row.type || '',
    orderedDate: toIso(row.orderedDate || row.orderDate),
    completedDate: toIso(row.completedDate),
    applicantName: row.applicantName || row.subjectName || row.name || '',
    clientName: row.clientName || '',
    clientCode: row.clientCode || '',
    productName: row.productName || row.packageName || '',
    requestedBy: row.requestedBy || row.requestor || '',
    searchFlagged: Boolean(row.searchFlagged || row.flagged),
    createdDate: toIso(row.createdDate || row.createdAt),
    modifiedDate: toIso(row.modifiedDate || row.updatedAt),
    raw: row,
  };
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

export async function tazworksSyncRuns(req: any, res: any, user: any, ctx: Ctx) {
  if (req.method !== 'GET') return ctx.json(res, 405, { status: 'error', message: 'Method not allowed' });
  if (!ctx.requireAdmin(user, res)) return;
  const result = await ctx.query('select * from tazworks_sync_runs order by started_at desc limit 25');
  return ctx.json(res, 200, { status: 'ok', runs: result.rows });
}

export async function tazworksSyncRun(req: any, res: any, user: any, ctx: Ctx) {
  if (req.method !== 'POST') return ctx.json(res, 405, { status: 'error', message: 'Method not allowed' });
  if (!ctx.requireAdmin(user, res)) return;

  const companyId = Number(user.companyId || 1);
  const startedBy = user.username || user.displayName || 'admin';
  const runInsert = await ctx.query(
    'insert into tazworks_sync_runs (status, triggered_by, message) values ($1,$2,$3) returning id',
    ['running', startedBy, 'Manual sync started']
  );
  const runId = runInsert.rows[0].id;

  let ordersPulled = 0;
  let applicantsUpserted = 0;
  let safetyReportsUpdated = 0;
  let errorsCount = 0;
  const errors: string[] = [];

  try {
    const e = env();
    const payload = await proxyGet(`/tazworks/orders?page=0&size=50&clientGuid=${encodeURIComponent(e.clientGuid)}`);
    const orders = asArray(payload).map(normalizeOrder).filter((order: any) => order.orderGuid || order.fileNumber);
    ordersPulled = orders.length;

    for (const order of orders) {
      try {
        await ctx.query(
          `insert into tazworks_order_cache
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
              last_sync_run_id=excluded.last_sync_run_id`,
          [
            companyId,
            order.orderGuid || `file-${order.fileNumber}`,
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
          await ctx.query(
            `insert into applicants ("companyId","fileNumber","applicantName","orderDate","monitorStatus","mvrStatus",notes)
              values ($1,$2,$3,$4,$5,$6,$7)
              on conflict ("fileNumber","companyId") do update set
                "applicantName" = case when excluded."applicantName" <> '' then excluded."applicantName" else applicants."applicantName" end,
                "orderDate" = coalesce(excluded."orderDate", applicants."orderDate"),
                "mvrStatus" = coalesce(excluded."mvrStatus", applicants."mvrStatus"),
                "updatedAt" = now()`,
            [
              companyId,
              String(order.fileNumber),
              String(order.applicantName || 'REVIEW NAME NEEDED'),
              dateOnly(order.orderedDate || order.createdDate),
              'On',
              String(order.orderStatus || ''),
              '',
            ]
          );
          applicantsUpserted++;

          const safetyUpdate = await ctx.query(
            'update safety_reports set "applicantName"=case when $1 <> \'\'' + " then $1 else \"applicantName\" end where \"companyId\"=$2 and \"fileNumber\"=$3 returning id",
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
      ? `Sync completed with ${errorsCount} record error(s).`
      : `Sync completed. Pulled ${ordersPulled} orders.`;

    await ctx.query(
      'update tazworks_sync_runs set status=$1, completed_at=now(), orders_pulled=$2, applicants_upserted=$3, safety_reports_updated=$4, errors_count=$5, message=$6, raw_summary=$7 where id=$8',
      [status, ordersPulled, applicantsUpserted, safetyReportsUpdated, errorsCount, message, JSON.stringify({ errors: errors.slice(0, 10) }), runId]
    );

    return ctx.json(res, 200, { status: 'ok', runId, ordersPulled, applicantsUpserted, safetyReportsUpdated, errorsCount, message });
  } catch (error: any) {
    const safe = error?.message || 'The order connection is currently unavailable.';
    await ctx.query(
      'update tazworks_sync_runs set status=$1, completed_at=now(), errors_count=$2, message=$3, raw_summary=$4 where id=$5',
      ['failed', errorsCount + 1, safe, JSON.stringify({ error: safe }), runId]
    );
    return ctx.json(res, error?.statusCode || 503, { status: 'error', message: safe, runId });
  }
}
