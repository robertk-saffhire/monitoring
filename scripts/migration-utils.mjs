import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Pool } = pg;

export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const migrationDataDir = path.join(repoRoot, "migration", "data");

export function ensureMigrationDataDir() {
  fs.mkdirSync(migrationDataDir, { recursive: true });
}

export function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

export function getEnv(name, fallback = "") {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : fallback;
}

export function createPool() {
  const connectionString = getRequiredEnv("DATABASE_URL");
  return new Pool({
    connectionString,
    ssl: connectionString.includes("supabase") || connectionString.includes("pooler")
      ? { rejectUnauthorized: false }
      : undefined,
  });
}

export function readJsonFile(filePath) {
  const resolved = path.isAbsolute(filePath) ? filePath : path.join(repoRoot, filePath);
  return JSON.parse(fs.readFileSync(resolved, "utf8"));
}

export function writeJsonFile(filePath, data) {
  const resolved = path.isAbsolute(filePath) ? filePath : path.join(repoRoot, filePath);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  fs.writeFileSync(resolved, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  return resolved;
}

export function timestampForFile() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

export function cleanString(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

export function normalizeFileNumber(value) {
  const raw = cleanString(value);
  if (!raw) return "";
  return raw.replace(/\.0$/, "");
}

export function pickFirst(row, keys, fallback = "") {
  for (const key of keys) {
    if (row && Object.prototype.hasOwnProperty.call(row, key)) {
      const value = cleanString(row[key]);
      if (value) return value;
    }
  }
  return fallback;
}

export function normalizeMonitorStatus(value) {
  const text = cleanString(value).toLowerCase();
  if (text === "on" || text === "active" || text === "yes" || text === "true") return "On";
  return "Off";
}

export function rowsFromGooglePayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.rows)) return payload.rows;
  return [];
}

export async function fetchJson(url) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) {
    throw new Error(`Fetch failed ${res.status} ${res.statusText}: ${url}`);
  }
  return res.json();
}

export async function resolveCompanyId(pool, options = {}) {
  const explicit = options.companyId || getEnv("MIGRATION_COMPANY_ID");
  if (explicit) return Number(explicit);

  const slug = options.companySlug || getEnv("MIGRATION_COMPANY_SLUG", "driver-pipeline");
  const bySlug = await pool.query('select id from companies where slug = $1 limit 1', [slug]);
  if (bySlug.rows[0]?.id) return bySlug.rows[0].id;

  const name = options.companyName || getEnv("MIGRATION_COMPANY_NAME", "Driver Pipeline");
  const byName = await pool.query('select id from companies where lower(name) = lower($1) limit 1', [name]);
  if (byName.rows[0]?.id) return byName.rows[0].id;

  const inserted = await pool.query(
    'insert into companies (name, slug, "isActive") values ($1, $2, true) returning id',
    [name, slug]
  );
  return inserted.rows[0].id;
}

export function parseArgs(argv = process.argv.slice(2)) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const item = argv[i];
    if (!item.startsWith("--")) continue;
    const key = item.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
    } else {
      args[key] = next;
      i++;
    }
  }
  return args;
}
