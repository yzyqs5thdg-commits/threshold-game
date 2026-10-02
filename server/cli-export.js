// Command-line export, for the nightly copy to the PI's Columbia Google Drive.
//   npm run export                 -> exports/threshold_sessions_<timestamp>.csv (all sessions)
//   npm run export -- --consent    -> also writes exports/threshold_consent_log_<timestamp>.csv
// Reads DATA_DIR from the environment (default ./data). Does not need the server to be running.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { openDatabases, allSessions, allConsentRecords } from './db.js';
import { derive, toCsv, consentCsv } from './export.js';

const dataDir = process.env.DATA_DIR || './data';
const outDir = process.env.EXPORT_DIR || './exports';
const withConsent = process.argv.includes('--consent');

mkdirSync(outDir, { recursive: true });
const dbs = openDatabases(dataDir);
const stamp = new Date().toISOString().replace(/[:.]/g, '-');

const rows = allSessions(dbs).map(derive);
const sessionsPath = join(outDir, `threshold_sessions_${stamp}.csv`);
writeFileSync(sessionsPath, toCsv(rows));
process.stdout.write(`${rows.length} session rows -> ${resolve(sessionsPath)}\n`);

if (withConsent) {
  const consentPath = join(outDir, `threshold_consent_log_${stamp}.csv`);
  const records = allConsentRecords(dbs);
  writeFileSync(consentPath, consentCsv(records));
  process.stdout.write(`${records.length} consent records -> ${resolve(consentPath)}  (store separately from session data)\n`);
}

dbs.study.close();
dbs.consent.close();
