import { test } from 'node:test';
import assert from 'node:assert/strict';
import { derive, toCsv, EXPORT_COLUMNS, MIN_DURATION_SEC } from '../server/export.js';
import { validateSubmission, validateConsent } from '../server/validate.js';
import { materialsFor, SCENARIOS, CONDITIONS, ATTENTION_CHECK } from '../server/content.js';
import { shuffled } from '../server/randomise.js';

const base = {
  session_uuid: 'u', condition: 'B', status: 'submitted', started_at: 't0', ended_at: 't1',
  duration_sec: 300,
  education: "Master's", job_function: 'ERM', years_experience: '5–9', seniority: 'Manager', industry: 'Consulting',
  rp_1: 5, rp_2_raw: 1, rp_3_raw: 1,
  dec_1: 1, dec_2: 1, dec_3: 0, dec_4: -1,
  conf_1: 5, conf_2: 4, conf_3: 3, conf_4: 2,
  lat_1: 10, lat_2: 20, lat_3: 30, lat_4: 40,
  attn_response: 0, mc_uncertainty: 1, mc_framing: 2,
};

test('risk-taking score, propensity, confidence and latency are derived as in the data dictionary', () => {
  const d = derive(base);
  assert.equal(d.risk_taking_score, 1);
  assert.equal(d.n_decisions, 4);
  assert.equal(d.pct_increase, 50);
  assert.equal(d.pct_maintain, 25);
  assert.equal(d.pct_decrease, 25);
  assert.equal(d.rp_2, 5);
  assert.equal(d.rp_3, 5);
  assert.equal(d.risk_propensity, 5);
  assert.equal(d.confidence_mean, 3.5);
  assert.equal(d.latency_mean, 25);
  assert.equal(d.log_latency, Math.round(Math.log(25) * 1e4) / 1e4);
  assert.equal(d.uncertainty_type, 'epistemic');
  assert.equal(d.framing, 'loss');
});

test('manipulation checks are scored against the assigned condition', () => {
  assert.equal(derive({ ...base, condition: 'B', mc_uncertainty: 1, mc_framing: 2 }).mc_both_correct, 'TRUE');
  assert.equal(derive({ ...base, condition: 'C', mc_uncertainty: 2, mc_framing: 1 }).mc_both_correct, 'TRUE');
  assert.equal(derive({ ...base, condition: 'C', mc_uncertainty: 1, mc_framing: 1 }).mc_uncertainty_correct, 'FALSE');
  assert.equal(derive({ ...base, condition: 'A', mc_uncertainty: 3, mc_framing: 3 }).mc_both_correct, 'FALSE');
});

test('pre-registered exclusions: duration, attention, incomplete, demographics', () => {
  const clean = derive(base);
  assert.equal(clean.excluded_any, 'FALSE');
  assert.equal(clean.analysis_sample, 'TRUE');
  assert.equal(clean.exclusion_reason, 'none');

  assert.equal(derive({ ...base, duration_sec: MIN_DURATION_SEC - 1 }).excl_duration, 'TRUE');
  assert.equal(derive({ ...base, duration_sec: MIN_DURATION_SEC }).excl_duration, 'FALSE');
  assert.equal(derive({ ...base, attn_response: -1 }).excl_attention, 'TRUE');
  assert.equal(derive({ ...base, dec_3: null }).excl_incomplete, 'TRUE');
  assert.equal(derive({ ...base, dec_3: null }).risk_taking_score, null);
  assert.equal(derive({ ...base, industry: null }).excl_demographics, 'TRUE');
  const multi = derive({ ...base, duration_sec: 10, attn_response: 1 });
  assert.equal(multi.exclusion_reason, 'duration;attention');
  assert.equal(multi.analysis_sample, 'FALSE');
});

test('attention check response never enters the risk-taking score', () => {
  assert.equal(derive({ ...base, attn_response: 1 }).risk_taking_score, derive({ ...base, attn_response: -1 }).risk_taking_score);
});

test('started and withdrawn sessions carry no exclusion flags or responses', () => {
  const s = derive({ session_uuid: 'x', condition: 'D', status: 'started', started_at: 't0' });
  assert.equal(s.completion_status, 'abandoned');
  assert.equal(s.excluded_any, null);
  assert.equal(s.risk_taking_score, null);
  const w = derive({ session_uuid: 'y', condition: 'D', status: 'withdrawn', started_at: 't0', ended_at: 't1' });
  assert.equal(w.completion_status, 'withdrawn');
  assert.equal(w.analysis_sample, null);
});

test('CSV export quotes fields and has a stable header', () => {
  const csv = toCsv([derive(base)]);
  const [header, row] = csv.trim().split('\r\n');
  assert.equal(header, EXPORT_COLUMNS.join(','));
  assert.ok(row.includes('"1,2,3,4"') || row.includes(',,')); // scenario_order quoted when present
  assert.equal(header.split(',').length, row.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).length);
});

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
const goodPayload = () => ({
  clientConsentAt: '2026-10-02T10:00:00Z',
  clientMcAt: '2026-10-02T10:04:30Z',
  profile: { education: "Master's", job_function: 'ERM', years_experience: '5–9', seniority: 'Manager', industry: 'Consulting' },
  style: { rp_1: 4, rp_2: 2, rp_3: 3 },
  decisions: [1, 2, 3, 4].map((id) => ({ scenarioId: id, choice: 'maintain', confidence: 3, latency: 5.5, latencyFirst: 5.5, hidden: false })),
  attention: { choice: 'maintain', latency: 3 },
  manipulation: { mc_uncertainty: 1, mc_framing: 2 },
});

test('a complete payload validates and normalises to column values', () => {
  const v = validateSubmission(goodPayload());
  assert.deepEqual(v.errors, []);
  assert.equal(v.ok, true);
  assert.equal(v.row.duration_sec, 270);
  assert.equal(v.row.dec_1, 0);
  assert.equal(v.row.attn_response, 0);
  assert.equal(v.row.scenario_order, '1,2,3,4');
  assert.equal(v.row.rp_2_raw, 2);
  assert.equal(v.row.hidden_1, 0);
});

test('payloads with missing, out-of-range or unknown values are rejected', () => {
  const cases = [
    (p) => (p.profile.industry = 'Space mining'),
    (p) => (p.style.rp_1 = 6),
    (p) => (p.style.rp_2 = 2.5),
    (p) => p.decisions.pop(),
    (p) => (p.decisions[0].scenarioId = 2),
    (p) => (p.decisions[1].choice = 'hedge'),
    (p) => (p.decisions[2].confidence = 0),
    (p) => (p.decisions[3].latency = -1),
    (p) => (p.decisions[3].latencyFirst = 99),
    (p) => (p.attention = { choice: 'maintain', latency: 0 }),
    (p) => (p.manipulation.mc_framing = 4),
    (p) => (p.clientMcAt = p.clientConsentAt),
    (p) => delete p.clientConsentAt,
  ];
  for (const mutate of cases) {
    const p = goodPayload();
    mutate(p);
    assert.equal(validateSubmission(p).ok, false, `expected rejection for ${mutate.toString()}`);
  }
  assert.equal(validateSubmission(null).ok, false);
  assert.equal(validateSubmission('x').ok, false);
});

test('consent record validation', () => {
  assert.equal(validateConsent({ fullName: 'A B', consentDate: '2026-10-02' }).ok, true);
  assert.equal(validateConsent({ fullName: '  Pat   Example ', consentDate: '2026-10-02' }).fullName, 'Pat Example');
  assert.equal(validateConsent({ fullName: 'A', consentDate: '2026-10-02' }).ok, false);
  assert.equal(validateConsent({ fullName: 'Pat', consentDate: '02/10/2026' }).ok, false);
  assert.equal(validateConsent({}).ok, false);
});

// ---------------------------------------------------------------------------
// Content integrity
// ---------------------------------------------------------------------------
test('every condition has a framing paragraph for every scenario and only the framing differs', () => {
  for (const c of Object.keys(CONDITIONS)) {
    const m = materialsFor(c);
    assert.equal(m.scenarios.length, 4);
    for (const s of m.scenarios) {
      assert.ok(s.framing && s.framing.length > 40, `${c} scenario ${s.id} framing`);
      assert.equal(s.context, SCENARIOS.find((x) => x.id === s.id).context);
    }
    assert.equal(m.attentionCheck.title, ATTENTION_CHECK.title);
    assert.ok(!('correct' in m.attentionCheck), 'the correct answer is not sent to the client');
    assert.equal(m.briefing.includes(c === 'A' || c === 'B' ? 'cannot put a reliable number' : 'can estimate the odds'), true);
  }
});

test('epistemic conditions never state a numeric probability; aleatory conditions always do', () => {
  for (const s of SCENARIOS) {
    assert.ok(!/\d+%/.test(s.framing.A) && !/\d+%/.test(s.framing.B), `scenario ${s.id} epistemic`);
    assert.ok(/\d+%/.test(s.framing.C) && /\d+%/.test(s.framing.D), `scenario ${s.id} aleatory`);
  }
});

test('shuffled returns a permutation', () => {
  for (let i = 0; i < 20; i++) assert.deepEqual(shuffled(['A', 'B', 'C', 'D']).sort(), ['A', 'B', 'C', 'D']);
});
