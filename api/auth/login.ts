import "dotenv/config";
import pg from "pg";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { methodNotAllowed, publicUser, readJsonBody, sendJson, setSessionCookie } from "../../server/authApiHelpers";

const { Pool } = pg;
const COOKIE_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "saffhire-dev-secret");

type LocalUserRow = {
  id: number;
  username: string;
  passwordHash: string;
  displayName: string | null;
  role: "user" | "admin" | "viewer";
  companyId: number | null;
  isActive: boolean;
  mustChangePassword: boolean;
};

async function getUserByUsername(username: string): Promise<LocalUserRow | null> {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  try {
    const result = await pool.query(
      `select id, username, "passwordHash", "displayName", role, "companyId", "isActive", "mustChangePassword"
       from local_users
       where username = $1
       limit 1`,
      [username.trim().toLowerCase()]
    );
    return result.rows[0] ?? null;
  } finally {
    await pool.end();
  }
}

async function updateLastSignedIn(id: number) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  try {
    await pool.query(`update local_users set "lastSignedIn" = now(), "updatedAt" = now() where id = $1`, [id]);
  } finally {
    await pool.end();
  }
}

async function signSession(user: LocalUserRow, expiresIn: string) {
  return new SignJWT({ sub: String(user.id), role: user.role, name: user.displayName ?? user.username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(COOKIE_SECRET);
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return methodNotAllowed(res);

  try {
    if (!process.env.DATABASE_URL) {
      return sendJson(res, 500, { status: "error", message: "DATABASE_URL is missing in Vercel" });
    }

    const body = await readJsonBody(req);
    const username = String(body.username ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const rememberMe = Boolean(body.rememberMe);

    const user = await getUserByUsername(username);
    if (!user || !user.isActive) {
      return sendJson(res, 401, { status: "error", message: "Invalid username or password" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return sendJson(res, 401, { status: "error", message: "Invalid username or password" });
    }

    await updateLastSignedIn(user.id);

    const maxAgeSeconds = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60;
    const token = await signSession(user, rememberMe ? "30d" : "1d");
    setSessionCookie(res, token, maxAgeSeconds);

    return sendJson(res, 200, {
      status: "ok",
      success: true,
      mustChangePassword: user.mustChangePassword,
      user: publicUser(user),
    });
  } catch (error: any) {
    console.error("[api/auth/login]", error);
    return sendJson(res, 500, { status: "error", message: error?.message || "Could not log in" });
  }
}
