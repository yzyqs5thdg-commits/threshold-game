// THRESHOLD server. Zero dependencies: node:http for routing, node:sqlite for storage.
//
// Privacy by construction:
//  - No IP address, user agent, referrer or cookie is read, logged or stored anywhere in this code.
//  - Request log lines contain method, path, status and duration only.
//  - Condition-specific text is sent only for the assigned condition.
//  - The consent log and the response data live in different database files and are
//    exported by different endpoints.

import http from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID, createHash, timingSafeEqual } from 'node:crypto';

import { openDatabases, openInMemory, recordConsent, createSession, getSession, submitSession, withdrawSession, allSessions, allConsentRecords, summary } from './db.js';
import { assignCondition } from './randomise.js';
import { validateConsent, validateSubmission } from './validate.js';
import { derive, toCsv, consentCsv } from './export.js';
import { materialsFor, publicMaterials, IMMEDIATE_DEBRIEF, INSTRUMENT_VERSION, CONSENT_VERSION } from './content.js';
import { consentPayload, consentPrintHtml } from './consent.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = resolve(__dirname, '..', 'public');
const MAX_BODY_BYTES = 64 * 1024;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
};

export function configFromEnv(env = process.env) {
  const bool = (v) => String(v ?? '').toLowerCase() === 'true';
  return {
    port: Number(env.PORT) || 3000,
    dataDir: env.DATA_DIR || './data',
    adminToken: env.ADMIN_TOKEN || '',
    consentToken: env.CONSENT_TOKEN || env.ADMIN_TOKEN || '',
    randomisation: env.RANDOMISATION === 'block' ? 'block' : 'simple',
    consentTimestampPrecision: ['exact', 'minute', 'hour'].includes(env.CONSENT_TIMESTAMP_PRECISION) ? env.CONSENT_TIMESTAMP_PRECISION : 'exact',
    followupFormUrl: env.FOLLOWUP_FORM_URL || '',
    immediateDebrief: bool(env.IMMEDIATE_DEBRIEF),
    studyClosed: bool(env.STUDY_CLOSED),
    quiet: bool(env.QUIET),
  };
}

export function createApp(config, dbs) {
  const log = config.quiet ? () => {} : (line) => process.stdout.write(line + '\n');

  // --- helpers -------------------------------------------------------------
  const send = (res, status, body, headers = {}) => {
    const h = { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', ...headers };
    res.writeHead(status, h);
    res.end(body);
  };
  const json = (res, status, obj) => send(res, status, JSON.stringify(obj), { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  const error = (res, status, message, details) => json(res, status, { error: message, ...(details ? { details } : {}) });

  const readJson = (req) =>
    new Promise((resolvePromise, reject) => {
      let size = 0;
      let tooLarge = false;
      const chunks = [];
      req.on('data', (c) => {
        size += c.length;
        if (size > MAX_BODY_BYTES) {
          tooLarge = true; // keep draining, stop buffering
          chunks.length = 0;
          return;
        }
        chunks.push(c);
      });
      req.on('end', () => {
        if (tooLarge) return reject(Object.assign(new Error('payload too large'), { status: 413 }));
        try {
          resolvePromise(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {});
        } catch {
          reject(Object.assign(new Error('invalid JSON'), { status: 400 }));
        }
      });
      req.on('error', reject);
    });

  const tokenOk = (req, expected) => {
    if (!expected) return false;
    const header = req.headers.authorization || '';
    const presented = header.startsWith('Bearer ') ? header.slice(7) : '';
    const a = createHash('sha256').update(presented).digest();
    const b = createHash('sha256').update(expected).digest();
    return timingSafeEqual(a, b);
  };

  const nowIso = () => new Date().toISOString();
  const consentTimestamp = () => {
    const d = new Date();
    if (config.consentTimestampPrecision === 'minute') d.setUTCSeconds(0, 0);
    if (config.consentTimestampPrecision === 'hour') d.setUTCMinutes(0, 0, 0);
    return d.toISOString();
  };

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  // --- API handlers --------------------------------------------------------
  async function handleApi(req, res, url) {
    const path = url.pathname;

    if (req.method === 'GET' && path === '/api/config') {
      return json(res, 200, {
        studyClosed: config.studyClosed,
        followupFormUrl: config.followupFormUrl,
        immediateDebrief: config.immediateDebrief,
        immediateDebriefText: config.immediateDebrief ? IMMEDIATE_DEBRIEF : null,
        versions: { instrument: INSTRUMENT_VERSION, consent: CONSENT_VERSION },
        consent: consentPayload(),
        ...publicMaterials(),
      });
    }

    // Consent + session creation. The consent record and the session are written to
    // different databases; the response carries only the session UUID and materials.
    if (req.method === 'POST' && path === '/api/sessions') {
      if (config.studyClosed) return error(res, 403, 'The study is closed to new participants.');
      const body = await readJson(req);
      const v = validateConsent(body);
      if (!v.ok) return error(res, 400, 'Invalid consent record', v.errors);

      recordConsent(dbs, { fullName: v.fullName, consentDate: v.consentDate, recordedAt: consentTimestamp(), consentVersion: CONSENT_VERSION });

      const sessionUuid = randomUUID();
      dbs.study.exec('BEGIN');
      let condition;
      try {
        condition = assignCondition(dbs, config.randomisation);
        createSession(dbs, { sessionUuid, condition, startedAt: nowIso(), instrumentVersion: INSTRUMENT_VERSION, consentVersion: CONSENT_VERSION, randomisation: config.randomisation });
        dbs.study.exec('COMMIT');
      } catch (e) {
        dbs.study.exec('ROLLBACK');
        throw e;
      }
      return json(res, 201, { sessionId: sessionUuid, materials: materialsFor(condition) });
    }

    const m = path.match(/^\/api\/sessions\/([^/]+)\/(materials|submit|withdraw)$/);
    if (m) {
      const [, id, action] = m;
      if (!UUID_RE.test(id)) return error(res, 404, 'Unknown session');
      const session = getSession(dbs, id);
      if (!session) return error(res, 404, 'Unknown session');

      if (action === 'materials' && req.method === 'GET') {
        if (session.status !== 'started') return error(res, 409, 'This session has already ended.');
        return json(res, 200, { materials: materialsFor(session.condition) });
      }
      if (action === 'submit' && req.method === 'POST') {
        if (session.status !== 'started') return error(res, 409, 'This session has already ended.');
        const body = await readJson(req);
        const v = validateSubmission(body);
        if (!v.ok) return error(res, 400, 'Invalid submission', v.errors);
        const ok = submitSession(dbs, id, v.row, nowIso());
        return ok ? json(res, 200, { status: 'submitted' }) : error(res, 409, 'This session has already ended.');
      }
      if (action === 'withdraw' && req.method === 'POST') {
        if (session.status !== 'started') return error(res, 409, 'This session has already ended.');
        const ok = withdrawSession(dbs, id, nowIso());
        return ok ? json(res, 200, { status: 'withdrawn' }) : error(res, 409, 'This session has already ended.');
      }
      return error(res, 405, 'Method not allowed');
    }

    // --- Admin (Bearer token) ------------------------------------------------
    if (path.startsWith('/api/admin/')) {
      const wantsConsent = path === '/api/admin/export/consent.csv';
      if (!tokenOk(req, wantsConsent ? config.consentToken : config.adminToken)) return error(res, 401, 'Unauthorized');
      if (req.method !== 'GET') return error(res, 405, 'Method not allowed');

      if (path === '/api/admin/summary') {
        return json(res, 200, { ...summary(dbs), config: { randomisation: config.randomisation, immediateDebrief: config.immediateDebrief, studyClosed: config.studyClosed, consentTimestampPrecision: config.consentTimestampPrecision }, versions: { instrument: INSTRUMENT_VERSION, consent: CONSENT_VERSION } });
      }
      if (path === '/api/admin/export/sessions.csv' || path === '/api/admin/export/sessions.json') {
        const status = url.searchParams.get('status');
        const rows = allSessions(dbs, { status: ['started', 'submitted', 'withdrawn'].includes(status) ? status : undefined }).map(derive);
        const stamp = nowIso().replace(/[:.]/g, '-');
        if (path.endsWith('.json')) return json(res, 200, rows);
        return send(res, 200, toCsv(rows), { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="threshold_sessions_${stamp}.csv"`, 'Cache-Control': 'no-store' });
      }
      if (wantsConsent) {
        const stamp = nowIso().replace(/[:.]/g, '-');
        return send(res, 200, consentCsv(allConsentRecords(dbs)), { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="threshold_consent_log_${stamp}.csv"`, 'Cache-Control': 'no-store' });
      }
      return error(res, 404, 'Not found');
    }

    return error(res, 404, 'Not found');
  }

  // --- static files --------------------------------------------------------
  function serveStatic(res, relPath) {
    const safe = normalize('/' + relPath).replace(/^(\.\.[/\\])+/, '');
    const file = join(PUBLIC_DIR, safe);
    if (!file.startsWith(PUBLIC_DIR) || !existsSync(file) || !statSync(file).isFile()) return false;
    const ext = extname(file).toLowerCase();
    const body = readFileSync(file);
    send(res, 200, body, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600',
      ...(ext === '.html'
        ? {
            'Content-Security-Policy': "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
            'X-Frame-Options': 'DENY',
          }
        : {}),
    });
    return true;
  }

  return async function handler(req, res) {
    const started = process.hrtime.bigint();
    const url = new URL(req.url, 'http://localhost');
    res.on('finish', () => {
      const ms = Number(process.hrtime.bigint() - started) / 1e6;
      log(`${nowIso()} ${req.method} ${url.pathname} ${res.statusCode} ${ms.toFixed(1)}ms`);
    });
    try {
      if (url.pathname.startsWith('/api/')) return await handleApi(req, res, url);
      if (req.method !== 'GET' && req.method !== 'HEAD') return error(res, 405, 'Method not allowed');
      if (url.pathname === '/') return serveStatic(res, 'index.html');
      if (url.pathname === '/admin') return serveStatic(res, 'admin.html');
      if (url.pathname === '/consent') return send(res, 200, consentPrintHtml(CONSENT_VERSION), { 'Content-Type': 'text/html; charset=utf-8', 'Content-Security-Policy': "default-src 'self'; style-src 'unsafe-inline'; script-src 'unsafe-inline'" });
      if (url.pathname === '/healthz') return json(res, 200, { ok: true });
      if (serveStatic(res, url.pathname)) return;
      return error(res, 404, 'Not found');
    } catch (e) {
      const status = e.status || 500;
      if (status === 500) log(`${nowIso()} ERROR ${req.method} ${url.pathname} ${e.stack || e}`);
      return error(res, status, status === 500 ? 'Internal server error' : e.message);
    }
  };
}

export function startServer(config, dbs) {
  const server = http.createServer(createApp(config, dbs));
  return new Promise((resolvePromise) => server.listen(config.port, () => resolvePromise(server)));
}

export { openDatabases, openInMemory };

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const config = configFromEnv();
  if (!config.adminToken || config.adminToken === 'change-me') {
    process.stderr.write('WARNING: ADMIN_TOKEN is not set (or is the example value). The /admin page and exports are disabled until you set it.\n');
    config.adminToken = '';
    if (!process.env.CONSENT_TOKEN) config.consentToken = '';
  }
  const dbs = openDatabases(config.dataDir);
  const server = await startServer(config, dbs);
  process.stdout.write(`THRESHOLD listening on http://localhost:${server.address().port}  (data: ${resolve(config.dataDir)}, randomisation: ${config.randomisation})\n`);
  const shutdown = () => {
    server.close(() => {
      dbs.study.close();
      dbs.consent.close();
      process.exit(0);
    });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
