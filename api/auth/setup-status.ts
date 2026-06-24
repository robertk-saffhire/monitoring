import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

function sendJson(res: any, statusCode: number, payload: unknown) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") return sendJson(res, 405, { status: "error", message: "Method not allowed" });

  try {
    if (!process.env.DATABASE_URL) return sendJson(res, 500, { status: "error", message: "DATABASE_URL is missing in Vercel" });

    const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    try {
      const result = await pool.query(`select id from local_users where role = $1 and "isActive" = true limit 1`, ["admin"]);
      return sendJson(res, 200, { status: "ok", hasAdmin: result.rows.length > 0 });
    } finally {
      await pool.end();
    }
  } catch (error: any) {
    console.error("[api/auth/setup-status]", error);
    return sendJson(res, 500, { status: "error", message: error?.message || "Could not check setup status" });
  }
}
