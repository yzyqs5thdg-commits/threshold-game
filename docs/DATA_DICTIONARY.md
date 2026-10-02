# Export data dictionary

One row per session (one UUID). Produced by `/api/admin/export/sessions.csv` and `npm run export`. Raw values are stored; every derived column is computed at export time by `server/export.js` so the rules are in one place. Booleans export as `TRUE`/`FALSE`; empty cells are missing.

Rows with `status` = `started` (never reached the closing screen) or `withdrawn` carry only the first block of columns. Use `status = submitted` (or the `?status=submitted` filter) for the analysis file.

## Session and condition

| Column | Values | Notes |
| --- | --- | --- |
| `session_uuid` | UUID v4 | Unit of analysis. |
| `condition` | A, B, C, D | A = Epistemic+Gain, B = Epistemic+Loss, C = Aleatory+Gain, D = Aleatory+Loss. |
| `uncertainty_type` | epistemic, aleatory | Derived from condition. Code epistemic = 1 for regression. |
| `framing` | gain, loss | Derived from condition. Code loss = 1 for regression. |
| `status` | started, submitted, withdrawn | Only `submitted` rows have responses. |
| `completion_status` | complete, withdrawn, abandoned | Data-dictionary naming of the same thing. |
| `started_at` | ISO 8601 UTC | Server clock at condition assignment (immediately after consent). |
| `ended_at` | ISO 8601 UTC | Server clock at submit or withdraw. |
| `client_consent_at` | ISO 8601 UTC | Participant's clock at "I agree". |
| `client_mc_at` | ISO 8601 UTC | Participant's clock at Continue after the manipulation-check items. |
| `duration_sec` | seconds | `client_mc_at − client_consent_at`. Basis of the 90-second exclusion. |
| `instrument_version` | string | Version tag of `server/content.js` text. |
| `consent_version` | string | Version tag of the consent text the participant saw. |
| `randomisation` | simple, block | Assignment method in force when the session was created. |

## Profile (Screen 2)

| Column | Values |
| --- | --- |
| `education` | High school / Bachelor's / Master's / Doctorate / Other / Prefer not to say |
| `job_function` | ERM / Operational risk / Financial risk / Credit or market risk / Compliance / Internal audit / Internal controls / IT or cyber risk / Business continuity / GRC / Other / Prefer not to say |
| `years_experience` | 2–4 / 5–9 / 10–14 / 15+ / Prefer not to say |
| `seniority` | Analyst or associate / Manager / Senior manager or director / Executive / Other / Prefer not to say |
| `industry` | Financial services / Consulting / Technology / Manufacturing / Energy / Healthcare / Government or non-profit / Other / Prefer not to say |
| `demographics_complete` | TRUE if all five are non-missing (always TRUE for submitted sessions, since all are required). |

## Risk propensity (Screen 3)

| Column | Values | Notes |
| --- | --- | --- |
| `rp_1` | 1–5 | "I generally enjoy taking calculated risks." |
| `rp_2_raw` | 1–5 | "I prefer certainty over chasing upside." (raw) |
| `rp_3_raw` | 1–5 | "I tend to avoid situations with unclear outcomes." (raw) |
| `rp_2`, `rp_3` | 1–5 | Reverse-scored: 6 − raw. |
| `risk_propensity` | 1.00–5.00 | (rp_1 + rp_2 + rp_3) / 3. Centre at analysis for H4. |

## Decisions (Screen 5, scored scenarios)

| Column | Values | Notes |
| --- | --- | --- |
| `dec_1` … `dec_4` | −1, 0, +1 | 1 Data Breach, 2 Supplier Concentration, 3 Compliance Gap, 4 Political Instability. Increase = +1, Maintain = 0, Decrease = −1. |
| `n_decisions` | 0–4 | Non-missing decisions. |
| `risk_taking_score` | −4 … +4 | Sum of `dec_1`…`dec_4`. Primary dependent variable. Missing unless all four present. |
| `pct_increase`, `pct_maintain`, `pct_decrease` | 0–100 | Share of the four decisions. |
| `scenario_order` | "1,2,3,4" | Presentation order (fixed in this build). |
| `conf_1` … `conf_4` | 1–5 | Confidence after each decision. |
| `confidence_mean` | 1.00–5.00 | Mean of the four. |
| `lat_1` … `lat_4` | seconds | Scenario painted → click on the submitted choice. |
| `lat_first_1` … `lat_first_4` | seconds | Scenario painted → first choice clicked (≤ `lat_n`). |
| `hidden_1` … `hidden_4` | 0/1 | 1 if the browser tab was hidden at some point while that scenario was displayed. |
| `latency_mean` | seconds | Mean of `lat_1`…`lat_4`. |
| `log_latency` | | Natural log of `latency_mean`. |

## Data-quality item (between scenarios 2 and 3)

| Column | Values | Notes |
| --- | --- | --- |
| `attn_response` | −1, 0, +1 | Same coding as decisions. Not part of `risk_taking_score`. |
| `attn_latency` | seconds | As for scenarios. |
| `attn_pass` | TRUE/FALSE | TRUE if `attn_response` = 0 (Maintain). |

## Manipulation checks (Screen 6)

| Column | Values | Notes |
| --- | --- | --- |
| `mc_uncertainty` | 1, 2, 3 | 1 = probability unknown / could not be estimated; 2 = estimated from data but inherently random; 3 = not sure. |
| `mc_framing` | 1, 2, 3 | 1 = opportunities / upside; 2 = threats / downside; 3 = about equally both ways. |
| `mc_uncertainty_correct` | TRUE/FALSE | 1 under epistemic, 2 under aleatory. |
| `mc_framing_correct` | TRUE/FALSE | 1 under gain, 2 under loss. |
| `mc_both_correct` | TRUE/FALSE | Both correct. Not an exclusion; sensitivity analysis only. |

## Exclusion flags (pre-registered; submitted sessions only)

| Column | Rule |
| --- | --- |
| `excl_duration` | `duration_sec` < 90 |
| `excl_attention` | `attn_pass` = FALSE |
| `excl_incomplete` | `n_decisions` < 4 |
| `excl_demographics` | `demographics_complete` = FALSE |
| `excluded_any` | Any of the above |
| `exclusion_reason` | Semicolon-separated list of the flags that fired, or `none` |
| `analysis_sample` | NOT `excluded_any` |

## Consent log (separate export)

`/api/admin/export/consent.csv` (requires `CONSENT_TOKEN`) or `npm run export -- --consent`. Columns: `id`, `full_name`, `consent_date` (as typed), `recorded_at` (server clock, precision per `CONSENT_TIMESTAMP_PRECISION`), `consent_version`. No session identifier. Store apart from the session export with PI-only access.
