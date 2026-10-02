// Server-side validation and normalisation of a submitted session.
// Everything is checked against the allowed values in content.js; anything else is rejected.

import { PROFILE_ITEMS, STYLE_ITEMS, DECISION_OPTIONS, MANIPULATION_CHECK, SCENARIOS } from './content.js';

const SCORE = Object.fromEntries(DECISION_OPTIONS.map((o) => [o.value, o.score]));
const MAX_LATENCY_SEC = 7 * 24 * 3600; // anything beyond a week is a client bug, not a participant
const MAX_DURATION_SEC = 7 * 24 * 3600;

const isInt = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
const isFiniteNum = (v) => typeof v === 'number' && Number.isFinite(v);
const parseIso = (s) => (typeof s === 'string' && !Number.isNaN(Date.parse(s)) ? new Date(s) : null);

export function validateConsent(body) {
  const errors = [];
  const fullName = typeof body?.fullName === 'string' ? body.fullName.trim().replace(/\s+/g, ' ') : '';
  const consentDate = typeof body?.consentDate === 'string' ? body.consentDate.trim() : '';
  if (fullName.length < 2 || fullName.length > 200) errors.push('fullName must be 2–200 characters');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(consentDate) || Number.isNaN(Date.parse(consentDate))) errors.push('consentDate must be YYYY-MM-DD');
  return { ok: errors.length === 0, errors, fullName, consentDate };
}

/**
 * Validate a submission payload. Returns { ok, errors, row } where row has the column names
 * used in db.js. Latencies are in seconds (client measures with performance.now()).
 */
export function validateSubmission(payload) {
  const errors = [];
  const row = {};
  if (!payload || typeof payload !== 'object') return { ok: false, errors: ['payload must be an object'], row };

  // Timing
  const consentAt = parseIso(payload.clientConsentAt);
  const mcAt = parseIso(payload.clientMcAt);
  if (!consentAt) errors.push('clientConsentAt missing or invalid');
  if (!mcAt) errors.push('clientMcAt missing or invalid');
  if (consentAt && mcAt) {
    const dur = (mcAt - consentAt) / 1000;
    if (!(dur > 0 && dur < MAX_DURATION_SEC)) errors.push('duration out of range');
    row.client_consent_at = consentAt.toISOString();
    row.client_mc_at = mcAt.toISOString();
    row.duration_sec = Math.round(dur * 1000) / 1000;
  }

  // Profile
  const profile = payload.profile ?? {};
  for (const item of PROFILE_ITEMS) {
    const v = profile[item.id];
    if (!item.options.includes(v)) errors.push(`profile.${item.id} invalid`);
    else row[item.id] = v;
  }

  // Risk propensity (raw)
  const style = payload.style ?? {};
  for (const item of STYLE_ITEMS) {
    const v = style[item.id];
    if (!isInt(v, 1, 5)) errors.push(`style.${item.id} must be an integer 1–5`);
  }
  row.rp_1 = style.rp_1;
  row.rp_2_raw = style.rp_2;
  row.rp_3_raw = style.rp_3;

  // Decisions
  const decisions = Array.isArray(payload.decisions) ? payload.decisions : [];
  if (decisions.length !== SCENARIOS.length) errors.push(`decisions must have ${SCENARIOS.length} entries`);
  const seen = new Set();
  const order = [];
  for (const d of decisions) {
    const id = d?.scenarioId;
    if (!isInt(id, 1, SCENARIOS.length) || seen.has(id)) {
      errors.push('decisions.scenarioId invalid or duplicated');
      continue;
    }
    seen.add(id);
    order.push(id);
    if (!(d.choice in SCORE)) errors.push(`decision ${id}: choice invalid`);
    if (!isInt(d.confidence, 1, 5)) errors.push(`decision ${id}: confidence must be 1–5`);
    if (!(isFiniteNum(d.latency) && d.latency > 0 && d.latency < MAX_LATENCY_SEC)) errors.push(`decision ${id}: latency out of range`);
    if (!(isFiniteNum(d.latencyFirst) && d.latencyFirst > 0 && d.latencyFirst <= (d.latency ?? Infinity) + 1e-6)) errors.push(`decision ${id}: latencyFirst out of range`);
    row[`dec_${id}`] = SCORE[d.choice];
    row[`conf_${id}`] = d.confidence;
    row[`lat_${id}`] = round3(d.latency);
    row[`lat_first_${id}`] = round3(d.latencyFirst);
    row[`hidden_${id}`] = d.hidden ? 1 : 0;
  }
  row.scenario_order = order.join(',');

  // Attention check
  const attn = payload.attention ?? {};
  if (!(attn.choice in SCORE)) errors.push('attention.choice invalid');
  else row.attn_response = SCORE[attn.choice];
  if (!(isFiniteNum(attn.latency) && attn.latency > 0 && attn.latency < MAX_LATENCY_SEC)) errors.push('attention.latency out of range');
  else row.attn_latency = round3(attn.latency);

  // Manipulation checks
  const mc = payload.manipulation ?? {};
  for (const item of MANIPULATION_CHECK.items) {
    const allowed = item.options.map((o) => o.value);
    if (!allowed.includes(mc[item.id])) errors.push(`manipulation.${item.id} invalid`);
    else row[item.id] = mc[item.id];
  }

  row.raw_json = JSON.stringify(payload);
  return { ok: errors.length === 0, errors, row };
}

function round3(x) {
  return Math.round(x * 1000) / 1000;
}
