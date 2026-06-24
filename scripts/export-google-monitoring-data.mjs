import "dotenv/config";
import path from "node:path";
import {
  ensureMigrationDataDir,
  fetchJson,
  getEnv,
  migrationDataDir,
  rowsFromGooglePayload,
  timestampForFile,
  writeJsonFile,
} from "./migration-utils.mjs";

const sources = {
  applicants: getEnv("GOOGLE_APPLICANTS_URL") || getEnv("MONITORING_APPLICANTS_URL"),
  notes: getEnv("GOOGLE_NOTES_URL"),
  medExpire: getEnv("GOOGLE_MED_EXPIRE_URL"),
  medCerts: getEnv("GOOGLE_MED_CERTS_URL"),
};

async function fetchOptionalSource(name, url) {
  if (!url) {
    return { status: "skipped", rows: [], reason: `Missing ${name} URL env var` };
  }
  const payload = await fetchJson(url);
  return { status: "ok", rows: rowsFromGooglePayload(payload), rawStatus: payload?.status ?? null };
}

async function main() {
  ensureMigrationDataDir();

  const result = {
    exportedAt: new Date().toISOString(),
    sourceEnv: Object.fromEntries(Object.entries(sources).map(([key, value]) => [key, Boolean(value)])),
    applicants: await fetchOptionalSource("applicants", sources.applicants),
    notes: await fetchOptionalSource("notes", sources.notes),
    medExpire: await fetchOptionalSource("medExpire", sources.medExpire),
    medCerts: await fetchOptionalSource("medCerts", sources.medCerts),
  };

  const output = path.join(migrationDataDir, `google-monitoring-export-${timestampForFile()}.json`);
  writeJsonFile(output, result);

  console.log(`Export complete: ${output}`);
  console.log(`Applicants: ${result.applicants.rows.length}`);
  console.log(`Notes: ${result.notes.rows.length}`);
  console.log(`Med expire overrides: ${result.medExpire.rows.length}`);
  console.log(`Med certs: ${result.medCerts.rows.length}`);
}

main().catch((error) => {
  console.error("Google monitoring export failed:", error);
  process.exit(1);
});
