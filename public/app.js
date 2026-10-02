// THRESHOLD client. Plain ES module, no build step, no third-party requests.
//
// Flow (Protocol v1.3 §6):
//   consent -> profile -> decision-making style -> analyst briefing ->
//   scenario 1 -> scenario 2 -> internal review (data-quality item) -> scenario 3 -> scenario 4 ->
//   end-of-day questions (manipulation check) -> closing screen (submit / withdraw) -> done
//
// All responses are held in this tab (sessionStorage) until the participant chooses
// "Submit my responses" on the closing screen. Only then is anything beyond the session's
// existence sent to the server. Choosing "Withdraw" discards everything.

const STORAGE_KEY = 'threshold.session.v1';
const app = document.getElementById('app');
const progressFill = document.getElementById('progress-fill');
const progressBar = document.querySelector('.progress');

const TOTAL_STEPS = 11; // consent, profile, style, briefing, 5 items, end-of-day, closing

// Optional hooks used by the standalone (no-server) build: a replacement for the network
// layer and a callback after each screen renders. Absent in the normal deployment.
const hooks = window.__THRESHOLD_HOOKS__ || {};

let config = null;
let state = loadState() || freshState();

// Per-screen volatile timing (never persisted; reset whenever an item is (re)rendered).
let itemShownAt = null;
let itemHidden = false;
let firstChoiceAt = null;
let lastChoiceAt = null;

function freshState() {
  return {
    screen: 'consent',
    sessionId: null,
    materials: null,
    clientConsentAt: null,
    profile: {},
    style: {},
    itemIndex: 0,
    decisions: [], // { scenarioId, choice, confidence, latency, latencyFirst, hidden }
    attention: null, // { choice, latency }
    manipulation: {},
    clientMcAt: null,
  };
}

function loadState() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || typeof s !== 'object' || !s.screen) return null;
    if (['submitted', 'withdrawn', 'declined'].includes(s.screen)) return null;
    return s;
  } catch {
    return null;
  }
}

function saveState() {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable: the session simply cannot survive a refresh */
  }
}

function clearState() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const paragraphs = (arr, cls = '') => arr.map((p) => `<p${cls ? ` class="${cls}"` : ''}>${esc(p)}</p>`).join('');
const todayIso = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

async function api(path, { method = 'GET', body } = {}) {
  if (hooks.api) return hooks.api(path, { method, body });
  const res = await fetch(path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'omit',
    cache: 'no-store',
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON */
  }
  if (!res.ok) {
    const err = new Error(data?.error || `Request failed (${res.status})`);
    err.status = res.status;
    err.details = data?.details;
    throw err;
  }
  return data;
}

function setProgress(step) {
  const pct = Math.round((step / TOTAL_STEPS) * 100);
  progressFill.style.width = `${pct}%`;
  progressBar.setAttribute('aria-valuenow', String(pct));
}

function render(html, { step, focus = true } = {}) {
  app.innerHTML = html;
  if (typeof step === 'number') setProgress(step);
  window.scrollTo(0, 0);
  if (focus) {
    const h = app.querySelector('h1, h2');
    if (h) {
      h.setAttribute('tabindex', '-1');
      h.focus({ preventScroll: true });
    }
  }
  hooks.afterRender?.(state.screen, app, state);
}

function go(screen, patch = {}) {
  Object.assign(state, patch, { screen });
  saveState();
  show();
}

function showError(container, message) {
  let box = container.querySelector('.alert--error');
  if (!box) {
    box = document.createElement('div');
    box.className = 'alert alert--error';
    box.setAttribute('role', 'alert');
    container.prepend(box);
  }
  box.textContent = message;
}

// ---------------------------------------------------------------------------
// Item sequence: scenarios 1–2, data-quality item, scenarios 3–4
// ---------------------------------------------------------------------------
function itemSequence() {
  const m = state.materials;
  const [s1, s2, s3, s4] = m.scenarios;
  return [
    { kind: 'scenario', data: s1 },
    { kind: 'scenario', data: s2 },
    { kind: 'attention', data: m.attentionCheck },
    { kind: 'scenario', data: s3 },
    { kind: 'scenario', data: s4 },
  ];
}

// ---------------------------------------------------------------------------
// Screens
// ---------------------------------------------------------------------------
function show() {
  switch (state.screen) {
    case 'consent': return renderConsent();
    case 'declined': return renderDeclined();
    case 'profile': return renderProfile();
    case 'style': return renderStyle();
    case 'briefing': return renderBriefing();
    case 'item': return renderItem();
    case 'manipulation': return renderManipulation();
    case 'closing': return renderClosing();
    case 'submitted': return renderSubmitted();
    case 'withdrawn': return renderWithdrawn();
    default:
      state = freshState();
      saveState();
      return renderConsent();
  }
}

function renderClosed() {
  render(`
    <div class="card">
      <h1>This study is now closed</h1>
      <p>Thank you for your interest. Data collection for this study has finished and no new sessions can be started.</p>
      <p class="contact">Questions: Jana Chamsi Bacha and Meher Jain, CU_ERM_Research@columbia.edu.</p>
    </div>`, { step: 0 });
}

function renderConsent() {
  const c = config.consent;
  render(`
    <div class="card">
      <p class="kicker">Research study · Columbia University IRB-ACYY3579</p>
      <h1>${esc(c.title)}</h1>
      <p class="muted">${esc(c.subtitle)}. Please read the information below before deciding whether to take part. You can also <a href="/consent" target="_blank" rel="noopener">open a printable copy</a>.</p>

      <div class="consent-doc" tabindex="0" aria-label="Consent form text">
        ${c.sections.map((s) => `<h3>${esc(s.heading)}</h3>${paragraphs(s.body)}`).join('')}
      </div>

      <p class="statement">${esc(c.statement)}</p>

      <form id="consent-form" novalidate>
        <div class="grid-2">
          <div class="field">
            <label for="fullName">Full name (your electronic signature)</label>
            <input id="fullName" name="fullName" type="text" autocomplete="name" required maxlength="200">
          </div>
          <div class="field">
            <label for="consentDate">Date</label>
            <input id="consentDate" name="consentDate" type="date" required value="${todayIso()}">
          </div>
        </div>
        <div class="actions">
          <button type="submit" class="btn" id="agree">${esc(c.agreeLabel)}</button>
          <button type="button" class="btn btn--secondary" id="decline">${esc(c.declineLabel)}</button>
        </div>
      </form>
    </div>`, { step: 0 });

  const form = document.getElementById('consent-form');
  document.getElementById('decline').addEventListener('click', () => go('declined'));
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fullName = form.fullName.value.trim();
    const consentDate = form.consentDate.value;
    let bad = false;
    for (const [el, ok] of [[form.fullName, fullName.length >= 2], [form.consentDate, /^\d{4}-\d{2}-\d{2}$/.test(consentDate)]]) {
      el.closest('.field').classList.toggle('field--invalid', !ok);
      if (!ok) bad = true;
    }
    if (bad) return showError(form, 'Please type your full name and the date to sign the consent form.');

    const agree = document.getElementById('agree');
    agree.disabled = true;
    agree.textContent = 'Starting…';
    const clientConsentAt = new Date().toISOString(); // start of the 90-second clock
    try {
      const data = await api('/api/sessions', { method: 'POST', body: { fullName, consentDate } });
      go('profile', { sessionId: data.sessionId, materials: data.materials, clientConsentAt });
    } catch (err) {
      agree.disabled = false;
      agree.textContent = c.agreeLabel;
      if (err.status === 403) return renderClosed();
      showError(form, 'We could not start your session. Please check your connection and try again.');
    }
  });
}

function renderDeclined() {
  clearState();
  render(`
    <div class="card">
      <h1>Thank you</h1>
      <p>You have chosen not to take part. No information has been recorded. You may close this window.</p>
      <p class="contact">Questions about the study: Jana Chamsi Bacha and Meher Jain, CU_ERM_Research@columbia.edu.</p>
    </div>`, { step: 0 });
}

function renderProfile() {
  const items = config.profileItems;
  render(`
    <div class="card">
      <p class="kicker">Meridian Group · Executive onboarding</p>
      <h1>Your CRO profile</h1>
      <p class="muted">Welcome to Meridian Group. Before your first day begins, please complete your profile. These questions describe participants in aggregate only.</p>
      <form id="profile-form" novalidate>
        ${items.map((it) => `
          <div class="field" data-field="${esc(it.id)}">
            <label for="${esc(it.id)}">${esc(it.label)}</label>
            <select id="${esc(it.id)}" name="${esc(it.id)}" required>
              <option value="">Select…</option>
              ${it.options.map((o) => `<option value="${esc(o)}" ${state.profile[it.id] === o ? 'selected' : ''}>${esc(o)}</option>`).join('')}
            </select>
          </div>`).join('')}
        <div class="actions actions--end">
          <button type="submit" class="btn">Continue</button>
        </div>
      </form>
    </div>`, { step: 1 });

  const form = document.getElementById('profile-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const profile = {};
    let bad = false;
    for (const it of items) {
      const v = form[it.id].value;
      const ok = it.options.includes(v);
      form.querySelector(`[data-field="${it.id}"]`).classList.toggle('field--invalid', !ok);
      if (!ok) bad = true;
      else profile[it.id] = v;
    }
    if (bad) return showError(form, 'Please answer every question to continue.');
    go('style', { profile });
  });
}

function likert(name, selected) {
  const labels = ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'];
  return `<div class="likert">${[1, 2, 3, 4, 5].map((n) => `
    <label><input type="radio" name="${esc(name)}" value="${n}" ${selected === n ? 'checked' : ''}><span class="n">${n}</span><span class="t">${labels[n - 1]}</span></label>`).join('')}</div>`;
}

function renderStyle() {
  const s = config.style;
  render(`
    <div class="card">
      <p class="kicker">Meridian Group · Executive onboarding</p>
      <h1>${esc(s.heading)}</h1>
      <p class="muted">${esc(s.instruction)}</p>
      <form id="style-form" novalidate>
        ${s.items.map((it) => `
          <fieldset class="field" data-field="${esc(it.id)}">
            <legend>${esc(it.text)}</legend>
            ${likert(it.id, state.style[it.id])}
          </fieldset>`).join('')}
        <div class="actions actions--end">
          <button type="submit" class="btn">Continue</button>
        </div>
      </form>
    </div>`, { step: 2 });

  const form = document.getElementById('style-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const style = {};
    let bad = false;
    for (const it of s.items) {
      const v = Number(form.querySelector(`input[name="${it.id}"]:checked`)?.value);
      const ok = Number.isInteger(v) && v >= 1 && v <= 5;
      form.querySelector(`[data-field="${it.id}"]`).classList.toggle('field--invalid', !ok);
      if (!ok) bad = true;
      else style[it.id] = v;
    }
    if (bad) return showError(form, 'Please rate every statement to continue.');
    go('briefing', { style });
  });
}

function renderBriefing() {
  const m = state.materials;
  const initials = m.organisation.analyst.replace(/^Dr\.\s*/, '').slice(0, 1).toUpperCase();
  render(`
    <div class="card">
      <p class="kicker">Meridian Group · Day one</p>
      <h1>Briefing from the strategy desk</h1>
      <div class="analyst">
        <div class="avatar" aria-hidden="true">${esc(initials)}</div>
        <div>
          <div class="analyst__meta"><span class="analyst__name">${esc(m.organisation.analyst)}</span> · ${esc(m.organisation.analystTitle)}</div>
          <div class="speech">${esc(m.briefing)}</div>
        </div>
      </div>
      <p class="muted mt-18">Over the course of today you will face a series of situations from across the group. For each one, decide how Meridian Group’s risk exposure should change.</p>
      <div class="actions actions--end">
        <button type="button" class="btn" id="begin">Begin the day</button>
      </div>
    </div>`, { step: 3 });
  document.getElementById('begin').addEventListener('click', () => go('item', { itemIndex: 0 }));
}

function onVisibility() {
  if (document.visibilityState === 'hidden') itemHidden = true;
}

function renderItem() {
  const seq = itemSequence();
  const idx = state.itemIndex;
  if (idx >= seq.length) return go('manipulation');
  const { kind, data } = seq[idx];
  const m = state.materials;

  render(`
    <div class="card scenario">
      <div class="eyebrow"><span class="tag">${esc(data.domain)}</span><span class="counter">${idx + 1} of ${seq.length}</span></div>
      <h1>${esc(data.title)}</h1>
      <div class="scenario__body">
        <p>${esc(data.context)}</p>
        <p>${esc(data.framing)}</p>
      </div>
      <div class="decision">
        <h2 class="small" id="decision-label">Your decision</h2>
        <div class="options" role="group" aria-labelledby="decision-label">
          ${m.decisionOptions.map((o) => `<button type="button" class="option" data-value="${esc(o.value)}" aria-pressed="false">${esc(o.label)}</button>`).join('')}
        </div>
      </div>
      <form id="confidence" class="confidence" hidden novalidate>
        <fieldset class="field" data-field="confidence">
          <legend>${esc(m.confidence.question)}</legend>
          <div class="likert">${[1, 2, 3, 4, 5].map((n) => `
            <label><input type="radio" name="confidence" value="${n}"><span class="n">${n}</span><span class="t">${n === 1 ? esc(m.confidence.anchors.low) : n === 5 ? esc(m.confidence.anchors.high) : ''}</span></label>`).join('')}</div>
        </fieldset>
        <div class="actions actions--end">
          <button type="submit" class="btn">Continue</button>
        </div>
      </form>
    </div>`, { step: 4 + idx });

  // Latency clock starts when the scenario is painted.
  itemShownAt = performance.now();
  itemHidden = document.visibilityState === 'hidden';
  firstChoiceAt = null;
  lastChoiceAt = null;
  document.removeEventListener('visibilitychange', onVisibility);
  document.addEventListener('visibilitychange', onVisibility);

  let choice = null;
  const options = [...app.querySelectorAll('.option')];
  const confidenceForm = document.getElementById('confidence');

  for (const btn of options) {
    btn.addEventListener('click', () => {
      const t = performance.now();
      if (firstChoiceAt === null) firstChoiceAt = t;
      lastChoiceAt = t;
      choice = btn.dataset.value;
      for (const b of options) b.setAttribute('aria-pressed', String(b === btn));
      if (confidenceForm.hidden) {
        confidenceForm.hidden = false;
        confidenceForm.querySelector('legend').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }

  confidenceForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const conf = Number(confidenceForm.querySelector('input[name="confidence"]:checked')?.value);
    const ok = Number.isInteger(conf) && conf >= 1 && conf <= 5 && choice;
    confidenceForm.querySelector('[data-field="confidence"]').classList.toggle('field--invalid', !ok);
    if (!ok) return showError(confidenceForm, 'Please rate your confidence to continue.');

    const latency = (lastChoiceAt - itemShownAt) / 1000;
    const latencyFirst = (firstChoiceAt - itemShownAt) / 1000;
    document.removeEventListener('visibilitychange', onVisibility);

    if (kind === 'scenario') {
      const decisions = state.decisions.filter((d) => d.scenarioId !== data.id);
      decisions.push({ scenarioId: data.id, choice, confidence: conf, latency, latencyFirst, hidden: itemHidden });
      go('item', { decisions, itemIndex: idx + 1 });
    } else {
      // Data-quality item: response recorded, confidence not analysed, not scored.
      go('item', { attention: { choice, latency, confidence: conf }, itemIndex: idx + 1 });
    }
  });
}

function renderManipulation() {
  const mc = state.materials.manipulationCheck;
  render(`
    <div class="card">
      <p class="kicker">Meridian Group · Day one</p>
      <h1>${esc(mc.heading)}</h1>
      <p class="muted">${esc(mc.intro)}</p>
      <form id="mc-form" novalidate>
        ${mc.items.map((it) => `
          <fieldset class="field" data-field="${esc(it.id)}">
            <legend>${esc(it.question)}</legend>
            <div class="choices">
              ${it.options.map((o) => `<label><input type="radio" name="${esc(it.id)}" value="${o.value}" ${state.manipulation[it.id] === o.value ? 'checked' : ''}><span>${esc(o.label)}</span></label>`).join('')}
            </div>
          </fieldset>`).join('')}
        <div class="actions actions--end">
          <button type="submit" class="btn">Continue</button>
        </div>
      </form>
    </div>`, { step: 9 });

  const form = document.getElementById('mc-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const manipulation = {};
    let bad = false;
    for (const it of mc.items) {
      const v = Number(form.querySelector(`input[name="${it.id}"]:checked`)?.value);
      const ok = it.options.some((o) => o.value === v);
      form.querySelector(`[data-field="${it.id}"]`).classList.toggle('field--invalid', !ok);
      if (!ok) bad = true;
      else manipulation[it.id] = v;
    }
    if (bad) return showError(form, 'Please answer both questions to continue.');
    go('closing', { manipulation, clientMcAt: new Date().toISOString() }); // end of the 90-second clock
  });
}

function renderClosing() {
  const c = state.materials.closing;
  const debrief = config.immediateDebrief ? config.immediateDebriefText : null;
  const [p1, p2, p3, p4] = c.paragraphs;
  render(`
    <div class="card">
      <h1>Thank you</h1>
      ${paragraphs([p1, p2], 'lead')}
      ${debrief
        ? `<h2>${esc(debrief.heading)}</h2>${paragraphs(debrief.paragraphs)}`
        : `<p>${esc(p3)}</p>`}
      <p>${esc(p4)}</p>
      <hr class="divider">
      <h2 class="small">Your responses</h2>
      <p>${esc(c.decision)}</p>
      <div id="closing-actions" class="actions">
        <button type="button" class="btn" id="submit">${esc(c.submitLabel)}</button>
        <button type="button" class="btn btn--secondary" id="withdraw">${esc(c.withdrawLabel)}</button>
      </div>
      <div id="withdraw-confirm" class="alert alert--info" hidden role="region" aria-live="polite">
        <p><strong>Withdraw your responses?</strong> They will be deleted and cannot be recovered.</p>
        <div class="actions mt-8">
          <button type="button" class="btn btn--secondary" id="withdraw-yes">Yes, withdraw and delete</button>
          <button type="button" class="btn btn--quiet" id="withdraw-no">Go back</button>
        </div>
      </div>
      <hr class="divider">
      <p class="contact">${esc(c.contact)}</p>
    </div>`, { step: 10 });

  const actions = document.getElementById('closing-actions');
  const confirmBox = document.getElementById('withdraw-confirm');
  const submitBtn = document.getElementById('submit');
  const withdrawBtn = document.getElementById('withdraw');

  const busy = (on) => {
    submitBtn.disabled = on;
    withdrawBtn.disabled = on;
  };

  submitBtn.addEventListener('click', async () => {
    busy(true);
    submitBtn.textContent = 'Submitting…';
    try {
      await api(`/api/sessions/${state.sessionId}/submit`, { method: 'POST', body: buildPayload() });
      go('submitted');
    } catch (err) {
      if (err.status === 409) return go('submitted'); // already recorded (e.g. double click after a slow network)
      busy(false);
      submitBtn.textContent = c.submitLabel;
      showError(actions.parentElement, err.status === 400
        ? 'Your responses could not be submitted because some answers were missing. Please contact the study team at CU_ERM_Research@columbia.edu.'
        : 'We could not reach the server. Please check your connection and try again. Your responses are still on this page.');
    }
  });

  withdrawBtn.addEventListener('click', () => {
    confirmBox.hidden = false;
    document.getElementById('withdraw-yes').focus();
  });
  document.getElementById('withdraw-no').addEventListener('click', () => {
    confirmBox.hidden = true;
    withdrawBtn.focus();
  });
  document.getElementById('withdraw-yes').addEventListener('click', async () => {
    busy(true);
    try {
      await api(`/api/sessions/${state.sessionId}/withdraw`, { method: 'POST', body: {} });
    } catch {
      /* Even if the server is unreachable, nothing has been submitted: the responses are discarded locally. */
    }
    go('withdrawn');
  });
}

function buildPayload() {
  return {
    clientConsentAt: state.clientConsentAt,
    clientMcAt: state.clientMcAt,
    profile: state.profile,
    style: state.style,
    decisions: [...state.decisions].sort((a, b) => a.scenarioId - b.scenarioId),
    attention: state.attention ? { choice: state.attention.choice, latency: state.attention.latency } : null,
    manipulation: state.manipulation,
    client: { instrument: config.versions.instrument, consent: config.versions.consent },
  };
}

function renderSubmitted() {
  const c = state.materials?.closing;
  clearState();
  render(`
    <div class="card">
      <h1>Your responses have been submitted</h1>
      <p class="lead">Thank you for taking part. Your session is complete and you may close this window.</p>
      ${config.followupFormUrl
        ? `<hr class="divider"><h2 class="small">Early access to the findings</h2>
           <p>${esc(c?.followupPrompt ?? '')}</p>
           <div class="actions"><a class="btn" href="${esc(config.followupFormUrl)}" target="_blank" rel="noopener noreferrer">Leave my email (separate form)</a></div>`
        : ''}
      <hr class="divider">
      <p class="contact">${esc(c?.contact ?? '')}</p>
    </div>`, { step: 11 });
}

function renderWithdrawn() {
  const c = state.materials?.closing;
  clearState();
  render(`
    <div class="card">
      <h1>Your responses have been withdrawn</h1>
      <p class="lead">Your responses were deleted and will not be used. Thank you for your time. You may close this window.</p>
      <hr class="divider">
      <p class="contact">${esc(c?.contact ?? '')}</p>
    </div>`, { step: 11 });
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
(async function boot() {
  try {
    config = await api('/api/config');
  } catch {
    render(`<div class="card"><h1>Unable to load</h1><p>The study page could not be loaded. Please refresh or try again later.</p></div>`, { step: 0 });
    return;
  }
  if (config.studyClosed && state.screen === 'consent') return renderClosed();
  // A resumed session must still have its materials; otherwise start over.
  if (state.screen !== 'consent' && (!state.sessionId || !state.materials)) {
    state = freshState();
    saveState();
  }
  show();
})();
