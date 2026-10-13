#!/usr/bin/env python3
"""
Build Team2_Signet_VB-ERM_Baseline_3a.xlsx from a clean run.

Usage
-----
    python3 build/build_model.py            # full pipeline: build -> LibreOffice recalc -> snapshot baseline
                                            #   -> sensitivities -> final build -> recalc -> verify
    python3 build/build_model.py --quick    # skip the sensitivity runs (keeps the last sensitivity CSV if present)
    python3 build/build_model.py --no-recalc  # just write the workbook (no LibreOffice available)

All hard-coded inputs live in the INPUTS dictionary directly below, with the source noted beside each.
Every other number in the workbook is an Excel formula. Columns: C = Last Yr (FY2026A), D..M = FY2027..FY2036.
"""
from __future__ import annotations

import argparse
import csv
import datetime as dt
import glob
import json
import os
import shutil
import subprocess
import sys
import tempfile
from copy import deepcopy

import openpyxl
from openpyxl.chart import BarChart, LineChart, Reference
from openpyxl.chart.label import DataLabelList
from openpyxl.formatting.rule import CellIsRule
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT_XLSX = os.path.join(ROOT, "Team2_Signet_VB-ERM_Baseline_3a.xlsx")
SENS_CSV = os.path.join(HERE, "sensitivity_results.csv")
SNAPSHOT_JSON = os.path.join(HERE, "baseline_snapshot.json")

# ----------------------------------------------------------------------------------------------------------------
# 1. HARD-CODED INPUTS (the only place numbers are typed). "src" = source; see data/sources.json for full APA entries.
# ----------------------------------------------------------------------------------------------------------------
YEARS = ["FY2027", "FY2028", "FY2029", "FY2030", "FY2031", "FY2032", "FY2033", "FY2034", "FY2035", "FY2036"]
N_YEARS = len(YEARS)
LAST_YR_LABEL = "Last Yr (FY2026A)"

INPUTS = {
    "meta": {
        "company": "Signet Jewelers Limited (NYSE: SIG)",
        "team": "Case Team #2: Meher Jain, Zainab Razzaque, Stanley Weng, Jana Chamsi Bacha, Anderson Chan",
        "course": "Columbia University ERMC PS5900 Capstone, Fall 2026 - Case Assignment #3(a): Baseline value-based ERM model",
        "build_date": dt.date(2026, 10, 13),
        "due": "Monday, October 19, 2026, 11pm ET (day before Session 7)",
    },
    # FY2026A calibration by segment ($ millions). Segment totals tie to Signet Jewelers Limited (2026a, 2026b);
    # the split of cost of sales, SG&A, other operating items, interest, tax and the balance sheet across segments is
    # a team allocation (see data/model_calibration_fy2026.csv and the Assumptions & Sources tab).
    "segments": {
        "NA": {
            "sheet": "Model - NA", "title": "North America",
            "desc": "North America reportable segment: Kay, Zales, Jared, Diamonds Direct, Banter by Piercing Pagoda, Rocksbox, "
                    "the digital brands James Allen and Blue Nile, and Peoples Jewellers (Canada).",
            "last": {  # src: 10-K FY2026 segment note / Q4 FY2026 release; allocations per calibration table
                "stores_beg": 2379, "openings": 14, "closures": 64,          # src: 10-K FY2026 store table (A)
                "rev_store": 4179.8, "rev_ecom": 1423.8, "rev_svc": 760.0, "rev_oth": 0.0,   # src: allocation (D); total 6,363.6 (A)
                "cogs": 3803.5, "vsga": 1272.7, "fsga": 731.5, "ooi": -103.3,  # src: allocation (D); OI 452.6 (A)
                "int_inc": 4.7, "int_exp": 0.0, "tax": 119.1,                 # src: allocation (D) of 4.0+1.0 net interest/other and 103.7 tax (A)
                "cash": 817.0, "inv": 1812.0, "debt": 0.0, "oliab": 792.7,     # src: allocation (D) of 874.8 / 1,940.1 / 0 / plug (A)
            },
            "assump": {
                "a_open":  {"last": 14,    "proj": {0: 6, 1: 10, 3: 12}},
                "a_close": {"last": 64,    "proj": {0: 70, 1: 50, 2: 40, 3: 30, 4: 25, 5: 20}},
                "a_sss":   {"last": 0.012, "proj": {0: 0.015, 1: 0.020}},
                "a_ecom":  {"last": None,  "proj": {0: 0.030, 1: 0.040}},
                "a_svc":   {"last": None,  "proj": {0: 0.138, 1: 0.140}},
                "a_oth":   {"last": None,  "proj": {0: 0.0}},
                "a_cogs":  {"last": None,  "proj": {0: 0.593}},
                "a_vsga":  {"last": None,  "proj": {0: 0.200}},
                "a_infl":  {"last": None,  "proj": {0: 0.025, 1: 0.023, 2: 0.021, 3: 0.020}},
                "a_save":  {"last": None,  "proj": {0: 0.0}},
                "a_ooi":   {"last": None,  "proj": {0: 30.0, 1: 0.0}},
                "a_yld":   {"last": None,  "proj": {0: 0.007}},
                "a_rdebt": {"last": None,  "proj": {0: 0.065}},
                "a_tax":   {"last": None,  "proj": {0: 0.240}},
                "a_dr":    {"last": None,  "proj": {0: 0.105}},
            },
        },
        "INTL": {
            "sheet": "Model - INTL", "title": "International",
            "desc": "International reportable segment: H.Samuel and Ernest Jones stores and e-commerce in the UK and the Republic of Ireland.",
            "last": {
                "stores_beg": 263, "openings": 0, "closures": 10,            # src: 10-K FY2026 store table (A)
                "rev_store": 307.8, "rev_ecom": 61.6, "rev_svc": 41.0, "rev_oth": 0.0,       # src: allocation (D); total 410.4 (A)
                "cogs": 279.1, "vsga": 61.6, "fsga": 51.4, "ooi": -2.0,       # src: allocation (D); OI 16.3 (A)
                "int_inc": 0.3, "int_exp": 0.0, "tax": 4.3,
                "cash": 52.7, "inv": 116.9, "debt": 0.0, "oliab": 51.1,
            },
            "assump": {
                "a_open":  {"last": 0,     "proj": {0: 2}},
                "a_close": {"last": 10,    "proj": {0: 4, 1: 5, 5: 4}},
                "a_sss":   {"last": 0.026, "proj": {0: 0.020}},
                "a_ecom":  {"last": None,  "proj": {0: 0.030}},
                "a_svc":   {"last": None,  "proj": {0: 0.111}},
                "a_oth":   {"last": None,  "proj": {0: 0.0}},
                "a_cogs":  {"last": None,  "proj": {0: 0.680}},
                "a_vsga":  {"last": None,  "proj": {0: 0.150}},
                "a_infl":  {"last": None,  "proj": {0: 0.030, 1: 0.025, 2: 0.020}},
                "a_save":  {"last": None,  "proj": {0: 0.0}},
                "a_ooi":   {"last": None,  "proj": {0: 0.0}},
                "a_yld":   {"last": None,  "proj": {0: 0.007}},
                "a_rdebt": {"last": None,  "proj": {0: 0.065}},
                "a_tax":   {"last": None,  "proj": {0: 0.250}},
                "a_dr":    {"last": None,  "proj": {0: 0.120}},
            },
        },
        "OTHER": {
            "sheet": "Model - OTHER", "title": "Other / Corporate",
            "desc": "'Other' reportable segment (rough-diamond purchasing and polishing subsidiaries selling to third parties) plus "
                    "corporate and unallocated costs. No stores, no e-commerce, no services: those rows are kept at zero.",
            "last": {
                "stores_beg": 0, "openings": 0, "closures": 0,
                "rev_store": 0.0, "rev_ecom": 0.0, "rev_svc": 0.0, "rev_oth": 39.6,          # src: Other segment sales 39.6 (A)
                "cogs": 36.4, "vsga": 0.0, "fsga": 56.0, "ooi": -23.0,         # src: allocation (D); OI -75.8 (C)
                "int_inc": 0.0, "int_exp": 0.0, "tax": -19.7,
                "cash": 5.1, "inv": 11.2, "debt": 0.0, "oliab": 4.9,
            },
            "assump": {
                "a_open":  {"last": 0,     "proj": {0: 0}},
                "a_close": {"last": 0,     "proj": {0: 0}},
                "a_sss":   {"last": None,  "proj": {0: 0.0}},
                "a_ecom":  {"last": None,  "proj": {0: 0.0}},
                "a_svc":   {"last": None,  "proj": {0: 0.0}},
                "a_oth":   {"last": None,  "proj": {0: 0.020}},
                "a_cogs":  {"last": None,  "proj": {0: 0.920}},
                "a_vsga":  {"last": None,  "proj": {0: 0.0}},
                "a_infl":  {"last": None,  "proj": {0: 0.025, 1: 0.023, 2: 0.021, 3: 0.020}},
                "a_save":  {"last": None,  "proj": {0: 0.0}},
                "a_ooi":   {"last": None,  "proj": {0: 0.0}},
                "a_yld":   {"last": None,  "proj": {0: 0.007}},
                "a_rdebt": {"last": None,  "proj": {0: 0.065}},
                "a_tax":   {"last": None,  "proj": {0: 0.240}},
                "a_dr":    {"last": None,  "proj": {0: 0.105}},
            },
        },
    },
    # Reported consolidated FY2026A figures used by the Checks tab (Signet Jewelers Limited, 2026b)
    "reported": {"sales": 6813.6, "oi": 393.1, "ni": 294.4, "equity": 1966.2,
                 "seg_sales": {"NA": 6363.6, "INTL": 410.4, "OTHER": 39.6},
                 "seg_oi": {"NA": 452.6, "INTL": 16.3, "OTHER": -75.8}},
    # FY2027 guidance ranges (Signet Jewelers Limited, 2026c) used by the Checks tab
    "guidance": {"sales_lo": 6700.0, "sales_hi": 6900.0, "adj_oi_lo": 535.0, "adj_oi_hi": 605.0,
                 "adj_eps_lo": 10.45, "adj_eps_hi": 12.15, "shares_fy27": 38.8},
    # Market data for the reasonableness check
    "market": {"date": dt.date(2026, 10, 9), "price": 105.22, "shares_out": 37.5,          # Yahoo Finance close; shares estimate (MarketBeat 38.3M / Google 37.3M)
               "diluted_shares_fy26": 41.6,                                                  # implied 294.4 / 7.08
               "rf": 0.0524, "beta": 1.25, "erp": 0.0420, "intl_premium": 0.015},           # H.15 Oct 9 2026; beta midpoint; Damodaran Oct 1 2026
}

# ----------------------------------------------------------------------------------------------------------------
# 2. LAYOUT (identical for the three segment tabs and the Total Company tab)
# ----------------------------------------------------------------------------------------------------------------
COL_LAST = 3                       # column C
COL_FIRST = 4                      # column D = FY2027
COL_LASTYEAR = COL_FIRST + N_YEARS - 1   # column M = FY2036
COL_UNIT = COL_LASTYEAR + 1        # N
COL_NOTE = COL_UNIT + 1            # O
L = get_column_letter
CL, CF, CM = L(COL_LAST), L(COL_FIRST), L(COL_LASTYEAR)

ASSUMPTION_ROWS = [  # key, label, unit, format
    ("a_open",  "Gross store openings (number of stores)", "# stores", "cnt"),
    ("a_close", "Store closures (number of stores)", "# stores", "cnt"),
    ("a_sss",   "Same-store sales growth (applied to merchandise sales per average store)", "% p.a.", "pct"),
    ("a_ecom",  "E-commerce merchandise sales growth", "% p.a.", "pct"),
    ("a_svc",   "Services attach rate (services revenue as % of merchandise sales)", "% of merch.", "pct"),
    ("a_oth",   "Other (non-retail / diamond sourcing) revenue growth", "% p.a.", "pct"),
    ("a_cogs",  "Cost of sales (incl. store occupancy) as % of total sales", "% of sales", "pct"),
    ("a_vsga",  "Variable SG&A (store payroll, advertising, credit) as % of total sales", "% of sales", "pct"),
    ("a_infl",  "Fixed SG&A inflation (corporate, support, fixed store overhead)", "% p.a.", "pct"),
    ("a_save",  "Cost-savings initiatives (incremental run-rate cut to fixed SG&A)", "$M", "num"),
    ("a_ooi",   "Other operating income / (expense), one-time items (+ = income)", "$M", "num"),
    ("a_yld",   "Net yield on invested assets (cash & equivalents)", "% of prior-yr cash", "pct"),
    ("a_rdebt", "Interest rate on debt (ABL revolver; debt is zero in baseline)", "% of prior-yr debt", "pct"),
    ("a_tax",   "Effective income tax rate", "% of pre-tax", "pct"),
    ("a_dr",    "Discount rate (cost of equity, CAPM) - single rate for the segment", "% p.a.", "pct"),
]
N_ASSUMP = len(ASSUMPTION_ROWS)

R = {}  # row registry: name -> row number
_row = 1
R["title"] = 1; R["subtitle"] = 2; R["header"] = 3
R["h_base"] = 5
for i, (k, *_r) in enumerate(ASSUMPTION_ROWS):
    R[k] = 6 + i
R["h_shock"] = 6 + N_ASSUMP + 1                   # 22
for i, (k, *_r) in enumerate(ASSUMPTION_ROWS):
    R["s_" + k[2:]] = R["h_shock"] + 1 + i        # 23..37
R["h_scen"] = R["h_shock"] + N_ASSUMP + 2         # 39
for i, (k, *_r) in enumerate(ASSUMPTION_ROWS):
    R["x_" + k[2:]] = R["h_scen"] + 1 + i         # 40..54
R["h_proj"] = R["h_scen"] + N_ASSUMP + 2          # 56
_r = R["h_proj"] + 1
PROJ_ROWS = [
    # name, label, unit, kind, fmt     kind: sub (subheader), amt (additive), ratio (recomputed on Total), cnt (additive count), val (valuation C-only)
    ("sub_ops", "OPERATING DRIVERS", "", "sub", None),
    ("stores_beg", "Stores - beginning of year", "# stores", "cnt", "cnt"),
    ("openings", "Gross store openings", "# stores", "cnt", "cnt"),
    ("closures", "Store closures", "# stores", "cnt", "cnt"),
    ("stores_end", "Stores - end of year", "# stores", "cnt", "cnt"),
    ("avg_stores", "Average stores in operation", "# stores", "cnt", "cnt1"),
    ("sps", "Store merchandise sales per average store", "$M / store", "ratio", "sps"),
    ("blank1", "", "", "blank", None),
    ("sub_is", "INCOME STATEMENT", "", "sub", None),
    ("rev_store", "Store merchandise sales (average stores x sales per store)", "$M", "amt", "num"),
    ("rev_ecom", "E-commerce merchandise sales", "$M", "amt", "num"),
    ("rev_svc", "Services revenue (extended service plans, repairs, custom design)", "$M", "amt", "num"),
    ("rev_oth", "Other revenue (diamond sourcing / non-retail)", "$M", "amt", "num"),
    ("sales", "TOTAL SALES", "$M", "amt", "numb"),
    ("rev_growth", "Revenue growth (calculated check row)", "%", "ratio", "pct"),
    ("cogs", "Cost of sales (merchandise, services and store occupancy)", "$M", "amt", "num"),
    ("gp", "Gross profit", "$M", "amt", "numb"),
    ("gm_pct", "Gross margin %", "%", "ratio", "pct"),
    ("vsga", "Variable SG&A", "$M", "amt", "num"),
    ("fsga", "Fixed SG&A (net of cost savings)", "$M", "amt", "num"),
    ("sga", "Total SG&A", "$M", "amt", "num"),
    ("sga_pct", "SG&A % of sales", "%", "ratio", "pct"),
    ("ooi", "Other operating income / (expense)", "$M", "amt", "num"),
    ("oi", "OPERATING INCOME", "$M", "amt", "numb"),
    ("oi_pct", "Operating margin %", "%", "ratio", "pct"),
    ("int_inc", "Interest income on invested assets (yield x prior-year cash)", "$M", "amt", "num"),
    ("int_exp", "Interest expense on debt (rate x prior-year debt)", "$M", "amt", "num"),
    ("ebt", "Income before income taxes", "$M", "amt", "numb"),
    ("ebt_pct", "Pre-tax margin %", "%", "ratio", "pct"),
    ("tax", "Income taxes", "$M", "amt", "num"),
    ("ni", "NET INCOME", "$M", "amt", "numb"),
    ("ni_pct", "Net margin %", "%", "ratio", "pct"),
    ("blank2", "", "", "blank", None),
    ("sub_val", "DISTRIBUTIONS & VALUATION (profits-released approach)", "", "sub", None),
    ("dist", "Distributions to shareholders (dividends + buybacks = net income)", "$M", "amt", "num"),
    ("retained", "Earnings retained in equity", "$M", "amt", "num"),
    ("dcf", "Distributable cash flow to shareholders (discounted below)", "$M", "amt", "num"),
    ("dr_used", "Discount rate used (from scenario block)", "%", "val", "pct"),
    ("tv", "Terminal value = shareholders' equity at end of FY2036", "$M", "amt", "num"),
    ("pv_dcf", "PV of FY2027-FY2036 distributable cash flows", "$M", "amt", "num"),
    ("pv_tv", "PV of terminal value", "$M", "amt", "num"),
    ("val_base", "SEGMENT VALUE - BASELINE (snapshot, hard-coded for 3(d) comparison)", "$M", "amt", "numb"),
    ("val_scen", "SEGMENT VALUE - SCENARIO RUN (live formula)", "$M", "amt", "numb"),
    ("val_pct", "% change vs baseline", "%", "ratio", "pct"),
    ("val_chg", "$ change vs baseline", "$M", "amt", "num"),
    ("blank3", "", "", "blank", None),
    ("sub_bs", "BALANCE SHEET (simplified, cash basis, year-end)", "", "sub", None),
    ("cash", "Invested assets (cash & cash equivalents)", "$M", "amt", "num"),
    ("inv", "Inventory and other non-depreciating operating assets", "$M", "amt", "num"),
    ("ta", "Total assets", "$M", "amt", "numb"),
    ("debt", "Debt", "$M", "amt", "num"),
    ("oliab", "Other liabilities, net (calibrated to reported equity)", "$M", "amt", "num"),
    ("tl", "Total liabilities", "$M", "amt", "numb"),
    ("eq", "SHAREHOLDERS' EQUITY", "$M", "amt", "numb"),
    ("eq_rf", "Equity roll-forward check: Equity(t) - [Equity(t-1) + Net income(t) - Distributions(t)]  (= 0)", "$M", "ratio", "num"),
    ("bs_chk", "Balance check: Total assets - Total liabilities - Equity  (= 0)", "$M", "ratio", "num"),
]
for name, *_x in PROJ_ROWS:
    R[name] = _r; _r += 1
R["end_grid"] = _r - 1
# Total-only extras
R["h_metrics"] = R["end_grid"] + 2
R["shares"] = R["h_metrics"] + 1
R["eps"] = R["h_metrics"] + 2
R["roe"] = R["h_metrics"] + 3
R["payout"] = R["h_metrics"] + 4
R["h_mkt"] = R["h_metrics"] + 6
R["mv_date"], R["mv_price"], R["mv_shares"], R["mv_cap"], R["mv_pe"], R["mv_under"], R["mv_vps"], R["mv_pe_trail"] = [R["h_mkt"] + i for i in range(1, 9)]
R["end_total"] = R["mv_pe_trail"]
MAX_ROW_SCAN = R["end_total"] + 5

# ----------------------------------------------------------------------------------------------------------------
# 3. STYLES
# ----------------------------------------------------------------------------------------------------------------
BLUE, BLACK, GREEN, GREY = "0000FF", "000000", "008000", "808080"
F_IN = Font(name="Calibri", size=10, color=BLUE)
F_FX = Font(name="Calibri", size=10, color=BLACK)
F_LK = Font(name="Calibri", size=10, color=GREEN)
F_LBL = Font(name="Calibri", size=10, color=BLACK)
F_LBLB = Font(name="Calibri", size=10, color=BLACK, bold=True)
F_HDR = Font(name="Calibri", size=10, color=BLACK, bold=True)
F_SEC = Font(name="Calibri", size=11, color="1F3864", bold=True)
F_TITLE = Font(name="Calibri", size=14, color="1F3864", bold=True)
F_NOTE = Font(name="Calibri", size=9, color=GREY, italic=True)
FILL_SEC = PatternFill("solid", fgColor="DDEBF7")
FILL_SUB = PatternFill("solid", fgColor="F2F2F2")
FILL_HDR = PatternFill("solid", fgColor="BDD7EE")
FILL_NA = PatternFill("solid", fgColor="EDEDED")
FILL_OK = PatternFill("solid", fgColor="C6EFCE")
FILL_BAD = PatternFill("solid", fgColor="FFC7CE")
THIN = Side(style="thin", color="BFBFBF")
B_BOTTOM = Border(bottom=Side(style="thin", color="1F3864"))
FMT = {
    "num": '#,##0.0;(#,##0.0);"-"',
    "numb": '#,##0.0;(#,##0.0);"-"',
    "pct": '0.0%;(0.0%);"-"',
    "cnt": '#,##0;(#,##0);"-"',
    "cnt1": '#,##0.0;(#,##0.0);"-"',
    "sps": '#,##0.000;(#,##0.000);"-"',
    "eps": '$#,##0.00;($#,##0.00);"-"',
    "price": '$#,##0.00',
    "date": 'yyyy-mm-dd',
    "x": '0.0"x"',
}


def q(sheet: str) -> str:
    return f"'{sheet}'!"


def setc(ws, row, col, value, font=F_FX, fmt=None, bold=False, fill=None, align=None):
    c = ws.cell(row=row, column=col, value=value)
    f = deepcopy(font)
    if bold:
        f = Font(name=f.name, size=f.size, color=f.color, bold=True, italic=f.italic)
    c.font = f
    if fmt:
        c.number_format = FMT.get(fmt, fmt)
    if fill:
        c.fill = fill
    if align:
        c.alignment = align
    return c


def is_formula(v):
    return isinstance(v, str) and v.startswith("=")


def section(ws, row, text, fill=FILL_SEC, cols=COL_NOTE):
    for col in range(1, cols + 1):
        ws.cell(row=row, column=col).fill = fill
    setc(ws, row, 1, text, font=F_SEC, fill=fill)


# ----------------------------------------------------------------------------------------------------------------
# 4. SEGMENT / TOTAL TAB BUILDERS
# ----------------------------------------------------------------------------------------------------------------
def write_header(ws, title, subtitle):
    setc(ws, R["title"], 1, title, font=F_TITLE)
    setc(ws, R["subtitle"], 1, subtitle, font=F_NOTE)
    setc(ws, R["header"], 1, "Section", font=F_HDR, fill=FILL_HDR)
    setc(ws, R["header"], 2, "Line item", font=F_HDR, fill=FILL_HDR)
    setc(ws, R["header"], COL_LAST, LAST_YR_LABEL, font=F_HDR, fill=FILL_HDR, align=Alignment(horizontal="center"))
    for i, y in enumerate(YEARS):
        setc(ws, R["header"], COL_FIRST + i, y, font=F_HDR, fill=FILL_HDR, align=Alignment(horizontal="center"))
    setc(ws, R["header"], COL_UNIT, "Units", font=F_HDR, fill=FILL_HDR)
    setc(ws, R["header"], COL_NOTE, "Notes", font=F_HDR, fill=FILL_HDR)
    ws.column_dimensions["A"].width = 13
    ws.column_dimensions["B"].width = 66
    for col in range(COL_LAST, COL_LASTYEAR + 1):
        ws.column_dimensions[L(col)].width = 11.5
    ws.column_dimensions[L(COL_LAST)].width = 17
    ws.column_dimensions[L(COL_UNIT)].width = 17
    ws.column_dimensions[L(COL_NOTE)].width = 60
    ws.freeze_panes = ws.cell(row=R["header"] + 1, column=COL_LAST)
    ws.sheet_view.zoomScale = 90


def assumption_blocks(ws, seg_key, seg, overrides):
    """Baseline, shock and scenario blocks for a segment tab."""
    a_notes = {
        "a_open": "Gross openings; net of closures drives average stores.",
        "a_close": "Fleet optimisation: mall closures / off-mall repositioning (net sq ft 'low-single-digit decline' guidance).",
        "a_sss": "Price/mix + traffic growth applied to sales per average store.",
        "a_ecom": "Includes digital-native brands (NA) and store-brand online sales.",
        "a_svc": "Extended service plans, repairs, custom design.",
        "a_oth": "Only the diamond-sourcing sales in OTHER are non-zero.",
        "a_cogs": "Signet books store occupancy in cost of sales; 1 - this = gross margin %.",
        "a_vsga": "Marginal expenses that move with sales.",
        "a_infl": "Fixed expenses grow with inflation (Session 6 guidance).",
        "a_save": "Zero: no quantified cost-savings programme disclosed. Row kept for shocks.",
        "a_ooi": "FY2027 NA: +30 tariff refunds expected by management; impairments/restructuring assumed nil going forward.",
        "a_yld": "Calibrated: reported net interest income was only 4.0 (FY26) and 9.8 (FY25) on 600-900 of cash.",
        "a_rdebt": "No funded debt at FY2026A; rate kept for interest-rate / liquidity shocks.",
        "a_tax": "FY2027 guidance 23-25% (NA/OTHER 24%); UK statutory 25% for INTL.",
        "a_dr": "CAPM: 5.24% + 1.25 x 4.20% = 10.5%; INTL +1.5pp premium. Single rate in the FY2027 column (as in Pear).",
    }
    # ---- Baseline
    section(ws, R["h_base"], "BASELINE ASSUMPTIONS (blue = hard-coded input; black '=previous cell' carries an assumption forward)")
    for key, label, unit, fmt in ASSUMPTION_ROWS:
        r = R[key]
        setc(ws, r, 1, "Baseline", font=F_NOTE)
        setc(ws, r, 2, label, font=F_LBL)
        setc(ws, r, COL_UNIT, unit, font=F_NOTE)
        setc(ws, r, COL_NOTE, a_notes.get(key, ""), font=F_NOTE)
        spec = seg["assump"][key]
        # Last Yr column: informational FY2026A value (formula where derivable from the projection, else input)
        last_formula = {
            "a_open": f"={CL}{R['openings']}", "a_close": f"={CL}{R['closures']}",
            "a_svc": f"=IF({CL}{R['rev_store']}+{CL}{R['rev_ecom']}=0,0,{CL}{R['rev_svc']}/({CL}{R['rev_store']}+{CL}{R['rev_ecom']}))",
            "a_cogs": f"=IF({CL}{R['sales']}=0,0,{CL}{R['cogs']}/{CL}{R['sales']})",
            "a_vsga": f"=IF({CL}{R['sales']}=0,0,{CL}{R['vsga']}/{CL}{R['sales']})",
            "a_ooi": f"={CL}{R['ooi']}",
            "a_tax": f"=IF({CL}{R['ebt']}=0,0,{CL}{R['tax']}/{CL}{R['ebt']})",
        }
        if key in last_formula:
            setc(ws, r, COL_LAST, last_formula[key], font=F_FX, fmt=fmt)
        elif spec.get("last") is not None:
            setc(ws, r, COL_LAST, spec["last"], font=F_IN, fmt=fmt)
        if key == "a_dr":   # single-rate assumption lives in the first model-year column only
            v = spec["proj"][0] + overrides.get((seg_key, key), 0.0)
            setc(ws, r, COL_FIRST, round(v, 6), font=F_IN, fmt=fmt)
            continue
        delta = overrides.get((seg_key, key), 0.0)
        for i in range(N_YEARS):
            col = COL_FIRST + i
            if i in spec["proj"]:
                setc(ws, r, col, round(spec["proj"][i] + delta, 6), font=F_IN, fmt=fmt)
            else:
                setc(ws, r, col, f"={L(col - 1)}{r}", font=F_FX, fmt=fmt)
    # ---- Shock
    section(ws, R["h_shock"], "SHOCK TO ASSUMPTIONS - additive shocks, all ZERO in the baseline (for use in Assignment 3(d))")
    for key, label, unit, fmt in ASSUMPTION_ROWS:
        r = R["s_" + key[2:]]
        setc(ws, r, 1, "Shock", font=F_NOTE)
        setc(ws, r, 2, "Shock: " + label, font=F_LBL)
        setc(ws, r, COL_UNIT, unit, font=F_NOTE)
        if key == "a_dr":
            setc(ws, r, COL_FIRST, 0, font=F_IN, fmt=fmt)
            continue
        for i in range(N_YEARS):
            setc(ws, r, COL_FIRST + i, 0, font=F_IN, fmt=fmt)
    # ---- Scenario = baseline + shock
    section(ws, R["h_scen"], "ASSUMPTIONS FOR SCENARIO RUN  (every cell = baseline + shock; the projection reads ONLY this block)")
    for key, label, unit, fmt in ASSUMPTION_ROWS:
        r = R["x_" + key[2:]]
        setc(ws, r, 1, "Scenario", font=F_NOTE)
        setc(ws, r, 2, "Scenario: " + label, font=F_LBL)
        setc(ws, r, COL_UNIT, unit, font=F_NOTE)
        cols = [COL_FIRST] if key == "a_dr" else range(COL_FIRST, COL_LASTYEAR + 1)
        for col in cols:
            setc(ws, r, col, f"={L(col)}{R[key]}+{L(col)}{R['s_' + key[2:]]}", font=F_FX, fmt=fmt)


def proj_formula(name, col, is_total, seg_sheets):
    """Return the formula/value for projection row `name` at column index `col` (C..M)."""
    c, p = L(col), L(col - 1)
    last = col == COL_LAST
    X = lambda k: f"{c}{R['x_' + k]}"           # scenario assumption at this column
    Rw = lambda k, cc=None: f"{(cc or c)}{R[k]}"  # projection row at column
    if is_total and name in ("stores_beg", "openings", "closures", "stores_end", "avg_stores", "rev_store", "rev_ecom", "rev_svc",
                             "rev_oth", "cogs", "vsga", "fsga", "ooi", "int_inc", "int_exp", "tax", "cash", "inv", "debt", "oliab",
                             "dcf", "tv", "pv_dcf", "pv_tv", "val_base"):
        if name in ("dcf",) and last:
            return None
        if name in ("tv", "pv_dcf", "pv_tv", "val_base") and not last:
            return None
        return "=" + "+".join(f"{q(s)}{c}{R[name]}" for s in seg_sheets)
    f = {
        "stores_beg": None if last else f"={p}{R['stores_end']}",
        "openings": None if last else f"={X('open')}",
        "closures": None if last else f"={X('close')}",
        "stores_end": f"={Rw('stores_beg')}+{Rw('openings')}-{Rw('closures')}",
        "avg_stores": f"=AVERAGE({Rw('stores_beg')},{Rw('stores_end')})",
        "sps": (f"=IF({Rw('avg_stores')}=0,0,{Rw('rev_store')}/{Rw('avg_stores')})" if (last or is_total)
                else f"={p}{R['sps']}*(1+{X('sss')})"),
        "rev_store": None if last else f"={Rw('avg_stores')}*{Rw('sps')}",
        "rev_ecom": None if last else f"={p}{R['rev_ecom']}*(1+{X('ecom')})",
        "rev_svc": None if last else f"=({Rw('rev_store')}+{Rw('rev_ecom')})*{X('svc')}",
        "rev_oth": None if last else f"={p}{R['rev_oth']}*(1+{X('oth')})",
        "sales": f"=SUM({Rw('rev_store')}:{Rw('rev_oth')})",
        "rev_growth": None if last else f"=IF({p}{R['sales']}=0,0,{Rw('sales')}/{p}{R['sales']}-1)",
        "cogs": None if last else f"={Rw('sales')}*{X('cogs')}",
        "gp": f"={Rw('sales')}-{Rw('cogs')}",
        "gm_pct": f"=IF({Rw('sales')}=0,0,{Rw('gp')}/{Rw('sales')})",
        "vsga": None if last else f"={Rw('sales')}*{X('vsga')}",
        "fsga": None if last else f"={p}{R['fsga']}*(1+{X('infl')})-{X('save')}",
        "sga": f"={Rw('vsga')}+{Rw('fsga')}",
        "sga_pct": f"=IF({Rw('sales')}=0,0,{Rw('sga')}/{Rw('sales')})",
        "ooi": None if last else f"={X('ooi')}",
        "oi": f"={Rw('gp')}-{Rw('sga')}+{Rw('ooi')}",
        "oi_pct": f"=IF({Rw('sales')}=0,0,{Rw('oi')}/{Rw('sales')})",
        "int_inc": None if last else f"={p}{R['cash']}*{X('yld')}",
        "int_exp": None if last else f"={p}{R['debt']}*{X('rdebt')}",
        "ebt": f"={Rw('oi')}+{Rw('int_inc')}-{Rw('int_exp')}",
        "ebt_pct": f"=IF({Rw('sales')}=0,0,{Rw('ebt')}/{Rw('sales')})",
        "tax": None if last else f"={Rw('ebt')}*{X('tax')}",
        "ni": f"={Rw('ebt')}-{Rw('tax')}",
        "ni_pct": f"=IF({Rw('sales')}=0,0,{Rw('ni')}/{Rw('sales')})",
        "dist": f"={Rw('ni')}",
        "retained": f"={Rw('ni')}-{Rw('dist')}",
        "dcf": None if last else f"={Rw('dist')}",
        "dr_used": (f"={CF}{R['x_dr']}" if (last and not is_total) else None),
        "tv": f"={CM}{R['eq']}" if last else None,
        "pv_dcf": f"=NPV({CL}{R['dr_used']},{CF}{R['dcf']}:{CM}{R['dcf']})" if last else None,
        "pv_tv": f"={CL}{R['tv']}/(1+{CL}{R['dr_used']})^{N_YEARS}" if last else None,
        "val_base": "SNAPSHOT" if last else None,
        "val_scen": f"={CL}{R['pv_dcf']}+{CL}{R['pv_tv']}" if last else None,
        "val_pct": f"=IF({CL}{R['val_base']}=0,0,{CL}{R['val_scen']}/{CL}{R['val_base']}-1)" if last else None,
        "val_chg": f"={CL}{R['val_scen']}-{CL}{R['val_base']}" if last else None,
        "cash": None if last else f"={p}{R['cash']}+{Rw('retained')}",
        "inv": None if last else f"={p}{R['inv']}",
        "ta": f"={Rw('cash')}+{Rw('inv')}",
        "debt": None if last else f"={p}{R['debt']}",
        "oliab": None if last else f"={p}{R['oliab']}",
        "tl": f"={Rw('debt')}+{Rw('oliab')}",
        "eq": f"={Rw('ta')}-{Rw('tl')}",
        "eq_rf": None if last else f"={Rw('eq')}-({p}{R['eq']}+{Rw('ni')}-{Rw('dist')})",
        "bs_chk": f"={Rw('ta')}-{Rw('tl')}-{Rw('eq')}",
    }
    return f[name]


LAST_INPUT_KEYS = ["stores_beg", "openings", "closures", "rev_store", "rev_ecom", "rev_svc", "rev_oth", "cogs", "vsga", "fsga",
                   "ooi", "int_inc", "int_exp", "tax", "cash", "inv", "debt", "oliab"]

PROJ_NOTES = {
    "stores_beg": "Last Yr = stores at Feb 1, 2025 (10-K FY2026).",
    "sps": "Last Yr calibrated = store merchandise sales / average stores; grows at same-store-sales assumption.",
    "rev_ecom": "Last Yr: NA 1,423.8 incl. James Allen + Blue Nile 481.5; company e-commerce 21.8% of sales.",
    "rev_svc": "FY2026 services 803.5 consolidated (10-K); attach rate assumption x merchandise sales.",
    "rev_oth": "Diamond-sourcing sales to third parties (Other segment).",
    "sales": "FY2026A ties to reported segment sales.",
    "cogs": "Segment split of consolidated 4,119.0 is a team allocation (see Assumptions & Sources).",
    "fsga": "Last Yr fixed SG&A = segment SG&A less variable component.",
    "ooi": "Last Yr: impairments & restructuring (consolidated -128.3); projection = one-time assumption row.",
    "oi": "FY2026A ties to reported segment operating income.",
    "int_inc": "Last Yr = allocated share of 4.0 net interest + 1.0 other non-operating income.",
    "tax": "Last Yr = allocated share of 103.7 (26.0% effective rate).",
    "dist": "Profits released: 100% of net income distributed (dividends + buybacks).",
    "retained": "Zero under profits released; would be positive under profits retained.",
    "dr_used": "Reads the scenario-run discount rate so a discount-rate shock flows through.",
    "pv_dcf": f"NPV over the {N_YEARS} model years (end-of-year cash flows).",
    "pv_tv": f"Terminal equity discounted {N_YEARS} years.",
    "val_base": "Hard-coded copy of the live value (blue). In 3(d), shocks move the SCENARIO value; this stays fixed.",
    "val_scen": "PV of distributable cash flows + PV of terminal equity.",
    "cash": "Static under profits released (grows only by retained earnings).",
    "inv": "Non-depreciating operating asset held flat (no working-capital build modelled).",
    "oliab": "Plug so that FY2026A simplified equity = reported shareholders' equity 1,966.2.",
    "eq": "FY2026A total = 1,966.2 reported shareholders' equity.",
}


def projection_block(ws, seg_key, seg, is_total, seg_sheets):
    section(ws, R["h_proj"], "PROJECTION  ($ millions unless stated; all formulas read the SCENARIO block, never the baseline block directly)")
    for name, label, unit, kind, fmt in PROJ_ROWS:
        r = R[name]
        if kind == "sub":
            for col in range(1, COL_NOTE + 1):
                ws.cell(row=r, column=col).fill = FILL_SUB
            setc(ws, r, 2, label, font=F_LBLB, fill=FILL_SUB)
            setc(ws, r, 1, {"sub_ops": "Drivers", "sub_is": "Income stmt", "sub_val": "Valuation", "sub_bs": "Balance sheet"}[name], font=F_NOTE, fill=FILL_SUB)
            continue
        if kind == "blank":
            continue
        bold = fmt == "numb" or name in ("val_base", "val_scen")
        setc(ws, r, 2, label, font=F_LBLB if bold else F_LBL)
        setc(ws, r, COL_UNIT, unit, font=F_NOTE)
        note = PROJ_NOTES.get(name, "")
        if is_total and name == "dr_used":
            note = "n/a at total level: discount rates are applied segment by segment."
        if is_total and name == "val_base":
            note = "Sum of the three segment baseline snapshots (green links)."
        setc(ws, r, COL_NOTE, note, font=F_NOTE)
        for col in range(COL_LAST, COL_LASTYEAR + 1):
            if col > COL_LAST and name in ("dr_used", "tv", "pv_dcf", "pv_tv", "val_base", "val_scen", "val_pct", "val_chg"):
                continue
            val = proj_formula(name, col, is_total, seg_sheets)
            if col == COL_LAST and name in LAST_INPUT_KEYS and not is_total:
                setc(ws, r, col, seg["last"][name], font=F_IN, fmt=fmt)
                continue
            if val == "SNAPSHOT":
                continue  # written separately (snapshot or temporary formula)
            if val is None:
                continue
            font = F_LK if (is_total and "!" in val) else F_FX
            setc(ws, r, col, val, font=font, fmt=fmt, bold=bold)
        if is_total and name == "dr_used":
            setc(ws, r, COL_LAST, "n/a", font=F_NOTE, align=Alignment(horizontal="right"))


def write_snapshot(ws, is_total, seg_sheets, snapshot_value):
    r, col = R["val_base"], COL_LAST
    if is_total:
        setc(ws, r, col, "=" + "+".join(f"{q(s)}{CL}{r}" for s in seg_sheets), font=F_LK, fmt="numb", bold=True)
    elif snapshot_value is None:
        setc(ws, r, col, f"={CL}{R['val_scen']}", font=F_FX, fmt="numb", bold=True)   # pass 1: temporary live formula
    else:
        setc(ws, r, col, round(float(snapshot_value), 2), font=F_IN, fmt="numb", bold=True)


def build_segment(wb, seg_key, seg, overrides, snapshot):
    ws = wb.create_sheet(seg["sheet"])
    write_header(ws, f"Signet Jewelers - Baseline Value-Based ERM Model - Segment: {seg['title']}",
                 f"{seg['desc']}  Units: $ millions (one decimal) unless stated; fiscal years end about January 31 (FY2026 = year ended Jan 31, 2026). "
                 "Blue = hard-coded input, black = formula, green = link to another tab.")
    assumption_blocks(ws, seg_key, seg, overrides)
    projection_block(ws, seg_key, seg, False, None)
    write_snapshot(ws, False, None, (snapshot or {}).get(seg_key))
    finish_sheet(ws, R["end_grid"])
    return ws


def build_total(wb, seg_sheets):
    ws = wb.create_sheet("Total Company")
    write_header(ws, "Signet Jewelers - Baseline Value-Based ERM Model - TOTAL COMPANY (sum of Model - NA, Model - INTL, Model - OTHER)",
                 "Same layout as the segment tabs. The three assumption blocks are intentionally blank: assumptions are applied at the "
                 "business-segment level. Every financial-statement line is the sum of the three segment tabs (green); ratios and key "
                 "metrics are recomputed here at the total-company level.")
    for hdr, prefix, text in (("h_base", "", "BASELINE ASSUMPTIONS - blank at total level (set in the segment tabs)"),
                              ("h_shock", "s_", "SHOCK TO ASSUMPTIONS - blank at total level"),
                              ("h_scen", "x_", "ASSUMPTIONS FOR SCENARIO RUN - blank at total level")):
        section(ws, R[hdr], text)
        for key, label, unit, fmt in ASSUMPTION_ROWS:
            r = R[(prefix + key[2:]) if prefix else key]
            setc(ws, r, 2, label, font=F_LBL)
            setc(ws, r, COL_UNIT, unit, font=F_NOTE)
            for col in range(COL_LAST, COL_LASTYEAR + 1):
                ws.cell(row=r, column=col).fill = FILL_NA
            setc(ws, r, COL_NOTE, "n/a - segment-level assumption", font=F_NOTE)
    projection_block(ws, "TOTAL", None, True, seg_sheets)
    write_snapshot(ws, True, seg_sheets, None)
    # ---- Key metrics (total company only)
    m, g = INPUTS["market"], INPUTS["guidance"]
    section(ws, R["h_metrics"], "KEY METRICS (total company level)")
    setc(ws, R["shares"], 2, "Diluted weighted average shares (millions)", font=F_LBL)
    setc(ws, R["shares"], COL_LAST, m["diluted_shares_fy26"], font=F_IN, fmt="cnt1")
    setc(ws, R["shares"], COL_FIRST, g["shares_fy27"], font=F_IN, fmt="cnt1")
    for col in range(COL_FIRST + 1, COL_LASTYEAR + 1):
        setc(ws, R["shares"], col, f"={L(col - 1)}{R['shares']}", font=F_FX, fmt="cnt1")
    setc(ws, R["shares"], COL_UNIT, "millions", font=F_NOTE)
    setc(ws, R["shares"], COL_NOTE, "FY2026A implied (294.4 / $7.08); FY2027 per guidance (~38.8M); held flat thereafter (buybacks not modelled).", font=F_NOTE)
    setc(ws, R["eps"], 2, "Diluted EPS (net income / diluted shares)", font=F_LBLB)
    setc(ws, R["roe"], 2, "Return on equity (net income / prior-year equity; Last Yr on year-end equity)", font=F_LBL)
    setc(ws, R["payout"], 2, "Distributions / net income (payout ratio)", font=F_LBL)
    for col in range(COL_LAST, COL_LASTYEAR + 1):
        c, p = L(col), L(col - 1)
        setc(ws, R["eps"], col, f"=IF({c}{R['shares']}=0,0,{c}{R['ni']}/{c}{R['shares']})", font=F_FX, fmt="eps", bold=True)
        eqref = f"{c}{R['eq']}" if col == COL_LAST else f"{p}{R['eq']}"
        setc(ws, R["roe"], col, f"=IF({eqref}=0,0,{c}{R['ni']}/{eqref})", font=F_FX, fmt="pct")
        setc(ws, R["payout"], col, f"=IF({c}{R['ni']}=0,0,{c}{R['dist']}/{c}{R['ni']})", font=F_FX, fmt="pct")
    for k in ("eps", "roe", "payout"):
        setc(ws, R[k], COL_UNIT, {"eps": "$ per share", "roe": "%", "payout": "%"}[k], font=F_NOTE)
    setc(ws, R["eps"], COL_NOTE, f"FY2027 adjusted EPS guidance ${g['adj_eps_lo']:.2f}-{g['adj_eps_hi']:.2f}; consensus $10.76 (FY27), $12.27 (FY28).", font=F_NOTE)
    # ---- Actual market valuation
    section(ws, R["h_mkt"], "ACTUAL MARKET VALUATION (reasonableness check vs. model baseline value)")
    rows = [
        ("mv_date", "Valuation date", m["date"], F_IN, "date", "date"),
        ("mv_price", "SIG share price (NYSE close)", m["price"], F_IN, "price", "$ per share"),
        ("mv_shares", "Common shares outstanding (estimate)", m["shares_out"], F_IN, "cnt1", "millions"),
        ("mv_cap", "Market capitalization", f"={CL}{R['mv_price']}*{CL}{R['mv_shares']}", F_FX, "numb", "$M"),
        ("mv_pe", "P/E on FY2027E model net income", f"=IF({CF}{R['ni']}=0,0,{CL}{R['mv_cap']}/{CF}{R['ni']})", F_FX, "x", "x"),
        ("mv_under", "Model baseline value / market cap - 1  ('under-valuation' if positive)", f"=IF({CL}{R['mv_cap']}=0,0,{CL}{R['val_base']}/{CL}{R['mv_cap']}-1)", F_FX, "pct", "%"),
        ("mv_vps", "Model baseline value per share", f"=IF({CL}{R['mv_shares']}=0,0,{CL}{R['val_base']}/{CL}{R['mv_shares']})", F_FX, "price", "$ per share"),
        ("mv_pe_trail", "P/E on FY2026A reported net income", f"=IF({CL}{R['ni']}=0,0,{CL}{R['mv_cap']}/{CL}{R['ni']})", F_FX, "x", "x"),
    ]
    notes = {"mv_price": "Yahoo Finance close, Oct 9, 2026 ($100.58 on Oct 2).",
             "mv_shares": "MarketBeat 38.3M / Google Finance 37.3M; Q2 FY27 diluted 39.3M before the $125M ASR.",
             "mv_under": "A gap inside +/-30% is treated as plausible for this exercise (Checks tab)."}
    for key, label, val, font, fmt, unit in rows:
        setc(ws, R[key], 2, label, font=F_LBLB if key in ("mv_cap", "mv_under") else F_LBL)
        setc(ws, R[key], COL_LAST, val, font=font, fmt=fmt, bold=key in ("mv_cap", "mv_under"))
        setc(ws, R[key], COL_UNIT, unit, font=F_NOTE)
        setc(ws, R[key], COL_NOTE, notes.get(key, ""), font=F_NOTE)
    finish_sheet(ws, R["end_total"])
    return ws


def finish_sheet(ws, last_row):
    ws.print_area = f"A1:{L(COL_NOTE)}{last_row}"
    ws.page_setup.orientation = "landscape"
    ws.page_setup.paperSize = ws.PAPERSIZE_LETTER
    ws.sheet_properties.pageSetUpPr.fitToPage = True
    ws.page_setup.fitToWidth = 1
    ws.page_setup.fitToHeight = 0
    ws.print_title_rows = f"{R['header']}:{R['header']}"
    ws.oddFooter.center.text = "&A - Page &P of &N"


# ----------------------------------------------------------------------------------------------------------------
# 5. SUMMARY & CHART, CHECKS, COVER, ASSUMPTIONS & SOURCES
# ----------------------------------------------------------------------------------------------------------------
SEG_ORDER = ["NA", "INTL", "OTHER"]


def build_summary(wb, sens_rows):
    ws = wb.create_sheet("Summary & Chart")
    segs = INPUTS["segments"]
    setc(ws, 1, 1, "Signet Jewelers - Baseline Company Value by Business Segment", font=F_TITLE)
    setc(ws, 2, 1, "$ millions. Values are links to the model tabs (green). Charts are native Excel charts linked to the cells below.", font=F_NOTE)
    hdr = ["Business segment", "Baseline value ($M)", "% of total", "Discount rate", "FY2026A sales ($M)", "FY2027E net income ($M)"]
    for j, h in enumerate(hdr):
        setc(ws, 4, 2 + j, h, font=F_HDR, fill=FILL_HDR, align=Alignment(horizontal="center", wrap_text=True))
    r0 = 5
    for i, k in enumerate(SEG_ORDER):
        s = segs[k]["sheet"]; r = r0 + i
        setc(ws, r, 2, segs[k]["title"], font=F_LBL)
        setc(ws, r, 3, f"={q(s)}{CL}{R['val_base']}", font=F_LK, fmt="numb")
        setc(ws, r, 4, f"=IF($C${r0 + 3}=0,0,C{r}/$C${r0 + 3})", font=F_FX, fmt="pct")
        setc(ws, r, 5, f"={q(s)}{CL}{R['dr_used']}", font=F_LK, fmt="pct")
        setc(ws, r, 6, f"={q(s)}{CL}{R['sales']}", font=F_LK, fmt="num")
        setc(ws, r, 7, f"={q(s)}{CF}{R['ni']}", font=F_LK, fmt="num")
    rt = r0 + 3
    setc(ws, rt, 2, "Total company (sum of segments)", font=F_LBLB)
    setc(ws, rt, 3, f"=SUM(C{r0}:C{rt - 1})", font=F_FX, fmt="numb", bold=True)
    setc(ws, rt, 4, f"=SUM(D{r0}:D{rt - 1})", font=F_FX, fmt="pct", bold=True)
    setc(ws, rt, 6, f"=SUM(F{r0}:F{rt - 1})", font=F_FX, fmt="numb", bold=True)
    setc(ws, rt, 7, f"=SUM(G{r0}:G{rt - 1})", font=F_FX, fmt="numb", bold=True)
    for col in range(2, 8):
        ws.cell(row=rt, column=col).border = Border(top=Side(style="thin"), bottom=Side(style="double"))
    setc(ws, rt + 1, 2, "Market capitalization (Oct 9, 2026; $105.22 x 37.5M shares)", font=F_LBL)
    setc(ws, rt + 1, 3, f"={q('Total Company')}{CL}{R['mv_cap']}", font=F_LK, fmt="numb")
    setc(ws, rt + 2, 2, "Model value / market cap - 1", font=F_LBL)
    setc(ws, rt + 2, 3, f"={q('Total Company')}{CL}{R['mv_under']}", font=F_LK, fmt="pct")
    setc(ws, rt + 3, 2, "Model value per share ($)", font=F_LBL)
    setc(ws, rt + 3, 3, f"={q('Total Company')}{CL}{R['mv_vps']}", font=F_LK, fmt="price")
    # ---- Chart 1: value by segment (clustered column; OTHER is negative so a stacked bar would mislead)
    ch = BarChart(); ch.type = "col"; ch.grouping = "clustered"; ch.style = 10
    ch.title = "Signet Baseline Company Value by Business Segment ($M)"
    ch.y_axis.title = "$ millions"; ch.x_axis.title = None
    ch.y_axis.numFmt = '#,##0'; ch.y_axis.majorGridlines = None
    ch.x_axis.delete = False; ch.y_axis.delete = False
    data = Reference(ws, min_col=3, min_row=4, max_row=rt)
    cats = Reference(ws, min_col=2, min_row=r0, max_row=rt)
    ch.add_data(data, titles_from_data=True); ch.set_categories(cats)
    ch.legend = None
    ch.dataLabels = DataLabelList(); ch.dataLabels.showVal = True; ch.dataLabels.numFmt = '#,##0'
    for flag in ("showSerName", "showCatName", "showLegendKey", "showPercent", "showBubbleSize", "showLeaderLines"):
        setattr(ch.dataLabels, flag, False)
    ch.height, ch.width = 9.5, 18
    ws.add_chart(ch, "I4")
    # ---- Chart 2 data: total revenue & net income by year
    r2 = rt + 6
    setc(ws, r2 - 1, 2, "Projected total company sales and net income by year ($M; links to Total Company tab)", font=F_LBLB)
    setc(ws, r2, 2, "Fiscal year", font=F_HDR, fill=FILL_HDR)
    setc(ws, r2 + 1, 2, "Total sales", font=F_LBL)
    setc(ws, r2 + 2, 2, "Net income", font=F_LBL)
    setc(ws, r2 + 3, 2, "Operating income", font=F_LBL)
    for i, col in enumerate(range(COL_LAST, COL_LASTYEAR + 1)):
        cc = 3 + i
        setc(ws, r2, cc, "FY2026A" if col == COL_LAST else YEARS[i - 1], font=F_HDR, fill=FILL_HDR, align=Alignment(horizontal="center"))
        setc(ws, r2 + 1, cc, f"={q('Total Company')}{L(col)}{R['sales']}", font=F_LK, fmt="num")
        setc(ws, r2 + 2, cc, f"={q('Total Company')}{L(col)}{R['ni']}", font=F_LK, fmt="num")
        setc(ws, r2 + 3, cc, f"={q('Total Company')}{L(col)}{R['oi']}", font=F_LK, fmt="num")
    lc = LineChart(); lc.title = "Projected Total Company Sales and Net Income ($M)"; lc.style = 12
    lc.y_axis.title = "$ millions"; lc.y_axis.numFmt = '#,##0'
    lc.x_axis.delete = False; lc.y_axis.delete = False
    d = Reference(ws, min_col=2, max_col=3 + N_YEARS, min_row=r2 + 1, max_row=r2 + 2)
    lc.add_data(d, from_rows=True, titles_from_data=True)
    lc.set_categories(Reference(ws, min_col=3, max_col=3 + N_YEARS, min_row=r2))
    lc.height, lc.width = 9, 18
    ws.add_chart(lc, f"I{r2 + 6}")
    # ---- Sensitivity table (values from build/sensitivity.py runs, not formulas)
    r3 = r2 + 7
    setc(ws, r3, 2, "Sensitivity of total company baseline value (computed by re-running the model with build/build_model.py; pasted values)", font=F_LBLB)
    heads = ["Assumption shocked (all years, all segments unless stated)", "Value: -1pp / less ($M)", "Base ($M)", "Value: +1pp / more ($M)", "Change for +1pp ($M)", "Change for +1pp (%)"]
    for j, h in enumerate(heads):
        setc(ws, r3 + 1, 2 + j, h, font=F_HDR, fill=FILL_HDR, align=Alignment(horizontal="center", wrap_text=True))
    if sens_rows:
        for i, row in enumerate(sens_rows):
            rr = r3 + 2 + i
            setc(ws, rr, 2, row["label"], font=F_LBL)
            setc(ws, rr, 3, round(row["minus"], 1), font=F_IN, fmt="num")
            setc(ws, rr, 4, round(row["base"], 1), font=F_IN, fmt="num")
            setc(ws, rr, 5, round(row["plus"], 1), font=F_IN, fmt="num")
            setc(ws, rr, 6, f"=E{rr}-D{rr}", font=F_FX, fmt="num")
            setc(ws, rr, 7, f"=IF(D{rr}=0,0,E{rr}/D{rr}-1)", font=F_FX, fmt="pct")
    else:
        setc(ws, r3 + 2, 2, "(sensitivity runs not available in this build)", font=F_NOTE)
    ws.column_dimensions["A"].width = 3; ws.column_dimensions["B"].width = 58
    for col in range(3, 3 + N_YEARS + 1):
        ws.column_dimensions[L(col)].width = 12
    ws.row_dimensions[4].height = 30
    ws.print_area = f"A1:T{max(r3 + 12, r2 + 26)}"
    ws.page_setup.orientation = "landscape"; ws.sheet_properties.pageSetUpPr.fitToPage = True
    ws.page_setup.fitToWidth = 1; ws.page_setup.fitToHeight = 0
    return ws


def build_checks(wb):
    ws = wb.create_sheet("Checks")
    segs = INPUTS["segments"]; rep = INPUTS["reported"]; g = INPUTS["guidance"]
    S = [segs[k]["sheet"] for k in SEG_ORDER]
    T = "Total Company"
    setc(ws, 1, 1, "Model integrity checks (formula-driven; every row must be TRUE)", font=F_TITLE)
    setc(ws, 2, 1, "Tolerances: $0.05M for ties to reported figures, $0.001M for internal identities.", font=F_NOTE)
    for j, h in enumerate(["#", "Check", "Result", "Measured value", "Tolerance / target"]):
        setc(ws, 4, 1 + j, h, font=F_HDR, fill=FILL_HDR)
    rng = lambda sh, row, c1=CL, c2=CM: f"{q(sh)}{c1}{row}:{c2}{row}"
    tol = 0.001
    checks = []
    for name, lbl in (("sales", "sales"), ("oi", "operating income"), ("ni", "net income"), ("eq", "shareholders' equity"), ("cash", "cash")):
        f = f"=SUMPRODUCT(ABS({rng(T, R[name])}-{rng(S[0], R[name])}-{rng(S[1], R[name])}-{rng(S[2], R[name])}))"
        checks.append((f"Total Company {lbl} = NA + INTL + OTHER in every year (FY2026A-FY2036)", f"{f}<{tol}", f, f"< {tol}"))
    for name, key, lbl in (("sales", "sales", "consolidated sales"), ("oi", "oi", "consolidated operating income"), ("ni", "ni", "consolidated net income"), ("eq", "equity", "shareholders' equity")):
        f = f"={q(T)}{CL}{R[name]}"
        checks.append((f"FY2026A {lbl} reproduces reported {rep[key]:,.1f}", f"=ABS({f[1:]}-{rep[key]})<0.05", f, f"{rep[key]:,.1f} +/- 0.05"))
    for k in SEG_ORDER:
        sh = segs[k]["sheet"]
        checks.append((f"FY2026A {segs[k]['title']} sales = reported {rep['seg_sales'][k]:,.1f}", f"=ABS({q(sh)}{CL}{R['sales']}-{rep['seg_sales'][k]})<0.05", f"={q(sh)}{CL}{R['sales']}", f"{rep['seg_sales'][k]:,.1f}"))
        checks.append((f"FY2026A {segs[k]['title']} operating income = reported {rep['seg_oi'][k]:,.1f}", f"=ABS({q(sh)}{CL}{R['oi']}-{rep['seg_oi'][k]})<0.05", f"={q(sh)}{CL}{R['oi']}", f"{rep['seg_oi'][k]:,.1f}"))
    f = "=" + "+".join(f"SUMPRODUCT(ABS({rng(sh, R['bs_chk'])}))" for sh in S + [T])
    checks.append(("Balance sheet balances (assets = liabilities + equity) every year in every tab", f"{f}<{tol}", f, f"< {tol}"))
    f = "=" + "+".join(f"SUMPRODUCT(ABS({rng(sh, R['eq_rf'], CF)}))" for sh in S + [T])
    checks.append(("Equity roll-forward Equity(t) = Equity(t-1) + NI(t) - Distributions(t) holds every year in every tab", f"{f}<{tol}", f, f"< {tol}"))
    for k in SEG_ORDER:
        sh = segs[k]["sheet"]
        base = f"{q(sh)}{CF}{R['a_open']}:{CM}{R['a_dr']}"
        shock = f"{q(sh)}{CF}{R['s_open']}:{CM}{R['s_dr']}"
        scen = f"{q(sh)}{CF}{R['x_open']}:{CM}{R['x_dr']}"
        f = f"=SUMPRODUCT(ABS({scen}-{base}-{shock}))"
        checks.append((f"{segs[k]['title']}: scenario assumptions = baseline + shock for every cell", f"{f}<0.0000001", f, "< 1e-7"))
        f = f"=SUMPRODUCT(ABS({shock}))"
        checks.append((f"{segs[k]['title']}: all shock cells are zero (baseline run)", f"{f}=0", f, "0"))
    for k in SEG_ORDER:
        sh = segs[k]["sheet"]
        f = f"=ABS({q(sh)}{CL}{R['val_base']}-{q(sh)}{CL}{R['val_scen']})"
        checks.append((f"{segs[k]['title']}: baseline snapshot value = live scenario-run value", f"{f}<0.05", f, "< 0.05"))
    seg_sum = "+".join(f"{q(sh)}{CL}{R['val_base']}" for sh in S)
    f = f"=ABS({q(T)}{CL}{R['val_base']}-({seg_sum}))"
    checks.append(("Company baseline value = sum of the three segment values", f"{f}<{tol}", f, f"< {tol}"))
    f = "=" + "+".join(f"SUMPRODUCT(ISERROR({q(sh)}A1:{L(COL_NOTE)}{MAX_ROW_SCAN})*1)" for sh in S + [T, "Summary & Chart", "Assumptions & Sources"])
    checks.append(("No #REF!, #DIV/0!, #VALUE!, #N/A or #NAME? anywhere in the model, summary and assumptions tabs (Cover excluded to avoid a circular reference with its status cell)", f"{f}=0", f, "0 error cells"))
    checks.append((f"FY2027E total sales inside management guidance ${g['sales_lo']:,.0f}-{g['sales_hi']:,.0f}M",
                   f"=AND({q(T)}{CF}{R['sales']}>={g['sales_lo']},{q(T)}{CF}{R['sales']}<={g['sales_hi']})", f"={q(T)}{CF}{R['sales']}", f"{g['sales_lo']:,.0f} - {g['sales_hi']:,.0f}"))
    checks.append((f"FY2027E operating income inside adjusted operating income guidance ${g['adj_oi_lo']:,.0f}-{g['adj_oi_hi']:,.0f}M",
                   f"=AND({q(T)}{CF}{R['oi']}>={g['adj_oi_lo']},{q(T)}{CF}{R['oi']}<={g['adj_oi_hi']})", f"={q(T)}{CF}{R['oi']}", f"{g['adj_oi_lo']:,.0f} - {g['adj_oi_hi']:,.0f}"))
    checks.append((f"FY2027E diluted EPS inside adjusted EPS guidance ${g['adj_eps_lo']:.2f}-{g['adj_eps_hi']:.2f}",
                   f"=AND({q(T)}{CF}{R['eps']}>={g['adj_eps_lo']},{q(T)}{CF}{R['eps']}<={g['adj_eps_hi']})", f"={q(T)}{CF}{R['eps']}", f"{g['adj_eps_lo']:.2f} - {g['adj_eps_hi']:.2f}"))
    checks.append(("Model company value within +/-30% of market capitalization", f"=ABS({q(T)}{CL}{R['mv_under']})<=0.3", f"={q(T)}{CL}{R['mv_under']}", "|gap| <= 30%"))
    r = 5
    for i, (desc, test, measured, target) in enumerate(checks, start=1):
        setc(ws, r, 1, i, font=F_LBL)
        setc(ws, r, 2, desc, font=F_LBL)
        setc(ws, r, 3, test, font=F_FX, align=Alignment(horizontal="center"))
        setc(ws, r, 4, measured, font=F_FX, fmt='#,##0.000;(#,##0.000);"-"')
        setc(ws, r, 5, target, font=F_NOTE)
        r += 1
    last = r - 1
    setc(ws, r + 1, 2, "ALL CHECKS PASS?", font=F_LBLB)
    setc(ws, r + 1, 3, f"=AND(C5:C{last})", font=F_FX, bold=True, align=Alignment(horizontal="center"))
    R["checks_overall"] = r + 1
    setc(ws, r + 2, 2, "Structural check performed by build/build_model.py (not a formula): no projection formula references the baseline block directly.", font=F_NOTE)
    for rng_ in (f"C5:C{last}", f"C{r + 1}"):
        ws.conditional_formatting.add(rng_, CellIsRule(operator="equal", formula=["TRUE"], fill=FILL_OK))
        ws.conditional_formatting.add(rng_, CellIsRule(operator="equal", formula=["FALSE"], fill=FILL_BAD))
    ws.column_dimensions["A"].width = 5; ws.column_dimensions["B"].width = 100
    ws.column_dimensions["C"].width = 12; ws.column_dimensions["D"].width = 18; ws.column_dimensions["E"].width = 22
    ws.freeze_panes = "A5"
    ws.print_area = f"A1:E{r + 2}"; ws.page_setup.orientation = "landscape"
    ws.sheet_properties.pageSetUpPr.fitToPage = True; ws.page_setup.fitToWidth = 1; ws.page_setup.fitToHeight = 0
    return ws


def build_cover(wb):
    ws = wb.create_sheet("Cover", 0)
    meta = INPUTS["meta"]; segs = INPUTS["segments"]
    setc(ws, 1, 2, "Signet Jewelers Limited (NYSE: SIG)", font=F_TITLE)
    setc(ws, 2, 2, "Baseline Value-Based ERM Model - Case Assignment #3(a)", font=Font(name="Calibri", size=13, bold=True, color="1F3864"))
    rows = [
        ("Course", meta["course"]),
        ("Team", meta["team"]),
        ("Deliverable date", meta["build_date"].strftime("%B %d, %Y") + f"  (due {meta['due']})"),
        ("Model units", "$ millions to one decimal; rates to 0.1%; store counts in units; fiscal years end about January 31 "
                        "(FY2026A = actual year ended January 31, 2026; FY2027-FY2036 = ten projected years)."),
        ("Valuation approach", "Profits released: each segment distributes 100% of net income to shareholders every year, so the simplified "
                               "balance sheet is static, and segment value = NPV at the segment cost of equity of FY2027-FY2036 distributable "
                               "cash flows plus the present value of terminal equity (= FY2036 shareholders' equity). Company value is the sum "
                               "of the three segment values; the choice is justified because Signet's dividends plus buybacks have run at "
                               "roughly 85-110% of underlying earnings (FY2026: $257M vs $294M net income; H1 FY2027: $197M vs about $84M)."),
    ]
    r = 4
    for k, v in rows:
        setc(ws, r, 2, k, font=F_LBLB); setc(ws, r, 3, v, font=F_LBL, align=Alignment(wrap_text=True, vertical="top")); r += 1
    r += 1
    setc(ws, r, 2, "Model integrity status", font=F_LBLB)
    setc(ws, r, 3, f"=IF({q('Checks')}C{R['checks_overall']},\"ALL CHECKS PASS\",\"CHECK FAILURES - see Checks tab\")", font=F_LK, bold=True)
    R["cover_status"] = r
    ws.conditional_formatting.add(f"C{r}", CellIsRule(operator="equal", formula=['"ALL CHECKS PASS"'], fill=FILL_OK))
    ws.conditional_formatting.add(f"C{r}", CellIsRule(operator="notEqual", formula=['"ALL CHECKS PASS"'], fill=FILL_BAD))
    r += 2
    setc(ws, r, 2, "Colour legend", font=F_LBLB); r += 1
    setc(ws, r, 2, "Blue font", font=F_IN); setc(ws, r, 3, "Hard-coded input (assumption, FY2026A actual or snapshot)", font=F_LBL); r += 1
    setc(ws, r, 2, "Black font", font=F_FX); setc(ws, r, 3, "Formula within the tab", font=F_LBL); r += 1
    setc(ws, r, 2, "Green font", font=F_LK); setc(ws, r, 3, "Link to another tab", font=F_LBL); r += 1
    setc(ws, r, 2, "Light-blue fill", font=F_LBL, fill=FILL_SEC); setc(ws, r, 3, "Section header; grey fill = sub-header; grey cells on the Total tab = intentionally blank assumptions", font=F_LBL); r += 2
    setc(ws, r, 2, "Tab map", font=F_LBLB); r += 1
    tabs = [
        ("Cover", "This page."),
        ("Assumptions & Sources", "Every baseline assumption with value, rationale and APA source; reclassifications; questions for the lecturer/TAs; limitations; reference list."),
        ("Model - NA", f"North America segment: baseline assumptions -> shock -> scenario -> projection, valuation and balance sheet. {segs['NA']['desc']}"),
        ("Model - INTL", f"International segment, identical layout. {segs['INTL']['desc']}"),
        ("Model - OTHER", f"Other / corporate, identical layout. {segs['OTHER']['desc']}"),
        ("Total Company", "Same layout; assumptions blank; every financial line = sum of the three segments; EPS, ROE, payout and the actual-market-valuation check."),
        ("Summary & Chart", "Segment value table, native chart 'Signet Baseline Company Value by Business Segment ($M)', sales/net income chart, sensitivity table."),
        ("Checks", "Formula-driven TRUE/FALSE integrity checks feeding the status cell above."),
    ]
    for t, d in tabs:
        setc(ws, r, 2, t, font=F_LBL); setc(ws, r, 3, d, font=F_LBL, align=Alignment(wrap_text=True, vertical="top")); r += 1
    r += 1
    setc(ws, r, 2, "Row layout", font=F_LBLB)
    setc(ws, r, 3, f"All four model tabs share one row layout: baseline assumptions rows {R['a_open']}-{R['a_dr']}, shocks rows {R['s_open']}-{R['s_dr']}, "
                   f"scenario rows {R['x_open']}-{R['x_dr']}, projection rows {R['stores_beg']}-{R['bs_chk']} (total sales row {R['sales']}, operating income row {R['oi']}, "
                   f"net income row {R['ni']}, segment value rows {R['val_base']}-{R['val_chg']}, equity row {R['eq']}). Risk tabs in 3(d) can therefore reference the same cells across segments.",
         font=F_LBL, align=Alignment(wrap_text=True, vertical="top"))
    r += 2
    setc(ws, r, 2, "Reproducibility", font=F_LBLB)
    setc(ws, r, 3, "Generated by build/build_model.py (openpyxl); all inputs are in one dictionary at the top of that script with the source beside each. "
                   "The workbook contains live Excel formulas only (no macros, no external links). Excel recalculates on open.", font=F_LBL, align=Alignment(wrap_text=True, vertical="top"))
    ws.column_dimensions["A"].width = 3; ws.column_dimensions["B"].width = 26; ws.column_dimensions["C"].width = 120
    for rr in range(4, r + 1):
        ws.row_dimensions[rr].height = None
    ws.print_area = f"A1:C{r}"; ws.page_setup.orientation = "landscape"
    ws.sheet_properties.pageSetUpPr.fitToPage = True; ws.page_setup.fitToWidth = 1; ws.page_setup.fitToHeight = 0
    return ws


ASSUMPTION_DOC = [
    # group, assumption, segment, value, rationale, source
    ("Revenue drivers", "Store count roll-forward: gross openings", "NA", "FY27 6; FY28 10; FY29 10; FY30+ 12 per year",
     "Signet opened 14 stores in FY2026 and only 3 in H1 FY2027 while it reorients toward off-mall formats; openings recover modestly as repositioned stores open.",
     "Signet Jewelers Limited (2026a, 2026d)"),
    ("Revenue drivers", "Store count roll-forward: closures", "NA", "FY27 70; FY28 50; FY29 40; FY30 30; FY31 25; FY32+ 20",
     "64 closures in FY2026 and 50 already in H1 FY2027; management guides to a low-single-digit decline in net square footage. Closures taper as the mall-heavy portion of the fleet shrinks.",
     "Signet Jewelers Limited (2026a, 2026c, 2026d)"),
    ("Revenue drivers", "Store count roll-forward", "INTL", "Openings 2 per year; closures 4 (FY27), 5 (FY28-FY31), 4 thereafter",
     "International closed 10 stores in FY2026 and 3 in H1 FY2027 with 2 openings; a slow net reduction of the UK/ROI estate continues.",
     "Signet Jewelers Limited (2026a, 2026d)"),
    ("Revenue drivers", "Store count roll-forward", "OTHER", "Zero stores, openings and closures", "The Other segment and corporate have no retail stores; rows kept at zero per the 'same layout' guideline.", "Signet Jewelers Limited (2026a)"),
    ("Revenue drivers", "Same-store sales growth (sales per average store)", "NA", "FY27 1.5%; FY28+ 2.0%",
     "FY2026 NA same-store sales +1.2%, Q2 FY2027 +2.2%, FY2027 guidance flat to +2.5%. Long-run 2.0% is in line with FOMC PCE inflation of 2.1-2.3% and a mature, share-gaining retailer; consensus revenue growth is 1.2-1.6% a year after net closures.",
     "Signet Jewelers Limited (2026b, 2026c); Board of Governors of the Federal Reserve System (2026b); Yahoo Finance (2026)"),
    ("Revenue drivers", "Same-store sales growth", "INTL", "2.0% every year", "FY2026 International same-store sales +2.6% (5.3% constant-currency total growth); UK CPI about 3% in early 2027 falling toward 2%; IMF UK GDP 1.3-1.5%.", "Signet Jewelers Limited (2026b); International Monetary Fund (2026a); Vanguard (2026)"),
    ("Revenue drivers", "E-commerce merchandise sales growth", "NA", "FY27 3.0%; FY28+ 4.0%",
     "E-commerce is 21.8% of sales. The digital brands (James Allen, Blue Nile, $481.5M) shrank and were impaired in FY2025-26 and are now stabilised under 'Grow Brand Love'; omnichannel growth of the store brands lifts the blended rate slightly above store growth.",
     "Signet Jewelers Limited (2026a, 2026f)"),
    ("Revenue drivers", "E-commerce merchandise sales growth", "INTL", "3.0% every year", "H.Samuel and Ernest Jones online growth assumed at nominal UK demand growth.", "Signet Jewelers Limited (2026a)"),
    ("Revenue drivers", "Services attach rate (% of merchandise sales)", "NA / INTL", "NA 13.6% (FY26A) -> 13.8% (FY27) -> 14.0% (FY28+); INTL 11.1% flat",
     "Services revenue grew 7.8% to $803.5M in FY2026 on extended-service-plan strength while merchandise was flat, so attach rises modestly then stabilises. International attach set lower (less ESP penetration).",
     "Signet Jewelers Limited (2026a, 2026b)"),
    ("Revenue drivers", "Other (diamond sourcing) revenue growth", "OTHER", "2.0% every year", "Third-party rough/polished diamond sales ($39.6M) grow with inflation; natural-diamond price weakness caps upside.", "Signet Jewelers Limited (2026a)"),
    ("Expense drivers", "Cost of sales % of total sales", "NA", "FY26A 59.8% -> 59.3% from FY27",
     "Consolidated gross margin was 39.5% (39.2% FY25). The new Bread Financial credit agreement adds $30-40M of margin/non-comp revenue from FY2027 (about 0.5pp of NA sales); gold-cost and tariff headwinds assumed to offset the services mix benefit thereafter.",
     "Signet Jewelers Limited (2026a, 2026c); CNBC (2026)"),
    ("Expense drivers", "Cost of sales % of total sales", "INTL", "68.0% flat", "International gross margin estimated at 32% (FY2025 implied about 30% from segment SG&A of $103.1M and operating income of $1.0M incl. $7.8M one-offs); UK fashion/watch mix is lower-margin than NA bridal.", "Signet Jewelers Limited (2025a, 2026b)"),
    ("Expense drivers", "Cost of sales % of total sales", "OTHER", "92.0% flat", "Diamond trading is a low-margin pass-through activity.", "Team estimate"),
    ("Expense drivers", "Variable SG&A % of sales", "NA / INTL / OTHER", "NA 20.0%; INTL 15.0%; OTHER 0%",
     "Store payroll, advertising and credit costs move with sales; the remainder of FY2026 SG&A (NA $731.5M, INTL $51.4M, corporate $56.0M) is treated as fixed. Split is a team estimate consistent with Session 6 'marginal vs fixed' guidance.",
     "Signet Jewelers Limited (2026a); Columbia University Capstone (2026b)"),
    ("Expense drivers", "Fixed SG&A inflation", "NA / OTHER", "2.5% (FY27), 2.3% (FY28), 2.1% (FY29), 2.0% thereafter", "FOMC median PCE inflation 3.7% (2026), 2.3% (2027), 2.1% (2028), 2.0% long run; FY2026 SG&A growth was inflated by an incentive-compensation reset that is not repeated.", "Board of Governors of the Federal Reserve System (2026b); Signet Jewelers Limited (2026a)"),
    ("Expense drivers", "Fixed SG&A inflation", "INTL", "3.0% (FY27), 2.5% (FY28), 2.0% thereafter", "UK CPI about 3% in early 2027 falling toward 1.7-2% by 2028.", "Vanguard (2026)"),
    ("Expense drivers", "Cost-savings initiatives", "All", "0 in every year", "No quantified savings programme is disclosed; the row is kept so that 3(d) scenarios can model restructuring responses.", "Signet Jewelers Limited (2026a)"),
    ("Expense drivers", "Other operating income/(expense), one-time", "NA", "+$30M in FY27; 0 thereafter", "Management expects about $30M of IEEPA tariff refunds in FY2027 ($20M received by Q2); no further impairments or restructuring assumed in the baseline.", "Signet Jewelers Limited (2026d); CNBC (2026)"),
    ("Interest", "Net yield on invested assets", "All", "0.7% of prior-year cash", "Calibrated: net interest income was only $4.0M in FY2026 and $9.8M in FY2025 on $600-900M of cash because much of the balance is operating float and fees offset income. Conservative versus a 4-5% money-market yield.", "Signet Jewelers Limited (2026b)"),
    ("Interest", "Interest rate on debt", "All", "6.5% of prior-year debt", "No funded debt at FY2026A; rate reflects SOFR about 4% plus an ABL spread, kept for liquidity/interest-rate shocks.", "Signet Jewelers Limited (2026a); Board of Governors of the Federal Reserve System (2026b)"),
    ("Tax", "Effective income tax rate", "NA / OTHER", "24.0%", "FY2027 guidance 23-25% excluding discrete items; FY2026 actual 26.0% included discrete items.", "Signet Jewelers Limited (2026b, 2026c)"),
    ("Tax", "Effective income tax rate", "INTL", "25.0%", "UK corporation tax main rate 25%.", "Team assumption"),
    ("Discount rate", "Cost of equity (CAPM)", "NA / OTHER", "10.5% = 5.24% + 1.25 x 4.20%", "Risk-free: 10-year Treasury 5.24% (Oct 9, 2026). Beta 1.25 = midpoint of published betas (1.10 MarketBeat, 1.12 Google, 1.44 Motley Fool). Implied ERP 4.20% (Damodaran, Oct 1, 2026). No sell-side WACC retrievable; 10.5% sits inside the 9-12% band typical for specialty retail.", "Board of Governors of the Federal Reserve System (2026a); Damodaran (2026); MarketBeat (2026); Google Finance (2026); The Motley Fool (2026)"),
    ("Discount rate", "Cost of equity (CAPM) + premium", "INTL", "12.0% (= 10.5% + 1.5pp)", "Premium for small scale, weak UK demand, GBP exposure and history of near-zero segment profit.", "Team assumption; Signet Jewelers Limited (2025a)"),
    ("Balance sheet", "Simplified cash-basis balance sheet", "All", "Cash 874.8; inventory 1,940.1; debt 0; other liabilities (net) 848.7 plug; equity 1,966.2", "Per Session 5, non-cash items (D&A, receivables, payables, leases, goodwill, intangibles, deferred revenue) are excluded. Inventory is kept as a non-depreciating operating asset. The single 'other liabilities, net' line calibrates simplified equity to reported shareholders' equity so the terminal value equals book equity.", "Signet Jewelers Limited (2026a, 2026b); Columbia University Capstone (2026a)"),
    ("Balance sheet", "Allocation of the balance sheet to segments", "All", "By FY2026 sales share: NA 93.4%, INTL 6.0%, OTHER 0.6%", "Cash is managed centrally and inventory is not disclosed by segment; a sales-share allocation keeps every tab's balance sheet, interest income and terminal equity proportionate to its business. Alternative (all cash in OTHER) noted as a question.", "Team allocation"),
    ("Market data", "Share price, shares outstanding, market cap", "Total", "$105.22 (Oct 9, 2026); 37.5M shares; $3,945.8M", "Close per Yahoo Finance; share count between MarketBeat (38.3M) and Google Finance (37.3M) after the $125M ASR announced in September 2026.", "Yahoo Finance (2026); MarketBeat (2026); Google Finance (2026); Signet Jewelers Limited (2026c)"),
    ("Market data", "Diluted shares for EPS", "Total", "41.6M (FY26A implied); 38.8M (FY27 guidance); flat thereafter", "Buybacks are distributions in this model, so the share count is not reduced further; EPS is therefore conservative in later years.", "Signet Jewelers Limited (2026b, 2026c)"),
    ("Horizon", "Projection horizon and terminal value", "All", "FY2027-FY2036 (10 years); terminal value = FY2036 equity", "Ten years reduces the weight of the terminal value (Session 6); terminal value = equity at end of projection is the 'simplest terminal value' recommended in class.", "Columbia University Capstone (2026b)"),
    ("Valuation", "Profits released vs. profits retained", "All", "Profits released", "Dividends plus buybacks: FY2026 $257.1M vs net income $294.4M (87%); H1 FY2027 $196.7M vs about $84M; $125M ASR added. Distributing all earnings is the closer approximation of Signet's behaviour; equity roll-forward holds in every tab (Checks).", "Signet Jewelers Limited (2026b, 2026c, 2026d); Columbia University Capstone (2026a)"),
]

RECLASS_DOC = [
    ("Segment sales", "NA 6,363.6 = consolidated 6,813.6 less International 410.4 less Other 39.6 (search excerpt: 'about $6.36 billion, +1.0%')."),
    ("Segment cost of sales / SG&A", "Fiscal 2026 segment cost lines (Note 5 'significant segment expenses') could not be retrieved, so: INTL gross margin 32.0% (FY2025 implied about 30%), INTL SG&A 27.5% of sales (FY2025 27.6%), OTHER gross margin 8.0%, corporate fixed SG&A 56.0 (FY2025 54.8 grown about 2%), NA = residual. Segment operating income still ties exactly to reported figures (NA 452.6, INTL 16.3, OTHER -75.8). Replace with the 10-K table when available."),
    ("Other operating income/(expense)", "Consolidated -128.3 (= operating income 393.1 - gross margin 2,694.6 + SG&A 2,173.2) comprises impairments (about 91.3 digital brands) and restructuring; split NA -103.3 / INTL -2.0 / OTHER -23.0 so that segment operating income ties."),
    ("Revenue build (FY2026A)", "Services: NA 760.0 and INTL 41.0 of the 803.5 consolidated (balance assumed inside Other). E-commerce: 21.8% x 6,813.6 = 1,485.4, of which INTL 61.6 (15% of its sales) and NA 1,423.8. Store merchandise sales = segment sales - services - e-commerce; sales per store = store merchandise sales / average stores (NA 1.776, INTL 1.193)."),
    ("Interest, other non-operating and tax", "Net interest income 4.0 + other non-operating income 1.0 = 5.0 allocated by sales share (NA 4.7, INTL 0.3, OTHER 0.0). Income taxes 103.7 allocated at the 26.0% effective rate (NA 119.1, INTL 4.3, OTHER -19.7 tax benefit on the corporate loss)."),
    ("Balance sheet", "Simplified assets = cash 874.8 + inventory 1,940.1 = 2,814.9. Other liabilities, net = 2,814.9 - reported equity 1,966.2 = 848.7 (plug). All lines allocated by FY2026 sales share."),
]

QUESTIONS_DOC = [
    "Segment structure: we model three tabs (NA, INTL, OTHER = diamond sourcing + corporate/unallocated) so the Total tab reproduces the consolidated statements exactly. OTHER has a negative value (corporate cost centre). Is this acceptable, or should corporate costs be allocated into NA and INTL?",
    "Valuation approach: we chose 'profits released' (PV of distributed earnings + PV of terminal equity) rather than 'profits retained'. Please confirm either is acceptable for 3(a) and that the same approach must be kept in 3(d).",
    "Balance-sheet simplification: equity is calibrated to reported shareholders' equity through a single 'other liabilities, net' plug. Is a book-equity terminal value preferred to a tangible-equity (ex-goodwill) terminal value?",
    "Segment cost allocations: the Fiscal 2026 segment cost-of-sales/SG&A table could not be retrieved in the build environment; allocations are documented above and will be replaced from the 10-K. Does the TA want the replacement before Session 7?",
    "Discount rate: single CAPM cost of equity per segment (10.5% / 12.0% / 10.5%) with the 10-year Treasury at 5.24%. Is a segment premium for International appropriate, or should one company-wide rate be used?",
]

LIMITATIONS_DOC = [
    "Data access: sec.gov, signetjewelers.com and the IR PDF host were blocked in the build environment, so figures come from web-search excerpts of the 10-K, the Q4 FY2026 and Q2 FY2027 releases and their verbatim re-publications. Confidence flags (A-D) are in data/*.csv. Segment cost lines, International adjusted operating income and intangibles were not retrievable.",
    "Static balance sheet: no capex, depreciation, working-capital build or lease accounting; inventory and cash are held flat. Buybacks are treated as distributions and the share count is not reduced, so modelled EPS growth is slower than consensus.",
    "FX: International is modelled in USD at FY2026 rates; a GBP shock would be applied through the INTL sales-per-store and e-commerce drivers in 3(d).",
    "Seasonality: annual model; the holiday-quarter concentration of earnings is not visible (a quarterly layer could be added later).",
    "Tax: a single effective rate per segment; OTHER's corporate loss generates a tax benefit, consistent with consolidated filing.",
    "The 'Baseline snapshot' value is a pasted number (as in the Pear model) so that 3(d) can compare scenario runs against it; it is checked against the live value on the Checks tab and must be re-pasted if baseline assumptions change (rerun build/build_model.py).",
]


def build_assumptions(wb):
    ws = wb.create_sheet("Assumptions & Sources", 1)
    setc(ws, 1, 1, "Baseline assumptions, rationale and sources", font=F_TITLE)
    setc(ws, 2, 1, "One row per assumption. Values are repeated in blue on the model tabs; this tab is documentation (no model formulas depend on it). APA 7th in-text citations; full reference list at the bottom.", font=F_NOTE)
    heads = ["#", "Group", "Assumption", "Segment(s)", "Value(s) by year or rule", "Rationale", "Source (APA in-text)"]
    widths = [4, 16, 36, 12, 34, 90, 42]
    for j, (h, w) in enumerate(zip(heads, widths)):
        setc(ws, 4, 1 + j, h, font=F_HDR, fill=FILL_HDR)
        ws.column_dimensions[L(1 + j)].width = w
    r = 5
    wrap = Alignment(wrap_text=True, vertical="top")
    for i, (grp, a, seg, val, rat, src) in enumerate(ASSUMPTION_DOC, start=1):
        for j, v in enumerate([i, grp, a, seg, val, rat, src]):
            setc(ws, r, 1 + j, v, font=F_LBL, align=wrap)
        r += 1
    r += 1
    section(ws, r, "Reclassifications and FY2026A calibration (how the 'Last Yr' column was built)", cols=7); r += 1
    for item, text in RECLASS_DOC:
        setc(ws, r, 2, item, font=F_LBLB, align=wrap); setc(ws, r, 3, text, font=F_LBL, align=wrap)
        ws.merge_cells(start_row=r, start_column=3, end_row=r, end_column=7)  # documentation text only, outside the model grid
        ws.row_dimensions[r].height = max(15, 13.5 * (len(text) // 165 + 1))
        r += 1
    r += 1
    section(ws, r, "Questions for the lecturer / TAs", cols=7); r += 1
    for i, t in enumerate(QUESTIONS_DOC, start=1):
        setc(ws, r, 2, f"Q{i}", font=F_LBLB, align=wrap); setc(ws, r, 3, t, font=F_LBL, align=wrap)
        ws.merge_cells(start_row=r, start_column=3, end_row=r, end_column=7); ws.row_dimensions[r].height = max(15, 13.5 * (len(t) // 165 + 1)); r += 1
    r += 1
    section(ws, r, "Limitations", cols=7); r += 1
    for i, t in enumerate(LIMITATIONS_DOC, start=1):
        setc(ws, r, 2, f"L{i}", font=F_LBLB, align=wrap); setc(ws, r, 3, t, font=F_LBL, align=wrap)
        ws.merge_cells(start_row=r, start_column=3, end_row=r, end_column=7); ws.row_dimensions[r].height = max(15, 13.5 * (len(t) // 165 + 1)); r += 1
    r += 1
    section(ws, r, "References (APA 7th)", cols=7); r += 1
    refs = [s["apa"] + (f" {s['url']}" if s.get("url") else "") for s in json.load(open(os.path.join(ROOT, "data", "sources.json")))["sources"]]
    for t in sorted(refs):
        setc(ws, r, 2, t, font=F_LBL, align=wrap)
        ws.merge_cells(start_row=r, start_column=2, end_row=r, end_column=7); ws.row_dimensions[r].height = max(15, 13.5 * (len(t) // 180 + 1)); r += 1
    ws.freeze_panes = "A5"
    ws.print_area = f"A1:G{r}"; ws.page_setup.orientation = "landscape"
    ws.sheet_properties.pageSetUpPr.fitToPage = True; ws.page_setup.fitToWidth = 1; ws.page_setup.fitToHeight = 0
    return ws


# ----------------------------------------------------------------------------------------------------------------
# 6. WORKBOOK ASSEMBLY, RECALC, VERIFY, SENSITIVITY
# ----------------------------------------------------------------------------------------------------------------
def build_workbook(out_path, overrides=None, snapshot=None, sens_rows=None):
    overrides = overrides or {}
    wb = openpyxl.Workbook()
    wb.remove(wb.active)
    seg_sheets = [INPUTS["segments"][k]["sheet"] for k in SEG_ORDER]
    for k in SEG_ORDER:
        build_segment(wb, k, INPUTS["segments"][k], overrides, snapshot)
    build_total(wb, seg_sheets)
    build_summary(wb, sens_rows)
    build_checks(wb)
    build_assumptions(wb)
    build_cover(wb)
    order = ["Cover", "Assumptions & Sources", "Model - NA", "Model - INTL", "Model - OTHER", "Total Company", "Summary & Chart", "Checks"]
    wb._sheets = [wb[n] for n in order]
    wb.active = 0
    wb.calculation.fullCalcOnLoad = True
    structural_check(wb)
    wb.save(out_path)
    return out_path


def structural_check(wb):
    """Projection formulas must reference the scenario block (rows x_*), never the baseline block (rows a_*)."""
    import re
    base_rows = {R[k] for k, *_ in ASSUMPTION_ROWS}
    for k in SEG_ORDER:
        ws = wb[INPUTS["segments"][k]["sheet"]]
        for row in range(R["h_proj"], R["end_grid"] + 1):
            for col in range(COL_LAST, COL_LASTYEAR + 1):
                v = ws.cell(row=row, column=col).value
                if is_formula(v):
                    for ref in re.findall(r"\$?[A-Z]{1,2}\$?(\d+)", v):
                        assert int(ref) not in base_rows, f"{ws.title}!{L(col)}{row} references baseline row {ref}: {v}"


def lo_recalc(paths, outdir):
    """Round-trip one or more workbooks through headless LibreOffice so every formula gets a cached value."""
    os.makedirs(outdir, exist_ok=True)
    prof = os.path.join(tempfile.gettempdir(), "lo_profile_sig")
    os.makedirs(os.path.join(prof, "user"), exist_ok=True)
    with open(os.path.join(prof, "user", "registrymodifications.xcu"), "w") as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?><oor:items xmlns:oor="http://openoffice.org/2001/registry" '
                'xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
                '<item oor:path="/org.openoffice.Office.Calc/Formula/Load"><prop oor:name="OOXMLRecalcMode" oor:op="fuse"><value>0</value></prop></item>'
                '</oor:items>')
    env = dict(os.environ, HOME=prof)
    cmd = ["soffice", f"-env:UserInstallation=file://{prof}", "--headless", "--calc", "--convert-to", "xlsx", "--outdir", outdir] + list(paths)
    res = subprocess.run(cmd, capture_output=True, text=True, timeout=600, env=env)
    if res.returncode != 0:
        raise RuntimeError(f"LibreOffice failed: {res.stderr}")
    return [os.path.join(outdir, os.path.basename(p)) for p in paths]


def read_results(recalc_path):
    wb = openpyxl.load_workbook(recalc_path, data_only=True)
    out = {"values": {}, "errors": [], "checks": []}
    for k in SEG_ORDER:
        ws = wb[INPUTS["segments"][k]["sheet"]]
        out["values"][k] = ws.cell(row=R["val_scen"], column=COL_LAST).value
    t = wb["Total Company"]
    out["values"]["TOTAL"] = t.cell(row=R["val_scen"], column=COL_LAST).value
    out["total_rows"] = {name: [t.cell(row=R[name], column=c).value for c in range(COL_LAST, COL_LASTYEAR + 1)]
                         for name in ("sales", "oi", "ni", "eq", "eps", "rev_growth", "gm_pct", "oi_pct", "ni_pct", "roe", "stores_end")}
    out["market"] = {k: t.cell(row=R[k], column=COL_LAST).value for k in ("mv_cap", "mv_under", "mv_vps", "mv_pe")}
    for ws in wb.worksheets:
        for row in ws.iter_rows():
            for c in row:
                if isinstance(c.value, str) and c.value.startswith("#") and c.value.endswith(("!", "?", "A")):
                    out["errors"].append(f"{ws.title}!{c.coordinate}={c.value}")
    cw = wb["Checks"]
    r = 5
    while cw.cell(row=r, column=2).value and r < 200:
        out["checks"].append((cw.cell(row=r, column=2).value, cw.cell(row=r, column=3).value, cw.cell(row=r, column=4).value))
        r += 1
    out["all_pass"] = cw.cell(row=R["checks_overall"], column=3).value
    out["cover_status"] = wb["Cover"].cell(row=R["cover_status"], column=3).value
    return out


SENS_SPECS = [  # label, {assumption key: delta}, segments
    ("Revenue growth: same-store, e-commerce and other revenue growth +/-1pp", {"a_sss": 0.01, "a_ecom": 0.01, "a_oth": 0.01}, SEG_ORDER),
    ("Gross margin +/-1pp (cost of sales % -/+1pp)", {"a_cogs": -0.01}, SEG_ORDER),
    ("Discount rate (cost of equity) +/-1pp", {"a_dr": 0.01}, SEG_ORDER),
    ("Variable SG&A % of sales +/-1pp", {"a_vsga": 0.01}, SEG_ORDER),
    ("Fixed SG&A inflation +/-1pp", {"a_infl": 0.01}, SEG_ORDER),
    ("Effective tax rate +/-1pp", {"a_tax": 0.01}, SEG_ORDER),
    ("NA store closures +/-10 per year", {"a_close": 10}, ["NA"]),
]


def run_sensitivities(snapshot, workdir):
    os.makedirs(workdir, exist_ok=True)
    paths, meta = [], []
    for i, (label, deltas, segs) in enumerate(SENS_SPECS):
        for sign, tag in ((-1, "minus"), (1, "plus")):
            ov = {(s, k): sign * d for s in segs for k, d in deltas.items()}
            p = os.path.join(workdir, f"sens_{i}_{tag}.xlsx")
            build_workbook(p, overrides=ov, snapshot=snapshot)
            paths.append(p); meta.append((i, tag))
    outs = lo_recalc(paths, os.path.join(workdir, "recalc"))
    res = {}
    for (i, tag), p in zip(meta, outs):
        res[(i, tag)] = read_results(p)["values"]["TOTAL"]
    rows = []
    for i, (label, deltas, segs) in enumerate(SENS_SPECS):
        rows.append({"label": label, "minus": res[(i, "minus")], "plus": res[(i, "plus")]})
    return rows


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--quick", action="store_true", help="skip sensitivity runs")
    ap.add_argument("--no-recalc", action="store_true", help="only write the workbook")
    args = ap.parse_args()
    work = os.path.join(tempfile.gettempdir(), "sig_build")
    shutil.rmtree(work, ignore_errors=True); os.makedirs(work)

    if args.no_recalc:
        build_workbook(OUT_XLSX)
        print("written (no recalculation):", OUT_XLSX); return

    # Pass 1: live baseline formula -> recalc -> read segment values -> snapshot
    p1 = os.path.join(work, "pass1.xlsx")
    build_workbook(p1)
    r1 = read_results(lo_recalc([p1], os.path.join(work, "r1"))[0])
    assert not r1["errors"], r1["errors"][:10]
    snapshot = {k: r1["values"][k] for k in SEG_ORDER}
    json.dump(snapshot, open(SNAPSHOT_JSON, "w"), indent=2)
    print("pass 1 segment values:", {k: round(v, 1) for k, v in snapshot.items()}, "total", round(r1["values"]["TOTAL"], 1))

    # Sensitivities (each variant keeps the frozen snapshot so % change columns are meaningful)
    sens_rows = None
    if not args.quick:
        sens_rows = run_sensitivities(snapshot, os.path.join(work, "sens"))
        for row in sens_rows:
            row["base"] = r1["values"]["TOTAL"]
        with open(SENS_CSV, "w", newline="") as f:
            w = csv.DictWriter(f, fieldnames=["label", "minus", "base", "plus"]); w.writeheader(); w.writerows(sens_rows)
    elif os.path.exists(SENS_CSV):
        sens_rows = [{k: (float(v) if k != "label" else v) for k, v in row.items()} for row in csv.DictReader(open(SENS_CSV))]

    # Final build with hard-coded snapshot + sensitivity table, then recalc and verify
    build_workbook(OUT_XLSX, snapshot=snapshot, sens_rows=sens_rows)
    final_recalc = lo_recalc([OUT_XLSX], os.path.join(HERE, "recalc_check"))[0]
    r2 = read_results(final_recalc)
    print("\nFINAL (recalculated copy:", final_recalc, ")")
    print("segment values:", {k: round(v, 1) for k, v in r2["values"].items()})
    print("market:", {k: (round(v, 3) if isinstance(v, (int, float)) else v) for k, v in r2["market"].items()})
    for name, vals in r2["total_rows"].items():
        print(f"{name:>11}:", [round(v, 3) if isinstance(v, (int, float)) else v for v in vals])
    print("\nChecks:")
    for desc, ok, meas in r2["checks"]:
        print(f"  [{'PASS' if ok else 'FAIL'}] {desc}  ({meas})")
    print("ALL CHECKS PASS cell:", r2["all_pass"], "| Cover status:", r2["cover_status"], "| error cells:", len(r2["errors"]))
    if r2["errors"]:
        print(r2["errors"][:20])
    if not r2["all_pass"]:
        sys.exit("CHECK FAILURES")


if __name__ == "__main__":
    main()
