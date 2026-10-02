// Derived variables (Data Dictionary, Development Record Part VI) and CSV export.
// Raw columns are stored; everything below is computed at export time so the rule set
// is in one place and can be checked against the pre-registration.

import { CONDITIONS, ATTENTION_CHECK, DECISION_OPTIONS } from './content.js';

const ATTN_CORRECT_SCORE = DECISION_OPTIONS.find((o) => o.value === ATTENTION_CHECK.correct).score;
export const MIN_DURATION_SEC = 90; // pre-registered exclusion: session completion time under 90 seconds

const mean = (xs) => {
  const v = xs.filter((x) => x !== null && x !== undefined);
  return v.length ? round(v.reduce((a, b) => a + b, 0) / v.length) : null;
};
const round = (x, d = 3) => (x === null || x === undefined ? null : Math.round(x * 10 ** d) / 10 ** d);
const bool = (b) => (b === null || b === undefined ? null : b ? 'TRUE' : 'FALSE');

/** Compute every derived variable for one stored session row. */
export function derive(row) {
  const spec = CONDITIONS[row.condition];
  const submitted = row.status === 'submitted';

  const decs = [1, 2, 3, 4].map((i) => row[`dec_${i}`]);
  const confs = [1, 2, 3, 4].map((i) => row[`conf_${i}`]);
  const lats = [1, 2, 3, 4].map((i) => row[`lat_${i}`]);
  const nDecisions = decs.filter((d) => d !== null && d !== undefined).length;
  const riskTakingScore = nDecisions === 4 ? decs.reduce((a, b) => a + b, 0) : null;

  const rp2 = row.rp_2_raw == null ? null : 6 - row.rp_2_raw;
  const rp3 = row.rp_3_raw == null ? null : 6 - row.rp_3_raw;
  const riskPropensity = row.rp_1 != null && rp2 != null && rp3 != null ? round((row.rp_1 + rp2 + rp3) / 3) : null;

  const demographicsComplete = submitted
    ? ['education', 'job_function', 'years_experience', 'seniority', 'industry'].every((k) => row[k] != null && row[k] !== '')
    : null;

  const attnPass = row.attn_response == null ? null : row.attn_response === ATTN_CORRECT_SCORE;

  const mcUncCorrect =
    row.mc_uncertainty == null ? null : (spec.uncertainty === 'epistemic' && row.mc_uncertainty === 1) || (spec.uncertainty === 'aleatory' && row.mc_uncertainty === 2);
  const mcFrmCorrect =
    row.mc_framing == null ? null : (spec.framing === 'gain' && row.mc_framing === 1) || (spec.framing === 'loss' && row.mc_framing === 2);

  const latencyMean = mean(lats);
  const confidenceMean = mean(confs);

  // Exclusion flags only apply to submitted sessions; started/withdrawn rows carry NULLs.
  let excl = { excl_duration: null, excl_attention: null, excl_incomplete: null, excl_demographics: null };
  let excludedAny = null;
  let reason = null;
  if (submitted) {
    excl = {
      excl_duration: row.duration_sec != null && row.duration_sec < MIN_DURATION_SEC,
      excl_attention: attnPass === false,
      excl_incomplete: nDecisions < 4,
      excl_demographics: demographicsComplete === false,
    };
    const reasons = Object.entries(excl).filter(([, v]) => v).map(([k]) => k.replace('excl_', ''));
    excludedAny = reasons.length > 0;
    reason = reasons.length ? reasons.join(';') : 'none';
  }

  const completionStatus = row.status === 'submitted' ? 'complete' : row.status === 'withdrawn' ? 'withdrawn' : 'abandoned';

  return {
    session_uuid: row.session_uuid,
    condition: row.condition,
    uncertainty_type: spec.uncertainty,
    framing: spec.framing,
    status: row.status,
    completion_status: completionStatus,
    started_at: row.started_at,
    ended_at: row.ended_at,
    client_consent_at: row.client_consent_at,
    client_mc_at: row.client_mc_at,
    duration_sec: row.duration_sec,
    instrument_version: row.instrument_version,
    consent_version: row.consent_version,
    randomisation: row.randomisation,

    education: row.education,
    job_function: row.job_function,
    years_experience: row.years_experience,
    seniority: row.seniority,
    industry: row.industry,
    demographics_complete: bool(demographicsComplete),

    rp_1: row.rp_1,
    rp_2_raw: row.rp_2_raw,
    rp_3_raw: row.rp_3_raw,
    rp_2: rp2,
    rp_3: rp3,
    risk_propensity: riskPropensity,

    dec_1: decs[0], dec_2: decs[1], dec_3: decs[2], dec_4: decs[3],
    n_decisions: submitted ? nDecisions : null,
    risk_taking_score: riskTakingScore,
    pct_increase: nDecisions === 4 ? (decs.filter((d) => d === 1).length / 4) * 100 : null,
    pct_maintain: nDecisions === 4 ? (decs.filter((d) => d === 0).length / 4) * 100 : null,
    pct_decrease: nDecisions === 4 ? (decs.filter((d) => d === -1).length / 4) * 100 : null,
    scenario_order: row.scenario_order,

    conf_1: confs[0], conf_2: confs[1], conf_3: confs[2], conf_4: confs[3],
    confidence_mean: confidenceMean,

    lat_1: lats[0], lat_2: lats[1], lat_3: lats[2], lat_4: lats[3],
    lat_first_1: row.lat_first_1, lat_first_2: row.lat_first_2, lat_first_3: row.lat_first_3, lat_first_4: row.lat_first_4,
    hidden_1: row.hidden_1, hidden_2: row.hidden_2, hidden_3: row.hidden_3, hidden_4: row.hidden_4,
    latency_mean: latencyMean,
    log_latency: latencyMean != null && latencyMean > 0 ? round(Math.log(latencyMean), 4) : null,

    attn_response: row.attn_response,
    attn_latency: row.attn_latency,
    attn_pass: bool(attnPass),

    mc_uncertainty: row.mc_uncertainty,
    mc_framing: row.mc_framing,
    mc_uncertainty_correct: bool(mcUncCorrect),
    mc_framing_correct: bool(mcFrmCorrect),
    mc_both_correct: bool(mcUncCorrect == null || mcFrmCorrect == null ? null : mcUncCorrect && mcFrmCorrect),

    excl_duration: bool(excl.excl_duration),
    excl_attention: bool(excl.excl_attention),
    excl_incomplete: bool(excl.excl_incomplete),
    excl_demographics: bool(excl.excl_demographics),
    excluded_any: bool(excludedAny),
    exclusion_reason: reason,
    analysis_sample: bool(excludedAny == null ? null : !excludedAny),
  };
}

export const EXPORT_COLUMNS = Object.keys(
  derive({ session_uuid: 'x', condition: 'A', status: 'started', started_at: '', rp_2_raw: null, rp_3_raw: null }),
);

export function toCsv(objects, columns = EXPORT_COLUMNS) {
  const escape = (v) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [columns.join(',')];
  for (const o of objects) lines.push(columns.map((c) => escape(o[c])).join(','));
  return lines.join('\r\n') + '\r\n';
}

export function consentCsv(records) {
  return toCsv(records, ['id', 'full_name', 'consent_date', 'recorded_at', 'consent_version']);
}
