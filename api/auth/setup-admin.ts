import "dotenv/config";
import {
  countAdminUsers,
  createLocalUser,
  getLocalUserByUsername,
  updateLocalUser,
  verifyLocalUserPassword,
} from "../../server/db";
import { methodNotAllowed, publicUser, readJsonBody, sendJson, setSessionCookie } from "../../server/authApiHelpers";
import { signLocalSession } from "../../server/localSession";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return methodNotAllowed(res);

  try {
    if ((await countAdminUsers()) > 0) {
      return sendJson(res, 403, { status: "error", message: "Admin setup is already complete" });
    }

    const body = await readJsonBody(req);
    const username = String(body.username ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (username.length < 3) {
      return sendJson(res, 400, { status: "error", message: "Username must be at least 3 characters" });
    }

    if (password.length < 6) {
      return sendJson(res, 400, { status: "error", message: "Password must be at least 6 characters" });
    }

    const existing = await getLocalUserByUsername(username);
    if (existing) {
      await updateLocalUser(existing.id, {
        displayName: existing.displayName ?? username,
        role: "admin",
        isActive: true,
        password,
        mustChangePassword: false,
      });
    } else {
      await createLocalUser({
        username,
        password,
        displayName: username,
        role: "admin",
        mustChangePassword: false,
      });
    }

    const user = await verifyLocalUserPassword(username, password);
    if (!user) {
      return sendJson(res, 500, { status: "error", message: "Admin was created, but login verification failed" });
    }

    const token = await signLocalSession(user, "1d");
    setSessionCookie(res, token, 24 * 60 * 60);

    return sendJson(res, 200, {
      status: "ok",
      success: true,
      mustChangePassword: false,
      user: publicUser(user),
    });
  } catch (error) {
    console.error("[api/auth/setup-admin]", error);
    return sendJson(res, 500, { status: "error", message: "Could not create admin account" });
  }
}
