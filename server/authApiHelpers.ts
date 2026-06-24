import { LOCAL_SESSION_COOKIE } from "./localSession";

function parseCookieHeader(header: string | undefined) {
  const cookies: Record<string, string> = {};
  if (!header) return cookies;

  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (!key) continue;
    try {
      cookies[key] = decodeURIComponent(value);
    } catch {
      cookies[key] = value;
    }
  }

  return cookies;
}

function serializeCookie(name: string, value: string, maxAgeSeconds: number) {
  const encodedName = encodeURIComponent(name);
  const encodedValue = encodeURIComponent(value);
  return [
    `${encodedName}=${encodedValue}`,
    "Path=/",
    "HttpOnly",
    "SameSite=None",
    "Secure",
    `Max-Age=${maxAgeSeconds}`,
  ].join("; ");
}

export async function readJsonBody(req: any) {
  if (req.body && typeof req.body === "object") return req.body;

  if (typeof req.body === "string" && req.body.trim()) {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length === 0) return {};

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return {};
  }
}

export function sendJson(res: any, statusCode: number, payload: unknown) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

export function methodNotAllowed(res: any) {
  sendJson(res, 405, { status: "error", message: "Method not allowed" });
}

export function attachCookies(req: any) {
  req.cookies = parseCookieHeader(req.headers?.cookie);
}

export function publicUser(user: any) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    companyId: user.companyId ?? null,
    mustChangePassword: user.mustChangePassword,
    isDemo: user.username === "demo",
  };
}

export function setSessionCookie(res: any, token: string, maxAgeSeconds: number) {
  res.setHeader("Set-Cookie", serializeCookie(LOCAL_SESSION_COOKIE, token, maxAgeSeconds));
}

export function clearSessionCookie(res: any) {
  res.setHeader("Set-Cookie", serializeCookie(LOCAL_SESSION_COOKIE, "", 0));
}
