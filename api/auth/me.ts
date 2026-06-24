import "dotenv/config";
import { attachCookies, methodNotAllowed, publicUser, sendJson } from "../../server/authApiHelpers";
import { getLocalUserFromCookie } from "../../server/localSession";

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") return methodNotAllowed(res);

  try {
    attachCookies(req);
    const user = await getLocalUserFromCookie(req as { cookies?: Record<string, string> });
    return sendJson(res, 200, { status: "ok", user: user ? publicUser(user) : null });
  } catch (error) {
    console.error("[api/auth/me]", error);
    return sendJson(res, 200, { status: "ok", user: null });
  }
}
