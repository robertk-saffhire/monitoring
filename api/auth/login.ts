import "dotenv/config";
import { verifyLocalUserPassword } from "../../server/db";
import { methodNotAllowed, publicUser, readJsonBody, sendJson, setSessionCookie } from "../../server/authApiHelpers";
import { signLocalSession } from "../../server/localSession";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return methodNotAllowed(res);

  try {
    const body = await readJsonBody(req);
    const username = String(body.username ?? "").trim();
    const password = String(body.password ?? "");
    const rememberMe = Boolean(body.rememberMe);

    const user = await verifyLocalUserPassword(username, password);
    if (!user) {
      return sendJson(res, 401, { status: "error", message: "Invalid username or password" });
    }

    const maxAgeSeconds = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60;
    const token = await signLocalSession(user, rememberMe ? "30d" : "1d");
    setSessionCookie(res, token, maxAgeSeconds);

    return sendJson(res, 200, {
      status: "ok",
      success: true,
      mustChangePassword: user.mustChangePassword,
      user: publicUser(user),
    });
  } catch (error) {
    console.error("[api/auth/login]", error);
    return sendJson(res, 500, { status: "error", message: "Could not log in" });
  }
}
