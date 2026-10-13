# Case Assignment 3(a): Signet Jewelers baseline value-based ERM model

Columbia University ERMC PS5900 Capstone, Fall 2026, Case Team #2. This folder is self-contained and unrelated to the study app in the rest of the repository.

| Path | What it is |
|---|---|
| `Team2_Signet_VB-ERM_Baseline_3a.xlsx` | The deliverable: Cover, Assumptions & Sources, Model - NA / INTL / OTHER, Total Company, Summary & Chart (native charts), Checks. Live formulas only; Excel recalculates on open. |
| `model_summary.md` | One-page summary for teammates: segment values, sensitivities, approach, open questions, double-check list. |
| `research_notes.md` | Data pulled for the model with APA 7th citations and reference list. |
| `design_memo.md` | The design decisions (segment structure, drivers, valuation approach, discount rate). |
| `data/` | Extracted figures as CSV/JSON with source IDs and confidence flags; `model_calibration_fy2026.csv` is the FY2026A segment split used in the model. |
| `build/build_model.py` | Generates the workbook from scratch (all inputs in one dictionary at the top), recalculates it with headless LibreOffice, pastes the baseline snapshot values, runs the sensitivities and verifies the Checks tab. |
| `build/recalc_check/` | The LibreOffice-recalculated copy used for verification (cached values, same formulas). |
| `build/sensitivity_results.csv`, `build/baseline_snapshot.json` | Outputs of the last full run. |

Rebuild: `python3 build/build_model.py` (needs `openpyxl` and `soffice`; add `--quick` to skip sensitivities, `--no-recalc` to only write the file).
