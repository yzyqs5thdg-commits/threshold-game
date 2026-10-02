// Storage. Two physically separate SQLite files:
//   study.db   – sessions (random UUID, condition, responses). No names, no identifiers.
//   consent.db – consent log (typed name, date, timestamp). No session ID, no link to responses.
// Uses the SQLite module built into Node 22.13+; no native dependencies.

import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

export function openDatabases(dataDir) {
  mkdirSync(dataDir, { recursive: true });
  const study = new DatabaseSync(join(dataDir, 'study.db'));
  const consent = new DatabaseSync(join(dataDir, 'consent.db'));
  study.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  consent.exec('PRAGMA journal_mode = WAL;');
  migrate(study, consent);
  return { study, consent };
}

export function openInMemory() {
  const study = new DatabaseSync(':memory:');
  const consent = new DatabaseSync(':memory:');
  migrate(study, consent);
  return { study, consent };
}

function migrate(study, consent) {
  study.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      session_uuid        TEXT PRIMARY KEY,
      condition           TEXT NOT NULL CHECK (condition IN ('A','B','C','D')),
      status              TEXT NOT NULL DEFAULT 'started' CHECK (status IN ('started','submitted','withdrawn')),
      started_at          TEXT NOT NULL,      -- server clock, ISO 8601 UTC, at condition assignment
      ended_at            TEXT,               -- server clock at submit/withdraw
      instrument_version  TEXT NOT NULL,
      consent_version     TEXT NOT NULL,
      randomisation       TEXT NOT NULL,      -- 'simple' | 'block'

      -- client-measured timing (protocol: duration from consent acceptance to final manipulation-check submission)
      client_consent_at   TEXT,
      client_mc_at        TEXT,
      duration_sec        REAL,

      -- Screen 2: profile
      education           TEXT,
      job_function        TEXT,
      years_experience    TEXT,
      seniority           TEXT,
      industry            TEXT,

      -- Screen 3: risk propensity (raw 1–5)
      rp_1 INTEGER, rp_2_raw INTEGER, rp_3_raw INTEGER,

      -- Screen 5: decisions (+1 increase / 0 maintain / -1 decrease), confidence 1–5, latency seconds
      dec_1 INTEGER, dec_2 INTEGER, dec_3 INTEGER, dec_4 INTEGER,
      conf_1 INTEGER, conf_2 INTEGER, conf_3 INTEGER, conf_4 INTEGER,
      lat_1 REAL, lat_2 REAL, lat_3 REAL, lat_4 REAL,              -- display -> submitted choice click
      lat_first_1 REAL, lat_first_2 REAL, lat_first_3 REAL, lat_first_4 REAL,  -- display -> first choice click
      hidden_1 INTEGER, hidden_2 INTEGER, hidden_3 INTEGER, hidden_4 INTEGER,  -- 1 if tab was hidden during the scenario
      scenario_order      TEXT,               -- e.g. "1,2,3,4"

      -- data quality item
      attn_response       INTEGER,            -- +1 / 0 / -1
      attn_latency        REAL,

      -- Screen 6: manipulation checks (1,2,3)
      mc_uncertainty      INTEGER,
      mc_framing          INTEGER,

      raw_json            TEXT                -- the submitted payload, for audit
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
    CREATE INDEX IF NOT EXISTS idx_sessions_condition ON sessions(condition);

    CREATE TABLE IF NOT EXISTS meta (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  consent.exec(`
    CREATE TABLE IF NOT EXISTS consent_log (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name       TEXT NOT NULL,
      consent_date    TEXT NOT NULL,          -- date as typed by the participant
      recorded_at     TEXT NOT NULL,          -- server clock, precision per CONSENT_TIMESTAMP_PRECISION
      consent_version TEXT NOT NULL
    );
  `);
}

// ---------------------------------------------------------------------------
// Consent log
// ---------------------------------------------------------------------------
export function recordConsent(dbs, { fullName, consentDate, recordedAt, consentVersion }) {
  dbs.consent
    .prepare('INSERT INTO consent_log (full_name, consent_date, recorded_at, consent_version) VALUES (?, ?, ?, ?)')
    .run(fullName, consentDate, recordedAt, consentVersion);
}

export function allConsentRecords(dbs) {
  return dbs.consent.prepare('SELECT id, full_name, consent_date, recorded_at, consent_version FROM consent_log ORDER BY id').all();
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------
export function createSession(dbs, { sessionUuid, condition, startedAt, instrumentVersion, consentVersion, randomisation }) {
  dbs.study
    .prepare(
      `INSERT INTO sessions (session_uuid, condition, status, started_at, instrument_version, consent_version, randomisation)
       VALUES (?, ?, 'started', ?, ?, ?, ?)`,
    )
    .run(sessionUuid, condition, startedAt, instrumentVersion, consentVersion, randomisation);
}

export function getSession(dbs, sessionUuid) {
  return dbs.study.prepare('SELECT * FROM sessions WHERE session_uuid = ?').get(sessionUuid) ?? null;
}

export function countStartedSessions(dbs) {
  return dbs.study.prepare('SELECT COUNT(*) AS n FROM sessions').get().n;
}

export function getMeta(dbs, key) {
  const row = dbs.study.prepare('SELECT value FROM meta WHERE key = ?').get(key);
  return row ? row.value : null;
}

export function setMeta(dbs, key, value) {
  dbs.study.prepare('INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, value);
}

const SUBMIT_COLUMNS = [
  'client_consent_at', 'client_mc_at', 'duration_sec',
  'education', 'job_function', 'years_experience', 'seniority', 'industry',
  'rp_1', 'rp_2_raw', 'rp_3_raw',
  'dec_1', 'dec_2', 'dec_3', 'dec_4',
  'conf_1', 'conf_2', 'conf_3', 'conf_4',
  'lat_1', 'lat_2', 'lat_3', 'lat_4',
  'lat_first_1', 'lat_first_2', 'lat_first_3', 'lat_first_4',
  'hidden_1', 'hidden_2', 'hidden_3', 'hidden_4',
  'scenario_order', 'attn_response', 'attn_latency',
  'mc_uncertainty', 'mc_framing', 'raw_json',
];

/** Store a validated, normalised submission. `row` keys must match SUBMIT_COLUMNS. Returns false if the session cannot accept a submission. */
export function submitSession(dbs, sessionUuid, row, endedAt) {
  const sets = SUBMIT_COLUMNS.map((c) => `${c} = ?`).join(', ');
  const values = SUBMIT_COLUMNS.map((c) => (row[c] === undefined ? null : row[c]));
  const result = dbs.study
    .prepare(`UPDATE sessions SET status = 'submitted', ended_at = ?, ${sets} WHERE session_uuid = ? AND status = 'started'`)
    .run(endedAt, ...values, sessionUuid);
  return result.changes === 1;
}

/** Mark a session withdrawn. Nothing beyond the status and end time is stored. */
export function withdrawSession(dbs, sessionUuid, endedAt) {
  const result = dbs.study
    .prepare(`UPDATE sessions SET status = 'withdrawn', ended_at = ? WHERE session_uuid = ? AND status = 'started'`)
    .run(endedAt, sessionUuid);
  return result.changes === 1;
}

export function allSessions(dbs, { status } = {}) {
  if (status) return dbs.study.prepare('SELECT * FROM sessions WHERE status = ? ORDER BY started_at').all(status);
  return dbs.study.prepare('SELECT * FROM sessions ORDER BY started_at').all();
}

export function summary(dbs) {
  const rows = dbs.study
    .prepare('SELECT condition, status, COUNT(*) AS n FROM sessions GROUP BY condition, status ORDER BY condition, status')
    .all();
  const byCondition = { A: { started: 0, submitted: 0, withdrawn: 0 }, B: { started: 0, submitted: 0, withdrawn: 0 }, C: { started: 0, submitted: 0, withdrawn: 0 }, D: { started: 0, submitted: 0, withdrawn: 0 } };
  for (const r of rows) byCondition[r.condition][r.status] = r.n;
  const totals = { started: 0, submitted: 0, withdrawn: 0 };
  for (const c of Object.values(byCondition)) for (const k of Object.keys(totals)) totals[k] += c[k];
  const consentCount = dbs.consent.prepare('SELECT COUNT(*) AS n FROM consent_log').get().n;
  return { byCondition, totals, consentCount };
}
