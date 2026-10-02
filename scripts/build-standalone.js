// Builds dist/threshold-standalone.html: the whole game in one file with no server.
// Used for previewing and playing the instrument (e.g. as a hosted artifact). It runs the same
// client code and the same study text as the real deployment; the network layer is replaced by
// an in-browser store, a researcher preview bar is added, and the session record is shown at
// the end. It records nothing anywhere. Not for data collection.
//
//   node scripts/build-standalone.js

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(resolve(root, p), 'utf8');

// Turn an ES module source into plain script text sharing one scope.
const demodule = (src) =>
  src
    .replace(/^import .*?;$/gm, '')
    .replace(/^export \{[^}]*\};?$/gm, '')
    .replace(/^export (const|let|function|async function) /gm, '$1 ');

const content = demodule(read('server/content.js'));
const consent = demodule(read('server/consent.js')).replace(/\besc\b/g, 'escConsent'); // avoid clashing with the client's esc()
const validate = demodule(read('server/validate.js'));
const exporter = demodule(read('server/export.js'));
const appJs = read('public/app.js');
const css = read('public/styles.css');

const extraCss = `
/* standalone preview additions */
.preview { background: #fff7e6; border-bottom: 1px solid #f0dcb0; color: #5a4a1e; font-size: 0.88rem; }
.preview__inner { max-width: 760px; margin: 0 auto; padding: 10px 16px; display: flex; flex-wrap: wrap; gap: 8px 18px; align-items: center; }
.preview__inner strong { font-weight: 650; }
.preview label { display: inline-flex; align-items: center; gap: 6px; }
.preview select { font: inherit; padding: 4px 8px; border-radius: 8px; border: 1px solid #d8c48f; background: #fff; color: inherit; }
.record { margin-top: 16px; }
.record table { width: 100%; border-collapse: collapse; font-size: 0.9rem; font-variant-numeric: tabular-nums; }
.record th, .record td { text-align: left; padding: 6px 8px; border-bottom: 1px solid var(--line); vertical-align: top; }
.record th { color: var(--ink-3); font-weight: 600; width: 42%; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 0.82rem; }
.record__wrap { overflow-x: auto; }
.record .pill { display: inline-block; background: #e9effa; color: var(--steel); border-radius: 999px; padding: 2px 10px; font-weight: 600; font-size: 0.85rem; }
`;

const glue = `
// ---------------------------------------------------------------------------
// Standalone glue: in-browser replacement for the server
// ---------------------------------------------------------------------------
const CONDITION_NAMES = { A: 'Epistemic + Gain', B: 'Epistemic + Loss', C: 'Aleatory + Gain', D: 'Aleatory + Loss' };
const store = { sessions: new Map(), consentLog: [] };
let lastRecord = null;

const localConfig = {
  studyClosed: false,
  followupFormUrl: '',
  immediateDebrief: false,
  immediateDebriefText: null,
  versions: { instrument: INSTRUMENT_VERSION + '+standalone', consent: CONSENT_VERSION },
  consent: consentPayload(),
  ...publicMaterials(),
};

const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => { const r = (Math.random() * 16) | 0; return (c === 'x' ? r : (r & 3) | 8).toString(16); }));
const fail = (status, message, details) => { const e = new Error(message); e.status = status; e.details = details; throw e; };

function pickCondition() {
  const sel = document.getElementById('preview-condition');
  const v = sel ? sel.value : 'random';
  if (['A', 'B', 'C', 'D'].includes(v)) return v;
  const a = new Uint32Array(1); crypto.getRandomValues(a);
  return ['A', 'B', 'C', 'D'][a[0] % 4];
}

window.__THRESHOLD_HOOKS__ = {
  async api(path, { method = 'GET', body } = {}) {
    await new Promise((r) => setTimeout(r, 120)); // a little network latency, for realism
    if (path === '/api/config') return localConfig;
    if (path === '/api/sessions' && method === 'POST') {
      const v = validateConsent(body);
      if (!v.ok) fail(400, 'Invalid consent record', v.errors);
      store.consentLog.push({ full_name: v.fullName, consent_date: v.consentDate, recorded_at: new Date().toISOString(), consent_version: CONSENT_VERSION });
      const sessionUuid = uuid();
      const condition = pickCondition();
      store.sessions.set(sessionUuid, { session_uuid: sessionUuid, condition, status: 'started', started_at: new Date().toISOString(), instrument_version: localConfig.versions.instrument, consent_version: CONSENT_VERSION, randomisation: 'simple' });
      return { sessionId: sessionUuid, materials: materialsFor(condition) };
    }
    const m = path.match(/^\\/api\\/sessions\\/([^/]+)\\/(materials|submit|withdraw)$/);
    if (m) {
      const s = store.sessions.get(m[1]);
      if (!s) fail(404, 'Unknown session');
      if (s.status !== 'started') fail(409, 'This session has already ended.');
      if (m[2] === 'materials') return { materials: materialsFor(s.condition) };
      if (m[2] === 'submit') {
        const v = validateSubmission(body);
        if (!v.ok) fail(400, 'Invalid submission', v.errors);
        Object.assign(s, v.row, { status: 'submitted', ended_at: new Date().toISOString() });
        lastRecord = derive(s);
        return { status: 'submitted' };
      }
      if (m[2] === 'withdraw') { Object.assign(s, { status: 'withdrawn', ended_at: new Date().toISOString() }); lastRecord = null; return { status: 'withdrawn' }; }
    }
    fail(404, 'Not found');
  },

  afterRender(screen, appEl) {
    if (screen === 'submitted' && lastRecord) {
      const r = lastRecord;
      const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
      const rows = EXPORT_COLUMNS.filter((k) => r[k] !== null && r[k] !== undefined && r[k] !== '')
        .map((k) => '<tr><th>' + escapeHtml(k) + '</th><td>' + escapeHtml(r[k]) + '</td></tr>').join('');
      const card = document.createElement('div');
      card.className = 'card record';
      card.innerHTML =
        '<p class="kicker">Researcher preview</p>' +
        '<h2>Session record</h2>' +
        '<p class="muted small">This is what the server would have stored for this session, with the derived variables from the data dictionary. Nothing was sent anywhere. You played condition <span class="pill">' + r.condition + ' · ' + CONDITION_NAMES[r.condition] + '</span></p>' +
        '<div class="record__wrap"><table><tbody>' + rows + '</tbody></table></div>' +
        '<div class="actions"><button type="button" class="btn" id="play-again">Play again</button></div>';
      appEl.appendChild(card);
      document.getElementById('play-again').addEventListener('click', restart);
    }
    if (screen === 'withdrawn' || screen === 'declined') {
      const div = document.createElement('div');
      div.className = 'card';
      div.innerHTML = '<p class="kicker">Researcher preview</p><p class="muted small">Nothing was recorded for this session.</p><div class="actions"><button type="button" class="btn" id="play-again">Play again</button></div>';
      appEl.appendChild(div);
      document.getElementById('play-again').addEventListener('click', restart);
    }
  },
};

function restart() {
  try { sessionStorage.removeItem('threshold.session.v1'); } catch {}
  location.reload();
}

document.getElementById('preview-debrief').addEventListener('change', (e) => {
  localConfig.immediateDebrief = e.target.checked;
  localConfig.immediateDebriefText = e.target.checked ? IMMEDIATE_DEBRIEF : null;
});
`;

const html = `<title>THRESHOLD</title>
<style>
${css}
${extraCss}
</style>
<a class="skip" href="#app">Skip to content</a>
<header class="topbar">
  <div class="topbar__inner">
    <div class="brand">
      <span class="brand__mark" aria-hidden="true"></span>
      <span class="brand__name">Meridian Group</span>
      <span class="brand__sep" aria-hidden="true">·</span>
      <span class="brand__app">THRESHOLD</span>
    </div>
    <div class="progress" role="progressbar" aria-label="Session progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
      <div class="progress__fill" id="progress-fill"></div>
    </div>
  </div>
</header>
<div class="preview" role="region" aria-label="Researcher preview controls">
  <div class="preview__inner">
    <span><strong>Researcher preview.</strong> Runs entirely in your browser; nothing is recorded or sent.</span>
    <label for="preview-condition">Condition for the next session
      <select id="preview-condition">
        <option value="random" selected>Random (as in the study)</option>
        <option value="A">A · Epistemic + Gain</option>
        <option value="B">B · Epistemic + Loss</option>
        <option value="C">C · Aleatory + Gain</option>
        <option value="D">D · Aleatory + Loss</option>
      </select>
    </label>
    <label><input type="checkbox" id="preview-debrief"> Show immediate debrief (Appendix C.2) on the closing screen</label>
  </div>
</div>
<main id="app" class="app" tabindex="-1">
  <div class="card card--center"><p class="muted">Loading…</p></div>
</main>
<footer class="footer">
  <p>Columbia University IRB-ACYY3579 · Questions: CU_ERM_Research@columbia.edu</p>
</footer>
<script type="module">
${content}
${consent}
${validate}
${exporter}
${glue}
${appJs}
</script>
`;

mkdirSync(resolve(root, 'dist'), { recursive: true });
const out = resolve(root, 'dist/threshold-standalone.html');
writeFileSync(out, html);
process.stdout.write(`${out} (${(Buffer.byteLength(html) / 1024).toFixed(0)} KB)\n`);
