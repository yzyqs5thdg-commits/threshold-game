#!/usr/bin/env node
// Verifies a live THRESHOLD deployment end to end without adding a fake response to the dataset:
//   1. /healthz answers
//   2. /api/config serves the instrument
//   3. a session can be created (this writes one consent-log entry named "DEPLOYMENT TEST") and
//      the assigned materials arrive
//   4. the session can be withdrawn (no responses are stored)
//   5. with ADMIN_TOKEN: the admin summary reflects the new withdrawn session and a snapshot can be written
//
//   node scripts/verify-deployment.mjs https://your-service.onrender.com [ADMIN_TOKEN]
//
// Afterwards delete the "DEPLOYMENT TEST" row from the consent log export if you keep that file.

const base = (process.argv[2] || '').replace(/\/$/, '');
const token = process.argv[3] || process.env.ADMIN_TOKEN || '';
if (!base) {
  console.error('usage: node scripts/verify-deployment.mjs <base-url> [admin-token]');
  process.exit(2);
}

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
};
const getJson = async (path, opts = {}) => {
  const res = await fetch(base + path, opts);
  let body = null;
  try { body = await res.json(); } catch { /* not json */ }
  return { status: res.status, body, headers: res.headers };
};

try {
  const h = await getJson('/healthz');
  check('health check', h.status === 200 && h.body?.ok === true, `status ${h.status}`);

  const c = await getJson('/api/config');
  check('instrument served', c.status === 200 && c.body?.consent?.title === 'Decision-Making in Organizational Risk Scenarios', `instrument ${c.body?.versions?.instrument ?? '?'}, consent ${c.body?.versions?.consent ?? '?'}`);
  check('HTTPS in use', base.startsWith('https://'), base.startsWith('https://') ? '' : 'participants must use an https:// link');
  check('study open', c.body?.studyClosed === false, c.body?.studyClosed ? 'STUDY_CLOSED is true' : '');
  check('follow-up form configured', !!c.body?.followupFormUrl, c.body?.followupFormUrl ? '' : 'FOLLOWUP_FORM_URL is empty (link hidden after submit)');

  let summaryBefore = null;
  if (token) {
    const s = await getJson('/api/admin/summary', { headers: { Authorization: `Bearer ${token}` } });
    check('admin token accepted', s.status === 200, `status ${s.status}`);
    summaryBefore = s.body;
  }

  const created = await getJson('/api/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fullName: 'DEPLOYMENT TEST', consentDate: new Date().toISOString().slice(0, 10) }) });
  const sid = created.body?.sessionId;
  check('session created after consent', created.status === 201 && /^[0-9a-f-]{36}$/.test(sid || ''), `status ${created.status}`);
  check('materials delivered for one condition only', Array.isArray(created.body?.materials?.scenarios) && created.body.materials.scenarios.length === 4 && typeof created.body.materials.briefing === 'string' && !('condition' in (created.body || {})));

  if (sid) {
    const w = await getJson(`/api/sessions/${sid}/withdraw`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    check('withdraw recorded (no responses stored)', w.status === 200 && w.body?.status === 'withdrawn', `status ${w.status}`);
    const again = await getJson(`/api/sessions/${sid}/submit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    check('ended session refuses a submission', again.status === 409, `status ${again.status}`);
  }

  if (token && summaryBefore) {
    const s = await getJson('/api/admin/summary', { headers: { Authorization: `Bearer ${token}` } });
    const grew = (s.body?.totals?.withdrawn ?? 0) === (summaryBefore.totals?.withdrawn ?? 0) + 1 && (s.body?.consentCount ?? 0) === (summaryBefore.consentCount ?? 0) + 1;
    check('database persisted the session and the consent record', grew, `withdrawn ${summaryBefore.totals?.withdrawn} → ${s.body?.totals?.withdrawn}, consent ${summaryBefore.consentCount} → ${s.body?.consentCount}`);
    const snap = await getJson('/api/admin/snapshot', { headers: { Authorization: `Bearer ${token}` } });
    check('snapshot export written on the server disk', snap.status === 200 && !!snap.body?.sessionsPath, snap.body?.sessionsPath || `status ${snap.status}`);
    const csv = await fetch(base + '/api/admin/export/sessions.csv', { headers: { Authorization: `Bearer ${token}` } });
    const text = await csv.text();
    check('sessions export has no names', csv.status === 200 && text.startsWith('session_uuid,') && !text.includes('DEPLOYMENT TEST'));
  } else if (!token) {
    console.log('note: pass the ADMIN_TOKEN as the second argument to also verify persistence, snapshots and exports');
  }
} catch (e) {
  check('request failed', false, e.message);
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
