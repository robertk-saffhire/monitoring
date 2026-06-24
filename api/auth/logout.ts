import "dotenv/config";
import { clearSessionCookie, methodNotAllowed, sendJson } from "../../server/authApiHelpers";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return methodNotAllowed(res);

  clearSessionCookie(res);
  return sendJson(res, 200, { status: "ok", success: true });
}
