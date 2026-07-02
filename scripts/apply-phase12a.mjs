import fs from 'fs';

const file = 'api/index.ts';
let src = fs.readFileSync(file, 'utf8');

const importLine = "import { tazworksSyncRun, tazworksSyncRuns } from '../server/tazworksSync';";
if (!src.includes(importLine)) {
  const importMatches = [...src.matchAll(/^import .*;$/gm)];
  if (!importMatches.length) throw new Error('No import block found in api/index.ts');
  const last = importMatches[importMatches.length - 1];
  const insertAt = (last.index || 0) + last[0].length;
  src = src.slice(0, insertAt) + "\n" + importLine + src.slice(insertAt);
}

if (!src.includes("tazworks-sync/run")) {
  const anchors = [
    "    if (route === 'system-check') return systemCheck(req, res, user);",
    "    if (path === 'system-check') return systemCheck(req, res, user);",
    "    if (route === 'change-password') return changePassword(req, res, user);",
    "    if (path === 'change-password') return changePassword(req, res, user);",
    "    if (path === 'import-applicants') return handleImport(req, res, user);",
    "    if (route === 'import-applicants') return importApplicants(req, res, user);",
    "    if (route === 'companies') return companies(req, res, user);",
    "    if (path === 'companies') return handleCompanies(req, res, user);"
  ];

  const anchor = anchors.find((item) => src.includes(item));
  if (!anchor) throw new Error('Could not find route insertion anchor in api/index.ts');

  const routeVar = anchor.includes("path ===") ? "path" : "route";
  const ctx = "{ query, json, requireAdmin }";
  const insert =
    `    if (${routeVar} === 'tazworks-sync/run') return tazworksSyncRun(req, res, user, ${ctx});\n` +
    `    if (${routeVar} === 'tazworks-sync/runs') return tazworksSyncRuns(req, res, user, ${ctx});\n` +
    anchor;

  src = src.replace(anchor, insert);
}

fs.writeFileSync(file, src);
console.log('Phase 12A-2 patch applied to api/index.ts');
