// Runs the generated Google Apps Script backend (dist/gas/Code.gs) inside Node with in-memory
// stand-ins for the Apps Script services, and checks that it stores exactly what the Node server
// stores: consent in a separate spreadsheet with no session id, sessions created at consent,
// responses only on submit, withdrawal keeping nothing, derived columns as in the data dictionary.

import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import vm from 'node:vm';
import { randomUUID } from 'node:crypto';
import { EXPORT_COLUMNS } from '../server/export.js';

const GAS_PATH = new URL('../dist/gas/Code.gs', import.meta.url);

// ---------------------------------------------------------------------------
// Minimal Apps Script service stubs (only what Code.gs uses)
// ---------------------------------------------------------------------------
function makeSheet(name) {
  const rows = []; // 2D array of values
  const sheet = {
    _name: name,
    _rows: rows,
    getName: () => sheet._name,
    setName: (n) => { sheet._name = n; return sheet; },
    getLastRow: () => rows.length,
    getMaxRows: () => Math.max(1000, rows.length),
    setFrozenRows: () => sheet,
    appendRow: (arr) => { rows.push(arr.slice()); return sheet; },
    getRange: (r, c, nr = 1, nc = 1) => ({
      getValues: () => {
        const out = [];
        for (let i = 0; i < nr; i++) {
          const row = rows[r - 1 + i] || [];
          out.push(Array.from({ length: nc }, (_, j) => (row[c - 1 + j] === undefined ? '' : row[c - 1 + j])));
        }
        return out;
      },
      setValues: (vals) => {
        for (let i = 0; i < vals.length; i++) {
          while (rows.length < r + i) rows.push([]);
          const row = rows[r - 1 + i];
          for (let j = 0; j < vals[i].length; j++) row[c - 1 + j] = vals[i][j];
        }
      },
      setNumberFormat: () => {},
      getRow: () => r,
    }),
  };
  return sheet;
}

function makeSpreadsheet(id, name) {
  const sheets = [makeSheet('Sheet1')];
  return {
    getId: () => id,
    getName: () => name,
    getSheets: () => sheets,
    getSheetByName: (n) => sheets.find((s) => s._name === n) || null,
    insertSheet: (n) => { const s = makeSheet(n); sheets.push(s); return s; },
  };
}

function makeEnvironment() {
  const active = makeSpreadsheet('sessions-ss', 'THRESHOLD sessions');
  const spreadsheets = { 'sessions-ss': active };
  const props = {};
  const cache = {};
  let locks = 0;
  const env = {
    active,
    spreadsheets,
    props,
    created: [],
    SpreadsheetApp: {
      getActiveSpreadsheet: () => active,
      openById: (id) => { if (!spreadsheets[id]) throw new Error('not found ' + id); return spreadsheets[id]; },
      create: (name) => { const id = 'ss-' + randomUUID().slice(0, 8); const ss = makeSpreadsheet(id, name); spreadsheets[id] = ss; env.created.push(ss); return ss; },
    },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => (k in props ? props[k] : null), setProperty: (k, v) => { props[k] = v; }, getProperties: () => ({ ...props }) }) },
    LockService: { getScriptLock: () => ({ waitLock: () => { locks++; }, releaseLock: () => { locks--; } }) },
    CacheService: { getScriptCache: () => ({ get: (k) => (k in cache ? cache[k] : null), put: (k, v) => { cache[k] = v; } }) },
    Utilities: { getUuid: () => randomUUID() },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: (s) => { const o = { _s: s, setMimeType: () => o, getContent: () => s }; return o; } },
    Logger: { log: () => {} },
    lockDepth: () => locks,
  };
  return env;
}

function loadGas(env) {
  const code = readFileSync(GAS_PATH, 'utf8');
  const sandbox = { ...env, console, Date, Math, JSON, Number, String, Array, Object, RegExp, Error, Symbol, parseInt, parseFloat, isNaN, isFinite };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: 'Code.gs' });
  const post = (payload) => JSON.parse(sandbox.doPost({ postData: { contents: JSON.stringify(payload) } }).getContent());
  const get = (params) => JSON.parse(sandbox.doGet({ parameter: params }).getContent());
  return { sandbox, post, get };
}

const submission = (sessionId) => ({
  action: 'submit',
  sessionId,
  clientConsentAt: '2026-10-02T10:00:00Z',
  clientMcAt: '2026-10-02T10:04:30Z',
  profile: { education: "Master's", job_function: 'ERM', years_experience: '5–9', seniority: 'Manager', industry: 'Consulting' },
  style: { rp_1: 5, rp_2: 1, rp_3: 2 },
  decisions: [1, 2, 3, 4].map((id) => ({ scenarioId: id, choice: id === 1 ? 'increase' : 'decrease', confidence: 4, latency: 6.5, latencyFirst: 6.5, hidden: false })),
  attention: { choice: 'maintain', latency: 3 },
  manipulation: { mc_uncertainty: 1, mc_framing: 2 },
});

before(() => {
  if (!existsSync(GAS_PATH)) execFileSync(process.execPath, [new URL('../scripts/build-gas.js', import.meta.url).pathname], { stdio: 'pipe' });
});

test('generated script parses and answers health', () => {
  const env = makeEnvironment();
  const gas = loadGas(env);
  const h = gas.get({ action: 'health' });
  assert.equal(h.ok, true);
  assert.equal(h.backend, 'google-sheets');
  assert.equal(h.versions.instrument, 'protocol-v1.3-appendixB');
});

test('consent goes to a separate spreadsheet with no session id; session row is created at consent', () => {
  const env = makeEnvironment();
  const gas = loadGas(env);
  const r = gas.post({ action: 'session', fullName: 'Pat Example', consentDate: '2026-10-02' });
  assert.match(r.sessionId, /^[0-9a-f-]{36}$/);
  assert.ok(!('condition' in r));
  assert.equal(r.materials.scenarios.length, 4);
  // consent log created automatically in a separate spreadsheet
  assert.equal(env.created.length, 1);
  const consentSheet = env.created[0].getSheetByName('consent_log');
  assert.deepEqual(consentSheet._rows[0], ['id', 'full_name', 'consent_date', 'recorded_at', 'consent_version']);
  assert.equal(consentSheet._rows[1][1], 'Pat Example');
  assert.ok(!JSON.stringify(consentSheet._rows).includes(r.sessionId), 'consent log holds no session id');
  assert.equal(env.props.CONSENT_SPREADSHEET_ID_AUTO, env.created[0].getId());
  // sessions sheet
  const sessions = env.active.getSheetByName('sessions');
  assert.deepEqual(sessions._rows[0].slice(0, EXPORT_COLUMNS.length), EXPORT_COLUMNS);
  assert.equal(sessions._rows[0][EXPORT_COLUMNS.length], 'raw_json');
  const row = Object.fromEntries(sessions._rows[0].map((k, i) => [k, sessions._rows[1][i]]));
  assert.equal(row.session_uuid, r.sessionId);
  assert.ok(['A', 'B', 'C', 'D'].includes(row.condition));
  assert.equal(row.status, 'started');
  assert.equal(row.dec_1, '');
  assert.ok(!JSON.stringify(sessions._rows).includes('Pat Example'), 'sessions sheet holds no names');
});

test('submit fills the row with raw and derived columns; second submit and withdraw are refused', () => {
  const env = makeEnvironment();
  const gas = loadGas(env);
  const { sessionId } = gas.post({ action: 'session', fullName: 'Sub Mitter', consentDate: '2026-10-02' });
  const bad = gas.post({ action: 'submit', sessionId, manipulation: {} });
  assert.equal(bad.status, 400);
  const ok = gas.post(submission(sessionId));
  assert.deepEqual(ok, { status: 'submitted' });
  const sessions = env.active.getSheetByName('sessions');
  const row = Object.fromEntries(sessions._rows[0].map((k, i) => [k, sessions._rows[1][i]]));
  assert.equal(row.status, 'submitted');
  assert.equal(row.dec_1, 1);
  assert.equal(row.dec_2, -1);
  assert.equal(row.risk_taking_score, -2);
  assert.equal(row.risk_propensity, 4.667);
  assert.equal(row.duration_sec, 270);
  assert.equal(row.attn_pass, 'TRUE');
  assert.equal(row.excl_attention, 'FALSE');
  assert.equal(row.analysis_sample, 'TRUE');
  assert.equal(row.mc_uncertainty_correct, row.condition === 'A' || row.condition === 'B' ? 'TRUE' : 'FALSE');
  assert.ok(String(row.raw_json).includes('"decisions"'));
  assert.equal(gas.post(submission(sessionId)).status, 409);
  assert.equal(gas.post({ action: 'withdraw', sessionId }).status, 409);
  assert.equal(env.lockDepth(), 0, 'locks released');
});

test('withdraw keeps no responses and unknown sessions are rejected', () => {
  const env = makeEnvironment();
  const gas = loadGas(env);
  const { sessionId } = gas.post({ action: 'session', fullName: 'With Drawer', consentDate: '2026-10-02' });
  assert.deepEqual(gas.post({ action: 'withdraw', sessionId }), { status: 'withdrawn' });
  const sessions = env.active.getSheetByName('sessions');
  const row = Object.fromEntries(sessions._rows[0].map((k, i) => [k, sessions._rows[1][i]]));
  assert.equal(row.status, 'withdrawn');
  assert.equal(row.dec_1, '');
  assert.equal(row.raw_json, '');
  assert.equal(gas.post(submission(sessionId)).status, 409);
  assert.equal(gas.post({ action: 'submit', sessionId: randomUUID() }).status, 404);
  assert.equal(gas.post({ action: 'withdraw', sessionId: 'nope' }).status, 404);
  assert.equal(gas.post({ action: 'bogus' }).status, 404);
});

test('block randomisation, study closed, rate limit and summary token', () => {
  const env = makeEnvironment();
  env.props.RANDOMISATION = 'block';
  env.props.ADMIN_TOKEN = 'secret';
  const gas = loadGas(env);
  for (let i = 0; i < 8; i++) gas.post({ action: 'session', fullName: 'Block Tester', consentDate: '2026-10-02' });
  const sessions = env.active.getSheetByName('sessions');
  const conds = sessions._rows.slice(1).map((r) => r[1]);
  assert.deepEqual(conds.slice(0, 4).sort(), ['A', 'B', 'C', 'D']);
  assert.deepEqual(conds.slice(4, 8).sort(), ['A', 'B', 'C', 'D']);

  assert.equal(gas.post({ action: 'summary', token: 'wrong' }).status, 401);
  const s = gas.post({ action: 'summary', token: 'secret' });
  assert.equal(s.totals.started, 8);
  assert.equal(s.consentCount, 8);
  assert.equal(s.config.randomisation, 'block');

  env.props.RATE_SESSIONS_PER_MIN = '8';
  assert.equal(gas.post({ action: 'session', fullName: 'Late Comer', consentDate: '2026-10-02' }).status, 429);
  env.props.RATE_SESSIONS_PER_MIN = '1000';
  env.props.STUDY_CLOSED = 'true';
  assert.equal(gas.post({ action: 'session', fullName: 'Late Comer', consentDate: '2026-10-02' }).status, 403);
  assert.equal(sessions._rows.length, 9, 'refused requests write nothing');
});
