/**
 * THRESHOLD — Google Sheets backend (Google Apps Script).
 *
 * GENERATED FILE: build it with `npm run build:gas` (scripts/build-gas.js), which embeds the study
 * instrument (server/content.js), the validation rules (server/validate.js) and the derived-variable
 * rules (server/export.js) so that this backend stores exactly the same data as the Node server.
 *
 * Deploy as a container-bound script of the study's sessions spreadsheet:
 *   Extensions → Apps Script → paste this file as Code.gs → Deploy → New deployment → Web app,
 *   "Execute as: Me", "Who has access: Anyone" → copy the /exec URL into the GitHub variable
 *   THRESHOLD_GAS_ENDPOINT (see docs/DEPLOY_SHEETS.md).
 *
 * Script properties (Project Settings → Script properties):
 *   ADMIN_TOKEN                 required for the 'summary' action (study team only)
 *   SESSIONS_SPREADSHEET_ID     optional; write sessions into this spreadsheet instead of the one the
 *                               script is bound to (use when deploying from a different account)
 *   CONSENT_SPREADSHEET_ID      optional; a separate spreadsheet for the consent log. If absent, the
 *                               script creates "THRESHOLD consent log (PI only)" in the deployer's Drive
 *                               on first use and remembers its id in CONSENT_SPREADSHEET_ID_AUTO.
 *   RANDOMISATION               "simple" (default) or "block"
 *   CONSENT_TIMESTAMP_PRECISION "exact" (default), "minute" or "hour"
 *   STUDY_CLOSED                "true" to stop new sessions
 *   RATE_SESSIONS_PER_MIN       default 60
 *
 * Privacy: Apps Script does not expose the caller's IP address or user agent to this code, and the
 * sheet rows contain only what the game sends (see the data dictionary). The consent log lives in a
 * different spreadsheet with no session identifier.
 */

/* ===== embedded study modules (generated) ===== */
/*__EMBEDDED_MODULES__*/
/* ===== end embedded ===== */

var SESSIONS_SHEET = 'sessions';
var CONSENT_SHEET = 'consent_log';
var SESSION_HEADERS = EXPORT_COLUMNS.concat(['raw_json']);
var CONSENT_HEADERS = ['id', 'full_name', 'consent_date', 'recorded_at', 'consent_version'];
var NUMERIC_COLUMNS = {};
['duration_sec', 'rp_1', 'rp_2_raw', 'rp_3_raw', 'dec_1', 'dec_2', 'dec_3', 'dec_4', 'conf_1', 'conf_2', 'conf_3', 'conf_4',
  'lat_1', 'lat_2', 'lat_3', 'lat_4', 'lat_first_1', 'lat_first_2', 'lat_first_3', 'lat_first_4',
  'hidden_1', 'hidden_2', 'hidden_3', 'hidden_4', 'attn_response', 'attn_latency', 'mc_uncertainty', 'mc_framing'].forEach(function (k) { NUMERIC_COLUMNS[k] = true; });

function settings_() {
  var p = PropertiesService.getScriptProperties().getProperties();
  return {
    adminToken: p.ADMIN_TOKEN || '',
    consentSpreadsheetId: p.CONSENT_SPREADSHEET_ID || p.CONSENT_SPREADSHEET_ID_AUTO || '',
    randomisation: p.RANDOMISATION === 'block' ? 'block' : 'simple',
    consentPrecision: ['exact', 'minute', 'hour'].indexOf(p.CONSENT_TIMESTAMP_PRECISION) >= 0 ? p.CONSENT_TIMESTAMP_PRECISION : 'exact',
    studyClosed: String(p.STUDY_CLOSED || '').toLowerCase() === 'true',
    rateSessionsPerMin: Number(p.RATE_SESSIONS_PER_MIN) || 60,
  };
}

function nowIso_() { return new Date().toISOString(); }

function consentTimestamp_(precision) {
  var d = new Date();
  if (precision === 'minute') d.setUTCSeconds(0, 0);
  if (precision === 'hour') d.setUTCMinutes(0, 0, 0);
  return d.toISOString();
}

/* ---------- sheets ---------- */
function sessionsSheet_() {
  // SESSIONS_SPREADSHEET_ID lets the script run from one account (e.g. a personal Gmail that is
  // allowed to publish a web app to "Anyone") while writing into a spreadsheet owned by another
  // (e.g. the study's Columbia-managed sheet, shared with the deploying account as editor).
  var id = PropertiesService.getScriptProperties().getProperty('SESSIONS_SPREADSHEET_ID');
  var ss = id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SESSIONS_SHEET);
  if (!sh) {
    sh = ss.insertSheet(SESSIONS_SHEET);
    sh.getRange(1, 1, 1, SESSION_HEADERS.length).setValues([SESSION_HEADERS]);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, sh.getMaxRows(), SESSION_HEADERS.length).setNumberFormat('@'); // plain text: no date auto-conversion
  }
  return sh;
}

function consentSheet_() {
  var s = settings_();
  var ss;
  if (s.consentSpreadsheetId) {
    ss = SpreadsheetApp.openById(s.consentSpreadsheetId);
  } else {
    ss = SpreadsheetApp.create('THRESHOLD consent log (PI only)');
    PropertiesService.getScriptProperties().setProperty('CONSENT_SPREADSHEET_ID_AUTO', ss.getId());
  }
  var sh = ss.getSheetByName(CONSENT_SHEET);
  if (!sh) {
    sh = ss.getSheets()[0];
    if (sh.getLastRow() > 0) sh = ss.insertSheet(CONSENT_SHEET);
    else sh.setName(CONSENT_SHEET);
    sh.getRange(1, 1, 1, CONSENT_HEADERS.length).setValues([CONSENT_HEADERS]);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, sh.getMaxRows(), CONSENT_HEADERS.length).setNumberFormat('@');
  }
  return sh;
}

function findSessionRow_(sh, sessionUuid) {
  var last = sh.getLastRow();
  if (last < 2) return 0;
  var ids = sh.getRange(2, 1, last - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) if (String(ids[i][0]) === sessionUuid) return i + 2;
  return 0;
}

function readRow_(sh, rowIndex) {
  var values = sh.getRange(rowIndex, 1, 1, SESSION_HEADERS.length).getValues()[0];
  var row = {};
  for (var i = 0; i < SESSION_HEADERS.length; i++) {
    var k = SESSION_HEADERS[i];
    var v = values[i];
    if (v === '' || v === undefined) v = null;
    else if (v instanceof Date) v = v.toISOString();
    else if (NUMERIC_COLUMNS[k] && typeof v === 'string' && /^-?\d+(\.\d+)?$/.test(v)) v = Number(v);
    row[k] = v;
  }
  return row;
}

function writeRow_(sh, rowIndex, row) {
  var out = derive(row);
  out.raw_json = row.raw_json || null;
  var values = SESSION_HEADERS.map(function (k) { return out[k] === null || out[k] === undefined ? '' : out[k]; });
  sh.getRange(rowIndex, 1, 1, SESSION_HEADERS.length).setValues([values]);
}

/* ---------- randomisation ---------- */
function shuffle_(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

function assignCondition_(sh, mode) {
  var letters = ['A', 'B', 'C', 'D'];
  if (mode !== 'block') return letters[Math.floor(Math.random() * 4)];
  var n = Math.max(0, sh.getLastRow() - 1);
  var position = n % 4;
  var props = PropertiesService.getScriptProperties();
  var block;
  if (position === 0 || !props.getProperty('CURRENT_BLOCK')) {
    block = shuffle_(letters);
    props.setProperty('CURRENT_BLOCK', JSON.stringify(block));
  } else {
    block = JSON.parse(props.getProperty('CURRENT_BLOCK'));
  }
  return block[position];
}

/* ---------- rate limit (global, no client addresses) ---------- */
function rateLimited_(perMinute) {
  var cache = CacheService.getScriptCache();
  var key = 'rl:sessions:' + Math.floor(Date.now() / 60000);
  var n = Number(cache.get(key) || 0) + 1;
  cache.put(key, String(n), 120);
  return n > perMinute;
}

/* ---------- actions ---------- */
function fail_(status, message, details) {
  var e = new Error(message);
  e.status = status;
  e.details = details;
  throw e;
}

function actionSession_(body) {
  var s = settings_();
  if (s.studyClosed) fail_(403, 'The study is closed to new participants.');
  var v = validateConsent(body);
  if (!v.ok) fail_(400, 'Invalid consent record', v.errors);
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    if (rateLimited_(s.rateSessionsPerMin)) fail_(429, 'The study server is busy. Please try again in a moment.');
    var consent = consentSheet_();
    var consentId = Math.max(0, consent.getLastRow() - 1) + 1;
    consent.appendRow([consentId, v.fullName, v.consentDate, consentTimestamp_(s.consentPrecision), CONSENT_VERSION]);

    var sh = sessionsSheet_();
    var condition = assignCondition_(sh, s.randomisation);
    var sessionUuid = Utilities.getUuid();
    var row = { session_uuid: sessionUuid, condition: condition, status: 'started', started_at: nowIso_(), instrument_version: INSTRUMENT_VERSION, consent_version: CONSENT_VERSION, randomisation: s.randomisation };
    writeRow_(sh, sh.getLastRow() + 1, row);
    return { sessionId: sessionUuid, materials: materialsFor(condition) };
  } finally {
    lock.releaseLock();
  }
}

function actionSubmit_(body) {
  var sessionId = String(body.sessionId || '');
  if (!/^[0-9a-f-]{36}$/i.test(sessionId)) fail_(404, 'Unknown session');
  var payload = {};
  for (var k in body) if (k !== 'action' && k !== 'sessionId') payload[k] = body[k];
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sh = sessionsSheet_();
    var idx = findSessionRow_(sh, sessionId);
    if (!idx) fail_(404, 'Unknown session');
    var row = readRow_(sh, idx);
    if (row.status !== 'started') fail_(409, 'This session has already ended.');
    var v = validateSubmission(payload);
    if (!v.ok) fail_(400, 'Invalid submission', v.errors);
    for (var key in v.row) row[key] = v.row[key];
    row.status = 'submitted';
    row.ended_at = nowIso_();
    writeRow_(sh, idx, row);
    return { status: 'submitted' };
  } finally {
    lock.releaseLock();
  }
}

function actionWithdraw_(body) {
  var sessionId = String(body.sessionId || '');
  if (!/^[0-9a-f-]{36}$/i.test(sessionId)) fail_(404, 'Unknown session');
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sh = sessionsSheet_();
    var idx = findSessionRow_(sh, sessionId);
    if (!idx) fail_(404, 'Unknown session');
    var row = readRow_(sh, idx);
    if (row.status !== 'started') fail_(409, 'This session has already ended.');
    var kept = { session_uuid: row.session_uuid, condition: row.condition, status: 'withdrawn', started_at: row.started_at, ended_at: nowIso_(), instrument_version: row.instrument_version, consent_version: row.consent_version, randomisation: row.randomisation };
    writeRow_(sh, idx, kept); // responses, if any arrived, are not kept
    return { status: 'withdrawn' };
  } finally {
    lock.releaseLock();
  }
}

function actionSummary_(body) {
  var s = settings_();
  if (!s.adminToken || String(body.token || '') !== s.adminToken) fail_(401, 'Unauthorized');
  var sh = sessionsSheet_();
  var last = sh.getLastRow();
  var by = { A: { started: 0, submitted: 0, withdrawn: 0 }, B: { started: 0, submitted: 0, withdrawn: 0 }, C: { started: 0, submitted: 0, withdrawn: 0 }, D: { started: 0, submitted: 0, withdrawn: 0 } };
  var totals = { started: 0, submitted: 0, withdrawn: 0 };
  if (last >= 2) {
    var rows = sh.getRange(2, 1, last - 1, 3).getValues(); // session_uuid, condition, uncertainty_type … status is column index of 'status'
    var statusCol = SESSION_HEADERS.indexOf('status') + 1;
    var statuses = sh.getRange(2, statusCol, last - 1, 1).getValues();
    for (var i = 0; i < rows.length; i++) {
      var c = String(rows[i][1]);
      var st = String(statuses[i][0]);
      if (by[c] && totals[st] !== undefined) { by[c][st]++; totals[st]++; }
    }
  }
  var consentCount = Math.max(0, consentSheet_().getLastRow() - 1);
  return { byCondition: by, totals: totals, consentCount: consentCount, config: { randomisation: s.randomisation, studyClosed: s.studyClosed, consentTimestampPrecision: s.consentPrecision }, versions: { instrument: INSTRUMENT_VERSION, consent: CONSENT_VERSION } };
}

function health_() {
  return { ok: true, backend: 'google-sheets', versions: { instrument: INSTRUMENT_VERSION, consent: CONSENT_VERSION } };
}

/* ---------- HTTP entry points ---------- */
function respond_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function dispatch_(body) {
  try {
    switch (String(body.action || '')) {
      case 'health': return health_();
      case 'session': return actionSession_(body);
      case 'submit': return actionSubmit_(body);
      case 'withdraw': return actionWithdraw_(body);
      case 'summary': return actionSummary_(body);
      default: fail_(404, 'Unknown action');
    }
  } catch (e) {
    return { error: e.message || 'Internal error', status: e.status || 500, details: e.details };
  }
}

function doPost(e) {
  var body = {};
  try {
    body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (err) {
    return respond_({ error: 'invalid JSON', status: 400 });
  }
  return respond_(dispatch_(body));
}

function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.action === 'health' || !p.action) return respond_(health_());
  return respond_({ error: 'Use POST', status: 405 });
}

/** Run once from the editor after pasting the code: creates the sheets and asks for permissions. */
function setup() {
  sessionsSheet_();
  consentSheet_();
  Logger.log('THRESHOLD sheets are ready. Consent log spreadsheet id: ' + settings_().consentSpreadsheetId);
}
