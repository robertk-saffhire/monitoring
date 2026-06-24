import "dotenv/config";
import { createApiApp } from "../server/_core/app";

const app = createApiApp();

function normalizeCatchAllUrl(req: any) {
  const rawPath = req.query?.path;
  const parts = Array.isArray(rawPath) ? rawPath : rawPath ? [String(rawPath)] : [];
  const query = typeof req.url === "string" && req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
  req.url = `/api/${parts.join("/")}${query}`;
}

export default function handler(req: any, res: any) {
  normalizeCatchAllUrl(req);
  return app(req, res);
}
