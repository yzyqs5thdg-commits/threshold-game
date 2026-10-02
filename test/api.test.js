import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp, openInMemory } from '../server/index.js';
import http from 'node:http';

let server, base, dbs;

const config = {
  port: 0,
  adminToken: 'admin-secret',
  consentToken: 'consent-secret',
  randomisation: 'block',
  consentTimestampPrecision: 'hour',
  followupFormUrl: 'https://forms.example/x',
  immediateDebrief: false,
  studyClosed: false,
  quiet: true,
};

before(async () => {
  dbs = openInMemory();
  server = http.createServer(createApp(config, dbs));
  await new Promise((r) => server.listen(0, r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

const req = async (path, { method = 'GET', body, token } = {}) => {
  const res = await fetch(base + path, {
    method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* not json */ }
  return { status: res.status, json, text, headers: res.headers };
};

const payload = () => ({
  clientConsentAt: '2026-10-02T10:00:00Z',
  clientMcAt: '2026-10-02T10:04:30Z',
  profile: { education: "Master's", job_function: 'ERM', years_experience: '5–9', seniority: 'Manager', industry: 'Consulting' },
  style: { rp_1: 4, rp_2: 2, rp_3: 3 },
  decisions: [1, 2, 3, 4].map((id) => ({ scenarioId: id, choice: 'decrease', confidence: 3, latency: 5.5, latencyFirst: 5.5, hidden: false })),
  attention: { choice: 'maintain', latency: 3 },
  manipulation: { mc_uncertainty: 1, mc_framing: 2 },
});

test('config is public and contains no condition-specific text', async () => {
  const r = await req('/api/config');
  assert.equal(r.status, 200);
  assert.equal(r.json.consent.title, 'Decision-Making in Organizational Risk Scenarios');
  assert.ok(!r.text.includes('12%'));
  assert.ok(!r.text.includes('cannot put a reliable number'));
});

test('session creation records consent separately and returns only assigned materials', async () => {
  const r = await req('/api/sessions', { method: 'POST', body: { fullName: 'Pat Example', consentDate: '2026-10-02' } });
  assert.equal(r.status, 201);
  assert.match(r.json.sessionId, /^[0-9a-f-]{36}$/);
  assert.ok(!('condition' in r.json), 'condition letter is not sent to the client');
  const hasNumbers = r.json.materials.scenarios.every((s) => /\d+%/.test(s.framing));
  const epistemic = r.json.materials.briefing.includes('cannot put a reliable number');
  assert.equal(hasNumbers, !epistemic, 'briefing and scenario framing come from the same condition');

  const consent = dbs.consent.prepare('SELECT * FROM consent_log').all();
  assert.equal(consent.length, 1);
  assert.equal(consent[0].full_name, 'Pat Example');
  assert.match(consent[0].recorded_at, /T\d{2}:00:00\.000Z$/, 'hour precision applied');
  assert.ok(!Object.keys(consent[0]).some((k) => /session|uuid/i.test(k)), 'consent log has no session column');
});

test('invalid consent is rejected and nothing is written', async () => {
  const before = dbs.consent.prepare('SELECT COUNT(*) n FROM consent_log').get().n;
  const r = await req('/api/sessions', { method: 'POST', body: { fullName: 'X', consentDate: 'today' } });
  assert.equal(r.status, 400);
  assert.equal(dbs.consent.prepare('SELECT COUNT(*) n FROM consent_log').get().n, before);
});

test('block randomisation gives each condition once per four sessions', async () => {
  dbs.study.exec('DELETE FROM sessions; DELETE FROM meta;');
  for (let i = 0; i < 8; i++) await req('/api/sessions', { method: 'POST', body: { fullName: 'Block Tester', consentDate: '2026-10-02' } });
  const rows = dbs.study.prepare('SELECT condition FROM sessions ORDER BY rowid').all().map((r) => r.condition);
  assert.deepEqual(rows.slice(0, 4).sort(), ['A', 'B', 'C', 'D']);
  assert.deepEqual(rows.slice(4, 8).sort(), ['A', 'B', 'C', 'D']);
});

test('submit stores responses once; second submit and withdraw are refused', async () => {
  const s = await req('/api/sessions', { method: 'POST', body: { fullName: 'Sub Mitter', consentDate: '2026-10-02' } });
  const id = s.json.sessionId;
  const bad = await req(`/api/sessions/${id}/submit`, { method: 'POST', body: { ...payload(), manipulation: {} } });
  assert.equal(bad.status, 400);
  assert.ok(Array.isArray(bad.json.details));

  const ok = await req(`/api/sessions/${id}/submit`, { method: 'POST', body: payload() });
  assert.equal(ok.status, 200);
  const row = dbs.study.prepare('SELECT * FROM sessions WHERE session_uuid = ?').get(id);
  assert.equal(row.status, 'submitted');
  assert.equal(row.dec_1, -1);
  assert.equal(row.duration_sec, 270);
  assert.equal(row.attn_response, 0);

  assert.equal((await req(`/api/sessions/${id}/submit`, { method: 'POST', body: payload() })).status, 409);
  assert.equal((await req(`/api/sessions/${id}/withdraw`, { method: 'POST', body: {} })).status, 409);
  assert.equal((await req(`/api/sessions/${id}/materials`)).status, 409);
});

test('withdraw marks the session withdrawn and stores no responses', async () => {
  const s = await req('/api/sessions', { method: 'POST', body: { fullName: 'With Drawer', consentDate: '2026-10-02' } });
  const id = s.json.sessionId;
  const r = await req(`/api/sessions/${id}/withdraw`, { method: 'POST', body: {} });
  assert.equal(r.status, 200);
  const row = dbs.study.prepare('SELECT * FROM sessions WHERE session_uuid = ?').get(id);
  assert.equal(row.status, 'withdrawn');
  assert.equal(row.dec_1, null);
  assert.equal(row.raw_json, null);
  assert.equal((await req(`/api/sessions/${id}/submit`, { method: 'POST', body: payload() })).status, 409);
});

test('unknown or malformed session ids are 404', async () => {
  assert.equal((await req('/api/sessions/not-a-uuid/materials')).status, 404);
  assert.equal((await req('/api/sessions/00000000-0000-4000-8000-000000000000/materials')).status, 404);
});

test('oversized and malformed bodies are rejected', async () => {
  assert.equal((await req('/api/sessions', { method: 'POST', body: '{not json' })).status, 400);
  const huge = JSON.stringify({ fullName: 'x'.repeat(70 * 1024), consentDate: '2026-10-02' });
  assert.equal((await req('/api/sessions', { method: 'POST', body: huge })).status, 413);
});

test('admin endpoints require the right token; consent export needs the consent token', async () => {
  assert.equal((await req('/api/admin/summary')).status, 401);
  assert.equal((await req('/api/admin/summary', { token: 'wrong' })).status, 401);
  const s = await req('/api/admin/summary', { token: 'admin-secret' });
  assert.equal(s.status, 200);
  assert.ok(s.json.totals.submitted >= 1);

  const csv = await req('/api/admin/export/sessions.csv', { token: 'admin-secret' });
  assert.equal(csv.status, 200);
  assert.match(csv.headers.get('content-type'), /text\/csv/);
  assert.ok(csv.text.startsWith('session_uuid,condition,'));
  assert.ok(!/Pat Example|Sub Mitter|With Drawer/.test(csv.text), 'session export contains no names');

  const onlySubmitted = await req('/api/admin/export/sessions.csv?status=submitted', { token: 'admin-secret' });
  assert.ok(!onlySubmitted.text.includes(',withdrawn,'));

  assert.equal((await req('/api/admin/export/consent.csv', { token: 'admin-secret' })).status, 401);
  const consent = await req('/api/admin/export/consent.csv', { token: 'consent-secret' });
  assert.equal(consent.status, 200);
  assert.ok(consent.text.includes('Pat Example'));
  assert.ok(!/[0-9a-f]{8}-[0-9a-f]{4}-4/.test(consent.text), 'consent export contains no session UUIDs');
});

test('static files are served safely and the page carries a CSP', async () => {
  const index = await req('/');
  assert.equal(index.status, 200);
  assert.match(index.headers.get('content-security-policy'), /default-src 'self'/);
  assert.equal((await req('/app.js')).status, 200);
  assert.equal((await req('/consent')).status, 200);
  assert.equal((await req('/admin')).status, 200);
  assert.equal((await req('/..%2f..%2fserver%2findex.js')).status, 404);
  assert.equal((await req('/server/index.js')).status, 404);
  assert.equal((await req('/nope.html')).status, 404);
});

test('a closed study refuses new sessions', async () => {
  const closedDbs = openInMemory();
  const closed = http.createServer(createApp({ ...config, studyClosed: true }, closedDbs));
  await new Promise((r) => closed.listen(0, r));
  const res = await fetch(`http://127.0.0.1:${closed.address().port}/api/sessions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fullName: 'Late Comer', consentDate: '2026-10-02' }) });
  assert.equal(res.status, 403);
  closed.close();
});
