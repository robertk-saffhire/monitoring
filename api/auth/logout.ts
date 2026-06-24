const SESSION_COOKIE = "saffhire_session";

function sendJson(res: any, statusCode: number, payload: unknown) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return sendJson(res, 405, { status: "error", message: "Method not allowed" });

  res.setHeader("Set-Cookie", `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=None; Secure; Max-Age=0`);
  return sendJson(res, 200, { status: "ok", success: true });
}
