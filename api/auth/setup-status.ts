import "dotenv/config";
import { countAdminUsers } from "../../server/db";
import { methodNotAllowed, sendJson } from "../../server/authApiHelpers";

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") return methodNotAllowed(res);

  try {
    const hasAdmin = (await countAdminUsers()) > 0;
    return sendJson(res, 200, { status: "ok", hasAdmin });
  } catch (error) {
    console.error("[api/auth/setup-status]", error);
    return sendJson(res, 500, { status: "error", message: "Could not check setup status" });
  }
}
