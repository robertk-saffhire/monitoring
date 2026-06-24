import "dotenv/config";
import pg from "pg";
import { jwtVerify } from "jose";

const { Pool } = pg;
const SESSION_COOKIE = "saffhire_session";
const COOKIE_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "saffhire-dev-secret");

function sendJson(res: any, statusCode: number, payload: unknown) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function parseCookie(header: string | undefined) {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (!key) continue;
    try { out[key] = decodeURIComponent(value); } catch { out[key] = value; }
  }
  return out;
}

function publicUser(user: any) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName ?? user.username,
    role: user.role,
    companyId: user.companyId ?? null,
    mustChangePassword: user.mustChangePassword,
    isDemo: user.username === "demo",
  };
}

async function getUserById(id: number) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  try {
    const result = await pool.query(
      `select id, username, "displayName", role, "companyId", "isActive", "mustChangePassword"
       from local_users
       where id = $1
       limit 1`,
      [id]
    );
    return result.rows[0] ?? null;
  } finally {
    await pool.end();
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") return sendJson(res, 405, { status: "error", message: "Method not allowed" });

  try {
    if (!process.env.DATABASE_URL || !process.env.JWT_SECRET) return sendJson(res, 200, { status: "ok", user: null });

    const cookies = parseCookie(req.headers?.cookie);
    const token = cookies[SESSION_COOKIE];
    if (!token) return sendJson(res, 200, { status: "ok", user: null });

    const { payload } = await jwtVerify(token, COOKIE_SECRET);
    const id = Number(payload.sub);
    if (!Number.isFinite(id)) return sendJson(res, 200, { status: "ok", user: null });

    const user = await getUserById(id);
    if (!user || !user.isActive) return sendJson(res, 200, { status: "ok", user: null });

    return sendJson(res, 200, { status: "ok", user: publicUser(user) });
  } catch (error) {
    console.error("[api/auth/me]", error);
    return sendJson(res, 200, { status: "ok", user: null });
  }
}
